import type { ChatRequest, ChatResponse } from '@/types/domain/chat';
import type { ITokenService } from '@/lib/domain/services/token';
import type { CreateTokenRequest } from '@/types/api/requests';
import type { IChatService } from './chat-service.interface';
import type { IExtractionService } from '@/lib/infrastructure/llm/extraction.interface';
import type { Token } from '@/lib/domain/models/token';

export class SimpleChatService implements IChatService {
  private tokenService: ITokenService;
  private extractionService: IExtractionService;

  constructor(tokenService: ITokenService, extractionService: IExtractionService) {
    this.tokenService = tokenService;
    this.extractionService = extractionService;
  }

  async processMessage(request: ChatRequest, userId?: string): Promise<ChatResponse> {
    try {
      // Extract command using enhanced extraction service (with OpenAI fallback)
      const command = await this.extractionService.extractCommand(request.message);

      // Process command
      const result = await this.executeCommand(command, userId);

      // Make response friendly
      const friendlyResponse = await this.extractionService.makeFriendly(result.message);

      return {
        response: friendlyResponse,
        sessionId: 'none', // Stateless
        success: result.success,
        data: result.data
      };
    } catch (error) {
      const errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      const friendlyError = await this.extractionService.makeFriendly(errorMessage);

      return {
        response: friendlyError,
        sessionId: 'none',
        success: false
      };
    }
  }

