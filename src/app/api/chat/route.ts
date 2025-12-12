import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest } from '@/types/domain/chat';
import { validateApiKey, getUserIdFromApiKey } from '@/lib/shared/middleware';
import { createSuccessResponse, createErrorResponse } from '@/utils/api/response';
import { chatService } from '@/lib';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check authentication
  if (!validateApiKey(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    // Parse request body
    const body = await request.json();

    // Basic validation
    if (!body.message || typeof body.message !== 'string') {
      return createErrorResponse('Message is required', 400);
    }

    // Get user ID from API key
    const apiKey = request.headers.get('x-api-key');
    const userId = getUserIdFromApiKey(apiKey);

    // Create proper ChatRequest object
    const chatRequest: ChatRequest = {
      message: body.message,
      sessionId: body.sessionId // Optional, will be ignored
    };

    // Process message
    const response = await chatService.processMessage(chatRequest, userId || undefined);

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}