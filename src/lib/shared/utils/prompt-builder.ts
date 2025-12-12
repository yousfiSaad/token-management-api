import { PromptBuilderError } from '../errors/extraction-errors';

/**
 * Utility for building extraction prompts with examples
 * Centralizes prompt templates to eliminate code duplication
 */
export class PromptBuilder {
  /**
   * Build the command extraction prompt with examples
   */
  static buildExtractionPrompt(message: string): string {
    if (!message || typeof message !== 'string') {
      throw new PromptBuilderError('Invalid message provided for extraction');
    }

    const examples = this.getExamples();

    return `Extract the token management command from this user message.

User message: "${message}"

Return ONLY a JSON object with this exact structure:
{
  "intent": "create|read|delete|update|refresh|status|revoke|help|unknown",
  "parameters": {
    "userId": "string or null",
    "scopes": ["read", "write", "admin"] or null,
    "tokenId": "string or null",
    "time": "string or null",
    "deleteAll": "boolean or null"
  },
  "confidence": 0.95
}

Examples:
${examples}

Important: Return ONLY the JSON object, no explanations or additional text.`;
  }

  /**
   * Build a prompt for making responses friendly
   */
  static buildFriendlyPrompt(message: string): string {
    return `You are formatting a response. Convert the following message to be friendly and natural while keeping the structured information intact.

Keep it brief and helpful.
Use a conversational tone but maintain the key details.
Add an appropriate emoji if it fits naturally at the end.
Do not change the meaning or key information.

For token listing responses, use formats like:
- "Found one token for user [username] with [scope] scope that expires on [date]"
- "Found [count] tokens for user [username]:"
- "[username] doesn't have any active tokens" (keep the username as-is)

Message to format: "${message}"

IMPORTANT: Respond with ONLY the formatted message. Do not include any explanations, preambles, or meta-commentary.`;
  }

  /**
   * Get all extraction examples as a formatted string
   */
  private static getExamples(): string {
    return [
      '- "Create a token for alice with read scope" → {"intent":"create","parameters":{"userId":"alice","scopes":["read"]},"confidence":0.95}',
      '- "Create a token for bob that expires in two weeks" → {"intent":"create","parameters":{"userId":"bob","scopes":["read"],"time":"2 weeks"},"confidence":0.95}',
      '- "Generate a token for alice with write and admin scopes that expires in 30 days" → {"intent":"create","parameters":{"userId":"alice","scopes":["write","admin"],"time":"30 days"},"confidence":0.95}',
      '- "List all tokens" → {"intent":"read","parameters":{},"confidence":0.95}',
      '- "List all tokens for alice" → {"intent":"read","parameters":{"userId":"alice"},"confidence":0.95}',
      '- "Show all tokens for alice" → {"intent":"read","parameters":{"userId":"alice"},"confidence":0.95}',
      '- "Get tokens for bob" → {"intent":"read","parameters":{"userId":"bob"},"confidence":0.95}',
      '- "Delete token_bob" → {"intent":"delete","parameters":{"tokenId":"token_bob"},"confidence":0.95}',
      '- "Delete all alice tokens" → {"intent":"delete","parameters":{"userId":"alice","deleteAll":true},"confidence":0.95}',
      '- "Remove all bob tokens" → {"intent":"delete","parameters":{"userId":"bob","deleteAll":true},"confidence":0.95}',
      '- "Clear all alice\'s tokens" → {"intent":"delete","parameters":{"userId":"alice","deleteAll":true},"confidence":0.95}',
      '- "Delete all of alice\'s tokens" → {"intent":"delete","parameters":{"userId":"alice","deleteAll":true},"confidence":0.95}',
      '- "Update token_alice with admin scope" → {"intent":"update","parameters":{"tokenId":"token_alice","scopes":["admin"]},"confidence":0.95}',
      '- "Refresh token_bob for 2 weeks" → {"intent":"refresh","parameters":{"tokenId":"token_bob","time":"2 weeks"},"confidence":0.95}',
      '- "Check status of token_alice" → {"intent":"status","parameters":{"tokenId":"token_alice"},"confidence":0.95}',
      '- "Revoke token_bob" → {"intent":"revoke","parameters":{"tokenId":"token_bob"},"confidence":0.95}',
      '- "What can I do?" → {"intent":"help","parameters":{},"confidence":0.95}'
    ].join('\n');
  }
}