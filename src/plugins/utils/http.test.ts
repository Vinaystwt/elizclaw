/**
 * Tests for HTTP utility — retries, timeouts, rate-limit handling.
 * Run with: bun test src/plugins/utils/http.test.ts
 */
import { afterEach, describe, test, expect, mock } from "bun:test";
import { httpGet } from "./http.ts";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  mock.restore();
});

function jsonResponse(body: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

describe("httpGet", () => {
  test("successful fetch returns ok: true with data", async () => {
    global.fetch = mock(async () => jsonResponse({ gecko_says: "(V3) To the Moon!" })) as typeof fetch;
    const result = await httpGet("https://example.com/ping");
    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("404 returns ok: false with error", async () => {
    global.fetch = mock(async () => jsonResponse({ error: "Not Found" }, { status: 404 })) as typeof fetch;
    const result = await httpGet("https://example.com/404");
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("rate limit 429 is detected", async () => {
    let callCount = 0;
    global.fetch = mock(async () => {
      callCount += 1;
      if (callCount === 1) {
        return jsonResponse({ error: "Rate limited" }, { status: 429, headers: { "retry-after": "1" } });
      }
      return jsonResponse({ ok: true });
    }) as typeof fetch;

    const result = await httpGet("https://example.com/rate-limit");
    expect(callCount).toBe(2);
    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
  }, { timeout: 15000 });

  test("structured FetchResult shape", async () => {
    global.fetch = mock(async () => jsonResponse({ ok: true })) as typeof fetch;
    const result = await httpGet("https://example.com/ping");
    expect(result).toHaveProperty("ok");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("error");
  });

  test("network error returns ok: false with error", async () => {
    global.fetch = mock(async () => {
      throw new Error("network down");
    }) as typeof fetch;

    const result = await httpGet("https://example.com/offline", {}, 0);
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});
