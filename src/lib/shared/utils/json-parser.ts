import { ExtractedCommand } from '@/lib/infrastructure/llm/extraction.interface';
import { InvalidResponseError } from '../errors/extraction-errors';

/**
 * Utility for parsing JSON responses from LLMs with robust fallback strategies
 * Extracted from the original 143-line extractCommand method
 */
export class JSONParser {
  /**
   * Extract and parse JSON from an LLM response with multiple fallback strategies
   */
  static extractAndParseJSON(response: string): ExtractedCommand {
    if (!response || typeof response !== 'string') {
      throw new InvalidResponseError('Empty or invalid response from LLM', response);
    }

    // Strategy 1: Try to extract JSON object from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new InvalidResponseError('No JSON found in LLM response', response);
    }

    let jsonString = jsonMatch[0].trim();

    // Strategy 2: Fix common JSON formatting issues
    jsonString = this.fixCommonJSONIssues(jsonString);

    // Strategy 3: Try to parse the fixed JSON
    try {
      const parsed = JSON.parse(jsonString);
      return this.validateAndNormalize(parsed);
    } catch (parseError) {
      // Strategy 4: Aggressive field extraction if JSON parsing fails
      return this.extractFieldsAggressively(jsonString);
    }
  }

  /**
   * Fix common JSON formatting issues in LLM responses
   */
  private static fixCommonJSONIssues(jsonString: string): string {
    let fixed = jsonString;

    // Add missing closing brace
    if (!fixed.endsWith('}')) {
      fixed += '}';
    }

    // Add missing confidence field if not present
    if (fixed.includes('"intent"') && !fixed.includes('"confidence"')) {
      const lastBraceIndex = fixed.lastIndexOf('}');
      if (lastBraceIndex > 0) {
        const beforeBrace = fixed.substring(0, lastBraceIndex);
        if (beforeBrace.trim().endsWith(',')) {
          // Replace trailing comma with confidence field
          fixed = beforeBrace.slice(0, -1) + ',\n  "confidence": 0.95\n}';
        } else {
          // Insert confidence field before closing brace
          fixed = beforeBrace + ',\n  "confidence": 0.95\n}';
        }
      }
    }

    return fixed;
  }

  /**
   * Validate and normalize the parsed JSON to ensure required fields
   */
  private static validateAndNormalize(parsed: any): ExtractedCommand {
    if (!parsed || typeof parsed !== 'object') {
      throw new InvalidResponseError('Parsed JSON is not an object', JSON.stringify(parsed));
    }

    // Ensure required fields exist with proper types
    const result: ExtractedCommand = {
      intent: this.validateIntent(parsed.intent),
      parameters: this.validateParameters(parsed.parameters),
      confidence: this.validateConfidence(parsed.confidence)
    };

    return result;
  }

  /**
   * Aggressive field extraction when JSON parsing fails
   */
  private static extractFieldsAggressively(jsonString: string): ExtractedCommand {
    const intentMatch = jsonString.match(/"intent"\s*:\s*"([^"]+)"/);
    const userIdMatch = jsonString.match(/"userId"\s*:\s*"([^"]+)"/);
    const scopesMatch = jsonString.match(/"scopes"\s*:\s*\[([^\]]+)\]/);
    const tokenIdMatch = jsonString.match(/"tokenId"\s*:\s*"([^"]+)"/);
    const timeMatch = jsonString.match(/"time"\s*:\s*"([^"]+)"/);
    const deleteAllMatch = jsonString.match(/"deleteAll"\s*:\s*(true|false)/);
    const confidenceMatch = jsonString.match(/"confidence"\s*:\s*([\d.]+)/);

    // Parse scopes if found
    let scopes: string[] | undefined;
    if (scopesMatch) {
      const scopesStr = scopesMatch[1];
      scopes = scopesStr.split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s);
    }

    return {
      intent: this.validateIntent(intentMatch?.[1]),
      parameters: {
        userId: userIdMatch?.[1],
        scopes,
        tokenId: tokenIdMatch?.[1],
        time: timeMatch?.[1],
        deleteAll: deleteAllMatch ? deleteAllMatch[1] === 'true' : undefined
      },
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.95
    };
  }

  /**
   * Validate intent field
   */
  private static validateIntent(intent: any): ExtractedCommand['intent'] {
    const validIntents = ['create', 'read', 'delete', 'update', 'refresh', 'status', 'revoke', 'help', 'unknown'];

    if (typeof intent === 'string' && validIntents.includes(intent)) {
      return intent as ExtractedCommand['intent'];
    }

    return 'unknown';
  }

  /**
   * Validate parameters object
   */
  private static validateParameters(params: any): ExtractedCommand['parameters'] {
    if (!params || typeof params !== 'object') {
      return {};
    }

    return {
      userId: typeof params.userId === 'string' ? params.userId : undefined,
      scopes: Array.isArray(params.scopes) ? params.scopes.filter((s: any) => typeof s === 'string') : undefined,
      tokenId: typeof params.tokenId === 'string' ? params.tokenId : undefined,
      time: typeof params.time === 'string' ? params.time : undefined,
      deleteAll: typeof params.deleteAll === 'boolean' ? params.deleteAll : undefined
    };
  }

  /**
   * Validate confidence field
   */
  private static validateConfidence(confidence: any): number {
    if (typeof confidence === 'number' && confidence >= 0 && confidence <= 1) {
      return confidence;
    }

    // Default confidence if not provided or invalid
    return 0.95;
  }
}