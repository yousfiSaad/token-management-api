import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/route';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    API_KEY: 'test-api-key-12345'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('/api/chat endpoint', () => {
  it('should return 401 without API key', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Unauthorized'
    });
  });

  it('should return 401 with invalid API key', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid-key'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should process valid chat request with correct API key', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello, chat!' }),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key-12345'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.response).toContain('Hello, chat!');
    expect(body.sessionId).toBeDefined();
  });

  it('should maintain session across requests', async () => {
    // First request
    const firstRequest = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'First message' }),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key-12345'
      }
    });

    const firstResponse = await POST(firstRequest);
    const firstBody = await firstResponse.json();
    const sessionId = firstBody.sessionId;

    // Second request with same session
    const secondRequest = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Second message',
        sessionId: sessionId
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key-12345'
      }
    });

    const secondResponse = await POST(secondRequest);
    const secondBody = await secondResponse.json();

    expect(secondBody.sessionId).toBe(sessionId);
    expect(secondBody.response).toContain('Second message');
  });

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),  // Missing 'message' field
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key-12345'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid chat request format');
  });

  it('should return 400 for empty message', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '' }),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key-12345'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Message content cannot be empty');
  });
});