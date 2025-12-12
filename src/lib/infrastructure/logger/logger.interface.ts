/**
 * Logger Interface
 * Defines the contract for structured logging throughout the application
 */
export interface ILogger {
  /**
   * Create a child logger with additional context
   * @param context - Additional context to add to all log entries
   * @returns New logger instance with combined context
   */
  child(context: Record<string, any>): ILogger;

  /**
   * Log an error message
   * @param message - Error message to log
   * @param context - Optional additional context
   * @param error - Optional Error object with stack trace
   */
  error(message: string, context?: Record<string, any>, error?: Error): void;

  /**
   * Log a warning message
   * @param message - Warning message to log
   * @param context - Optional additional context
   */
  warn(message: string, context?: Record<string, any>): void;

  /**
   * Log an info message
   * @param message - Info message to log
   * @param context - Optional additional context
   */
  info(message: string, context?: Record<string, any>): void;

  /**
   * Log a debug message (only in development mode)
   * @param message - Debug message to log
   * @param context - Optional additional context
   */
  debug(message: string, context?: Record<string, any>): void;
}

/**
 * Logger Factory Interface
 * Defines the contract for creating logger instances
 */
export interface ILoggerFactory {
  /**
   * Create a new logger instance
   * @param context - Initial context for the logger
   * @returns New logger instance
   */
  create(context?: Record<string, any>): ILogger;

  /**
   * Get a named logger instance
   * @param name - Logger name/namespace
   * @returns Logger instance for the specified namespace
   */
  getNamedLogger(name: string): ILogger;
}