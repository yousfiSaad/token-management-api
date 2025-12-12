/**
 * Command extraction result from natural language
 */
export interface ExtractedCommand {
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
}

/**
 * Ollama Service Interface
 * Defines the contract for communicating with OLLAMA LLM service
 * Note: Command extraction and friendly formatting are now handled by CommandExtractionService
 */
export interface IOllamaService {
  /**
   * Check if OLLAMA service is available and responding
   * @returns Promise resolving to true if healthy, false otherwise
   */
  healthCheck(): Promise<boolean>;

  /**
   * Generate a text completion from OLLAMA
   * @param prompt - The prompt to send to OLLAMA
   * @param options - Optional configuration for temperature and max tokens
   * @returns Promise resolving to generated text
   */
  generateCompletion(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;

  /**
   * Test connection to OLLAMA with a simple prompt
   * @returns Promise resolving to test result with success status and optional error
   */
  testConnection(): Promise<{ success: boolean; error?: string }>;
}