import type { ChatRequest, ChatResponse } from '@/types/domain/chat';

/**
 * Chat Service Interface
 * Defines the contract for processing chat messages and managing token operations through natural language
 */
export interface IChatService {
  /**
   * Process a chat message and execute token management commands
   * @param request - Chat request containing message and optional session ID
   * @param userId - Optional user ID from authentication context
   * @returns Promise resolving to chat response with result
   */
  processMessage(request: ChatRequest, userId?: string): Promise<ChatResponse>;
}