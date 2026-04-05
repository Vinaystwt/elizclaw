import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { httpGet } from "../utils/http.ts";

/**
 * Real-time price check with 24h change and optional threshold alerts.
 * Uses CoinGecko free API with retry and timeout handling.
 */
export const monitorPriceAction: Action = {
  name: "MONITOR_PRICE",
  similes: ["CHECK_PRICE", "PRICE_ALERT", "TRACK_PRICE"],
  description: "Fetch current crypto price with optional threshold alerting",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();
    return /(price|monitor|track|watch|check.*(btc|eth|sol|crypto|coin))/i.test(lower)
      && /(btc|bitcoin|eth|ethereum|sol|solana|doge|ada|avax|matic|bnb|xrp)/i.test(lower);
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const coinMatch = text.match(/(btc|bitcoin|eth|ethereum|sol|solana|doge|dogecoin|ada|avax|matic|bnb|xrp)/i);
    const priceMatch = text.match(/\$?([\d,]+\.?\d*)\s*(k|m|b)?/i);

    if (!coinMatch) {
      callback({ text: "Which coin? I support BTC, ETH, SOL, DOGE, ADA, AVAX, MATIC, BNB, XRP." });
      return;
    }

    // Map common names to CoinGecko IDs
    const coinMap: Record<string, string> = {
      btc: "bitcoin", bitcoin: "bitcoin", eth: "ethereum", ethereum: "ethereum",
      sol: "solana", solana: "solana", doge: "dogecoin", dogecoin: "dogecoin",
      ada: "cardano", avax: "avalanche-2", matic: "matic-network",
      bnb: "binancecoin", xrp: "ripple",
    };

    const coinId = coinMap[coinMatch[1].toLowerCase()] || coinMatch[1].toLowerCase();
    const symbol = coinMatch[1].toUpperCase().substring(0, 4);

    const result = await httpGet(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!result.ok || !result.data) {
      callback({ text: `⚠️ Could not fetch ${symbol} price. Service may be rate-limited. Try again in a minute.` });
      return;
    }

    const coinData = (result.data as any)[coinId];
    if (!coinData || !coinData.usd) {
      callback({ text: `⚠️ No price data available for ${symbol}. The symbol may not be supported.` });
      return;
    }

    const price = coinData.usd;
    const change = coinData.usd_24h_change?.toFixed(2) ?? "N/A";
    let msg = `📊 **${symbol}/USD: $${price.toLocaleString()}**\n24h: ${parseFloat(change) >= 0 ? "🟢" : "🔴"} ${change}%`;

    // Threshold check
    if (priceMatch) {
      let threshold = parseFloat(priceMatch[1].replace(/,/g, ""));
      if (priceMatch[2]) threshold *= { k: 1000, m: 1000000, b: 1000000000 }[priceMatch[2].toLowerCase()];

      if (price > threshold) {
        msg += `\n\n🔔 **Above your $${threshold.toLocaleString()} threshold!**`;
        // Append market context from CoinGecko trending
        const marketContext = await getMarketContext();
        if (marketContext) msg += `\n${marketContext}`;
      } else {
        msg += `\n(Below $${threshold.toLocaleString()} — no alert triggered)`;
      }
    }

    msg += "\n\nWant me to monitor this on a schedule?";
    callback({ text: msg });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "What's BTC price?" } },
      { user: "ElizClaw", content: { text: "Checking...", action: "MONITOR_PRICE" } },
    ],
  ],
};

/**
 * Fetch lightweight market context for narrative alerts.
 * Uses Promise.race with 3s timeout so it never blocks the price response.
 * Returns a 1-sentence market context or null if unavailable.
 */
async function getMarketContext(): Promise<string | null> {
  try {
    const timeout = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 3000)
    );

    const fetchCtx = httpGet(
      "https://api.coingecko.com/api/v3/search/trending"
    );

    const result = await Promise.race([fetchCtx, timeout]);
    if (!result.ok || !result.data) return null;

    const trending = (result.data as any)?.coins || [];
    if (trending.length > 0) {
      const top = trending[0]?.item;
      if (top?.name) {
        return `\nMarket context: ${top.name} is currently trending #1 on CoinGecko.`;
      }
    }
    return null;
  } catch {
    return null; // Silent failure — alert still fires without context
  }
}
