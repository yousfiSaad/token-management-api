'use client';

import { ChatContainer } from '@/components/chat/ChatContainer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';

export default function ChatPage() {
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-8 bg-gray-50 h-screen flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Token Chat Interface</h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Token Management
          </Link>
        </div>
        <p className="text-gray-600 mt-2">
          Manage your tokens using natural language commands. Try asking to create, list, or delete tokens.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ErrorBoundary>
          <ChatContainer />
        </ErrorBoundary>
      </div>
    </main>
  );
}