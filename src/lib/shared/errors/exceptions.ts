/**
 * Custom Exception Classes
 * Provides type-safe error handling with proper categorization
 */

export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication Errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Validation Errors
export class ValidationError extends AppError {
  public readonly details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class InvalidUserIdError extends ValidationError {
  constructor(userId: string) {
    super(`Invalid user ID: ${userId}`, { userId });
  }
}

export class InvalidTokenIdError extends ValidationError {
  constructor(tokenId: string) {
    super(`Invalid token ID: ${tokenId}`, { tokenId });
  }
}

// Business Logic Errors
export class TokenNotFoundError extends AppError {
  constructor(tokenId: string) {
    super(`Token not found: ${tokenId}`, 404, 'TOKEN_NOT_FOUND');
  }
}

export class TokenExpiredError extends AppError {
  constructor(tokenId: string) {
    super(`Token has expired: ${tokenId}`, 410, 'TOKEN_EXPIRED');
  }
}

export class InsufficientScopesError extends AppError {
  constructor(requiredScopes: string[]) {
    super(`Insufficient scopes. Required: ${requiredScopes.join(', ')}`, 403, 'INSUFFICIENT_SCOPES');
  }
}

// System Errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR', false);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    const message = retryAfter
      ? `Rate limit exceeded. Retry after ${retryAfter} seconds`
      : 'Rate limit exceeded';
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Internal Error for unknown errors
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}

// Error Factory
export class ErrorFactory {
  static fromException(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('UNIQUE constraint')) {
        return new ValidationError('Resource already exists', { originalError: error.message });
      }

      if (error.message.includes('SQLITE')) {
        return new DatabaseError(`Database error: ${error.message}`);
      }

      if (error.message.includes('timeout')) {
        return new ExternalServiceError('Service timeout', error.message);
      }
    }

    // Unknown error - wrap in InternalError
    return new InternalError(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Error type guard
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}