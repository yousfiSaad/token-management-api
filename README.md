# Token Management API - LLM Chat Interface

> **Note**: This is the `LLM-integration` branch featuring a natural language chat interface for token management. For the core API implementation (POST/GET /api/tokens), see the [main branch](../../tree/main).

A natural language chat interface built on top of a token management API, demonstrating production-ready LLM integration with local inference engines.

## What's New in This Branch

This bonus feature adds a conversational interface to the token management system, allowing users to manage tokens using plain English commands instead of direct API calls.

**Key Highlights:**
- Integration with Ollama for local LLM inference
- Natural language command extraction and execution
- Clean domain-driven design with comprehensive testing
- React-based chat UI with token highlighting

## Tech Stack

### Core (from main branch)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite with better-sqlite3
- **Testing**: Jest with ts-jest
- **See main branch for full details**

### LLM Integration (new in this branch)
- **LLM**: Ollama (local inference)
- **Provider Management**: Factory with health checking
- **Command Processing**: Natural language → structured commands
- **UI**: React components with real-time chat

## Prerequisites

- Node.js 20 or higher
- npm
- **[Ollama](https://ollama.ai)** - For local LLM inference

## Quick Start

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### 2. Pull a Language Model

```bash
ollama pull llama3.1:8b
```

### 3. Start Ollama Server

```bash
ollama serve
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Required
DATABASE_PATH=./data/tokens.db
API_KEY=your-secret-api-key

# Ollama Configuration (optional - uses defaults)
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=llama3.1:8b
```

### 6. Run the Application

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

### 7. Access the Chat Interface

Navigate to `http://localhost:3000/chat` and start chatting!

## Using the Chat Interface

1. **Enter your API key**: Use the same key from `.env.local`
2. **Type natural language commands**: No need to remember exact API syntax
3. **View results**: Tokens are automatically highlighted, data is formatted clearly

### Example Commands

**Create Tokens:**
```
"Create a token with read scope for bob"
"Generate a token for alice with write and admin scopes that expires in 2 weeks"
```

**List Tokens:**
```
"List all tokens"
"Show me all tokens for alice"
"Get details of token_xyz123"
```

**Manage Tokens:**
```
"Update token_bob with admin scope"
"Refresh token_alice for 2 weeks"
"Check if token_bob is still valid"
"Delete token_alice"
"Revoke all tokens for bob"
```

### Example Conversation

```
You: Create a token with read scope for alice

Chat: Created token token_abc123 for alice with scopes: read.
      It will expire on 2025-01-11T10:00:00.000Z.

      Token: 9f0c2d6a-3b48-4e5a-9c7d-8f1a2b3c4d5e

You: List all tokens for alice

Chat: Found 1 token(s) for alice:
      • token_abc123 - Scopes: read - Expires: 2025-01-11T10:00:00.000Z

You: Delete token_abc123

Chat: Successfully deleted token_abc123.
```

## Architecture

### Overview

The chat system extends the base token management API with a natural language interface:

```
User Input (Natural Language)
        ↓
    Chat UI (React)
        ↓
    POST /api/chat
        ↓
Command Extraction Service (LLM)
        ↓
  Chat Service (Orchestration)
        ↓
  Token Service (Core API)
        ↓
    SQLite Database
```

### LLM Provider System

**LLM Provider:**
- `ProviderFactory` - Manages LLM provider initialization
- `OllamaProvider` - Local inference with Ollama

**Provider Features:**
- Provider health checking with caching
- Structured output support
- Clean provider abstraction for extensibility

**Command Extraction:**
- Natural language → structured JSON commands
- Confidence scoring (threshold: 0.5-0.7)
- 8 supported intents: create, read, update, delete, refresh, status, revoke, help

### Layer Breakdown

**Frontend Layer** (`/src/components/chat/`):
- `ChatContainer` - Main UI, state management
- `MessageList` - Message display with token highlighting
- `MessageInput` - Auto-expanding textarea
- `ExampleCommands` - Quick-action buttons

**API Layer** (`/src/app/api/chat/`):
- POST `/api/chat` - Chat endpoint with authentication
- Request validation and response formatting

**Business Logic** (`/src/lib/domain/services/`):
- `SimpleChatService` - Command orchestration
- `CommandExtractionService` - NLP processing
- `TokenService` - Core token operations (from main branch)

**Infrastructure** (`/src/lib/infrastructure/`):
- `ProviderFactory` - LLM provider management
- `OllamaProvider` - Ollama LLM integration
- `SQLiteTokenRepository` - Data access (from main branch)

### Key Design Patterns

- **Repository Pattern**: Abstract data access
- **Factory Pattern**: Provider selection and instantiation
- **Domain-Driven Design**: Clear service boundaries
- **Type Safety**: Full TypeScript with strict mode, no `any` types

## API Reference

### Core Token API

The base token management API is implemented in the main branch:

**Endpoints:**
- `POST /api/tokens` - Create a new token
- `GET /api/tokens?userId=<id>` - List non-expired tokens for a user

**See the [main branch README](../../tree/main) for complete API documentation.**

### Chat API (New)

**POST /api/chat**

Send natural language commands to manage tokens.

**Request:**
```json
{
  "message": "Create a token with read scope for alice",
  "sessionId": "optional-session-id"
}
```

**Headers:**
```
X-API-Key: your-secret-api-key
Content-Type: application/json
```

**Response:**
```json
{
  "response": "Created token token_abc123 for alice...",
  "success": true,
  "sessionId": "none",
  "data": {
    "token": {
      "id": "token_abc123",
      "userId": "alice",
      "scopes": ["read"],
      "token": "9f0c2d6a...",
      "createdAt": "2025-01-01T10:00:00.000Z",
      "expiresAt": "2025-01-01T11:00:00.000Z"
    }
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- Unit tests for chat service and command extraction
- Integration tests for chat API endpoint
- Full test suite from main branch for core functionality

## Docker Support

```bash
# Build image
docker build -t token-management-api .

# Run with Ollama (requires Ollama running on host)
docker run -p 3000:3000 \
  -e API_KEY=your-secret-api-key \
  -e OLLAMA_HOST=host.docker.internal \
  -v $(pwd)/data:/app/data \
  token-management-api
```

**Note**: For local Ollama access from Docker, use `host.docker.internal` as the host.

## Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── tokens/         # Core API (main branch)
│   │   │   └── chat/           # Chat API (this branch)
│   │   ├── chat/               # Chat UI page (this branch)
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   └── chat/               # Chat React components (this branch)
│   ├── lib/
│   │   ├── domain/
│   │   │   └── services/
│   │   │       ├── chat/       # Chat services (this branch)
│   │   │       └── token-service.ts
│   │   ├── infrastructure/
│   │   │   └── llm/            # LLM providers (this branch)
│   │   ├── db/                 # Database layer (main branch)
│   │   ├── middleware/         # Auth middleware (main branch)
│   │   └── validators/         # Input validation (main branch)
│   └── types/
│       ├── token.ts            # Token types (main branch)
│       └── domain/
│           └── chat.ts         # Chat types (this branch)
├── tests/
│   ├── unit/
│   │   ├── chat-service.test.ts      # New
│   │   └── token-service.test.ts     # Main branch
│   └── integration/
│       ├── chat-endpoint.test.ts     # New
│       └── api.test.ts               # Main branch
└── data/                       # SQLite database
```

## Development Principles

This implementation demonstrates:

- **Clean Architecture**: Clear separation of concerns across layers
- **Type Safety**: TypeScript strict mode, explicit interfaces
- **Testability**: Business logic isolated from infrastructure
- **Extensibility**: Easy to add new LLM providers or command types
- **Production Patterns**: Health checking, provider management, error handling
- **No Over-engineering**: Simple, focused implementations

## License

This project is part of a technical demonstration.
