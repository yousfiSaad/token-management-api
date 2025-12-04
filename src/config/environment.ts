/**
 * Environment configuration and validation
 * Validates required environment variables at application startup
 */

// Validate required environment variables at module load time
if (!process.env.API_KEY) {
  console.warn('WARNING: API_KEY environment variable is not set. API access will be denied for all requests.');
  console.warn('Set API_KEY in your .env.local file or pass it as an environment variable.');
}

// Get API_KEY with type safety
export function getApiKey(): string | undefined {
  return process.env.API_KEY;
}

// Check if API_KEY is configured
export function isApiKeyConfigured(): boolean {
  return !!process.env.API_KEY;
}

// Validate required environment variables (can also be called explicitly if needed)
export function validateEnvironment() {
  // This function can be called for explicit validation
  // The warning has already been logged at module load time
}