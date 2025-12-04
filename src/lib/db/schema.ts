import Database from 'better-sqlite3';

export function initializeDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      scopes TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_userId ON tokens(userId);
    CREATE INDEX IF NOT EXISTS idx_expiresAt ON tokens(expiresAt);
  `);
}
