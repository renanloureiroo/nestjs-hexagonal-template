import { register } from 'node:module';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

/**
 * Carregado com `node --import` antes da aplicação, como o agente/starter OpenTelemetry no Spring.
 * Exportadores e endpoint vêm das variáveis OTEL_* padrão. O hook ESM é registrado antes de tudo
 * porque precisa estar ativo quando express, pg e Nest forem importados.
 */
const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-fs': { enabled: false } }),
  ],
});

sdk.start();

process.once('SIGTERM', () => {
  void sdk.shutdown();
});
