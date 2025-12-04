# Token Management API

A minimal but clean TypeScript API service for managing access tokens for users, built with Next.js (App Router) and SQLite.

## Tech Stack

- **Framework**: Next.js 16.0.7 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript (strict mode)
- **Database**: SQLite with better-sqlite3
- **Validation**: Zod v4.1.13
- **Testing**: Jest with ts-jest
- **Styling**: Tailwind CSS v4.1.17
- **Containerization**: Docker with multi-platform support (amd64/arm64)
- **CI/CD**: GitHub Actions
- **Build Tool**: Turbopack (for development)

## Features

- Create access tokens with user ID, scopes, and expiry time
- List all non-expired tokens for a specific user
- Type-safe API with explicit TypeScript interfaces
- Zod-based input validation with type safety
- Simple API key authentication
- Clean three-layer architecture (presentation, business logic, data access)
- Repository pattern for easy database replacement
- Comprehensive unit tests
- GitHub Actions automated Docker builds
- HTML test coverage reports
- TypeScript path aliases for cleaner imports
- Turbopack for faster development builds
- Multi-platform Docker images (amd64/arm64)
- Frontend UI for token management
- Docker support for containerized deployment

## Prerequisites

- Node.js 24 or higher
- npm

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd toptal-yahya
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your configuration:

```env
DATABASE_PATH=./data/tokens.db
API_KEY=your-secret-api-key
```

## Running Locally

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

## Running with Docker

### Build the Docker image:

```bash
docker build -t token-management-api .
```

### Run the container:

```bash
docker run -p 3000:3000 \
  -e API_KEY=your-secret-api-key \
  -v $(pwd)/data:/app/data \
  token-management-api
```

The `-v` flag mounts a volume for persistent database storage.

### Using Docker Hub Image

For quick deployment without building locally:

```bash
# Pull the latest image
docker pull ysaad/token-management-api:latest

# Run the container
docker run -p 3000:3000 \
  -e API_KEY=your-secret-api-key \
  -v $(pwd)/data:/app/data \
  ysaad/token-management-api:latest
```

The image is automatically built and pushed to Docker Hub on every push to the main branch.

## Running Tests

### Run all tests:

```bash
npm test
```

### Run tests in watch mode:

```bash
npm run test:watch
```

### Run tests with coverage:

```bash
npm run test:coverage
```

### Generate HTML coverage report:

```bash
npm run test:coverage:html
```

## API Documentation

### Authentication

All API endpoints require authentication using an API key passed in the `X-API-Key` header:

```
X-API-Key: your-secret-api-key
```

### POST /api/tokens

Create a new access token for a user.

**Request:**

```http
POST /api/tokens HTTP/1.1
Content-Type: application/json
X-API-Key: your-secret-api-key

{
  "userId": "123",
  "scopes": ["read", "write"],
  "expiresInMinutes": 60
}
```

**Validation Rules:**

- `userId`: Must be a non-empty string (leading/trailing whitespace will be trimmed)
- `scopes`: Must be a non-empty array of strings (leading/trailing whitespace on each scope will be trimmed)
- `expiresInMinutes`: Must be a positive integer

**Note on Input Handling**: String inputs are trimmed of leading and trailing whitespace for better usability:

- `userId`: `"  userId  "` becomes `"userId"`
- `scopes`: Each item is trimmed, e.g., `["  read  ", "  write  "]` becomes `["read", "write"]`
- `expiresInMinutes`: Not applicable (numeric value)

**Response (201 Created):**

```json
{
  "id": "token_abc123",
  "userId": "123",
  "scopes": ["read", "write"],
  "createdAt": "2025-01-01T10:00:00.000Z",
  "expiresAt": "2025-01-01T11:00:00.000Z",
  "token": "9f0c2d6a-3b48-4e5a-9c7d-8f1a2b3c4d5e"
}
```

**Error Responses:**

- `400 Bad Request`: Validation failed

```json
{
  "error": "Validation failed",
  "details": {
    "userId": "userId must be a non-empty string"
  }
}
```

- `401 Unauthorized`: Invalid or missing API key

```json
{
  "error": "Unauthorized"
}
```

### GET /api/tokens

List all non-expired tokens for a specific user.

**Request:**

```http
GET /api/tokens?userId=123 HTTP/1.1
X-API-Key: your-secret-api-key
```

**Query Parameters:**

- `userId` (required): The user ID to filter tokens by

