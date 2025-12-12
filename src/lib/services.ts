/**
 * Service instances - Simple singleton pattern for application services
 * Replaces the complex DI container with a straightforward approach
 */

import { SQLiteTokenRepository } from '@/lib/data';
import { TokenService } from '@/lib/domain/services/token';
import { SimpleChatService } from '@/lib/domain/services/chat';
import { OllamaService } from '@/lib/infrastructure/ollama';
import { Logger } from '@/lib/infrastructure/logger';
import { getDatabaseConfig } from '@/config';
import { CommandExtractionService } from '@/lib/domain/services/extraction';
import { ProviderFactory } from '@/lib/infrastructure/llm/provider-factory';
import { OllamaProvider } from '@/lib/infrastructure/llm/ollama-provider';
import { OpenAIProvider } from '@/lib/infrastructure/llm/openai-provider';

// Configuration
export const config = {
  database: getDatabaseConfig(),
};

// Core instances - singleton for the entire application
export const repository = new SQLiteTokenRepository(config.database.path);
export const logger = new Logger({ component: 'APP' });
export const ollamaService = new OllamaService();

// LLM Providers
const providers = [
  // Try OpenAI first if API key is available
  ...(process.env.OPENAI_API_KEY ? [new OpenAIProvider()] : []),
  // Always include Ollama as fallback
  new OllamaProvider()
];

export const providerFactory = new ProviderFactory(providers);

// Extraction service
export const extractionService = new CommandExtractionService(providerFactory);

// Domain services
export const tokenService = new TokenService(repository);
export const chatService = new SimpleChatService(tokenService, extractionService);