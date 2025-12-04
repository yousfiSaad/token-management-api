import { validateCreateTokenRequest, validateUserId } from '@/lib/validators/token-validator';

describe('validateCreateTokenRequest', () => {
  it('should validate a correct request', () => {
    const data = {
      userId: '123',
      scopes: ['read', 'write'],
      expiresInMinutes: 60,
    };

    const result = validateCreateTokenRequest(data);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.details).toBeUndefined();
  });

  describe('userId validation', () => {
    it('should reject missing userId', () => {
      const data = {
        scopes: ['read'],
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.userId).toBeDefined();
    });

    it('should reject empty userId', () => {
      const data = {
        userId: '',
        scopes: ['read'],
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.userId).toBe('userId must be a non-empty string');
    });

    it('should reject userId with only whitespace', () => {
      const data = {
        userId: '   ',
        scopes: ['read'],
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.userId).toBeDefined();
    });

    it('should reject non-string userId', () => {
      const data = {
        userId: 123,
        scopes: ['read'],
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.userId).toBeDefined();
    });
  });

  describe('scopes validation', () => {
    it('should reject missing scopes', () => {
      const data = {
        userId: '123',
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.scopes).toBe('scopes must be an array');
    });

    it('should reject empty scopes array', () => {
      const data = {
        userId: '123',
        scopes: [],
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.scopes).toBe('scopes must be a non-empty array');
    });

    it('should reject non-array scopes', () => {
      const data = {
        userId: '123',
        scopes: 'read',
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.scopes).toBe('scopes must be an array');
    });

    it('should reject scopes with non-string elements', () => {
      const data = {
        userId: '123',
        scopes: ['read', 123, 'write'],
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.scopes).toBe('scopes must be an array of non-empty strings');
    });

    it('should reject scopes with empty strings', () => {
      const data = {
        userId: '123',
        scopes: ['read', '', 'write'],
        expiresInMinutes: 60,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.scopes).toBe('scopes must be an array of non-empty strings');
    });
  });

  describe('expiresInMinutes validation', () => {
    it('should reject missing expiresInMinutes', () => {
      const data = {
        userId: '123',
        scopes: ['read'],
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.expiresInMinutes).toBe('expiresInMinutes must be a number');
    });

    it('should reject non-number expiresInMinutes', () => {
      const data = {
        userId: '123',
        scopes: ['read'],
        expiresInMinutes: '60',
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.expiresInMinutes).toBe('expiresInMinutes must be a number');
    });

    it('should reject non-integer expiresInMinutes', () => {
      const data = {
        userId: '123',
        scopes: ['read'],
        expiresInMinutes: 60.5,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.expiresInMinutes).toBe('expiresInMinutes must be an integer');
    });

    it('should reject zero expiresInMinutes', () => {
      const data = {
        userId: '123',
        scopes: ['read'],
        expiresInMinutes: 0,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.expiresInMinutes).toBe('expiresInMinutes must be a positive integer');
    });

    it('should reject negative expiresInMinutes', () => {
      const data = {
        userId: '123',
        scopes: ['read'],
        expiresInMinutes: -30,
      };

      const result = validateCreateTokenRequest(data);

      expect(result.valid).toBe(false);
      expect(result.details.expiresInMinutes).toBe('expiresInMinutes must be a positive integer');
    });
  });

  it('should reject invalid JSON body', () => {
    const result = validateCreateTokenRequest(null);

    expect(result.valid).toBe(false);
    expect(result.details.request).toBe('Request body must be a valid JSON object');
  });

  it('should return multiple errors for multiple invalid fields', () => {
    const data = {
      userId: '',
      scopes: [],
      expiresInMinutes: -5,
    };

    const result = validateCreateTokenRequest(data);

    expect(result.valid).toBe(false);
    expect(Object.keys(result.details).length).toBe(3);
  });
});

describe('validateUserId', () => {
  it('should validate a correct userId', () => {
    const result = validateUserId('123');

    expect(result.valid).toBe(true);
    expect(result.details).toBeUndefined();
  });

  it('should reject missing userId', () => {
    const result = validateUserId(null);

    expect(result.valid).toBe(false);
    expect(result.details.userId).toBe('userId must be a non-empty string');
  });

  it('should reject empty userId', () => {
    const result = validateUserId('');

    expect(result.valid).toBe(false);
    expect(result.details.userId).toBe('userId must be a non-empty string');
  });

  it('should reject userId with only whitespace', () => {
    const result = validateUserId('   ');

    expect(result.valid).toBe(false);
    expect(result.details.userId).toBe('userId must be a non-empty string');
  });

  it('should reject non-string userId', () => {
    const result = validateUserId(123);

    expect(result.valid).toBe(false);
    expect(result.details.userId).toBe('userId must be a non-empty string');
  });
});
