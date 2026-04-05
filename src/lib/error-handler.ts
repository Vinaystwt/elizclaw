/**
 * Global error handler for ElizClaw.
 * Provides structured error handling that never exposes stack traces to users.
 */

/**
 * Custom error class with error code and optional context metadata.
 */
export class AppError extends Error {
  public code: string;
  public context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.context = context;
  }
}

/**
 * Handle any error — returns a sanitized user-safe message,
 * logs the full details internally.
 */
export function handleError(error: unknown): string {
  if (error instanceof AppError) {
    console.error(`[error] ${error.code}: ${error.message}`, error.context);
    return error.message;
  }

  if (error instanceof Error) {
    console.error(`[error] ${error.name}: ${error.message}`);
    // Never expose stack traces or internal paths to the user
    if (error.message.includes("ENOENT")) return "File not found — check the path and try again.";
    if (error.message.includes("ECONNREFUSED")) return "Connection refused — the service may be down.";
    if (error.message.includes("ETIMEDOUT") || error.message.includes("timeout")) return "Request timed out — the service may be slow or unreachable.";
    if (error.message.includes("EAI_AGAIN") || error.message.includes("ENOTFOUND")) return "DNS lookup failed — check your internet connection.";
    return `An unexpected error occurred: ${error.message.substring(0, 100)}`;
  }

  // Unknown error type — sanitize completely
  const msg = String(error);
  console.error(`[error] Unknown error: ${msg}`);
  return "An unexpected error occurred. Please try again.";
}
