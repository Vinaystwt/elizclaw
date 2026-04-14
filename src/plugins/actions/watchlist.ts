import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore, setStore } from "../store.ts";
import { httpGet } from "../utils/http.ts";

export interface WatchlistItem {
  coin: string;
  symbol: string;
  addedAt: string;
  currentPrice: number;
  priceAtAdd: number;
  change24h: number;
}

export const coinMap: Record<string, { id: string; symbol: string; coin: string }> = {
  btc: { id: "bitcoin", symbol: "BTC", coin: "Bitcoin" },
  bitcoin: { id: "bitcoin", symbol: "BTC", coin: "Bitcoin" },
  eth: { id: "ethereum", symbol: "ETH", coin: "Ethereum" },
  ethereum: { id: "ethereum", symbol: "ETH", coin: "Ethereum" },
  sol: { id: "solana", symbol: "SOL", coin: "Solana" },
  solana: { id: "solana", symbol: "SOL", coin: "Solana" },
  bnb: { id: "binancecoin", symbol: "BNB", coin: "BNB" },
  xrp: { id: "ripple", symbol: "XRP", coin: "XRP" },
  ada: { id: "cardano", symbol: "ADA", coin: "Cardano" },
  avax: { id: "avalanche-2", symbol: "AVAX", coin: "Avalanche" },
};

export async function fetchCoinQuote(input: string) {
  const key = input.toLowerCase();
  const resolved = coinMap[key];
  if (!resolved) return null;

  const result = await httpGet(`https://api.coingecko.com/api/v3/simple/price?ids=${resolved.id}&vs_currencies=usd&include_24hr_change=true`);
  if (!result.ok || !result.data) return null;
  const data = (result.data as any)[resolved.id];
  if (!data?.usd) return null;

  return {
    ...resolved,
    currentPrice: data.usd,
    change24h: Number((data.usd_24h_change || 0).toFixed(2)),
  };
}

export function findRequestedCoin(text: string) {
  return Object.keys(coinMap).find((coin) => new RegExp(`\\b${coin}\\b`, "i").test(text));
}

export const watchlistAction: Action = {
  name: "WATCHLIST",
  similes: ["COIN_WATCHLIST", "WATCH_COIN", "REMOVE_WATCHLIST_ITEM"],
  description: "Add coins to a watchlist, remove coins, inspect my coins, manage a portfolio watch, and review coins I am watching.",
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = ((message.content as any)?.text || "").toLowerCase();
    return text.includes("watchlist")
      || text.includes("watch list")
      || text.includes("my coins")
      || text.includes("check my watch")
      || text.includes("coins i'm watching")
      || text.includes("coins im watching")
      || text.includes("portfolio watch")
      || text.includes("add coin")
      || text.includes("remove coin");
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = ((message.content as any)?.text || "");
    const lower = text.toLowerCase();
    const current = getStore<WatchlistItem[]>("WATCHLIST") || [];

    if (/remove from watchlist|remove .*watchlist/i.test(lower)) {
      const requested = findRequestedCoin(lower);
      if (!requested) {
        callback({ text: "Tell me which coin to remove from your watchlist." });
        return;
      }

      const symbol = coinMap[requested].symbol;
      const nextList = current.filter((item) => item.symbol !== symbol);
      setStore("WATCHLIST", nextList);
      callback({ text: `Removed ${symbol} from your watchlist.` });
      return;
    }

    if (/add to watchlist|watch coin/i.test(lower)) {
      const requested = findRequestedCoin(lower);
      if (!requested) {
        callback({ text: "Tell me which coin to add. I currently support BTC, ETH, SOL, BNB, XRP, ADA, and AVAX." });
        return;
      }

      const quote = await fetchCoinQuote(requested);
      if (!quote) {
        callback({ text: "I couldn't fetch that coin right now. Try again in a minute." });
        return;
      }

      const existingIndex = current.findIndex((item) => item.symbol === quote.symbol);
      const entry: WatchlistItem = {
        coin: quote.coin,
        symbol: quote.symbol,
        addedAt: existingIndex >= 0 ? current[existingIndex].addedAt : new Date().toISOString(),
        currentPrice: quote.currentPrice,
        priceAtAdd: existingIndex >= 0 ? current[existingIndex].priceAtAdd : quote.currentPrice,
        change24h: quote.change24h,
      };

      const nextList = [...current];
      if (existingIndex >= 0) {
        nextList[existingIndex] = entry;
      } else {
        nextList.push(entry);
      }
      setStore("WATCHLIST", nextList);

      callback({
        text: `Added ${quote.symbol} to your watchlist.\nCurrent price: $${quote.currentPrice.toLocaleString()}\n24h change: ${quote.change24h >= 0 ? "+" : ""}${quote.change24h}%`,
        data: entry,
      });
      return;
    }

    if (current.length === 0) {
      callback({ text: "Your watchlist is empty. Add a coin with 'add BTC to watchlist'." });
      return;
    }

    const lines = current.map((item) => {
      const sinceAdd = item.priceAtAdd > 0
        ? (((item.currentPrice - item.priceAtAdd) / item.priceAtAdd) * 100).toFixed(2)
        : "0.00";
      return `• ${item.symbol} — $${item.currentPrice.toLocaleString()} (${Number(sinceAdd) >= 0 ? "+" : ""}${sinceAdd}% since added, ${item.change24h >= 0 ? "+" : ""}${item.change24h}% 24h)`;
    });

    callback({ text: `👀 **Your Watchlist**\n\n${lines.join("\n")}`, data: current });
  },
};
