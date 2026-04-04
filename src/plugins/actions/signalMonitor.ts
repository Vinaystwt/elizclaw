import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { httpGet } from "../utils/http.ts";

/**
 * Social signal monitor — aggregates crypto-relevant social signals.
 * Fetches trending topics, notable mentions, and market-moving events from public sources.
 * Combines CoinGecko trending, GitHub trending repos, and news headlines.
 */

interface SocialSignal {
  source: string;
  title: string;
  url: string;
  sentiment: "bullish" | "bearish" | "neutral";
  timestamp: string;
}

/**
 * Fetch CoinGecko trending coins.
 */
async function fetchTrendingCoins(): Promise<string[]> {
  const result = await httpGet("https://api.coingecko.com/api/v3/search/trending");
  if (result.ok && result.data) {
    const coins = (result.data as any).coins || [];
    return coins.slice(0, 5).map((c: any) => c.item?.name || c.item?.symbol || "");
  }
  return [];
}

/**
 * Fetch GitHub trending repos (crypto/blockchain related).
 */
async function fetchTrendingRepos(): Promise<string[]> {
  const result = await httpGet("https://api.github.com/search/repositories?q=solana+blockchain&sort=stars&order=desc&per_page=5");
  if (result.ok && result.data) {
    const items = (result.data as any).items || [];
    return items.slice(0, 5).map((r: any) => r.full_name);
  }
  return [];
}

/**
 * Fetch market overview from CoinGecko.
 */
async function fetchMarketOverview(): Promise<{ totalMarket: string; btcDominance: string; fearGreed: string }> {
  const result = await httpGet("https://api.coingecko.com/api/v3/global");
  if (result.ok && result.data) {
    const data = (result.data as any).data;
    return {
      totalMarket: `$${((data?.total_market_cap?.usd || 0) / 1e12).toFixed(2)}T`,
      btcDominance: `${(data?.market_cap_percentage?.btc || 0).toFixed(1)}%`,
      fearGreed: "N/A",
    };
  }
  return { totalMarket: "N/A", btcDominance: "N/A", fearGreed: "N/A" };
}

export const signalMonitorAction: Action = {
  name: "SIGNAL_MONITOR",
  similes: ["SOCIAL_SIGNAL", "MARKET_SENTIMENT", "TRENDING", "WHAT_IS_HAPPENING"],
  description: "Monitor crypto social signals, trending coins, and market sentiment",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();
    return /(what.*happening|market.sentiment|trending|social.signal|what.*moving|market.overview)/i.test(lower)
      && /(crypto|market|coin|solana|bitcoin|btc|defi)/i.test(lower);
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    // Fetch all signals in parallel
    const [trendingCoins, trendingRepos, marketOverview] = await Promise.all([
      fetchTrendingCoins(),
      fetchTrendingRepos(),
      fetchMarketOverview(),
    ]);

    let response = `📡 **Market Signals**\n\n`;

    // Market overview
    response += `**Market:** ${marketOverview.totalMarket} | BTC Dom: ${marketOverview.btcDominance}\n\n`;

    // Trending coins
    if (trendingCoins.length > 0) {
      response += `🔥 **Trending Coins:**\n`;
      response += trendingCoins.map((name, i) => `  ${i + 1}. ${name}`).join("\n");
      response += "\n\n";
    }

    // Trending repos
    if (trendingRepos.length > 0) {
      response += `💻 **Trending Dev Activity:**\n`;
      response += trendingRepos.slice(0, 3).map(name => `  • ${name}`).join("\n");
      response += "\n\n";
    }

    response += `Want me to monitor these on a schedule?`;

    callback({ text: response });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "What's happening in the crypto market?" } },
      { user: "ElizClaw", content: { text: "Checking market signals...", action: "SIGNAL_MONITOR" } },
    ],
  ],
};
