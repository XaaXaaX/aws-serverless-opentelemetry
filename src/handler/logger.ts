import { SeverityNumber } from '@opentelemetry/api-logs';
import * as otel from './OpenTelemetry';

const logMessage = (level: string, severityNumber: SeverityNumber, message: string, args: Record<string, any>) => {
  otel.logger.emit( {
    severityText: level,
    severityNumber,
    body: message,
    attributes: args
  })
}

/**
 * @param {string} message 
 * @param {Record<string, any>} args 
 */
const debug = (message: string, args = {}) => {
  logMessage('DEBUG', SeverityNumber.DEBUG, message, args);
}

/**
 * @param {string} message 
 * @param {Record<string, any>} args 
 */
const info = (message: string, args = {}) => {
  logMessage('INFO', SeverityNumber.INFO, message, args);
}

/**
 * @param {string} message 
 * @param {Record<string, any>} args 
 */
const warn = (message: string, args = {}) => {
  logMessage('WARN', SeverityNumber.WARN, message, args);
}

/**
 * @param {string} message 
 * @param {Record<string, any>} args 
 */
const error = (message: string, args = {}) => {
  logMessage('ERROR', SeverityNumber.ERROR, message, args);
}

export default { debug, info, warn, error }