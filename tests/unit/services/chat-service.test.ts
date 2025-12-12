import { SimpleChatService } from '@/lib/domain/services/chat';
import { OllamaService } from '@/lib/infrastructure/ollama';
import { ChatRequest } from '@/types/domain/chat';
import type { IOllamaService } from '@/lib/infrastructure';
import type { ITokenService } from '@/lib/domain/services/token';
import type { Token } from '@/lib/domain/models/token';

// Mock OllamaService
jest.mock('@/lib/infrastructure/ollama/ollama-service');

// Mock TokenService
jest.mock('@/lib/domain/services/token/token-service');

describe('SimpleChatService', () => {
  let chatService: SimpleChatService;
  let mockOllamaService: jest.Mocked<IOllamaService>;
  let mockTokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock OllamaService
    mockOllamaService = {
      extractCommand: jest.fn(),
      makeFriendly: jest.fn(),
    } as any;

    // Mock TokenService
    mockTokenService = {
      createToken: jest.fn(),
      getTokensForUser: jest.fn(),
      getAllTokens: jest.fn(),
      deleteToken: jest.fn(),
      getToken: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as any;

    // Create service instance with proper dependencies
    chatService = new SimpleChatService(mockTokenService, mockOllamaService);

    // Default mock behavior for extractCommand
    mockOllamaService.extractCommand.mockResolvedValue({
      intent: 'unknown',
      parameters: {},
      confidence: 0.5
    });

    // Default mock behavior for makeFriendly
    mockOllamaService.makeFriendly.mockImplementation((msg: string) => Promise.resolve(msg));
  });

  describe('processMessage', () => {
    it('should return success: false for unknown commands', async () => {
      const request: ChatRequest = {
        message: 'What is the weather?'
      };

      const response = await chatService.processMessage(request, 'test-user');

      expect(response).toEqual({
        response: "I'm not sure what you want to do. Try asking me to create, list, update, delete, refresh, or check the status of tokens.",
        sessionId: 'none',
        success: false
      });
    });

    it('should handle create token command', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'create',
        parameters: {
          userId: 'john',
          scopes: ['read', 'write']
        },
        confidence: 0.95
      });

      const mockToken: Token = {
        id: 'token_abc123',
        userId: 'john',
        scopes: ['read', 'write'],
        token: 'secret-token-value',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      mockTokenService.createToken = jest.fn().mockReturnValue(mockToken);

      const request: ChatRequest = {
        message: 'Create a token for john with read and write scopes'
      };

      const response = await chatService.processMessage(request);

      expect(response.data.token).toHaveProperty('token');
      expect(response.data.token.id).toBe('token_abc123');
      expect(response.data.token.token).toBe('secret-token-value');
      expect(response.sessionId).toBe('none');
      expect(response.success).toBe(true);
      expect(response.response).toContain('Created token token_abc123 for john');
      expect(response.response).toContain('Token: secret-token-value');
    });

    it('should handle create token command with expiration time', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'create',
        parameters: {
          userId: 'alice',
          scopes: ['read'],
          time: '2 weeks'
        },
        confidence: 0.95
      });

      const mockToken: Token = {
        id: 'token_def456',
        userId: 'alice',
        scopes: ['read'],
        token: 'secret-token-value',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      };

      mockTokenService.createToken = jest.fn().mockReturnValue(mockToken);

      const request: ChatRequest = {
        message: 'Create a token for user alice that expires in two weeks'
      };

      const response = await chatService.processMessage(request);

      expect(response.success).toBe(true);
      expect(response.response).toContain('Created token token_def456 for alice');
      expect(response.response).toContain('will expire in 2 weeks');
      expect(mockTokenService.createToken).toHaveBeenCalledWith({
        userId: 'alice',
        scopes: ['read'],
        expiresInMinutes: 14 * 24 * 60 // 2 weeks in minutes
      });
    });

    it('should handle read token command without tokenId - single token', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'read',
        parameters: {
          userId: 'john'
        },
        confidence: 0.95
      });

      const mockTokens: Token[] = [
        {
          id: 'token_abc123',
          userId: 'john',
          scopes: ['read'],
          token: 'secret-1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];

      mockTokenService.getTokensForUser = jest.fn().mockReturnValue(mockTokens);

      const request: ChatRequest = {
        message: 'List all tokens for john'
      };

      const response = await chatService.processMessage(request);

      expect(response.sessionId).toBe('none');
      expect(response.success).toBe(true);
      expect(response.response).toContain('Found one token for user john');
      expect(response.response).toContain('Scopes: read');
      expect(response.response).toContain('Token: secret-1');
      if (response.data?.tokens) {
        response.data.tokens.forEach((token: any) => {
          expect(token).toHaveProperty('token');
        });
      }
    });

    it('should handle read token command with multiple tokens', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'read',
        parameters: {
          userId: 'john'
        },
        confidence: 0.95
      });

      const mockTokens: Token[] = [
        {
          id: 'token_abc123',
          userId: 'john',
          scopes: ['read'],
          token: 'secret-1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'token_def456',
          userId: 'john',
          scopes: ['read', 'write'],
          token: 'secret-2',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      ];

      mockTokenService.getTokensForUser = jest.fn().mockReturnValue(mockTokens);

      const request: ChatRequest = {
        message: 'List all tokens for john'
      };

      const response = await chatService.processMessage(request);

      expect(response.sessionId).toBe('none');
      expect(response.success).toBe(true);
      expect(response.response).toContain('Found 2 tokens for user john');
      expect(response.response).toContain('token_abc123');
      expect(response.response).toContain('token_def456');
      expect(response.response).toContain('Scopes: read');
      expect(response.response).toContain('Scopes: read, write');
      if (response.data?.tokens) {
        response.data.tokens.forEach((token: any) => {
          expect(token).toHaveProperty('token');
        });
      }
    });

    it('should respect userId parameter when specified in command', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'read',
        parameters: {
          userId: 'alice_smith' // Using a more generic example
        },
        confidence: 0.95
      });

      const mockTokens: Token[] = [
        {
          id: 'token_abc123',
          userId: 'alice_smith',
          scopes: ['read'],
          token: 'secret-1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];

      mockTokenService.getTokensForUser = jest.fn().mockReturnValue(mockTokens);

      const request: ChatRequest = {
        message: 'Show me all tokens for alice_smith'
      };

      const response = await chatService.processMessage(request, 'demo-user'); // authenticated user is demo-user

      expect(response.sessionId).toBe('none');
      expect(response.success).toBe(true);
      expect(response.response).toContain('Found one token for user alice_smith'); // Should show alice_smith, not demo-user
      expect(mockTokenService.getTokensForUser).toHaveBeenCalledWith('alice_smith'); // Should be called with 'alice_smith'
      if (response.data?.tokens) {
        expect(response.data.tokens[0].userId).toBe('alice_smith'); // Data should contain alice_smith's tokens
        response.data.tokens.forEach((token: any) => {
          expect(token).toHaveProperty('token');
        });
      }
    });

    it('should show correct username when user has no tokens', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'read',
        parameters: {
          userId: 'user123'
        },
        confidence: 0.95
      });

      // Return empty array for no tokens
      mockTokenService.getTokensForUser = jest.fn().mockReturnValue([]);

      const request: ChatRequest = {
        message: 'Show tokens for user123'
      };

      const response = await chatService.processMessage(request, 'demo-user');

      expect(response.sessionId).toBe('none');
      expect(response.success).toBe(true);
      expect(response.response).toContain('user123'); // Should mention user123, not "you"
      expect(response.response).toContain('doesn\'t have any active tokens');
      expect(mockTokenService.getTokensForUser).toHaveBeenCalledWith('user123');
    });

    it('should list all tokens when no user specified', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'read',
        parameters: {},
        confidence: 0.95
      });

      const mockTokens: Token[] = [
        {
          id: 'token_abc123',
          userId: 'alice',
          scopes: ['read'],
          token: 'secret-1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'token_def456',
          userId: 'bob',
          scopes: ['write'],
          token: 'secret-2',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      ];

      mockTokenService.getAllTokens = jest.fn().mockReturnValue(mockTokens);

      const request: ChatRequest = {
        message: 'List all tokens'
      };

      const response = await chatService.processMessage(request, 'demo-user');

      expect(response.sessionId).toBe('none');
      expect(response.success).toBe(true);
      expect(response.response).toContain('Found 2 tokens in the system');
      expect(response.response).toContain('User: alice');
      expect(response.response).toContain('User: bob');
      expect(mockTokenService.getAllTokens).toHaveBeenCalled();
    });

    it('should handle delete token command', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'delete',
        parameters: {
          tokenId: 'token_abc123'
        },
        confidence: 0.95
      });

      const mockToken: Token = {
        id: 'token_abc123',
        userId: 'john',
        scopes: ['read'],
        token: 'secret-token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      mockTokenService.findById = jest.fn().mockResolvedValue(mockToken);
      mockTokenService.delete = jest.fn().mockResolvedValue(true);

      const request: ChatRequest = {
        message: 'Delete token token_abc123'
      };

      const response = await chatService.processMessage(request, 'john');

      expect(response).toEqual({
        response: 'Successfully deleted token token_abc123.',
        sessionId: 'none',
        success: true,
        data: { deletedToken: 'token_abc123' }
      });
    });

    it('should handle delete all tokens for user command', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'delete',
        parameters: {
          userId: 'alice',
          deleteAll: true
        },
        confidence: 0.95
      });

      const mockTokens: Token[] = [
        {
          id: 'token_abc123',
          userId: 'alice',
          scopes: ['read'],
          token: 'secret-1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'token_def456',
          userId: 'alice',
          scopes: ['write'],
          token: 'secret-2',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      ];

      mockTokenService.getTokensForUser = jest.fn().mockReturnValue(mockTokens);
      mockTokenService.delete = jest.fn().mockResolvedValue(true);

      const request: ChatRequest = {
        message: 'Delete all alice tokens'
      };

      const response = await chatService.processMessage(request, 'alice');

      expect(response.response).toContain('Deleted 2 tokens for alice.');
      expect(response.sessionId).toBe('none');
      expect(response.success).toBe(true);
      expect(response.data.deletedCount).toBe(2);
      expect(response.data.userId).toBe('alice');
      expect(mockTokenService.delete).toHaveBeenCalledTimes(2);
      expect(mockTokenService.delete).toHaveBeenCalledWith('token_abc123');
      expect(mockTokenService.delete).toHaveBeenCalledWith('token_def456');
    });

    it('should handle errors gracefully', async () => {
      mockOllamaService.extractCommand.mockRejectedValue(new Error('Ollama unavailable'));

      const request: ChatRequest = {
        message: 'Create a token'
      };

      const response = await chatService.processMessage(request);

      expect(response).toEqual({
        response: 'Error: Ollama unavailable',
        sessionId: 'none',
        success: false
      });
    });

    it('should return error when create command missing scopes', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'create',
        parameters: {
          userId: 'john'
          // missing scopes
        },
        confidence: 0.95
      });

      const request: ChatRequest = {
        message: 'Create a token for john'
      };

      const response = await chatService.processMessage(request);

      expect(response).toEqual({
        response: 'To create a token, please specify at least one scope (read, write, or admin).',
        sessionId: 'none',
        success: false
      });
    });
  });

  describe('New Handler Methods', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset default mock behavior
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'unknown',
        parameters: {},
        confidence: 0.5
      });
      mockOllamaService.makeFriendly.mockImplementation((msg: string) => Promise.resolve(msg));
    });

    it('should handle update token command', async () => {
      const mockToken = {
        id: 'token-abc',
        userId: 'john',
        scopes: ['read'],
        token: 'secret-token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'update',
        parameters: {
          tokenId: 'token-abc',
          scopes: ['read', 'write']
        },
        confidence: 0.95
      });

      mockTokenService.findById = jest.fn().mockResolvedValue(mockToken);
      mockTokenService.delete = jest.fn().mockResolvedValue(true);
      mockTokenService.createToken = jest.fn().mockReturnValue(mockToken);

      const request: ChatRequest = {
        message: 'Update token-abc with write scope'
      };

      const response = await chatService.processMessage(request, 'john');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(mockTokenService.findById).toHaveBeenCalledWith('token-abc');
      expect(mockTokenService.createToken).toHaveBeenCalled();
    });

    it('should handle refresh token command', async () => {
      const mockToken = {
        id: 'token-abc',
        userId: 'john',
        scopes: ['read'],
        token: 'secret-token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'refresh',
        parameters: {
          tokenId: 'token-abc',
          time: '2 weeks'
        },
        confidence: 0.95
      });

      mockTokenService.findById = jest.fn().mockResolvedValue(mockToken);
      mockTokenService.delete = jest.fn().mockResolvedValue(true);
      mockTokenService.createToken.mockReturnValue(mockToken);

      const request: ChatRequest = {
        message: 'Refresh token-abc for 2 weeks'
      };

      const response = await chatService.processMessage(request, 'john');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(mockTokenService.findById).toHaveBeenCalledWith('token-abc');
    });

    it('should handle status token command', async () => {
      const mockToken = {
        id: 'token-abc',
        userId: 'john',
        scopes: ['read'],
        token: 'secret-token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      };

      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'status',
        parameters: {
          tokenId: 'token-abc'
        },
        confidence: 0.95
      });

      mockTokenService.findById = jest.fn().mockResolvedValue(mockToken);

      const request: ChatRequest = {
        message: 'Check status of token-abc'
      };

      const response = await chatService.processMessage(request, 'john');

      expect(response.success).toBe(true);
      expect(response.data.isValid).toBe(true);
      expect(response.data.daysUntilExpiry).toBe(10);
    });

    it('should handle revoke token command', async () => {
      const mockToken = {
        id: 'token-abc',
        userId: 'john',
        scopes: ['read'],
        createdAt: new Date(),
        expiresAt: new Date()
      };

      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'revoke',
        parameters: {
          tokenId: 'token-abc'
        },
        confidence: 0.95
      });

      mockTokenService.findById = jest.fn().mockResolvedValue(mockToken);
      mockTokenService.delete = jest.fn().mockResolvedValue(true);

      const request: ChatRequest = {
        message: 'Revoke token-abc'
      };

      const response = await chatService.processMessage(request, 'john');

      expect(response.success).toBe(true);
      expect(response.data.revokedToken).toBe('token-abc');
      expect(mockTokenService.delete).toHaveBeenCalledWith('token-abc');
    });

    it('should handle help command', async () => {
      mockOllamaService.extractCommand.mockResolvedValue({
        intent: 'help',
        parameters: {},
        confidence: 0.95
      });

      const request: ChatRequest = {
        message: 'What can I do?'
      };

      const response = await chatService.processMessage(request, 'john');

      expect(response.success).toBe(true);
      expect(response.response).toContain('I can help you manage tokens!');
      expect(response.response).toContain('Create tokens:');
      expect(response.response).toContain('Update tokens:');
      expect(response.response).toContain('[username]'); // Should show generic placeholders
      expect(response.response).toContain('[token_id]'); // Should show generic placeholders
      expect(response.response).toContain('Use any username or user ID'); // Should show helpful tips
    });
  });
});