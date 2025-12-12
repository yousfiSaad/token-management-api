import type { ITokenRepository } from '@/lib/data';
import type { Token } from '@/lib/domain/models/token';
import type { CreateTokenRequest } from '@/types/api/requests';
import type { ITokenService } from './token-service.interface';

export class TokenService implements ITokenService {
  constructor(private repository: ITokenRepository) {}

  createToken(data: CreateTokenRequest): Token {
    return this.repository.create(data);
  }

  getTokensForUser(userId: string): Token[] {
    return this.repository.findNonExpiredByUserId(userId);
  }

  getAllTokens(): Token[] {
    return this.repository.findAllNonExpired();
  }

  async findById(id: string): Promise<Token | null> {
    return this.repository.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
