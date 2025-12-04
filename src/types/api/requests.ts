/**
 * API request types
 * Defines the structure of incoming API requests
 */

export interface CreateTokenRequest {
  userId: string;
  scopes: string[];
  expiresInMinutes: number;
}