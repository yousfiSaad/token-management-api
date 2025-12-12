import Database from 'better-sqlite3';
import type { ITokenRepository } from '@/lib/data/interfaces/repository';
import type { Token } from '@/lib/domain/models/token';
import type { CreateTokenRequest } from '@/types/api/requests';
import { initializeDatabase } from '@/lib/data/schema';
import { generateToken } from '@/utils/token-generator';

interface TokenRow {
  id: string;
  userId: string;
  scopes: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export class SQLiteTokenRepository implements ITokenRepository {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    initializeDatabase(this.db);
  }

  create(data: CreateTokenRequest): Token {
    const id = `token_${generateToken()}`;
    const token = generateToken();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + data.expiresInMinutes * 60000);

    const stmt = this.db.prepare(`
      INSERT INTO tokens (id, userId, scopes, token, createdAt, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.userId,
      JSON.stringify(data.scopes),
      token,
      createdAt.toISOString(),
      expiresAt.toISOString()
    );

    return {
      id,
      userId: data.userId,
      scopes: data.scopes,
      token,
      createdAt,
      expiresAt,
    };
  }

  findNonExpiredByUserId(userId: string): Token[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tokens
      WHERE userId = ? AND datetime(expiresAt) > datetime('now')
      ORDER BY createdAt DESC
    `);

    const rows = stmt.all(userId) as TokenRow[];

    return rows.map(row => ({
      id: row.id,
      userId: row.userId,
      scopes: JSON.parse(row.scopes),
      token: row.token,
      createdAt: new Date(row.createdAt),
      expiresAt: new Date(row.expiresAt),
    }));
  }

  findAllNonExpired(): Token[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tokens
      WHERE datetime(expiresAt) > datetime('now')
      ORDER BY createdAt DESC
    `);

    const rows = stmt.all() as TokenRow[];

    return rows.map(row => ({
      id: row.id,
      userId: row.userId,
      scopes: JSON.parse(row.scopes),
      token: row.token,
      createdAt: new Date(row.createdAt),
      expiresAt: new Date(row.expiresAt),
    }));
  }

  async findById(id: string): Promise<Token | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM tokens
      WHERE id = ? AND datetime(expiresAt) > datetime('now')
    `);

    const row = stmt.get(id) as TokenRow | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.userId,
      scopes: JSON.parse(row.scopes),
      token: row.token,
      createdAt: new Date(row.createdAt),
      expiresAt: new Date(row.expiresAt),
    };
  }

  // New method to delete token by ID
  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      DELETE FROM tokens WHERE id = ?
    `);

    const result = stmt.run(id);
    return (result.changes || 0) > 0;
  }

  close(): void {
    this.db.close();
  }
}
