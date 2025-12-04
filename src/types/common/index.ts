// Shared utility types

/**
 * Unified error structure that can be used for both API responses and validation results
 * Provides a consistent way to handle error information across the application
 */
export interface UnifiedError {
  error: string;
  details?: Record<string, string>;
}

/**
 * Validation result that uses the unified error structure
 * When valid is true, error and details should be empty/undefined
 * When valid is false, error should describe the validation failure and details should contain field-specific errors
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, string>;
}