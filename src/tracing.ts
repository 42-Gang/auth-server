import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const prometheusExporter = new PrometheusExporter(
  {
    host: '0.0.0.0',
    port: 9464,
    endpoint: '/metrics',
  },
  () => {
    console.log('✅ Prometheus scrape endpoint: http://0.0.0.0:9464/metrics');
  },
);

if (!process.env.JAEGER_ENDPOINT) {
  throw new Error('JAEGER_ENDPOINT environment variable is not set');
}
console.log(`Using Jaeger endpoint: ${process.env.JAEGER_ENDPOINT}`);

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.JAEGER_ENDPOINT,
    headers: {},
  }),
  serviceName: 'auth-service',
  metricReader: prometheusExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
