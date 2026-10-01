import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/*/infra/database/drizzle/schema/*.schema.ts',
  out: './drizzle',
  // Prefixo yyyyMMddHHmmss, equivalente à convenção V<timestamp>__ do Flyway.
  migrations: { prefix: 'timestamp' },
});
