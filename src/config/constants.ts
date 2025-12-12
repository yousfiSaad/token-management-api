/**
 * Application Constants
 * Centralized configuration for all magic numbers and hardcoded values
 */

export const CACHE_DURATION = {
  TOKEN_MS: 24 * 60 * 60 * 1000, // 24 hours
};

export const OLLAMA_CONFIG = {
  TEMPERATURE: 0.2,
  MAX_TOKENS: 800,
  MODEL: 'llama2',
  TIMEOUT_MS: 30000,
};

export const DISPLAY_ID = {
  MAX_ATTEMPTS: 10,
  FALLBACK_PREFIX: 'token-',
};

export const ERROR_MESSAGES = {
  AUTHENTICATION: {
    UNAUTHORIZED: 'Unauthorized: Invalid or missing API key',
    FORBIDDEN: 'Forbidden: Insufficient permissions',
  },
  VALIDATION: {
    INVALID_REQUEST: 'Invalid request format',
    MISSING_FIELDS: 'Required fields are missing',
    INVALID_USER_ID: 'Invalid user ID format',
    INVALID_TOKEN_ID: 'Invalid token ID format',
  },
  BUSINESS: {
    TOKEN_NOT_FOUND: 'Token not found or access denied',
    TOKEN_EXPIRED: 'Token has expired',
    INSUFFICIENT_SCOPES: 'Insufficient permissions for requested operation',
  },
  SYSTEM: {
    INTERNAL_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database operation failed',
    EXTERNAL_SERVICE_ERROR: 'External service unavailable',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  },
} as const;

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;