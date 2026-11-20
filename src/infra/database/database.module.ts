import { resolve } from 'node:path';
import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { Transactor } from '../../core/transaction/transactor.js';
import { ENVIRONMENT } from '../config/environment.module.js';
import { type Environment } from '../config/environment.js';
import { Database } from './database.js';
import { DrizzleTransactor } from './drizzle-transactor.js';

const POOL = Symbol('pg.Pool');

/** Com DATABASE_SCHEMA, tabelas sem prefixo nascem e são lidas no schema do serviço. */
function searchPathOf(schema: string | null): pg.PoolConfig {
  return schema ? { options: `-c search_path=${schema}` } : {};
}

/**
 * O pool emite `error` quando o banco derruba uma conexão ociosa (reinício, failover, banco
 * parado). Sem ouvinte, o Node encerra o processo. A conexão perdida já saiu do pool, e a próxima
 * consulta abre outra; só resta registrar.
 */
function withIdleErrorsLogged(pool: pg.Pool): pg.Pool {
  const logger = new Logger('Database');
  pool.on('error', (error) => logger.warn(`Conexão ociosa com o banco perdida: ${error.message}`));
  return pool;
}

@Global()
@Module({
  providers: [
    {
      provide: POOL,
      inject: [ENVIRONMENT],
      useFactory: (environment: Environment) =>
        withIdleErrorsLogged(
          new pg.Pool({
            connectionString: environment.databaseUrl,
            max: environment.databasePoolSize,
            ...searchPathOf(environment.databaseSchema),
          }),
        ),
    },
    {
      provide: Database,
      inject: [POOL, ENVIRONMENT],
      /** Migrations rodam no boot, antes de qualquer requisição, como o Flyway no Spring. */
      useFactory: async (pool: pg.Pool, environment: Environment) => {
        const db = drizzle({ client: pool });
        await migrate(db, {
          migrationsFolder: resolve(environment.migrationsFolder),
          /** O histórico de migrations fica no schema do serviço; sem schema, no `drizzle`. */
          migrationsSchema: environment.databaseSchema ?? 'drizzle',
        });
        new Logger('Database').log('Migrations aplicadas');
        return new Database(db);
      },
    },
    { provide: Transactor, useClass: DrizzleTransactor },
  ],
  exports: [Database, Transactor],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: pg.Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
