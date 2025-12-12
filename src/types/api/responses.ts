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

export type ListTokensResponse = TokenResponse[];

export interface TokenResponse {
  id: string;
  userId: string;
  scopes: string[];
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface SingleTokenResponse extends TokenResponse {
  isExpired: boolean;
  timeToExpiry: number;
  scopeCount: number;
}