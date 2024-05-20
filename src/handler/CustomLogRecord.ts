import { LogRecord, LogRecordExporter, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import log from "./Logger";
export class CustomLogRecordProcessor extends SimpleLogRecordProcessor {
  readonly _logs:LogRecord[] = [];

  constructor(readonly exporter: LogRecordExporter) {
    super(exporter)
  }
  onEmit(logRecord: LogRecord): void {
    log.info('Somthing', logRecord)
    super.onEmit(logRecord)
  }
  forceFlush(): Promise<void> {
    console.info('CustomLogRecordProcessor', 'forceFlush')
    return super.forceFlush()
  }
  shutdown(): Promise<void> {
    console.info('CustomLogRecordProcessor', 'shutdown')
    this.forceFlush()
    this.exporter.shutdown();
    return super.shutdown()
  }
}