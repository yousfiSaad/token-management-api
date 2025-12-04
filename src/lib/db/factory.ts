import { SQLiteTokenRepository } from './sqlite';
import { getDatabaseConfig } from '@/config/database';

let repository: SQLiteTokenRepository | null = null;

/**
 * Get the SQLite token repository instance.
 * Implements lazy initialization with singleton pattern.
 *
 * @returns {SQLiteTokenRepository} The repository instance
 */
export function getTokenRepository(): SQLiteTokenRepository {
  if (!repository) {
    const { path: dbPath } = getDatabaseConfig();
    repository = new SQLiteTokenRepository(dbPath);
  }
  return repository;
}

/**
 * Reset the repository instance. Useful for testing.
 */
export function resetTokenRepository(): void {
  repository = null;
}