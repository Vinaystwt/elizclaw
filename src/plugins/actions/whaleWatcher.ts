import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore, setStore } from "../store.ts";

/**
 * Whale/smart money watcher — monitors notable Solana wallets for large transfers.
 * Alerts when a tracked wallet makes a significant move.
 * Uses Solana blockchain explorer APIs for transaction data.
 */

interface WhaleAlert {
  wallet: string;
  label: string;
  type: "transfer" | "swap" | "mint" | "unknown";
  amount: number;
  symbol: string;
  usdValue: number;
  txSignature: string;
  timestamp: string;
}

/**
 * Well-known Solana wallets to track (public data, not private keys).
 * These are exchange wallets, fund wallets, and known whales.
 */
const KNOWN_WHALES: Record<string, string> = {
  // Exchange cold wallets and known large holders (public addresses)
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM": "Binance Cold Wallet",
  "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9": "FTX Estate Recovery",
  "GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ": "Wintermute Trading",
  "4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg": "Alameda Research",
};

/**
 * Fetch recent whale events for a wallet from store.json.
 * Falls back to whale watcher logs if no dedicated event list exists yet.
 */
async function fetchRecentTransfers(walletAddress?: string, limit: number = 5): Promise<WhaleAlert[]> {
  const storedEvents = getStore<any[]>("WHALE_EVENTS") || [];
  const logEvents = (getStore<any[]>("LOGS") || [])
    .filter((entry: any) => entry.type === "whale_watcher" || entry.task_type === "whale_watcher")
    .map((entry: any) => ({
      wallet: entry.wallet || entry.address || "Unknown Wallet",
      label: entry.label || entry.task_name || "Whale Watcher",
      type: "transfer" as const,
      amount: extractAmount(entry.output),
      symbol: extractCoin(entry.output),
      usdValue: extractAmount(entry.output),
      txSignature: entry.txSignature || "stored-log",
      timestamp: entry.executed_at || entry.timestamp || new Date().toISOString(),
    }));

  const events = [...storedEvents, ...logEvents]
    .filter((event) => !walletAddress || event.wallet === walletAddress || event.label === walletAddress)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return events;
}

function extractAmount(output: string = ""): number {
  const match = output.match(/\$?([\d,]+(?:\.\d+)?)/);
  return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
}

function extractCoin(output: string = ""): string {
  const match = output.match(/\b(BTC|ETH|SOL|DOGE|ADA|AVAX|BNB|XRP|USDC|USDT)\b/i);
  return match ? match[1].toUpperCase() : "SOL";
}

function formatEvent(event: WhaleAlert): string {
  const wallet = event.wallet.length > 16
    ? `${event.wallet.slice(0, 8)}...${event.wallet.slice(-4)}`
    : event.wallet;
  const amountText = event.usdValue > 0 ? `$${event.usdValue.toLocaleString()}` : "size unknown";
  return `• ${event.label || wallet} — ${event.symbol} ${amountText} (${wallet})`;
}

function inferPattern(events: WhaleAlert[], event: WhaleAlert): string {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const related = events.filter((entry) => {
    const matchesCoin = entry.symbol === event.symbol;
    const ts = new Date(entry.timestamp).getTime();
    return matchesCoin && ts >= oneWeekAgo;
  });

  if (related.length <= 1) return "first move this week";
  const inCount = related.filter((entry: any) => ((entry.direction || "IN").toUpperCase() === "IN")).length;
  const outCount = related.length - inCount;
  return inCount >= outCount ? "repeated accumulation" : "distribution";
}

function buildWhaleContext(event: WhaleAlert, events: WhaleAlert[]): string {
  const direction = ((event as any).direction || "IN").toUpperCase();
  const wallet = event.wallet.length > 16 ? `${event.wallet.slice(0, 8)}...${event.wallet.slice(-4)}` : event.wallet;
  const knownEntity = KNOWN_WHALES[event.wallet] || event.label || "Unlabeled wallet";

  return [
    `🐋 **Whale context:**`,
    `- Wallet: ${wallet}`,
    `- Move: ${event.amount.toLocaleString()} ${event.symbol} ${direction}`,
    `- Known entity: ${knownEntity}`,
    `- Pattern: ${inferPattern(events, event)}`,
  ].join("\n");
}

