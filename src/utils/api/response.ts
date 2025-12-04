import { NextResponse } from "next/server";
import { CreateTokenResponse } from "@/types/api/responses";
import { Token } from "@/types/domain/token";

/**
 * Creates a successful JSON response with consistent format
 * @param data The response data to include
 * @param status HTTP status code (default: 200)
 * @returns NextResponse instance with JSON data
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Creates an error JSON response with consistent format
 * @param error Error message describing what went wrong
 * @param status HTTP status code indicating the error type
 * @param details Optional additional error details for validation failures
 * @returns NextResponse instance with error information
 */
export function createErrorResponse(
  error: string,
  status: number,
  details?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ error, ...(details && { details }) }, { status });
}

/**
 * Converts a Token domain model to API response format
 * Transforms Date objects to ISO strings for JSON serialization
 * @param token The token domain model with Date objects
 * @returns CreateTokenResponse API model with ISO date strings
 */
export function toApiResponse(token: Token): CreateTokenResponse {
  return {
    id: token.id,
    userId: token.userId,
    scopes: token.scopes,
    createdAt: token.createdAt.toISOString(),
    expiresAt: token.expiresAt.toISOString(),
    token: token.token,
  };
}
