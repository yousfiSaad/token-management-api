'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ExampleCommands } from './ExampleCommands';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  success: boolean;
  data?: any;
  error?: string;
  clarification_needed?: boolean;
  clarification_question?: string;
}

export function ChatContainer() {
  const [apiKey, setApiKey] = useState('your-secret-api-key');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('chat-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    // Add welcome message if no messages
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'assistant',
          content: 'Hello! I can help you manage tokens using natural language. Try commands like:\n\n• "Create a token with read scope for bob"\n• "List all tokens"\n• "Show tokens for alice"\n• "Delete token_bob"',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('chat-api-key', key);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Clear previous errors
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId || undefined
        }),
      });

      const data: ChatResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update session ID
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: data.success ? 'assistant' : 'system',
        content: data.response,
        timestamp: new Date(),
        data: data.data
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If clarification is needed, show it as a system message
      if (data.clarification_needed && data.clarification_question) {
        setTimeout(() => {
          const clarificationMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: 'system',
            content: data.clarification_question || 'I need more information.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, clarificationMessage]);
        }, 500);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      const errorMessageObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
      // Focus back to input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleExampleCommand = (command: string) => {
    setInputMessage(command);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      {/* API Key Section */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700 mb-2">
          API Key:
        </label>
        <input
          id="apiKey"
          type="text"
          value={apiKey}
          onChange={(e) => saveApiKey(e.target.value)}
          placeholder="Enter your API key from .env.local"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="API Key input"
          aria-describedby="apiKey-description"
          autoComplete="off"
          spellCheck="false"
        />
        <p id="apiKey-description" className="mt-1 text-xs text-gray-500">
          Enter the API key from your environment configuration
        </p>
      </div>

      {/* Messages Area - Takes remaining space */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-4"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-pulse">Thinking</div>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Example Commands */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <ExampleCommands onCommandClick={handleExampleCommand} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="mx-4 mb-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md text-sm flex-shrink-0"
          role="alert"
          aria-live="assertive"
        >
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Input Area - Always at bottom */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <MessageInput
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSendMessage}
          disabled={isLoading}
          ref={inputRef}
        />
      </div>
    </div>
  );
}