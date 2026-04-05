/**
 * Tests for store persistence layer — read, write, corrupt recovery, concurrent writes.
 * Run with: bun test src/plugins/store.test.ts
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import { getStore, setStore, appendToArray } from "./store.ts";

const TEST_DATA_DIR = path.join(__dirname, "../../data/test-store");

// Override DATA_DIR for tests
process.env.DATA_DIR = TEST_DATA_DIR;

describe("store persistence", () => {
  beforeAll(() => {
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
    // Clean store before tests
    const storePath = path.join(TEST_DATA_DIR, "store.json");
    if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
  });

  afterAll(() => {
    const storePath = path.join(TEST_DATA_DIR, "store.json");
    if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
  });

  test("read from empty store returns null for missing key", () => {
    const result = getStore("NONEXISTENT_KEY");
    expect(result).toBeNull();
  });

  test("write and read back a task", () => {
    const task = { id: 1, name: "Test Task", type: "price_monitor", is_active: 1 };
    setStore("TEST_TASK", task);
    const retrieved = getStore("TEST_TASK");
    expect(retrieved).toEqual(task);
  });

  test("corrupt JSON recovers gracefully", () => {
    const storePath = path.join(TEST_DATA_DIR, "store.json");
    // Write garbage
    fs.writeFileSync(storePath, "{{{INVALID JSON!!!}}}", "utf8");
    // Read should return empty object, not crash
    const result = getStore("ANY_KEY");
    expect(result).toBeNull();
    // Store should still be writable after recovery
    setStore("AFTER_CORRUPT", { ok: true });
    const recovered = getStore("AFTER_CORRUPT");
    expect(recovered).toEqual({ ok: true });
  });

  test("concurrent writes do not corrupt store", async () => {
    const writes = Array.from({ length: 5 }, (_, i) =>
      new Promise<void>(resolve => {
        setStore(`CONCURRENT_${i}`, { index: i, ts: Date.now() });
        resolve();
      })
    );
    await Promise.all(writes);
    // Verify all keys exist
    for (let i = 0; i < 5; i++) {
      const val = getStore(`CONCURRENT_${i}`);
      expect(val).toBeDefined();
      expect(val?.index).toBe(i);
    }
  });

  test("appendToArray creates and populates array", () => {
    const uniqueKey = `TEST_LOGS_${Date.now()}`;
    appendToArray(uniqueKey, { id: 1, msg: "first" });
    appendToArray(uniqueKey, { id: 2, msg: "second" });
    const logs = getStore<any[]>(uniqueKey);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs?.length).toBe(2);
    expect(logs?.[0].msg).toBe("first");
    expect(logs?.[1].msg).toBe("second");
  });
});
