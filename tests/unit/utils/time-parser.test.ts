// Test the parseTimeExpression method from chat service
import { SimpleChatService } from '@/lib/domain/services/chat';

// Mock the dependencies
jest.mock('@/lib/infrastructure/ollama/ollama-service');
jest.mock('@/lib/domain/services/token/token-service');

describe('parseTimeExpression', () => {
  let chatService: SimpleChatService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create minimal mock services
    const mockOllamaService = {
      extractCommand: jest.fn(),
      makeFriendly: jest.fn(),
    } as any;

    const mockTokenService = {
      createToken: jest.fn(),
      getTokensForUser: jest.fn(),
      findByDisplayId: jest.fn(),
      deleteByDisplayId: jest.fn(),
    } as any;

    chatService = new SimpleChatService(mockTokenService, mockOllamaService);
  });

  it('should parse days correctly', () => {
    // Access private method via prototype for testing
    const parseTimeExpression = (chatService as any).parseTimeExpression.bind(chatService);

    expect(parseTimeExpression('1 day')).toBe(24 * 60);
    expect(parseTimeExpression('5 days')).toBe(5 * 24 * 60);
    expect(parseTimeExpression('10 days')).toBe(10 * 24 * 60);
  });

  it('should parse weeks correctly', () => {
    const parseTimeExpression = (chatService as any).parseTimeExpression.bind(chatService);

    expect(parseTimeExpression('1 week')).toBe(7 * 24 * 60);
    expect(parseTimeExpression('2 weeks')).toBe(2 * 7 * 24 * 60);
    expect(parseTimeExpression('3 weeks')).toBe(3 * 7 * 24 * 60);
  });

  it('should parse months correctly', () => {
    const parseTimeExpression = (chatService as any).parseTimeExpression.bind(chatService);

    expect(parseTimeExpression('1 month')).toBe(30 * 24 * 60);
    expect(parseTimeExpression('6 months')).toBe(6 * 30 * 24 * 60);
  });

  it('should parse years correctly', () => {
    const parseTimeExpression = (chatService as any).parseTimeExpression.bind(chatService);

    expect(parseTimeExpression('1 year')).toBe(365 * 24 * 60);
    expect(parseTimeExpression('2 years')).toBe(2 * 365 * 24 * 60);
  });

  it('should handle case insensitive inputs', () => {
    const parseTimeExpression = (chatService as any).parseTimeExpression.bind(chatService);

    expect(parseTimeExpression('1 DAY')).toBe(24 * 60);
    expect(parseTimeExpression('2 WEEKS')).toBe(2 * 7 * 24 * 60);
    expect(parseTimeExpression('3 Months')).toBe(3 * 30 * 24 * 60);
  });

  it('should return default for unrecognized expressions', () => {
    const parseTimeExpression = (chatService as any).parseTimeExpression.bind(chatService);

    expect(parseTimeExpression('invalid')).toBe(30 * 24 * 60);
    expect(parseTimeExpression('')).toBe(30 * 24 * 60);
    expect(parseTimeExpression('bananas')).toBe(30 * 24 * 60);
  });
});