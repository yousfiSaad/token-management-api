interface OllamaResponse {
  response: string;
  done: boolean;
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const OLLAMA_TIMEOUT = 30000;

/**
 * @deprecated Use IOllamaService from DI container instead
 * This singleton pattern violates dependency injection principles
 */
export class OllamaHelper {
  private static instance: OllamaHelper;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;
  }

  static getInstance(): OllamaHelper {
    if (!OllamaHelper.instance) {
      console.warn('⚠️  OllamaHelper.getInstance() is deprecated. Use IOllamaService from DI container instead.');
      OllamaHelper.instance = new OllamaHelper();
    }
    return OllamaHelper.instance;
  }

  async extractCommand(message: string): Promise<{
    intent: string;
    parameters: Record<string, any>;
    confidence: number;
  }> {
    const prompt = `Extract the token management command from this user message.

User message: "${message}"

Return JSON in this format:
{
  "intent": "create|read|delete|update|refresh|status|revoke|help|unknown",
  "parameters": {
    "userId": "string or null",
    "scopes": ["read", "write", "admin"] or null,
    "tokenId": "string or null",
    "deleteAll": "boolean or null",
    "time": "string or null"
  },
  "confidence": 0.95
}

Examples:
- "Create a token for alice with read scope" → {"intent":"create","parameters":{"userId":"alice","scopes":["read"]},"confidence":0.95}
- "List all tokens for bob" → {"intent":"read","parameters":{"userId":"bob"},"confidence":0.9}
- "Delete token_alice" → {"intent":"delete","parameters":{"tokenId":"token_alice"},"confidence":0.95}
- "Delete all alice tokens" → {"intent":"delete","parameters":{"userId":"alice","deleteAll":true},"confidence":0.95}

Return only the JSON object.`;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: { temperature: 0.3, max_tokens: 200 }
        }),
        signal: AbortSignal.timeout(OLLAMA_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status}`);
      }

      const data = await response.json() as OllamaResponse;
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || 'unknown',
          parameters: parsed.parameters || {},
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0))
        };
      }

      return { intent: 'unknown', parameters: {}, confidence: 0.1 };
    } catch (error) {
      console.error('Ollama command extraction error:', error);
      return { intent: 'unknown', parameters: {}, confidence: 0.1 };
    }
  }
}