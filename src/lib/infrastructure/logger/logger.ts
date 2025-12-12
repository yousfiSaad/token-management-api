/**
 * Structured Logger Utility
 * Provides consistent logging across the application
 */

import { LOG_LEVELS } from '@/config/constants';

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

import type { ILogger } from './logger.interface';

export class Logger implements ILogger {
  private readonly context: Record<string, any>;

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...context });
  }

  /**
   * Log at error level
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LOG_LEVELS.ERROR, message, context, error);
  }

  /**
   * Log at warn level
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.WARN, message, context);
  }

  /**
   * Log at info level
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.INFO, message, context);
  }

  /**
   * Log at debug level
   */
  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(LOG_LEVELS.DEBUG, message, context);
    }
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...this.context,
        ...context,
      },
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    // Output based on environment
    if (process.env.NODE_ENV === 'production') {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    } else {
      // In development, use pretty printing
      this.prettyPrint(logEntry);
    }
  }

  /**
   * Pretty print log entry for development
   */
  private prettyPrint(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(5);
    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : '';
    const errorStr = entry.error
      ? `\n  Error: ${entry.error.message}`
      : '';

    console.log(`[${timestamp}] ${level} ${entry.message}${contextStr}${errorStr}`);
  }
}

// Default logger instance
export const LOGGER = new Logger();

// Named loggers for different parts of the application
export const loggers = {
  api: new Logger({ component: 'API' }),
  database: new Logger({ component: 'DATABASE' }),
  auth: new Logger({ component: 'AUTH' }),
  riskAnalysis: new Logger({ component: 'RISK_ANALYSIS' }),
  chat: new Logger({ component: 'CHAT' }),
  cache: new Logger({ component: 'CACHE' }),
} as const;