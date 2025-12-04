import { Token } from '@/types/domain/token';
import { CreateTokenRequest } from '@/types/api/requests';

export interface ITokenRepository {
  create(data: CreateTokenRequest): Token;
  findNonExpiredByUserId(userId: string): Token[];
}
