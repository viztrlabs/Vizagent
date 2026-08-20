import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
    : undefined,
  base: { service: 'viztr' },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

/** Create a child logger with additional context. */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/** Log an API request. */
export function logRequest(method: string, path: string, status: number, durationMs: number) {
  logger.info({ method, path, status, durationMs }, 'API request');
}

/** Log an API error. */
export function logError(err: Error, context?: Record<string, unknown>) {
  logger.error({ err, ...context }, 'Error occurred');
}
