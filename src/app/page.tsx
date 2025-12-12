'use client';

import { useState } from 'react';
import { CreateTokenResponse, TokenResponse } from '@/types/api/responses';
import Link from 'next/link';

export default function Home() {
  const [apiKey, setApiKey] = useState('your-secret-api-key');

  // Create token form state
  const [userId, setUserId] = useState('');
  const [scopes, setScopes] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState('60');
  const [createdToken, setCreatedToken] = useState<CreateTokenResponse | null>(null);
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // List tokens state
  const [listUserId, setListUserId] = useState('');
  const [tokens, setTokens] = useState<TokenResponse[]>([]);
  const [listError, setListError] = useState('');
  const [isListing, setIsListing] = useState(false);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreatedToken(null);
    setIsCreating(true);

    try {
      const scopesArray = scopes.split(',').map(s => s.trim()).filter(s => s);

      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          userId,
          scopes: scopesArray,
          expiresInMinutes: parseInt(expiresInMinutes, 10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error + (data.details ? ': ' + JSON.stringify(data.details) : ''));
        return;
      }

      setCreatedToken(data);
      setUserId('');
      setScopes('');
      setExpiresInMinutes('60');
    } catch (error) {
      setCreateError('Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };

  const handleListTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setListError('');
    setTokens([]);
    setIsListing(true);

    try {
      const response = await fetch(`/api/tokens?userId=${encodeURIComponent(listUserId)}`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setListError(data.error + (data.details ? ': ' + JSON.stringify(data.details) : ''));
        return;
      }

      setTokens(data);
    } catch (error) {
      setListError('Failed to fetch tokens');
    } finally {
      setIsListing(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Token Management API</h1>
        <Link
          href="/chat"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Try Chat Interface →
        </Link>
      </div>

      <div className="bg-blue-50 rounded-lg shadow-sm p-6 mb-6">
        <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700 mb-2">API Key:</label>
        <input
          id="apiKey"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key from .env.local"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Token</h2>
        <form onSubmit={handleCreateToken}>
          <div className="mb-4">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">User ID:</label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., 123"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="scopes" className="block text-sm font-medium text-gray-700 mb-2">Scopes (comma-separated):</label>
            <input
              id="scopes"
              type="text"
              value={scopes}
              onChange={(e) => setScopes(e.target.value)}
              placeholder="e.g., read, write"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="expiresInMinutes" className="block text-sm font-medium text-gray-700 mb-2">Expires in Minutes:</label>
            <input
              id="expiresInMinutes"
              type="number"
              value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(e.target.value)}
              placeholder="e.g., 60"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Token'}
          </button>
        </form>

        {createError && (
          <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md">
            {createError}
          </div>
        )}

        {createdToken && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
            <h3 className="font-semibold mb-3">Token Created Successfully!</h3>
            <div className="space-y-1 text-sm">
              <p><strong>ID:</strong> {createdToken.id}</p>
              <p><strong>User ID:</strong> {createdToken.userId}</p>
              <p><strong>Scopes:</strong> {createdToken.scopes.join(', ')}</p>
              <p><strong>Token:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{createdToken.token}</code></p>
              <p><strong>Created At:</strong> {new Date(createdToken.createdAt).toLocaleString()}</p>
              <p><strong>Expires At:</strong> {new Date(createdToken.expiresAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">List Tokens</h2>
        <form onSubmit={handleListTokens}>
          <div className="mb-4">
            <label htmlFor="listUserId" className="block text-sm font-medium text-gray-700 mb-2">User ID:</label>
            <input
              id="listUserId"
              type="text"
              value={listUserId}
              onChange={(e) => setListUserId(e.target.value)}
              placeholder="e.g., 123"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isListing}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isListing ? 'Loading...' : 'List Tokens'}
          </button>
        </form>

        {listError && (
          <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md">
            {listError}
          </div>
        )}

        {tokens.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Non-Expired Tokens ({tokens.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scopes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokens.map((token) => (
                    <tr key={token.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{token.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{token.scopes.join(', ')}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {token.token ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all">{token.token}</code>
                        ) : (
                          <span className="text-gray-400 italic">No token value</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(token.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(token.expiresAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tokens.length === 0 && listUserId && !isListing && !listError && (
          <p className="mt-6 text-gray-500 italic">No non-expired tokens found for this user.</p>
        )}
      </div>
    </main>
  );
}
