import { LambdaFunctionURLEvent, LambdaFunctionURLHandler } from 'aws-lambda';
import { 
  trace,
  Span, 
  SpanKind, 
  createTraceState, 
  context } from "@opentelemetry/api";
import { EventCustomMapGetter } from './EventCustomMapGetter';
import * as otel from './OpenTelemetry';
import logger from './Logger';

const treat = (title: string) => {
  const parentspan = trace.getSpan(context.active())
  return otel.tracer.startActiveSpan(title, { kind: SpanKind.INTERNAL }, (span: Span) => {
    for (let i = 0; i < 5; i++) {
      span.addEvent(`${title}`, { step: `${i}` }, new Date().getTime())
    }
    span.spanContext().traceState = parentspan.spanContext().traceState?.set('child', `${title}`);
    span.end();
  });
}

export const handler: LambdaFunctionURLHandler = async (event: LambdaFunctionURLEvent) => {
  const extractedContext = otel.propagator.extract(context.active(), event, new EventCustomMapGetter('traceparent'));
  otel.tracer.startActiveSpan('handler',{ kind: SpanKind.SERVER }, extractedContext, (parentSpan: Span) => {
    logger.info('Hello from Lambda!');
    parentSpan.spanContext().traceState = createTraceState().set('service', 'handler');

    for (let i = 0; i < 3; i++) {
      treat(`${i}`)
      logger.info(`Hello from Lambda! ${i}`, { step: `${i}` });
    }
    parentSpan.end();
  });

  return 'Hello from Lambda!';
}

process.on('SIGTERM', () => {
  otel.sdk.shutdown()
    .then(() => console.log('OTel Tracing terminated'))
    .catch((error) => console.log('Error terminating OTel tracing', error))
    .finally(() => process.exit(0))
})