  private async executeCommand(command: any, userId?: string): Promise<{
    message: string;
    success: boolean;
    data?: any;
  }> {
    const { intent, parameters } = command;

    
    const targetUserId = parameters.userId || userId || 'demo-user';

    try {
      switch (intent) {
        case 'create':
          return await this.handleCreate(targetUserId, parameters.scopes, parameters.time);

        case 'read':
          return await this.handleRead(targetUserId, parameters.tokenId, parameters.userId);

        case 'delete':
          return await this.handleDelete(targetUserId, parameters.tokenId, parameters.deleteAll);

        case 'update':
          return await this.handleUpdate(targetUserId, parameters.tokenId, parameters.scopes);

        case 'refresh':
          return await this.handleRefresh(targetUserId, parameters.tokenId, parameters.time);

        case 'status':
          return await this.handleStatus(targetUserId, parameters.tokenId);

        case 'revoke':
          return await this.handleRevoke(targetUserId, parameters.tokenId);

        case 'help':
          return await this.handleHelp();

        default:
          return {
            message: "I'm not sure what you want to do. Try asking me to create, list, update, delete, refresh, or check the status of tokens.",
            success: false
          };
      }
    } catch (error) {
      return {
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async handleCreate(userId: string, scopes?: string[], time?: string): Promise<any> {
    if (!scopes || scopes.length === 0) {
      return {
        message: 'To create a token, please specify at least one scope (read, write, or admin).',
        success: false
      };
    }

    
    // Parse time expression or default to 30 days
    let expiresInMinutes = 43200; // 30 days default
    if (time) {
      expiresInMinutes = this.parseTimeExpression(time);
    }

    const createRequest: CreateTokenRequest = {
      userId,
      scopes,
      expiresInMinutes
    };

    const newToken = this.tokenService.createToken(createRequest);

    // Include the actual token value in the response
    const tokenData = {
      id: newToken.id,
      userId: newToken.userId,
      scopes: newToken.scopes,
      token: newToken.token, // Include the actual token
      createdAt: newToken.createdAt,
      expiresAt: newToken.expiresAt
    };

    let message = `Created token ${newToken.id} for ${userId} with scopes: ${newToken.scopes.join(', ')}.`;
    if (time) {
      message += ` It will expire in ${time} (on ${newToken.expiresAt.toLocaleDateString()}).`;
    } else {
      message += ` The token will expire on ${newToken.expiresAt.toLocaleDateString()}.`;
    }

    // Add token to the message in a clean format
    message += `\n\nToken: ${newToken.token}`;

    return {
      message,
      success: true,
      data: { token: tokenData }
    };
  }

  private async handleRead(userId: string, tokenId?: string, requestedUserId?: string): Promise<any> {
    if (tokenId) {
      // Get specific token by ID
      const token = await this.tokenService.findById(tokenId);
      if (!token || token.userId !== userId) {
        return {
          message: 'Token not found or access denied.',
          success: false
        };
      }

      return {
        message: `Token ${token.id}:\n\nUser: ${token.userId}\nScopes: ${token.scopes.join(', ')}\nToken: ${token.token}\nExpires: ${token.expiresAt.toLocaleDateString()}`,
        success: true,
        data: {
          token: {
            id: token.id,
            userId: token.userId,
            scopes: token.scopes,
            token: token.token,
            createdAt: token.createdAt,
            expiresAt: token.expiresAt
          }
        }
      };
    } else {
      // List tokens
      let tokens: Token[];

      if (requestedUserId) {
        // List tokens for specific user
        tokens = this.tokenService.getTokensForUser(requestedUserId);
      } else {
        // List all tokens in the system
        tokens = this.tokenService.getAllTokens();
      }

      if (tokens.length === 0) {
        return {
          message: requestedUserId
            ? `${requestedUserId} doesn't have any active tokens.`
            : 'No active tokens found in the system.',
          success: true
        };
      }

      // Include actual token values
      const tokenData = tokens.map(token => ({
        id: token.id,
        userId: token.userId,
        scopes: token.scopes,
        token: token.token, // Include the actual token
        createdAt: token.createdAt,
        expiresAt: token.expiresAt
      }));

      // Create a clean message format with token details
      if (tokens.length === 1) {
        const token = tokens[0];
        const message = `Found one token ${requestedUserId ? `for user ${token.userId}` : 'in the system'}:\n\n` +
          `ID: ${token.id}\n` +
          `User: ${token.userId}\n` +
          `Scopes: ${token.scopes.join(', ')}\n` +
          `Token: ${token.token}\n` +
          `Expires: ${token.expiresAt.toLocaleDateString()}`;

        return {
          message,
          success: true,
          data: { tokens: tokenData }
        };
      } else {
        let message = `Found ${tokens.length} tokens ${requestedUserId ? `for user ${requestedUserId}` : 'in the system'}:\n\n`;

        tokens.forEach((token, index) => {
          message += `${index + 1}. ${token.id}\n`;
          message += `   User: ${token.userId}\n`;
          message += `   Scopes: ${token.scopes.join(', ')}\n`;
          message += `   Token: ${token.token}\n`;
          message += `   Expires: ${token.expiresAt.toLocaleDateString()}\n\n`;
        });

        return {
          message,
          success: true,
          data: { tokens: tokenData }
        };
      }
    }
  }

  private async handleDelete(userId: string, tokenId?: string, deleteAll?: boolean): Promise<any> {
    if (!tokenId && !deleteAll) {
      return {
        message: 'Please specify which token ID to delete or use "delete all [username] tokens".',
        success: false
      };
    }

    // Handle delete all tokens for a user
    if (deleteAll) {
      const tokens = this.tokenService.getTokensForUser(userId);

      if (tokens.length === 0) {
        return {
          message: `${userId} doesn't have any tokens to delete.`,
          success: true
        };
      }

      let deletedCount = 0;
      const errors: string[] = [];

      for (const token of tokens) {
        try {
          const deleted = await this.tokenService.delete(token.id);
          if (deleted) {
            deletedCount++;
          }
        } catch (error) {
          errors.push(`Failed to delete ${token.id}`);
        }
      }

      return {
        message: `Deleted ${deletedCount} token${deletedCount === 1 ? '' : 's'} for ${userId}.${errors.length > 0 ? ` Some errors occurred: ${errors.join(', ')}` : ''}`,
        success: true,
        data: { deletedCount, userId }
      };
    }

    // Handle single token deletion
    if (!tokenId) {
      return {
        message: 'Please specify which token ID to delete.',
        success: false
      };
    }

    // Check if token exists and belongs to user
    const token = await this.tokenService.findById(tokenId);
    if (!token || token.userId !== userId) {
      return {
        message: 'Token not found or access denied.',
        success: false
      };
    }

    // Delete token by ID
    const deleted = await this.tokenService.delete(tokenId);

    if (deleted) {
      return {
        message: `Successfully deleted token ${tokenId}.`,
        success: true,
        data: { deletedToken: tokenId }
      };
    } else {
      return {
        message: `Failed to delete token ${tokenId}.`,
        success: false
      };
    }
  }

  private async handleUpdate(userId: string, tokenId?: string, scopes?: string[]): Promise<any> {
    if (!tokenId) {
      return {
        message: 'Please specify which token ID to update.',
        success: false
      };
    }

    if (!scopes || scopes.length === 0) {
      return {
        message: 'Please specify the new scopes (read, write, admin).',
        success: false
      };
    }

    // Get existing token
    const token = await this.tokenService.findById(tokenId);
    if (!token || token.userId !== userId) {
      return {
        message: 'Token not found or access denied.',
        success: false
      };
    }

    // For now, we need to delete and recreate since TokenService doesn't have update method
    // In a real implementation, you'd add updateToken to TokenService
    await this.tokenService.delete(tokenId);

    const newToken = this.tokenService.createToken({
      userId,
      scopes,
      expiresInMinutes: Math.ceil((token.expiresAt.getTime() - Date.now()) / (1000 * 60))
    });

    return {
      message: `Updated token ${newToken.id} with new scopes: ${newToken.scopes.join(', ')}.`,
      success: true,
      data: { token: this.sanitizeToken(newToken) }
    };
  }

  private async handleRefresh(userId: string, tokenId?: string, time?: string): Promise<any> {
    if (!tokenId) {
      return {
        message: 'Please specify which token ID to refresh.',
        success: false
      };
    }

    const token = await this.tokenService.findById(tokenId);
    if (!token || token.userId !== userId) {
      return {
        message: 'Token not found or access denied.',
        success: false
      };
    }

    // Parse time expression or default to 30 days
    let expiresInMinutes = 43200; // 30 days default
    if (time) {
      expiresInMinutes = this.parseTimeExpression(time);
    }

    // Delete and recreate with new expiration
    await this.tokenService.delete(tokenId);

    const newToken = this.tokenService.createToken({
      userId,
      scopes: token.scopes,
      expiresInMinutes
    });

    return {
      message: `Refreshed token ${newToken.id}. New expiration: ${newToken.expiresAt.toLocaleDateString()}.`,
      success: true,
      data: { token: this.sanitizeToken(newToken) }
    };
  }

  private async handleStatus(userId: string, tokenId?: string): Promise<any> {
    if (!tokenId) {
      return {
        message: 'Please specify which token ID to check.',
        success: false
      };
    }

    const token = await this.tokenService.findById(tokenId);
    if (!token || token.userId !== userId) {
      return {
        message: 'Token not found or access denied.',
        success: false
      };
    }

    const now = new Date();
    const isValid = token.expiresAt > now;
    const daysUntilExpiry = Math.ceil((token.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      message: `Token ${token.id} status:\n- Valid: ${isValid ? '✅ Yes' : '❌ No'}\n- Expires: ${token.expiresAt.toLocaleDateString()} (${daysUntilExpiry} days)\n- Scopes: [${token.scopes.join(', ')}]`,
      success: true,
      data: {
        token: this.sanitizeToken(token),
        isValid,
        daysUntilExpiry
      }
    };
  }

  private async handleRevoke(userId: string, tokenId?: string): Promise<any> {
    if (!tokenId) {
      return {
        message: 'Please specify which token ID to revoke.',
        success: false
      };
    }

    const token = await this.tokenService.findById(tokenId);
    if (!token || token.userId !== userId) {
      return {
        message: 'Token not found or access denied.',
        success: false
      };
    }

    // Revoke by deleting (in a real implementation, you might mark as revoked instead)
    const deleted = await this.tokenService.delete(tokenId);

    if (deleted) {
      return {
        message: `Successfully revoked token ${tokenId}.`,
        success: true,
        data: { revokedToken: tokenId }
      };
    } else {
      return {
        message: `Failed to revoke token ${tokenId}.`,
        success: false
      };
    }
  }

  private async handleHelp(): Promise<any> {
    return {
      message: `I can help you manage tokens! Here's what you can ask me:

🔑 Create tokens:
- "Create a token with read scope for [username]"
- "Generate a token for [username] with read and write scopes"
- "Create a token for [username] that expires in [time]" (e.g., "2 weeks", "30 days")

📋 View tokens:
- "List all tokens"
- "Show tokens for [username]"
- "Show me all tokens for [user_id]"
- "Get details of token [token_id]"

✏️ Update tokens:
- "Update token [token_id] with admin scope"
- "Modify token [token_id] scopes to read and write"

🔄 Refresh tokens:
- "Refresh token [token_id] for 2 weeks"
- "Extend token [token_id]"

🚫 Revoke/Delete tokens:
- "Revoke token [token_id]"
- "Delete token [token_id]"

✅ Check status:
- "Check status of token [token_id]"
- "Is token [token_id] valid?"

Natural time expressions I understand: "2 weeks", "30 days", "1 month", "90 days", etc.

Tips:
- Use any username or user ID when requesting tokens for specific users
- Token IDs typically start with "token_" followed by random characters
- You can use singular ("token") or plural ("tokens") - I'll understand both`,
      success: true
    };
  }

  private parseTimeExpression(timeExpression: string): number {
    const expression = timeExpression.toLowerCase().trim();

    // Simple parsing for common expressions
    if (expression.includes('day')) {
      const days = parseInt(expression) || 1;
      return days * 24 * 60; // Convert days to minutes
    }
    if (expression.includes('week')) {
      const weeks = parseInt(expression) || 1;
      return weeks * 7 * 24 * 60; // Convert weeks to minutes
    }
    if (expression.includes('month')) {
      const months = parseInt(expression) || 1;
      return months * 30 * 24 * 60; // Approximate month as 30 days
    }
    if (expression.includes('year')) {
      const years = parseInt(expression) || 1;
      return years * 365 * 24 * 60; // Approximate year as 365 days
    }

    // Default to 30 days if unrecognized
    return 30 * 24 * 60;
  }

  private sanitizeToken(token: any) {
    return {
      id: token.id,
      userId: token.userId,
      scopes: token.scopes,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt
    };
  }
}