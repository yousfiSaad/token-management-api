import type { ExtractedCommand, IExtractionService } from '@/lib/infrastructure/llm/extraction.interface';
import { ProviderFactory } from '@/lib/infrastructure/llm/provider-factory';
import { PromptBuilder } from '@/lib/shared/utils/prompt-builder';
import { JSONParser } from '@/lib/shared/utils/json-parser';
import {
  ProviderUnavailableError,
  InvalidResponseError
} from '@/lib/shared/errors';

/**
 * Unified command extraction service that supports multiple LLM providers
 * Replaces the separate OllamaService.extractCommand and HybridExtractionService
 */
export class CommandExtractionService implements IExtractionService {
  private readonly minConfidenceThreshold = 0.5;
  private readonly maxRetries = 2;

  constructor(
    private providerFactory: ProviderFactory,
    private promptBuilder: typeof PromptBuilder = PromptBuilder,
    private jsonParser: typeof JSONParser = JSONParser
  ) {}

  /**
   * Extract command from a natural language message
   * Uses the best available provider with intelligent fallback
   */
  async extractCommand(message: string): Promise<ExtractedCommand> {
    if (!message || typeof message !== 'string') {
      return this.createUnknownCommand('Invalid message provided');
    }

    const prompt = this.promptBuilder.buildExtractionPrompt(message);

    // Try with providers that support structured output first
    let result = await this.tryWithStructuredProviders(prompt);
    console.log(`[EXTRACTION] Structured provider result:`, result ? 'SUCCESS' : 'FAILED');

    // If structured output providers failed or unavailable, try with other providers
    if (!result || this.isLowConfidence(result)) {
      console.log(`[EXTRACTION] Falling back to regular providers...`);
      result = await this.tryWithRegularProviders(prompt);
      console.log(`[EXTRACTION] Regular provider result:`, result ? 'SUCCESS' : 'FAILED');
    }

    // Final confidence check
    if (this.isLowConfidence(result)) {
      console.warn(
        `Low confidence extraction (${result.confidence}): "${message}"`,
        result
      );

      // For very low confidence, return unknown to avoid hallucinations
      if (result.confidence < this.minConfidenceThreshold) {
        return this.createUnknownCommand('Could not confidently extract command');
      }
    }

    return result;
  }

  /**
   * Try extraction with providers that support structured JSON output
   */
  private async tryWithStructuredProviders(prompt: string): Promise<ExtractedCommand | null> {
    const structuredProviders = this.providerFactory.getStructuredOutputProviders();

    console.log(`[EXTRACTION] Found ${structuredProviders.length} structured output providers`);

    if (structuredProviders.length === 0) {
      return null;
    }

    for (const provider of structuredProviders) {
      try {
        const response = await this.providerFactory.generateCompletionWithProvider(
          provider.name,
          prompt,
          { temperature: 0.1, maxTokens: 200 }
        );

        // OpenAI with structured output should return clean JSON
        const parsed = this.jsonParser.extractAndParseJSON(response);

        // Add provider info for debugging
        console.log(`✅ Used ${provider.name} for extraction (confidence: ${parsed.confidence})`);

        return parsed;
      } catch (error) {
        console.warn(
          `Structured provider ${provider.name} failed:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        // Continue to next provider
      }
    }

    return null;
  }

  /**
   * Try extraction with regular providers (no guaranteed JSON format)
   */
  private async tryWithRegularProviders(prompt: string): Promise<ExtractedCommand> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.providerFactory.generateCompletion(prompt, {
          temperature: 0.1,
          maxTokens: 200,
          timeout: 30000
        });

        // Parse with our robust JSON parser that handles malformed responses
        const parsed = this.jsonParser.extractAndParseJSON(response);

        console.log(`⚠️ Used regular provider (confidence: ${parsed.confidence})`);

        return parsed;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on certain errors
        if (error instanceof InvalidResponseError) {
          break;
        }

        // Exponential backoff for retries
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all attempts failed, return unknown
    console.error('All extraction providers failed:', lastError?.message);
    throw new ProviderUnavailableError(
      'All extraction providers failed to extract command'
    );
  }

  /**
   * Make a response sound more friendly and natural
   * Reuses the same provider logic with a different prompt
   */
  async makeFriendly(message: string): Promise<string> {
    if (!message || typeof message !== 'string') {
      return message;
    }

    const prompt = this.promptBuilder.buildFriendlyPrompt(message);

    try {
      const response = await this.providerFactory.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 100
      });

      // Clean up the response
      const cleaned = response.trim();

      // Try to extract just the friendly response, excluding any explanatory text
      const lines = cleaned.split('\n').filter(line => line.trim());

      // Skip common explanatory phrases
      const filteredLines = lines.filter((line) => {
        const lowerLine = line.toLowerCase().trim();
        return (
          !lowerLine.includes("here's a friendly") &&
          !lowerLine.includes("here is a friendly") &&
          !lowerLine.includes("friendly version") &&
          !lowerLine.includes("natural version") &&
          !lowerLine.includes("response:")
        );
      });

      // Return the filtered lines or the original response if no filtering occurred
      return filteredLines.length > 0 ? filteredLines.join('\n').trim() : cleaned;
    } catch (error) {
      console.error('Failed to make response friendly:', error);
      // Return original message if provider fails
      return message;
    }
  }

  /**
   * Check if confidence is below threshold
   */
  private isLowConfidence(result: ExtractedCommand): boolean {
    return result.confidence < 0.7;
  }

  /**
   * Create an unknown command response
   */
  private createUnknownCommand(_reason: string): ExtractedCommand {
    return {
      intent: 'unknown',
      parameters: {},
      confidence: 0.1
    };
  }

  /**
   * Get health status of all underlying providers
   */
  async getHealthStatus(): Promise<Map<string, boolean>> {
    return this.providerFactory.checkAllProvidersHealth();
  }

  /**
   * Get information about configured providers
   */
  getProviderInfo(): Array<{ name: string; priority: number; capabilities: any }> {
    return this.providerFactory.getProviders().map(provider => ({
      name: provider.name,
      priority: provider.priority,
      capabilities: provider.getCapabilities()
    }));
  }
}