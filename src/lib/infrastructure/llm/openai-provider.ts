import { ILLMProvider, GenerationOptions, ProviderCapabilities } from './provider.interface';
import { ExternalServiceError } from '@/lib/shared/errors';

/**
 * OpenAI provider for cloud-based LLM inference
 */
export class OpenAIProvider implements ILLMProvider {
  readonly name = 'OpenAI';
  readonly priority = 1; // Highest priority for reliability

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string, config?: { model?: string; baseUrl?: string }) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.model = config?.model || 'gpt-4o-mini';
    this.baseUrl = config?.baseUrl || 'https://api.openai.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async generateCompletion(prompt: string, options?: GenerationOptions): Promise<string> {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant that provides accurate and concise responses.' },
      { role: 'user', content: prompt }
    ];

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature || 0.1,
      max_tokens: options?.maxTokens || 500,
      stop: options?.stop,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(options?.timeout || 30000),
    });

    if (!response.ok) {
      throw new ExternalServiceError(
        'openai',
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new ExternalServiceError(
        'openai',
        'Invalid response: missing message content'
      );
    }

    return data.choices[0].message.content;
  }

  /**
   * Generate a completion with structured JSON output
   * Uses OpenAI's JSON mode for reliable structured output
   */
  async generateJSONCompletion(prompt: string, options?: GenerationOptions): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: 'You are a JSON extraction expert. Always return valid JSON objects matching the requested schema exactly.'
      },
      { role: 'user', content: prompt }
    ];

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature || 0.1,
      max_tokens: options?.maxTokens || 500,
      response_format: { type: 'json_object' },
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(options?.timeout || 30000),
    });

    if (!response.ok) {
      throw new ExternalServiceError(
        'openai',
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new ExternalServiceError(
        'openai',
        'Invalid response: missing message content'
      );
    }

    return data.choices[0].message.content;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsStructuredOutput: true,
      supportsToolCalling: true,
      maxContextLength: 128000, // GPT-4o-mini context window
      isLocal: false,
    };
  }

  /**
   * Get the model name this provider is configured to use
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Check if the provider has an API key configured
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}