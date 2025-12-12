import { AppError } from './exceptions';

/**
 * Base error for command extraction failures
 */
export class ExtractionError extends AppError {
  constructor(message: string, public cause?: Error) {
    super(message, 500, 'EXTRACTION_ERROR', true);
  }
}

/**
 * Error when LLM response is not valid JSON or cannot be parsed
 */
export class InvalidResponseError extends ExtractionError {
  constructor(message: string, response?: string, cause?: Error) {
    super(message, cause);
    this.name = 'InvalidResponseError';
    // Store response for debugging (excluding PII)
    Object.defineProperty(this, 'response', {
      value: response,
      enumerable: false,
      writable: false
    });
  }
}

/**
 * Error when all LLM providers are unavailable
 */
export class ProviderUnavailableError extends ExtractionError {
  constructor(message: string = 'All LLM providers are unavailable') {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

/**
 * Error when extraction confidence is too low
 */
export class LowConfidenceError extends ExtractionError {
  constructor(message: string, public confidence: number) {
    super(message);
    this.name = 'LowConfidenceError';
  }
}

/**
 * Error when prompt building fails
 */
export class PromptBuilderError extends ExtractionError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'PromptBuilderError';
  }
}