export const LOG_LEVELS = [
  'trace',
  'debug',
  'verbose',
  'log',
  'warn',
  'error',
  'fatal',
] as const;

export type AppLogLevel = (typeof LOG_LEVELS)[number];

export type LogFormat = 'json' | 'pretty';

export interface LogMeta {
  [key: string]: unknown;
}

/** Structured log record written to stdout (Loki / OTel log collectors). */
export interface StructuredLogRecord {
  timestamp: string;
  level: string;
  message: string;
  context: string;
  service: string;
  environment: string;
  traceId?: string;
  spanId?: string;
  meta?: LogMeta;
  stack?: string;
}
