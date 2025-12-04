/**
 * Database configuration
 * Centralizes all database-related configuration for better maintainability
 */

export interface DatabaseConfig {
  path: string;
}

/**
 * Get database configuration from environment variables
 * @returns Database configuration object
 */
export function getDatabaseConfig(): DatabaseConfig {
  const path = process.env.DATABASE_PATH || './data/tokens.db';

  return {
    path,
  };
}

/**
 * Default database configuration
 */
export const defaultDatabaseConfig: DatabaseConfig = {
  path: './data/tokens.db',
};