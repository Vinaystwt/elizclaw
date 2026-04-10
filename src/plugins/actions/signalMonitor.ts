import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore } from "../store.ts";
import { httpGet } from "../utils/http.ts";

interface MarketOverview {
  totalMarket: string;
  btcDominance: string;
  marketCapChange24h: number;
}

interface SignalSnapshot {
  timestamp: string;
  trendingCoins: string[];
  trendingRepos: string[];
  marketOverview: MarketOverview;
  whaleSummary: {
    positive: number;
    negative: number;
    recentCoins: string[];
    recentEvents: any[];
  };
  momentum: "Bullish" | "Neutral" | "Bearish";
  developerTrend: "rising developer activity" | "steady developer activity" | "falling developer activity";
  overallRead: string;
}

/**
 * Fetch CoinGecko trending coins.
 */
export async function fetchTrendingCoins(): Promise<string[]> {
  const result = await httpGet("https://api.coingecko.com/api/v3/search/trending");
  if (result.ok && result.data) {
    const coins = (result.data as any).coins || [];
    return coins.slice(0, 5).map((c: any) => c.item?.name || c.item?.symbol || "").filter(Boolean);
  }
  return [];
}

/**
 * Fetch GitHub trending repos (crypto/blockchain related).
 */
export async function fetchTrendingRepos(): Promise<string[]> {
  const result = await httpGet("https://api.github.com/search/repositories?q=solana+blockchain&sort=stars&order=desc&per_page=5");
  if (result.ok && result.data) {
    const items = (result.data as any).items || [];
    return items.slice(0, 5).map((r: any) => r.full_name).filter(Boolean);
  }
  return [];
}

/**
 * Fetch market overview from CoinGecko.
 */
export async function fetchMarketOverview(): Promise<MarketOverview> {
  const result = await httpGet("https://api.coingecko.com/api/v3/global");
  if (result.ok && result.data) {
    const data = (result.data as any).data;
    return {
      totalMarket: `$${((data?.total_market_cap?.usd || 0) / 1e12).toFixed(2)}T`,
      btcDominance: `${(data?.market_cap_percentage?.btc || 0).toFixed(1)}%`,
      marketCapChange24h: Number((data?.market_cap_change_percentage_24h_usd || 0).toFixed(2)),
    };
  }
  return { totalMarket: "N/A", btcDominance: "N/A", marketCapChange24h: 0 };
}

function readWhaleSummary() {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const storedEvents = getStore<any[]>("WHALE_EVENTS") || [];
  const logEvents = (getStore<any[]>("LOGS") || [])
    .filter((entry: any) => entry.type === "whale_watcher" || entry.task_type === "whale_watcher")
    .map((entry: any) => ({
      symbol: extractCoin(entry.output || ""),
      direction: extractDirection(entry.output || ""),
      timestamp: entry.executed_at || entry.timestamp || new Date().toISOString(),
      label: entry.label || entry.task_name || "Whale Watcher",
    }));

  const recentEvents = [...storedEvents, ...logEvents].filter((event: any) => {
    const ts = new Date(event.timestamp || event.executed_at || 0).getTime();
    return Number.isFinite(ts) && ts >= sevenDaysAgo;
  });

  const positive = recentEvents.filter((event: any) => extractDirection(event.direction || event.output || "") === "IN").length;
  const negative = recentEvents.filter((event: any) => extractDirection(event.direction || event.output || "") === "OUT").length;
  const recentCoins = Array.from(new Set(recentEvents.map((event: any) => extractCoin(event.symbol || event.output || "")).filter(Boolean)));

  return { positive, negative, recentCoins, recentEvents };
}

function extractCoin(text: string): string {
  const match = text.match(/\b(BTC|ETH|SOL|DOGE|ADA|AVAX|BNB|XRP|USDC|USDT)\b/i);
  return match ? match[1].toUpperCase() : "";
}

function extractDirection(text: string): "IN" | "OUT" {
  return /out|sell|distribution|sent/i.test(text) ? "OUT" : "IN";
}

