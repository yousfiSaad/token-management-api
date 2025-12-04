import { TokenService } from '@/lib/services/token-service';
import { ITokenRepository } from '@/lib/db';
import { Token } from '@/types/domain/token';
import { CreateTokenRequest } from '@/types/api/requests';

describe('TokenService', () => {
  let service: TokenService;
  let mockRepository: jest.Mocked<ITokenRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findNonExpiredByUserId: jest.fn(),
    };
    service = new TokenService(mockRepository);
  });

  describe('createToken', () => {
    it('should create a token with correct data', () => {
      const data: CreateTokenRequest = {
        userId: '123',
        scopes: ['read', 'write'],
        expiresInMinutes: 60,
      };

      const expectedToken: Token = {
        id: 'token_abc123',
        userId: '123',
        scopes: ['read', 'write'],
        token: 'token-string',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        expiresAt: new Date('2025-01-01T11:00:00.000Z'),
      };

      mockRepository.create.mockReturnValue(expectedToken);

      const result = service.createToken(data);

      expect(mockRepository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(expectedToken);
    });

    it('should calculate correct expiry time', () => {
      const data: CreateTokenRequest = {
        userId: '123',
        scopes: ['read'],
        expiresInMinutes: 30,
      };

      mockRepository.create.mockImplementation((data) => {
        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + data.expiresInMinutes * 60000);

        return {
          id: 'token_xyz',
          userId: data.userId,
          scopes: data.scopes,
          token: 'test-token',
          createdAt,
          expiresAt,
        };
      });

      const result = service.createToken(data);
      const timeDiff = result.expiresAt.getTime() - result.createdAt.getTime();
      const minutesDiff = timeDiff / 60000;

      expect(minutesDiff).toBe(30);
    });
  });

  describe('getTokensForUser', () => {
    it('should return non-expired tokens for a user', () => {
      const userId = '123';
      const mockTokens: Token[] = [
        {
          id: 'token_1',
          userId: '123',
          scopes: ['read'],
          token: 'token-string-1',
          createdAt: new Date('2025-01-01T10:00:00.000Z'),
          expiresAt: new Date('2025-01-01T11:00:00.000Z'),
        },
        {
          id: 'token_2',
          userId: '123',
          scopes: ['write'],
          token: 'token-string-2',
          createdAt: new Date('2025-01-01T09:00:00.000Z'),
          expiresAt: new Date('2025-01-01T12:00:00.000Z'),
        },
      ];

      mockRepository.findNonExpiredByUserId.mockReturnValue(mockTokens);

      const result = service.getTokensForUser(userId);

      expect(mockRepository.findNonExpiredByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockTokens);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no tokens exist', () => {
      const userId = '456';
      mockRepository.findNonExpiredByUserId.mockReturnValue([]);

      const result = service.getTokensForUser(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
