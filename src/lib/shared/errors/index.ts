/**
 * Error handling exports
 */

export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  InvalidUserIdError,
  InvalidTokenIdError,
  TokenNotFoundError,
  TokenExpiredError,
  InsufficientScopesError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  InternalError,
  ErrorFactory,
  isAppError
} from './exceptions';

// Extraction-specific errors
export {
  ExtractionError,
  InvalidResponseError,
  ProviderUnavailableError,
  LowConfidenceError,
  PromptBuilderError
} from './extraction-errors';