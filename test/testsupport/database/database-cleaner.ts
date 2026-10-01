import { sql } from 'drizzle-orm';
import { type Database } from '../../../src/infra/database/database.js';

// Descobre as tabelas pelo catálogo do PostgreSQL; o histórico de migrations do Drizzle vive
// no schema `drizzle` e fica de fora. Nenhuma ordem de chave estrangeira é codificada.
export class DatabaseCleaner {
  private tables: string[] | undefined;

  constructor(private readonly database: Database) {}

  async clean(): Promise<void> {
    this.tables ??= await this.discoverTables();
    if (this.tables.length === 0) {
      return;
    }
    const names = this.tables.map((table) => `"${table}"`).join(', ');
    await this.database.executor.execute(
      sql.raw(`truncate table ${names} restart identity cascade`),
    );
  }

  private async discoverTables(): Promise<string[]> {
    const result = await this.database.executor.execute<{ table_name: string }>(sql`
      select table_name
        from information_schema.tables
       where table_schema = current_schema()
         and table_type = 'BASE TABLE'
    `);
    return result.rows.map((row) => row.table_name);
  }
}
