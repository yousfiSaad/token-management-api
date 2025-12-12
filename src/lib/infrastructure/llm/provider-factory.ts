import { ILLMProvider, GenerationOptions } from './provider.interface';
import { ProviderUnavailableError } from '@/lib/shared/errors';

/**
 * Factory and manager for LLM providers with intelligent fallback
 */
export class ProviderFactory {
  private providers: ILLMProvider[];
  private healthCache: Map<string, { healthy: boolean; lastCheck: number }> = new Map();
  private readonly healthCheckInterval = 60000; // 1 minute

  constructor(providers: ILLMProvider[]) {
    // Sort providers by priority (lower number = higher priority)
    this.providers = providers.sort((a, b) => a.priority - b.priority);

    if (this.providers.length === 0) {
      throw new Error('At least one provider must be configured');
    }
  }

  /**
   * Generate a completion using the best available provider
   * Implements intelligent fallback with health checking
   */
  async generateCompletion(prompt: string, options?: GenerationOptions): Promise<string> {
    const availableProvider = await this.getBestProvider();

    if (!availableProvider) {
      throw new ProviderUnavailableError(
        'All LLM providers are currently unavailable'
      );
    }

    try {
      const response = await availableProvider.generateCompletion(prompt, options);

      // Mark provider as healthy on successful response
      this.markProviderHealthy(availableProvider.name);

      return response;
    } catch (error) {
      // Mark provider as unhealthy on error
      this.markProviderUnhealthy(availableProvider.name);

      // Try next provider if available
      const nextProvider = await this.getNextProvider(availableProvider.name);
      if (nextProvider) {
        console.warn(
          `Provider ${availableProvider.name} failed, trying ${nextProvider.name}`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        return this.generateCompletionWithProvider(nextProvider.name, prompt, options);
      }

      throw error;
    }
  }

  /**
   * Generate a completion with a specific provider
   */
  async generateCompletionWithProvider(
    providerName: string,
    prompt: string,
    options?: GenerationOptions
  ): Promise<string> {
    const provider = this.providers.find(p => p.name === providerName);

    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    return provider.generateCompletion(prompt, options);
  }

  /**
   * Get the best available provider based on priority and health
   */
  private async getBestProvider(): Promise<ILLMProvider | null> {
    // Check providers in priority order
    for (const provider of this.providers) {
      if (await this.isProviderHealthy(provider)) {
        return provider;
      }
    }

    return null;
  }

  /**
   * Get the next available provider after the specified one
   */
  private async getNextProvider(afterProvider: string): Promise<ILLMProvider | null> {
    const currentIndex = this.providers.findIndex(p => p.name === afterProvider);

    for (let i = currentIndex + 1; i < this.providers.length; i++) {
      const provider = this.providers[i];
      if (await this.isProviderHealthy(provider)) {
        return provider;
      }
    }

    return null;
  }

  /**
   * Check if a provider is healthy (with caching)
   */
  private async isProviderHealthy(provider: ILLMProvider): Promise<boolean> {
    const cached = this.healthCache.get(provider.name);
    const now = Date.now();

    // Return cached value if still fresh
    if (cached && (now - cached.lastCheck) < this.healthCheckInterval) {
      return cached.healthy;
    }

    // Perform actual health check
    const isHealthy = await provider.isAvailable();

    // Update cache
    this.healthCache.set(provider.name, {
      healthy: isHealthy,
      lastCheck: now
    });

    return isHealthy;
  }

  /**
   * Mark a provider as healthy
   */
  private markProviderHealthy(providerName: string): void {
    this.healthCache.set(providerName, {
      healthy: true,
      lastCheck: Date.now()
    });
  }

  /**
   * Mark a provider as unhealthy
   */
  private markProviderUnhealthy(providerName: string): void {
    this.healthCache.set(providerName, {
      healthy: false,
      lastCheck: Date.now()
    });
  }

  /**
   * Get all configured providers
   */
  getProviders(): ILLMProvider[] {
    return [...this.providers];
  }

  /**
   * Get provider by name
   */
  getProvider(name: string): ILLMProvider | undefined {
    return this.providers.find(p => p.name === name);
  }

  /**
   * Check if any provider supports structured output
   */
  hasStructuredOutputSupport(): boolean {
    return this.providers.some(p => p.getCapabilities().supportsStructuredOutput);
  }

  /**
   * Get providers that support structured output
   */
  getStructuredOutputProviders(): ILLMProvider[] {
    return this.providers.filter(p => p.getCapabilities().supportsStructuredOutput);
  }

  /**
   * Force health check of all providers
   */
  async checkAllProvidersHealth(): Promise<Map<string, boolean>> {
    const healthMap = new Map<string, boolean>();

    for (const provider of this.providers) {
      const isHealthy = await provider.isAvailable();
      healthMap.set(provider.name, isHealthy);

      this.healthCache.set(provider.name, {
        healthy: isHealthy,
        lastCheck: Date.now()
      });
    }

    return healthMap;
  }
}