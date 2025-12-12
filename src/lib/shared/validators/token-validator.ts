import { z } from "zod";
import type { ValidationResult } from "@/types/common";

// NOTE: Input strings are trimmed of leading/trailing whitespace.
// This is a design decision for better UX while maintaining security.
//
// NOTE: Trimmed fields:
// - userId: "  userId  " becomes "userId"
// - scopes array items: ["  read  ", "  write  "] becomes ["read", "write"]
// - expiresInMinutes is NOT trimmed (it's a number, not a string)
const createTokenSchema = z.object({
  userId: z.unknown().transform((val, ctx): string => {
    if (!val || typeof val !== "string") {
      ctx.addIssue({
        code: "custom",
        message: "userId must be a non-empty string",
      });
      return z.NEVER;
    }
    const trimmed = val.trim();
    if (trimmed === "") {
      ctx.addIssue({
        code: "custom",
        message: "userId must be a non-empty string",
      });
      return z.NEVER;
    }
    return trimmed;
  }),
  scopes: z.unknown().transform((val, ctx): string[] => {
    if (!Array.isArray(val)) {
      ctx.addIssue({
        code: "custom",
        message: "scopes must be an array",
      });
      return z.NEVER;
    }
    if (val.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "scopes must be a non-empty array",
      });
      return z.NEVER;
    }
    if (
      !val.every((scope) => typeof scope === "string" && scope.trim() !== "")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "scopes must be an array of non-empty strings",
      });
      return z.NEVER;
    }
    return val.map((scope) => scope.trim());
  }),
  expiresInMinutes: z.unknown().transform((val, ctx): number => {
    if (typeof val !== "number") {
      ctx.addIssue({
        code: "custom",
        message: "expiresInMinutes must be a number",
      });
      return z.NEVER;
    }
    if (!Number.isInteger(val)) {
      ctx.addIssue({
        code: "custom",
        message: "expiresInMinutes must be an integer",
      });
      return z.NEVER;
    }
    if (val <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "expiresInMinutes must be a positive integer",
      });
      return z.NEVER;
    }
    return val;
  }),
});

export function validateCreateTokenRequest(data: unknown): ValidationResult {
  // Handle null/undefined case with proper type guards
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      valid: false,
      error: "Request body must be a valid JSON object",
      details: { request: "Request body must be a valid JSON object" },
    };
  }

  // Parse with Zod
  const result = createTokenSchema.safeParse(data);

  if (!result.success) {
    // Convert Zod errors to the expected format with type-safe access
    const details: Record<string, string> = {};

    result.error.issues.forEach((issue) => {
      // Type-safe access to issue.path with proper checks
      if (issue.path.length > 0) {
        const field = issue.path[0];
        if (typeof field === "string") {
          details[field] = issue.message;
        }
      }
    });

    return {
      valid: false,
      error: "Validation failed",
      details,
    };
  }

  return {
    valid: true,
  };
}

export function validateUserId(userId: unknown): ValidationResult {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return {
      valid: false,
      error: "userId must be a non-empty string",
      details: { userId: "userId must be a non-empty string" },
    };
  }

  return {
    valid: true,
  };
}
