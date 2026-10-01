import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Workers herdam o ambiente do processo principal: toda a suíte roda em UTC.
process.env.TZ = 'UTC';

export default defineConfig({
  // SWC preserva a metadata de decorators que a injeção de dependências do Nest exige.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          // Unitários rodam antes: falha barata aparece antes de subir containers.
          sequence: { groupOrder: 0 },
          include: ['test/**/*.test.ts'],
          exclude: ['test/**/*.e2e.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          sequence: { groupOrder: 1 },
          include: ['test/**/*.e2e.test.ts'],
          globalSetup: ['test/testsupport/e2e/global-setup.ts'],
          setupFiles: ['test/testsupport/telemetry/metrics.ts'],
          // Um único worker sem isolamento reaproveita a mesma aplicação entre arquivos,
          // como o cache de contexto do Spring. O banco é compartilhado, então não há
          // paralelismo entre arquivos.
          fileParallelism: false,
          isolate: false,
          hookTimeout: 120_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
