import 'reflect-metadata';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { inject } from 'vitest';
import { AppModule } from '../../../src/infra/app.module.js';
import { loadEnvironment } from '../../../src/infra/config/environment.js';
import { Database } from '../../../src/infra/database/database.js';
import { configureApp } from '../../../src/infra/http/configure-app.js';
import { DatabaseCleaner } from '../database/database-cleaner.js';

export interface E2EContext {
  readonly app: NestExpressApplication;
  readonly database: Database;
  readonly cleaner: DatabaseCleaner;
}

let context: Promise<E2EContext> | undefined;

// Equivalente ao @E2E: suíte com tag própria, ignorada sem Docker.
export const describeE2E = describe.skipIf(!inject('dockerAvailable'));

// A aplicação sobe uma vez por execução e é reaproveitada por todos os arquivos E2E
// (o projeto e2e roda sem isolamento), como o cache de contexto do Spring.
export function e2e(): Promise<E2EContext> {
  context ??= start();
  return context;
}

async function start(): Promise<E2EContext> {
  process.env.DATABASE_URL = inject('databaseUrl');
  process.env.API_DOCS_ENABLED = 'true';
  process.env.LOG_LEVEL ??= 'warn';
  const environment = loadEnvironment();

  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication<NestExpressApplication>({
    logger: environment.logLevels,
  });
  configureApp(app, environment);
  // Servidor real em porta livre: serialização, validação e transação como em produção.
  await app.listen(0);

  const database = app.get(Database);
  return { app, database, cleaner: new DatabaseCleaner(database) };
}
