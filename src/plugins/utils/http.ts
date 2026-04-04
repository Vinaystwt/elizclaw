/**
 * HTTP utility with retries, timeouts, and rate-limit handling.
 * Wraps fetch with consistent error formatting for all API calls.
 */

const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_RETRIES = 2;
const BASE_DELAY = 1_000;

interface FetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/**
 * Sleep for ms milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout. Rejects if the request takes longer than timeoutMs.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Check if a response indicates rate limiting.
 */
function isRateLimited(res: Response): boolean {
  return res.status === 429 || res.headers.get("retry-after") !== null;
}

/**
 * Fetch with retries and exponential backoff.
 * Returns a structured result with ok/data/error fields.
 */
export async function httpGet<T = any>(url: string, options: RequestInit = {}, retries = DEFAULT_RETRIES): Promise<FetchResult<T>> {
  let lastError = "";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);

      // Rate limited — back off and retry
      if (isRateLimited(res)) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "0") || BASE_DELAY * Math.pow(2, attempt);
        await sleep(retryAfter);
        continue;
      }

      const data = await res.json() as T;

      if (!res.ok) {
        return { ok: false, status: res.status, data: null, error: `HTTP ${res.status}` };
      }

      return { ok: true, status: res.status, data, error: null };
    } catch (e: any) {
      lastError = e.name === "AbortError" ? "Request timed out" : e.message;
      if (attempt < retries) {
        await sleep(BASE_DELAY * Math.pow(2, attempt));
      }
    }
  }

  return { ok: false, status: 0, data: null, error: lastError || "Request failed" };
}

/**
 * Validate that a required config value exists.
 */
export function requireConfig(value: any, name: string): void {
  if (!value) {
    throw new Error(`Missing required config: ${name}`);
  }
}
