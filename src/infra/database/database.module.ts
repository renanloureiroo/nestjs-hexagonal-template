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

@Global()
@Module({
  providers: [
    {
      provide: POOL,
      inject: [ENVIRONMENT],
      useFactory: (environment: Environment) =>
        new pg.Pool({
          connectionString: environment.databaseUrl,
          max: environment.databasePoolSize,
        }),
    },
    {
      provide: Database,
      inject: [POOL, ENVIRONMENT],
      // Migrations rodam no boot, antes de qualquer requisição, como o Flyway no Spring.
      useFactory: async (pool: pg.Pool, environment: Environment) => {
        const db = drizzle({ client: pool });
        await migrate(db, { migrationsFolder: resolve(environment.migrationsFolder) });
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
