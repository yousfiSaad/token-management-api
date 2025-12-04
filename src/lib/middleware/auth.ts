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
