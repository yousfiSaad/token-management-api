// API request and response types
export interface CreateTokenRequest {
  userId: string;
  scopes: string[];
  expiresInMinutes: number;
}

// API response type - dates as ISO strings
export interface CreateTokenResponse {
  id: string;
  userId: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  token: string;
}

// API response type for listing tokens
export type ListTokensResponse = CreateTokenResponse[];