**Response (200 OK):**

```json
[
  {
    "id": "token_abc123",
    "userId": "123",
    "scopes": ["read", "write"],
    "createdAt": "2025-01-01T10:00:00.000Z",
    "expiresAt": "2025-01-01T11:00:00.000Z",
    "token": "9f0c2d6a-3b48-4e5a-9c7d-8f1a2b3c4d5e"
  }
]
```

**Note:** Only non-expired tokens (where `expiresAt` > current time) are returned.

**Error Responses:**

- `400 Bad Request`: Invalid userId

```json
{
  "error": "Validation failed",
  "details": {
    "userId": "userId must be a non-empty string"
  }
}
```

- `401 Unauthorized`: Invalid or missing API key

## Frontend UI

The application includes a simple web interface accessible at `http://localhost:3000` where you can:

- Create new tokens by entering user ID, scopes (comma-separated), and expiry time
- List all non-expired tokens for a given user ID
- View token details in a table format

The frontend automatically includes the API key from the input field in all requests.

## Configuration

### TypeScript Configuration

- Path aliases: `@/*` maps to `./src/*`
- Strict mode enabled with comprehensive type checking
- Target: ES2017 for compatibility

### Next.js Configuration

- Standalone output for optimized Docker builds
- Turbopack enabled for faster development
- Custom webpack configuration for better-sqlite3 compatibility

### Environment Variables

The application uses environment-based configuration:

```env
DATABASE_PATH=./data/tokens.db
API_KEY=your-secret-api-key
NODE_ENV=development
```

**Note**: The frontend UI defaults to `your-secret-api-key` for development. To test the application:

- Set your environment API_KEY to `your-secret-api-key` to match the frontend default, or
- Update the API key in the frontend UI to match your secret API key value

### Test Configuration

- Jest with TypeScript support via ts-jest
- Path mapping for clean imports in tests
- Coverage collection from all TypeScript files
- HTML coverage reports with detailed metrics

## CI/CD

### GitHub Actions Workflow

The project includes an automated CI/CD pipeline (`.github/workflows/docker.yml`) that:

- Triggers on push to main branch
- Builds Docker images for multiple platforms (amd64/arm64)
- Pushes images to Docker Hub
- Uses GitHub Actions cache for faster builds
- Supports multi-platform deployments

### Docker Configuration

- Multi-stage builds for optimized image size
- Non-root user execution for security
- Standalone output for production deployments
- Platform-specific builds for amd64 and arm64 architectures

## Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── api/tokens/route.ts      # API route handlers (POST & GET)
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Frontend UI
│   │   └── globals.css              # Tailwind CSS styles
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts             # ITokenRepository interface
│   │   │   ├── factory.ts           # Repository factory
│   │   │   ├── sqlite.ts            # SQLite implementation
│   │   │   └── schema.ts            # Database schema
│   │   ├── services/
│   │   │   └── token-service.ts     # Business logic
│   │   ├── middleware/
│   │   │   └── auth.ts              # API key authentication
│   │   └── validators/
│   │       └── token-validator.ts   # Zod-based validation
│   ├── types/
│   │   ├── api/                     # API-related types
│   │   │   ├── errors.ts            # Error type definitions
│   │   │   ├── requests.ts          # Request payload types
│   │   │   └── responses.ts         # Response payload types
│   │   ├── common/                  # Shared utility types
│   │   │   └── index.ts
│   │   ├── domain/                  # Domain entity types
│   │   │   └── token.ts
│   │   └── index.ts                 # Type exports
│   ├── config/                      # Configuration files
│   │   ├── database.ts              # Database configuration
│   │   ├── environment.ts           # Environment variables
│   │   └── index.ts                 # Config exports
│   └── utils/
│       ├── api/
│       │   └── response.ts          # API response utilities
│       └── token-generator.ts       # Token generation (UUID)
├── tests/
│   └── unit/                        # Only unit tests exist
│       ├── token-service.test.ts    # Service layer tests
│       └── token-validator.test.ts  # Validation tests
├── .github/
│   └── workflows/
│       └── docker.yml               # GitHub Actions CI/CD
├── data/                            # SQLite database storage
├── Dockerfile                       # Multi-stage Docker build
├── next.config.ts                   # Next.js configuration
├── tsconfig.json                    # TypeScript configuration
├── jest.config.js                   # Jest test configuration
└── README.md
```

## Architecture

### Three-Layer Architecture

1. **Presentation Layer** (`src/app/api/tokens/route.ts`)
   - Handles HTTP requests and responses
   - Calls authentication middleware
   - Delegates business logic to service layer

2. **Business Logic Layer** (`src/lib/services/token-service.ts`)
   - Token creation and expiry calculation
   - Non-expired token filtering logic
   - Independent of HTTP and database specifics

3. **Data Access Layer** (`src/lib/db/`)
   - Repository pattern with `ITokenRepository` interface
   - SQLite implementation in `SQLiteTokenRepository`
   - Easy database replacement by implementing the interface

### Validation Layer

The application uses Zod for runtime type checking and validation:

- Schema-based validation with automatic type inference
- Detailed error messages with field-specific feedback
- Input sanitization (string trimming for userId and scopes)
- Type-safe validation that integrates with TypeScript

### Configuration Management

Centralized configuration approach:

- Environment variables in `src/config/environment.ts`
- Database configuration in `src/config/database.ts`
- Type-safe configuration with validation
- Environment-specific settings support

### Database Abstraction

The repository pattern is used to abstract database operations:

```typescript
// Interface
export interface ITokenRepository {
  create(data: CreateTokenData): Token;
  findNonExpiredByUserId(userId: string): Token[];
}

