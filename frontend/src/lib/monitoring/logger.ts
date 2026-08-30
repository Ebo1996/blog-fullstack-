/**
 * Structured logging utility
 * Production: Replace console with proper logging service (Datadog, Sentry, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  eventId?: string
  orderId?: string
  [key: string]: unknown
}

class Logger {
  private context: LogContext = {}

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context }
  }

  clearContext() {
    this.context = {}
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString()
    const _logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...meta,
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, Datadog, etc.
      // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) })
    }

    // Console output for development
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : 
                         console.log

    consoleMethod(`[${level.toUpperCase()}]`, message, meta || '')
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta)
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta)
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
    const errorMeta = error instanceof Error
      ? {
          error: error.message,
          stack: error.stack,
          ...meta,
        }
      : { error: String(error), ...meta }

    this.log('error', message, errorMeta)
  }

  // Critical operations logging
  payment(action: string, meta: Record<string, unknown>) {
    this.info(`[PAYMENT] ${action}`, { ...meta, critical: true })
  }

  refund(action: string, meta: Record<string, unknown>) {
    this.info(`[REFUND] ${action}`, { ...meta, critical: true })
  }

  transfer(action: string, meta: Record<string, unknown>) {
    this.info(`[TRANSFER] ${action}`, { ...meta, critical: true })
  }

  auth(action: string, meta: Record<string, unknown>) {
    this.info(`[AUTH] ${action}`, meta)
  }
}

export const logger = new Logger()

// Helper to create scoped logger
export function createScopedLogger(scope: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => 
      logger.debug(`[${scope}] ${msg}`, meta),
    info: (msg: string, meta?: Record<string, unknown>) => 
      logger.info(`[${scope}] ${msg}`, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => 
      logger.warn(`[${scope}] ${msg}`, meta),
    error: (msg: string, error?: Error | unknown, meta?: Record<string, unknown>) => 
      logger.error(`[${scope}] ${msg}`, error, meta),
  }
}
