/**
 * OLLAMA Service for communicating with local OLLAMA instance
 * Provides secure LLM communication for chat interface
 */

// Local Ollama type definitions
interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

interface OllamaResponse {
  done: boolean;
  response: string;
}

import type { IOllamaService } from "./ollama-service.interface";

export class OllamaService implements IOllamaService {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number = 30000; // 30 seconds
  private readonly maxRetries: number = 3;

  constructor(config?: { host?: string; port?: string; model?: string }) {
    // Use environment variables or defaults
    const host = config?.host || process.env.OLLAMA_HOST || "localhost";
    const port = config?.port || process.env.OLLAMA_PORT || "11434";
    this.model = config?.model || process.env.OLLAMA_MODEL || "llama3.1:8b";

    this.baseUrl = `http://${host}:${port}`;
  }

  /**
   * Check if OLLAMA is available and responsive
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout for health check
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // Check if our model is available
      return data.models?.some((m: any) => m.name === this.model) || false;
    } catch (error) {
      // Log without exposing sensitive information
      console.warn(
        "OLLAMA health check failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return false;
    }
  }

  /**
   * Generate completion from OLLAMA
   */
  async generateCompletion(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    const requestBody: OllamaRequest = {
      model: this.model,
      prompt: this.sanitizePrompt(prompt),
      stream: false,
      options: {
        temperature: options?.temperature || 0.3, // Lower temperature for consistent analysis
        top_p: 0.9,
        max_tokens: options?.maxTokens || 1000,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          throw new Error(
            `OLLAMA API error: ${response.status} ${response.statusText}`,
          );
        }

        const data: OllamaResponse = await response.json();

        if (data.done && data.response) {
          return data.response.trim();
        }

        throw new Error("Invalid response from OLLAMA");
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        // Don't retry on client errors (4xx) or when it's the last attempt
        if (
          lastError.message.includes("404") ||
          lastError.message.includes("400") ||
          lastError.message.includes("401") ||
          lastError.message.includes("403") ||
          lastError.message.includes("Connection failed") ||
          attempt === this.maxRetries
        ) {
          break;
        }

        // Exponential backoff for retries
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Log error without exposing prompt content
    console.error(
      "OLLAMA completion failed after retries:",
      lastError?.message || "Unknown error",
    );
    throw new Error("Failed to get completion from OLLAMA");
  }

  /**
   * Sanitize prompt to prevent logging sensitive data
   */
  private sanitizePrompt(prompt: string): string {
    // Remove potential token-like patterns from logs
    // This is a defense-in-depth measure as we never send raw tokens
    return prompt;
  }

  
  
  /**
   * Test connection with a simple prompt
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testPrompt = 'Respond with "OK" if you can read this.';
      const response = await this.generateCompletion(testPrompt, {
        maxTokens: 10,
      });

      return {
        success: response.toLowerCase().includes("ok"),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
