// API error and response types
import { UnifiedError } from '../common';

// Re-export unified error type for API usage
export type { UnifiedError };

/**
 * API error response using the unified error structure
 * This provides consistency with validation errors throughout the application
 */
export type ApiResponseError = UnifiedError;

export interface ApiResponseSuccess<T> {
  data: T;
}

/**
 * Standardized API response with discriminated union for success/error states
 * Uses the unified error structure for consistency
 */
export type ApiResponse<T = never> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string> };