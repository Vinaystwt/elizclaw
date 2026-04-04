import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../../data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStore(): Record<string, any> {
  const storePath = path.join(DATA_DIR, "store.json");
  if (!fs.existsSync(storePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(storePath, "utf8"));
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, any>) {
  const storePath = path.join(DATA_DIR, "store.json");
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

export function getStore<T = any>(key: string): T | null {
  const store = readStore();
  return store[key] ?? null;
}

export function setStore(key: string, value: any) {
  const store = readStore();
  store[key] = value;
  writeStore(store);
}

export function appendToArray(key: string, item: any) {
  const store = readStore();
  if (!store[key]) store[key] = [];
  store[key].push(item);
  writeStore(store);
}
