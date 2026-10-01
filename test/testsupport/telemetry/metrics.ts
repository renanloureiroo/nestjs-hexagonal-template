import { metrics } from '@opentelemetry/api';
import { MeterProvider, MetricReader } from '@opentelemetry/sdk-metrics';

// Leitor em memória: o E2E observa métricas sem exportador nem container de observabilidade.
class InMemoryMetricReader extends MetricReader {
  protected override async onForceFlush(): Promise<void> {}

  protected override async onShutdown(): Promise<void> {}
}

// O setupFile roda antes de cada arquivo, mas a API do OpenTelemetry aceita um único
// MeterProvider global. O leitor vive em globalThis para que todos os arquivos consultem o
// mesmo leitor que foi registrado.
const READER = Symbol.for('app.test-metric-reader');
const registry = globalThis as { [READER]?: InMemoryMetricReader };

// Precisa acontecer antes de a aplicação criar seus instrumentos; por isso é um setupFile.
const reader = (registry[READER] ??= register(new InMemoryMetricReader()));

function register(created: InMemoryMetricReader): InMemoryMetricReader {
  metrics.setGlobalMeterProvider(new MeterProvider({ readers: [created] }));
  return created;
}

export async function counterValue(name: string): Promise<number> {
  const { resourceMetrics } = await reader.collect();
  return resourceMetrics.scopeMetrics
    .flatMap((scope) => scope.metrics)
    .filter((metric) => metric.descriptor.name === name)
    .flatMap((metric) => metric.dataPoints as Array<{ value: unknown }>)
    .reduce<number>((total, point) => total + Number(point.value), 0);
}
