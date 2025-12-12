export interface SessionContext {
  sessionId: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  lastIntent?: string;
  lastParameters?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  success: boolean;
  data?: any; // Token operation results
  error?: string;
  clarification_needed?: boolean;
  clarification_question?: string;
}