import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import {
  AppLogLevel,
  LOG_LEVELS,
  LogFormat,
  LogMeta,
  StructuredLogRecord,
} from './logger.types';

const NEST_TO_APP_LEVEL: Record<LogLevel, AppLogLevel> = {
  log: 'log',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
  verbose: 'verbose',
  fatal: 'fatal',
};

const LEVEL_RANK: Record<AppLogLevel, number> = {
  trace: 0,
  debug: 1,
  verbose: 2,
  log: 3,
  warn: 4,
  error: 5,
  fatal: 6,
};

const OUTPUT_LEVEL: Record<AppLogLevel, string> = {
  trace: 'trace',
  debug: 'debug',
  verbose: 'debug',
  log: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
};

function resolveLogFormat(): LogFormat {
  const format = process.env.LOG_FORMAT?.toLowerCase();
  if (format === 'json' || format === 'pretty') {
    return format;
  }
  return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
}

function resolveMinLevel(): AppLogLevel {
  const configured = process.env.LOG_LEVEL?.toLowerCase() as
    | AppLogLevel
    | undefined;
  if (configured && LOG_LEVELS.includes(configured)) {
    return configured;
  }
  return process.env.NODE_ENV === 'production' ? 'log' : 'debug';
}

/** Reads active trace context when OpenTelemetry is wired in later. */
function readTraceContext(): Pick<StructuredLogRecord, 'traceId' | 'spanId'> {
  // Integrate @opentelemetry/api here, e.g.:
  // const span = trace.getActiveSpan();
  // const ctx = span?.spanContext();
  // return ctx?.traceId ? { traceId: ctx.traceId, spanId: ctx.spanId } : {};
  return {};
}

function formatMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }
  if (message instanceof Error) {
    return message.message;
  }
  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

function extractStack(
  message: unknown,
  optionalParams: unknown[],
): string | undefined {
  if (message instanceof Error) {
    return message.stack;
  }

  for (const param of optionalParams) {
    if (typeof param === 'string' && param.includes('\n')) {
      return param;
    }
    if (param instanceof Error) {
      return param.stack;
    }
  }

  return undefined;
}

function extractMeta(optionalParams: unknown[]): LogMeta | undefined {
  const meta: LogMeta = {};

  for (const param of optionalParams) {
    if (param === undefined || param === null) {
      continue;
    }
    if (typeof param === 'string' && param.includes('\n')) {
      continue;
    }
    if (param instanceof Error) {
      meta.error = {
        name: param.name,
        message: param.message,
      };
      continue;
    }
    if (typeof param === 'object') {
      Object.assign(meta, param as LogMeta);
      continue;
    }
    meta.detail = param;
  }

  return Object.keys(meta).length > 0 ? meta : undefined;
}

export class AppLogger implements LoggerService {
  private static minLevel: AppLogLevel = resolveMinLevel();
  private static format: LogFormat = resolveLogFormat();
  private static enabledLevels = new Set<AppLogLevel>(LOG_LEVELS);
  private static serviceName =
    process.env.SERVICE_NAME?.trim() || 'hospital-management-api';

  constructor(private readonly context = 'Application') {}

  static configure(options: {
    minLevel?: AppLogLevel;
    format?: LogFormat;
    serviceName?: string;
    levels?: LogLevel[];
  }): void {
    if (options.minLevel) {
      AppLogger.minLevel = options.minLevel;
    }
    if (options.format) {
      AppLogger.format = options.format;
    }
    if (options.serviceName) {
      AppLogger.serviceName = options.serviceName;
    }
    if (options.levels) {
      AppLogger.setLogLevels(options.levels);
    }
  }

  static setLogLevels(levels: LogLevel[]): void {
    AppLogger.enabledLevels = new Set(
      levels.map((level) => NEST_TO_APP_LEVEL[level]),
    );
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('log', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams);
  }

  private write(
    level: AppLogLevel,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: StructuredLogRecord = {
      timestamp: new Date().toISOString(),
      level: OUTPUT_LEVEL[level],
      message: formatMessage(message),
      context: this.context,
      service: AppLogger.serviceName,
      environment: process.env.NODE_ENV ?? 'development',
      ...readTraceContext(),
      ...(() => {
        const meta = extractMeta(optionalParams);
        return meta ? { meta } : {};
      })(),
      ...(() => {
        const stack = extractStack(message, optionalParams);
        return stack ? { stack } : {};
      })(),
    };

    this.print(entry, level);
  }

  private isLevelEnabled(level: AppLogLevel): boolean {
    return (
      AppLogger.enabledLevels.has(level) &&
      LEVEL_RANK[level] >= LEVEL_RANK[AppLogger.minLevel]
    );
  }

  private print(entry: StructuredLogRecord, level: AppLogLevel): void {
    const output =
      AppLogger.format === 'json'
        ? JSON.stringify(entry)
        : this.formatPretty(entry, level);

    if (level === 'error' || level === 'fatal') {
      console.error(output);
      return;
    }
    if (level === 'warn') {
      console.warn(output);
      return;
    }
    console.log(output);
  }

  private formatPretty(entry: StructuredLogRecord, level: AppLogLevel): string {
    const meta =
      entry.meta && Object.keys(entry.meta).length > 0
        ? ` ${JSON.stringify(entry.meta)}`
        : '';
    const trace =
      entry.traceId !== undefined
        ? ` traceId=${entry.traceId}${entry.spanId ? ` spanId=${entry.spanId}` : ''}`
        : '';

    return `[${entry.timestamp}] ${level.toUpperCase()} [${entry.context}] ${entry.message}${meta}${trace}`;
  }
}

/** Create a context-scoped logger for use outside Nest DI (utils, scripts). */
export function createLogger(context: string): AppLogger {
  return new AppLogger(context);
}

@Injectable()
export class AppLoggerService extends AppLogger implements LoggerService {
  constructor() {
    super('Application');
  }

  forContext(context: string): AppLogger {
    return new AppLogger(context);
  }
}
