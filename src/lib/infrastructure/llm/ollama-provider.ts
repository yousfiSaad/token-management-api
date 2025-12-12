import { ILLMProvider, GenerationOptions, ProviderCapabilities } from './provider.interface';
import { ExternalServiceError } from '@/lib/shared/errors';

/**
 * Ollama provider for local LLM inference
 */
export class OllamaProvider implements ILLMProvider {
  readonly name = 'Ollama';
  readonly priority = 10; // Lower priority than cloud providers

  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(config?: { host?: string; port?: string; model?: string; timeout?: number }) {
    const host = config?.host || process.env.OLLAMA_HOST || 'localhost';
    const port = config?.port || process.env.OLLAMA_PORT || '11434';
    this.model = config?.model || process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.timeout = config?.timeout || 30000;

    this.baseUrl = `http://${host}:${port}`;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.models?.some((m: any) => m.name === this.model) || false;
    } catch (error) {
      return false;
    }
  }

  async generateCompletion(prompt: string, options?: GenerationOptions): Promise<string> {
    const requestBody = {
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || 0.3,
        top_p: 0.9,
        num_predict: options?.maxTokens || 1000,
        stop: options?.stop,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(options?.timeout || this.timeout),
    });

    if (!response.ok) {
      throw new ExternalServiceError(
        'ollama',
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.response) {
      throw new ExternalServiceError(
        'ollama',
        'Invalid response: missing response field'
      );
    }

    return data.response;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsStructuredOutput: false, // Ollama doesn't have guaranteed JSON mode
      supportsToolCalling: false,
      maxContextLength: 8192, // Typical for llama3.1:8b
      isLocal: true,
    };
  }

  /**
   * Get the model name this provider is configured to use
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get the base URL for the Ollama instance
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}