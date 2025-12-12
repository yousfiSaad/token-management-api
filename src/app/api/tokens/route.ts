import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/shared/middleware';
import { validateCreateTokenRequest, validateUserId } from '@/lib/shared/validators';
import { createSuccessResponse, createErrorResponse, toApiResponse } from '@/utils/api/response';
import { CreateTokenRequest } from '@/types/api/requests';
import { ListTokensResponse } from '@/types/api/responses';
import { tokenService } from '@/lib';


export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check authentication
  if (!validateApiKey(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateCreateTokenRequest(body);
    if (!validation.valid) {
      return createErrorResponse(validation.error || 'Validation failed', 400, validation.details);
    }

    // The validation passed, so body is safe to cast to CreateTokenRequest
    // This is type-safe because validation.valid === true implies the input matches the schema
    const data: CreateTokenRequest = body as CreateTokenRequest;
    const token = tokenService.createToken(data);

    // Return response
    return createSuccessResponse(toApiResponse(token), 201);
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check authentication
  if (!validateApiKey(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate userId
    const validation = validateUserId(userId);
    if (!validation.valid) {
      return createErrorResponse(validation.error || 'Validation failed', 400, validation.details);
    }

    // Get tokens - userId is guaranteed to be string after validation
    const tokens = tokenService.getTokensForUser(userId!);

    // Convert to API response format
    const response: ListTokensResponse = tokens.map(toApiResponse);

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
  }
}
