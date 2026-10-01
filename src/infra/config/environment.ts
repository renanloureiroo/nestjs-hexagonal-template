import { type LogLevel } from '@nestjs/common';

export interface Environment {
  readonly port: number;
  readonly databaseUrl: string;
  readonly databasePoolSize: number;
  readonly migrationsFolder: string;
  readonly apiDocsEnabled: boolean;
  readonly logLevels: LogLevel[];
}

const LOG_LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  return {
    port: Number(source.PORT ?? 8080),
    databaseUrl: required(source, 'DATABASE_URL'),
    databasePoolSize: Number(source.DATABASE_POOL_SIZE ?? 10),
    migrationsFolder: source.DATABASE_MIGRATIONS_FOLDER ?? 'drizzle',
    apiDocsEnabled: source.API_DOCS_ENABLED === 'true',
    logLevels: logLevelsFrom(source.LOG_LEVEL ?? 'log'),
  };
}

function required(source: NodeJS.ProcessEnv, name: string): string {
  const value = source[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

// LOG_LEVEL=info segue o vocabulário usual; o Nest chama esse nível de "log".
function logLevelsFrom(level: string): LogLevel[] {
  const normalized = (level === 'info' ? 'log' : level) as LogLevel;
  const index = LOG_LEVELS.indexOf(normalized);
  return LOG_LEVELS.slice(0, index === -1 ? LOG_LEVELS.indexOf('log') + 1 : index + 1);
}
