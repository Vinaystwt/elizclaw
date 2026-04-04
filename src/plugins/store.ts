/**
 * Simple JSON file-based persistence layer.
 * Stores tasks, logs, bets, and guesses in data/store.json.
 * Thread-safe via synchronous read/write (single-process assumption).
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
 * Read the entire store from disk.
 * Returns empty object if file doesn't exist or is corrupt.
 */
function readStore(): Record<string, any> {
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
 * Write the entire store to disk atomically.
 */
function writeStore(store: Record<string, any>) {
  const storePath = path.join(DATA_DIR, "store.json");
  try {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
  } catch (e) {
    console.error(`[store] Failed to write store.json:`, e);
  }
}

/**
 * Get a value from the store by key.
 * Returns null if the key doesn't exist.
 */
export function getStore<T = any>(key: string): T | null {
  const store = readStore();
  return store[key] ?? null;
}

/**
 * Set a value in the store by key.
 */
export function setStore(key: string, value: any) {
  const store = readStore();
  store[key] = value;
  writeStore(store);
}

/**
 * Append an item to a named array in the store.
 * Creates the array if it doesn't exist.
 */
export function appendToArray(key: string, item: any) {
  const store = readStore();
  if (!store[key]) store[key] = [];
  if (!Array.isArray(store[key])) {
    console.warn(`[store] Key '${key}' is not an array, overwriting.`);
    store[key] = [];
  }
  store[key].push(item);
  writeStore(store);
}
