import {
  Context,
  createTraceState,
  isSpanContextValid,
  SpanContext,
  TextMapGetter,
  TextMapPropagator,
  TextMapSetter,
  trace,
  TraceFlags,
} from '@opentelemetry/api';

export class EventCustomMapGetter<Carrier = any> implements TextMapGetter<Carrier> {
    constructor(private readonly eventKey: string) {}
    get(carrier: any, key: string): string | undefined {
      if (carrier == null) {
        return undefined;
      }
      return carrier[this.eventKey];
    }
  
    keys(carrier: any): string[] {
      if (carrier == null) {
        return [];
      }
      return Object.keys(carrier);
    }
};

export const TRACE_PARENT_HEADER = 'traceparent';
export const TRACE_STATE_HEADER = 'tracestate';

const VERSION = '00';
const VERSION_PART = '(?!ff)[\\da-f]{2}';
const TRACE_ID_PART = '(?![0]{32})[\\da-f]{32}';
const PARENT_ID_PART = '(?![0]{16})[\\da-f]{16}';
const FLAGS_PART = '[\\da-f]{2}';
const TRACE_PARENT_REGEX = new RegExp(
  `^\\s?(${VERSION_PART})-(${TRACE_ID_PART})-(${PARENT_ID_PART})-(${FLAGS_PART})(-.*)?\\s?$`
);

export function parseTraceParent(traceParent: string): SpanContext | null {
  const match = TRACE_PARENT_REGEX.exec(traceParent);
  if (!match) return null;

  if (match[1] === '00' && match[5]) return null;

  return {
    traceId: match[2],
    spanId: match[3],
    traceFlags: parseInt(match[4], 16),
  };
}

export class CustomW3CTraceContextPropagator implements TextMapPropagator {
  inject(context: Context, carrier: unknown, setter: TextMapSetter): void {
    const spanContext = trace.getSpanContext(context);
    if (
      !spanContext ||
      !isSpanContextValid(spanContext)
    )
      return;

    const traceParent = `${VERSION}-${spanContext.traceId}-${
      spanContext.spanId
    }-0${Number(spanContext.traceFlags || TraceFlags.NONE).toString(16)}`;

    setter.set(carrier, TRACE_PARENT_HEADER, traceParent);
    if (spanContext.traceState) {
      setter.set(
        carrier,
        TRACE_STATE_HEADER,
        spanContext.traceState.serialize()
      );
    }
  }

  extract(context: Context, carrier: unknown, getter: TextMapGetter): Context {
    const traceParentHeader = getter.get(carrier, TRACE_PARENT_HEADER);
    if (!traceParentHeader) return context;
    const traceParent = Array.isArray(traceParentHeader)
      ? traceParentHeader[0]
      : traceParentHeader;
    if (typeof traceParent !== 'string') return context;
    const spanContext = parseTraceParent(traceParent);
    if (!spanContext) return context;

    spanContext.isRemote = true;

    const traceStateHeader = getter.get(carrier, TRACE_STATE_HEADER);
    if (traceStateHeader) {
      // If more than one `tracestate` header is found, we merge them into a
      // single header.
      const state = Array.isArray(traceStateHeader)
        ? traceStateHeader.join(',')
        : traceStateHeader;
      spanContext.traceState = createTraceState(
        typeof state === 'string' ? state : undefined
      );
    }
    return trace.setSpanContext(context, spanContext);
  }

  fields(): string[] {
    return [TRACE_PARENT_HEADER, TRACE_STATE_HEADER];
  }
}