function buildOverallRead(
  marketCapChange24h: number,
  trendingCoins: string[],
  trendingRepos: string[],
  whaleSummary: { positive: number; negative: number; recentCoins: string[] },
) {
  let positiveSignals = 0;
  let negativeSignals = 0;

  if (marketCapChange24h > 1) positiveSignals += 1;
  if (marketCapChange24h < -1) negativeSignals += 1;
  if (trendingCoins.length >= 3) positiveSignals += 1;
  if (trendingCoins.length <= 1) negativeSignals += 1;
  if (trendingRepos.length >= 2) positiveSignals += 1;
  if (trendingRepos.length === 0) negativeSignals += 1;
  if (whaleSummary.positive > whaleSummary.negative) positiveSignals += 1;
  if (whaleSummary.negative > whaleSummary.positive) negativeSignals += 1;

  const momentum = positiveSignals >= 2 ? "Bullish" : negativeSignals >= 2 ? "Bearish" : "Neutral";
  const developerTrend = trendingRepos.length >= 3
    ? "rising developer activity"
    : trendingRepos.length === 0
    ? "falling developer activity"
    : "steady developer activity";

  let overallRead = "Signals are mixed, so the market looks balanced rather than decisively trending in one direction.";
  if (momentum === "Bullish") {
    overallRead = `Momentum is constructive: price breadth is improving, builders are active, and ${whaleSummary.positive > 0 ? "whale flows lean toward accumulation." : "risk appetite looks healthy."}`;
  } else if (momentum === "Bearish") {
    overallRead = `Risk is elevated: market breadth is soft, ${developerTrend === "falling developer activity" ? "builder interest is cooling, " : ""}and whale flows skew toward distribution.`;
  }

  return { momentum, developerTrend, overallRead };
}

export async function getSignalSnapshot(): Promise<SignalSnapshot> {
  const [trendingCoins, trendingRepos, marketOverview] = await Promise.all([
    fetchTrendingCoins(),
    fetchTrendingRepos(),
    fetchMarketOverview(),
  ]);

  const whaleSummary = readWhaleSummary();
  const synthesis = buildOverallRead(
    marketOverview.marketCapChange24h,
    trendingCoins,
    trendingRepos,
    whaleSummary,
  );

  return {
    timestamp: new Date().toISOString(),
    trendingCoins,
    trendingRepos,
    marketOverview,
    whaleSummary,
    momentum: synthesis.momentum,
    developerTrend: synthesis.developerTrend,
    overallRead: synthesis.overallRead,
  };
}

export function formatSignalBrief(snapshot: SignalSnapshot): string {
  const time = new Date(snapshot.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const topCoins = snapshot.trendingCoins.slice(0, 3);
  const topRepos = snapshot.trendingRepos.slice(0, 2);

  return [
    `📊 **Market Signal Brief — ${time}**`,
    ``,
    `**MOMENTUM: ${snapshot.momentum}**`,
    `- Top trending: ${topCoins.length > 0 ? topCoins.join(", ") : "No clear leaders"}`,
    `- 24h market cap change: ${snapshot.marketOverview.marketCapChange24h >= 0 ? "+" : ""}${snapshot.marketOverview.marketCapChange24h}%`,
    `- BTC dominance: ${snapshot.marketOverview.btcDominance}`,
    ``,
    `**BUILDER ACTIVITY:**`,
    `- Top crypto repos today: ${topRepos.length > 0 ? topRepos.join(", ") : "No standout repos"}`,
    `- Trend: ${snapshot.developerTrend}`,
    ``,
    `**OVERALL READ:** ${snapshot.overallRead}`,
  ].join("\n");
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

  handler: async (_runtime: IAgentRuntime, _message: Memory, _state: State, _options: any, callback: any) => {
    const snapshot = await getSignalSnapshot();
    callback({
      text: `${formatSignalBrief(snapshot)}\n\nWant me to monitor these on a schedule?`,
      data: snapshot,
    });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "What's happening in the crypto market?" } },
      { user: "ElizClaw", content: { text: "Checking market signals...", action: "SIGNAL_MONITOR" } },
    ],
  ],
};