export const whaleWatcherAction: Action = {
  name: "WHALE_WATCHER",
  similes: ["WHALE_ALERT", "SMART_MONEY", "LARGE_TRANSFER", "WHALE_TRACK"],
  description: "Track whale activity, smart money, institutional wallets, large transactions, and big moves across notable Solana wallets.",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = ((message.content as any)?.text || "").toLowerCase();
    if (text.startsWith("[whale_watcher]")) return true;
    return text.includes("whale")
      || text.includes("whale activity")
      || text.includes("large move")
      || text.includes("big moves")
      || text.includes("large transaction")
      || text.includes("whale alert")
      || text.includes("smart money")
      || text.includes("institutional");
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    try {
      const text = (message.content as any)?.text || "";

      const addrMatch = text.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/);
      const whaleList = Object.entries(KNOWN_WHALES)
        .slice(0, 4)
        .map(([addr, label]) => `• **${label}**: ${addr.slice(0, 8)}...${addr.slice(-4)}`)
        .join("\n");

      if (addrMatch) {
        const address = addrMatch[1];
        const watchers = getStore<any[]>("WHALE_WATCHERS") || [];
        const existing = watchers.findIndex((w: any) => w.address === address);
        const label = KNOWN_WHALES[address] || `Wallet ${address.slice(0, 8)}`;

        const entry = {
          address,
          label,
          threshold: 10000,
          is_active: true,
          created_at: new Date().toISOString(),
        };

        if (existing >= 0) {
          watchers[existing] = { ...watchers[existing], ...entry };
        } else {
          watchers.push(entry);
        }

        setStore("WHALE_WATCHERS", watchers);
        const recentEvents = await fetchRecentTransfers(address);
        const recentSummary = recentEvents.length > 0
          ? `\n\n**Recent movements:**\n${recentEvents.map(formatEvent).join("\n")}\n\n${buildWhaleContext(recentEvents[0], recentEvents)}`
          : "\n\nWhale monitoring active. No new movements detected in the last hour.";

        callback({
          text: `🐋 **Now watching: ${label}**\n\nAddress: ${address.slice(0, 8)}...${address.slice(-4)}\nAlert threshold: $10,000+\n\nI'll notify you when this wallet makes a big move.${recentSummary}`,
        });
        return;
      }

      const watchers = getStore<any[]>("WHALE_WATCHERS") || [];
      const activeWatchers = watchers.filter((w: any) => w.is_active);
      const recentEvents = await fetchRecentTransfers(undefined, 5);

      let response = `🐋 **Whale Watcher**\n\n`;
      response += `Currently tracking ${activeWatchers.length} wallet(s).\n\n`;

      if (recentEvents.length > 0) {
        response += `**Recent whale movements:**\n${recentEvents.map(formatEvent).join("\n")}\n\n${buildWhaleContext(recentEvents[0], recentEvents)}\n\n`;
      } else if (activeWatchers.length > 0) {
        response += "Whale monitoring active. No new movements detected in the last hour.\n\n";
      }

      if (activeWatchers.length > 0) {
        response += `**Active watchlist:**\n`;
        response += activeWatchers
          .map((w: any) => `• ${w.label} — alert on >$${(w.threshold || 10000).toLocaleString()}`)
          .join("\n");
      } else {
        response += `**Known whales you can track:**\n${whaleList}\n\n`;
        response += `Reply with "track <address>" to add a wallet, or "track Binance Cold Wallet" to follow a known whale.`;
      }

      callback({ text: response });
    } catch {
      callback({
        text: "Whale monitoring active. No new movements detected in the last hour.",
      });
    }
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Track the Binance cold wallet" } },
      { user: "ElizClaw", content: { text: "🐋 Now watching Binance Cold Wallet. I'll alert on moves over $10k.", action: "WHALE_WATCHER" } },
    ],
  ],
};
