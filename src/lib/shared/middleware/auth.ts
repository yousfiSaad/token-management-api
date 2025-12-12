import { getApiKey } from '@/config/environment';

export function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get('X-API-Key');
  const expectedApiKey = getApiKey();

  // Fail secure - deny access if API_KEY is not configured
  if (!expectedApiKey) {
    return false;
  }

  return apiKey === expectedApiKey;
}

export function getUserIdFromApiKey(apiKey: string | null): string | null {
  const expectedApiKey = getApiKey();

  // Fail secure - deny access if API_KEY is not configured
  if (!expectedApiKey || !apiKey) {
    return null;
  }

  // For demo purposes, we'll use the API key as a simple user identifier
  // In a real application, this would look up the user from the API key
  return apiKey === expectedApiKey ? 'demo-user' : null;
}
