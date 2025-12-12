import type { Token } from '@/lib/domain';
import type { CreateTokenRequest } from '@/types/api/requests';

export interface ITokenRepository {
  create(data: CreateTokenRequest): Token;
  findNonExpiredByUserId(userId: string): Token[];
  findAllNonExpired(): Token[];
  findById(id: string): Promise<Token | null>;
  delete(id: string): Promise<boolean>;
}
