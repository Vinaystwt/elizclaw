import fs from "fs";
import path from "path";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readStore() {
  ensureDir();
  if (!fs.existsSync(storePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(storePath, "utf8"));
  } catch {
    return {};
  }
}

function writeStore(store) {
  ensureDir();
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function mergeByKey(existing, incoming, keyFn) {
  const map = new Map();
  for (const item of existing) map.set(keyFn(item), item);
  for (const item of incoming) map.set(keyFn(item), item);
  return Array.from(map.values());
}

const demoTasks = [
  {
    id: 101,
    name: "Check BTC price daily at 8AM, alert if above $95,000",
    type: "price_monitor",
    schedule: "daily at 08:00",
    config: { coin: "BTC", threshold: 95000 },
    is_active: 1,
    created_at: daysAgo(3),
    updated_at: hoursAgo(2),
    last_run: hoursAgo(8),
    next_run: hoursAgo(-16),
  },
  {
    id: 102,
    name: "Track wallet Binance cold storage for large moves",
    type: "signal_monitor",
    schedule: "every hour",
    config: { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" },
    is_active: 1,
    created_at: daysAgo(3),
    updated_at: hoursAgo(1),
    last_run: hoursAgo(1),
    next_run: hoursAgo(-1),
  },
  {
    id: 103,
    name: "Get market signal brief every morning",
    type: "signal_monitor",
    schedule: "daily at 09:00",
    config: {},
    is_active: 1,
    created_at: daysAgo(3),
    updated_at: hoursAgo(4),
    last_run: hoursAgo(6),
    next_run: hoursAgo(-18),
  },
];

const demoLogs = [
  { id: "demo-log-1", task_id: 101, type: "price_monitor", status: "success", output: "BTC checked at $94,230. Threshold not triggered.", executed_at: hoursAgo(22), duration_ms: 842 },
  { id: "demo-log-2", task_id: 103, type: "signal_monitor", status: "success", output: "Trending coins: SOL, ETH, BNB. Market cap +1.8%.", executed_at: hoursAgo(18), duration_ms: 1130 },
  { id: "demo-log-3", task_id: 102, type: "signal_monitor", status: "success", output: "Signal monitor flagged outsized Binance cold wallet activity alongside elevated ETH volume.", executed_at: hoursAgo(15), duration_ms: 930 },
  { id: "demo-log-4", task_id: 101, type: "price_monitor", status: "success", output: "BTC checked at $93,100. Momentum below 7-day average.", executed_at: hoursAgo(12), duration_ms: 801 },
  { id: "demo-log-5", task_id: 103, type: "signal_monitor", status: "success", output: "Trending coins: SOL, ETH, BNB. Builders active across Solana repos.", executed_at: hoursAgo(20), duration_ms: 1204 },
  { id: "demo-log-6", task_id: 102, type: "signal_monitor", status: "success", output: "Signal monitor spotted stablecoin inflows and improving liquidity across major desks.", executed_at: hoursAgo(9), duration_ms: 954 },
  { id: "demo-log-7", task_id: 101, type: "price_monitor", status: "success", output: "BTC checked at $95,440. Alert triggered above threshold.", executed_at: hoursAgo(8), duration_ms: 883 },
  { id: "demo-log-8", task_id: 103, type: "signal_monitor", status: "success", output: "Signal monitor completed normally. BTC momentum firmed while altcoin breadth stayed constructive.", executed_at: hoursAgo(2), duration_ms: 1500 },
  { id: "demo-log-9", task_id: 102, type: "signal_monitor", status: "success", output: "Cross-market read stayed bullish as whale activity, trend strength, and dev activity aligned.", executed_at: hoursAgo(1), duration_ms: 1014 },
  { id: "demo-log-10", task_id: 103, type: "signal_monitor", status: "success", output: "Morning brief generated with 3 confirmed signals and no critical failures.", executed_at: hoursAgo(0.5), duration_ms: 1188 },
];

const demoWhaleEvents = [
  {
    id: "demo-whale-1",
    wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    label: "Binance Cold Wallet",
    direction: "OUT",
    amount: 12000,
    symbol: "ETH",
    usdValue: 28400000,
    txSignature: "demo-binance-eth",
    timestamp: hoursAgo(11),
  },
  {
    id: "demo-whale-2",
    wallet: "GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ",
    label: "Wintermute",
    direction: "IN",
    amount: 500000,
    symbol: "USDC",
    usdValue: 500000,
    txSignature: "demo-wintermute-usdc",
    timestamp: hoursAgo(7),
  },
  {
    id: "demo-whale-3",
    wallet: "JUMPtrading11111111111111111111111111111111",
    label: "Jump Trading",
    direction: "OUT",
    amount: 8000,
    symbol: "SOL",
    usdValue: 1200000,
    txSignature: "demo-jump-sol",
    timestamp: hoursAgo(3),
  },
];

const demoBriefs = [
  {
    timestamp: daysAgo(1),
    brief: "📋 ElizClaw Daily Brief — Yesterday\n\nMARKET: Bullish — SOL and ETH led the tape while builders stayed active.\nWHALE ACTIVITY: 2 movements detected\nYOUR TASKS: 3 ran successfully, 0 failed\nTOP ALERT: Binance Cold Wallet moved 12,000 ETH\nNEXT SCHEDULED: Check BTC price daily at 8AM, alert if above $95,000\n\nGenerated at 8:00 AM — next brief in 24 hours",
    topAlert: "Binance Cold Wallet moved 12,000 ETH",
    nextScheduled: "Check BTC price daily at 8AM, alert if above $95,000",
  },
];

const demoWatchlist = [
  { coin: "Bitcoin", symbol: "BTC", addedAt: daysAgo(2), currentPrice: 95440, priceAtAdd: 93200, change24h: 1.84 },
  { coin: "Solana", symbol: "SOL", addedAt: daysAgo(2), currentPrice: 150, priceAtAdd: 142, change24h: 3.11 },
  { coin: "Ethereum", symbol: "ETH", addedAt: daysAgo(2), currentPrice: 2366, priceAtAdd: 2288, change24h: 2.27 },
];

const demoReports = [
  {
    timestamp: daysAgo(1),
    totalTasks: 3,
    successRate: 98,
    failureRate: 2,
    mostUsedAction: "MONITOR_PRICE",
    tasksByType: {
      price_monitor: 12,
      signal_monitor: 8,
      whale_watcher: 0,
    },
    recentFailures: [],
    uptime: 86400,
    tasksRunToday: 3,
    avgExecutionTime: 1240,
  },
];

const store = readStore();
store.TASKS = demoTasks;
store.LOGS = demoLogs;
store.WHALE_EVENTS = demoWhaleEvents;
store.DAILY_BRIEFS = demoBriefs;
store.AGENT_REPORTS = demoReports;
store.WATCHLIST = demoWatchlist;
store.WHALE_WATCHERS = [
  {
    address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    label: "Binance Cold Wallet",
    threshold: 10000,
    is_active: true,
    created_at: daysAgo(2),
  },
  {
    address: "GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ",
    label: "Wintermute",
    threshold: 10000,
    is_active: true,
    created_at: daysAgo(2),
  },
  {
    address: "JUMPtrading11111111111111111111111111111111",
    label: "Jump Trading",
    threshold: 10000,
    is_active: true,
    created_at: daysAgo(2),
  },
];

writeStore(store);

console.log(`Seeded demo data in ${storePath}`);
console.log(`Tasks: ${store.TASKS.length}, Logs: ${store.LOGS.length}, Whale events: ${store.WHALE_EVENTS.length}, Watchlist: ${store.WATCHLIST.length}`);
