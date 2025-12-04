/**
 * API response types
 * Defines the structure of outgoing API responses
 * Dates are represented as ISO strings for JSON serialization
 */

export interface CreateTokenResponse {
  id: string;
  userId: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  token: string;
}

export type ListTokensResponse = CreateTokenResponse[];