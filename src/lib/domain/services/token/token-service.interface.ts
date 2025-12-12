import type { Token } from '@/lib/domain/models/token';
import type { CreateTokenRequest } from '@/types/api/requests';

/**
 * Token Service Interface
 * Defines the contract for token management operations
 */
export interface ITokenService {
  /**
   * Create a new token
   * @param data - Token creation data including userId, scopes, and expiration
   * @returns Created token with generated values
   */
  createToken(data: CreateTokenRequest): Token;

  /**
   * Get all non-expired tokens for a user
   * @param userId - User identifier
   * @returns Array of active tokens for the user
   */
  getTokensForUser(userId: string): Token[];

  /**
   * Get all non-expired tokens in the system
   * @returns Array of all active tokens
   */
  getAllTokens(): Token[];

  /**
   * Find token by ID
   * @param id - Token identifier
   * @returns Promise resolving to token if found and not expired, null otherwise
   */
  findById(id: string): Promise<Token | null>;

  /**
   * Delete token by ID
   * @param id - Token identifier
   * @returns Promise resolving to true if token was deleted, false if not found
   */
  delete(id: string): Promise<boolean>;
}