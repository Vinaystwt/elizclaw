/**
 * Simple JSON file-based persistence layer.
 * Stores tasks, logs, bets, and guesses in data/store.json.
 * Uses a write mutex to prevent concurrent write corruption.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : path.join(__dirname, "../../data");

/**
 * Ensure the data directory exists.
 */
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Write mutex — prevents concurrent writes from corrupting store.json.
 * When a write is in progress, subsequent writes queue up and execute sequentially.
 */
let writeLock = false;
const writeQueue: Array<() => void> = [];

/**
 * Read the entire store from disk.
 * Returns empty object if file doesn't exist or is corrupt.
 */
function readStoreSync(): Record<string, any> {
  const storePath = path.join(DATA_DIR, "store.json");
  if (!fs.existsSync(storePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(storePath, "utf8"));
  } catch (e) {
    console.error(`[store] Corrupt store.json, returning empty store:`, e);
    return {};
  }
}

/**
 * Write the entire store to disk.
 * Uses mutex to prevent concurrent corruption.
 */
function writeStoreSync(store: Record<string, any>) {
  const storePath = path.join(DATA_DIR, "store.json");
  try {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
  } catch (e) {
    console.error(`[store] Failed to write store.json:`, e);
  }
}

/**
 * Acquire the write lock, or queue the write.
 */
function withWriteLock(fn: () => void) {
  if (!writeLock) {
    writeLock = true;
    fn();
    writeLock = false;
    // Flush queue
    const next = writeQueue.shift();
    if (next) withWriteLock(next);
  } else {
    writeQueue.push(fn);
  }
}

/**
 * Get a value from the store by key.
 * Returns null if the key doesn't exist.
 */
export function getStore<T = any>(key: string): T | null {
  const store = readStoreSync();
  return store[key] ?? null;
}

/**
 * Set a value in the store by key.
 * Thread-safe: uses write mutex to prevent corruption.
 */
export function setStore(key: string, value: any) {
  withWriteLock(() => {
    const store = readStoreSync();
    store[key] = value;
    writeStoreSync(store);
  });
}

/**
 * Append an item to a named array in the store.
 * Creates the array if it doesn't exist.
 * Thread-safe: uses write mutex to prevent corruption.
 */
export function appendToArray(key: string, item: any) {
  withWriteLock(() => {
    const store = readStoreSync();
    if (!store[key]) store[key] = [];
    if (!Array.isArray(store[key])) {
      console.warn(`[store] Key '${key}' is not an array, overwriting.`);
      store[key] = [];
    }
    store[key].push(item);
    writeStoreSync(store);
  });
}