// SQLite implementation
export class SQLiteTokenRepository implements ITokenRepository {
  // Implementation details
}
```

**To replace SQLite with another database** (PostgreSQL, Redis, etc.):

1. Create a new class implementing `ITokenRepository`
2. Implement the two required methods
3. Update the service to use the new repository

The service layer depends only on the interface, not the concrete implementation.

## Database Schema

```sql
CREATE TABLE tokens (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  scopes TEXT NOT NULL,      -- JSON stringified array
  token TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,   -- ISO 8601 string
  expiresAt TEXT NOT NULL    -- ISO 8601 string
);

CREATE INDEX idx_userId ON tokens(userId);
CREATE INDEX idx_expiresAt ON tokens(expiresAt);
```

**Data Type Handling:**

- **Dates**: Stored as ISO 8601 strings, converted to Date objects in the repository layer
- **Scopes**: Stored as JSON stringified array, parsed in the repository layer

## Example cURL Commands

### Create a token:

```bash
curl -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "userId": "123",
    "scopes": ["read", "write"],
    "expiresInMinutes": 60
  }'
```

### List tokens:

```bash
curl -X GET "http://localhost:3000/api/tokens?userId=123" \
  -H "X-API-Key: your-secret-api-key"
```

### Test authentication failure:

```bash
curl -X GET "http://localhost:3000/api/tokens?userId=123"
# Returns 401 Unauthorized
```

### Test validation error:

```bash
curl -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "userId": "",
    "scopes": [],
    "expiresInMinutes": -5
  }'
# Returns 400 Bad Request with validation errors
```

## Assumptions and Simplifications

### 1. Authentication

- Uses a single shared API key for simplicity
- In production, you would implement:
  - Per-user API keys
  - JWT-based authentication
  - OAuth 2.0 / OpenID Connect

### 2. Token Storage

- Tokens are stored in plain text in the database
- In production, you should:
  - Hash tokens before storage
  - Only return token value on creation
  - Use cryptographically secure token generation

### 3. Database

- SQLite is used for ease of setup and demonstration
- The repository pattern makes it trivial to replace with:
  - PostgreSQL for production scalability
  - Redis for high-performance caching
  - Any other database by implementing `ITokenRepository`

### 4. Error Handling

- Basic error handling with appropriate HTTP status codes
- In production, you would add:
  - Detailed logging
  - Error tracking (e.g., Sentry)
  - Rate limiting
  - Request validation middleware

### 5. Security

- No rate limiting
- No CORS configuration
- No HTTPS enforcement
- These would be required in a production environment

## Development Principles

This implementation follows the assignment requirements of being "minimal but clean and technically sound":

- **No over-engineering**: Simple, focused implementations without unnecessary abstractions
- **Type safety**: TypeScript strict mode throughout, no `any` types
- **Separation of concerns**: Clear boundaries between presentation, business logic, and data access
- **Testability**: Business logic separated from HTTP and database for easy unit testing
- **Maintainability**: Small, focused files and modules
- **Extensibility**: Repository pattern allows easy database replacement

## License

This project is part of a technical assignment.
