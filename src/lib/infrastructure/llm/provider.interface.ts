/**
 * Interface for LLM providers
 * Abstracts different LLM implementations (Ollama, OpenAI, etc.)
 */
export interface ILLMProvider {
  /** Unique name of the provider */
  readonly name: string;

  /** Priority of the provider (lower number = higher priority) */
  readonly priority: number;

  /**
   * Check if the provider is available and responsive
   */
  isAvailable(): Promise<boolean>;

  /**
   * Generate a completion from the provider
   * @param prompt The prompt to send to the LLM
   * @param options Optional configuration for the generation
   */
  generateCompletion(prompt: string, options?: GenerationOptions): Promise<string>;

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities;
}

/**
 * Options for generating completions
 */
export interface GenerationOptions {
  /** Temperature for controlling randomness (0-1) */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Stop sequences to end generation */
  stop?: string[];
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  /** Whether the provider supports structured JSON output */
  supportsStructuredOutput: boolean;
  /** Whether the provider has function/tool calling capabilities */
  supportsToolCalling: boolean;
  /** Maximum input context length */
  maxContextLength: number;
  /** Whether the provider is local (self-hosted) or remote */
  isLocal: boolean;
}