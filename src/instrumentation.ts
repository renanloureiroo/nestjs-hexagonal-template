// Carregado com `node --import` antes da aplicação, como o agente/starter OpenTelemetry no
// Spring. Exportadores e endpoint vêm das variáveis OTEL_* padrão.
import { register } from 'node:module';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

// O hook ESM precisa estar registrado antes de express, pg e Nest serem importados.
register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-fs': { enabled: false } }),
  ],
});

sdk.start();

process.once('SIGTERM', () => {
  void sdk.shutdown();
});
