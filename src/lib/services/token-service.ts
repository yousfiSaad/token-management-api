import { ITokenRepository } from '@/lib/db';
import { Token } from '@/types/domain/token';
import { CreateTokenRequest } from '@/types/api/requests';

export class TokenService {
  constructor(private repository: ITokenRepository) {}

  createToken(data: CreateTokenRequest): Token {
    return this.repository.create(data);
  }

  getTokensForUser(userId: string): Token[] {
    return this.repository.findNonExpiredByUserId(userId);
  }
}
