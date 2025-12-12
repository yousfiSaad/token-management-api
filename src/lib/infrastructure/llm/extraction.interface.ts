/**
 * Command extraction result from natural language
 */
export interface ExtractedCommand {
  intent: 'create' | 'read' | 'delete' | 'update' | 'refresh' | 'status' | 'revoke' | 'help' | 'unknown';
  parameters: {
    userId?: string;
    scopes?: string[];
    tokenId?: string;
    time?: string;
    deleteAll?: boolean;
  };
  confidence: number;
}

/**
 * Extraction Service Interface
 * Defines the contract for extracting commands from natural language
 */
export interface IExtractionService {
  /**
   * Extract command from natural language message
   * @param message - User message to analyze
   * @returns Promise resolving to extracted command with intent and parameters
   */
  extractCommand(message: string): Promise<ExtractedCommand>;

  /**
   * Make a response sound more friendly and natural
   * @param message - The message to make friendly
   * @returns Promise resolving to a friendly version of the message
   */
  makeFriendly(message: string): Promise<string>;
}