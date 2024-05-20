import { 
  trace,
  propagation } from "@opentelemetry/api";
import { 
  CompositePropagator, 
  W3CTraceContextPropagator, 
  W3CBaggagePropagator } from '@opentelemetry/core';
  import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ConsoleLogRecordExporter } from '@opentelemetry/sdk-logs';
import { logs } from '@opentelemetry/api-logs';
import { CustomLogRecordProcessor } from './CustomLogRecord';
import { NodeSDK } from '@opentelemetry/sdk-node';

export const propagator = new CompositePropagator(
  {
    propagators: [ 
      new W3CTraceContextPropagator(), 
      new W3CBaggagePropagator()]
  }
);

propagation.setGlobalPropagator(propagator);

export const sdk = new NodeSDK({
  autoDetectResources: true,
  logRecordProcessor: new CustomLogRecordProcessor(new ConsoleLogRecordExporter()),
  textMapPropagator: propagator,
  instrumentations: [ 
    getNodeAutoInstrumentations(),
  ],
  spanProcessors: [
    new SimpleSpanProcessor(new OTLPTraceExporter())
  ]
})

sdk.start();

export const tracer = trace.getTracer(process.env.AWS_LAMBDA_FUNCTION_NAME , '1');
export const logger = logs.getLogger(process.env.AWS_LAMBDA_FUNCTION_NAME, '1.0.0');
