import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore } from "../store.ts";
import { httpGet } from "../utils/http.ts";
import fs from "fs";
import path from "path";

// Log startup warning about Helius API key
if (!process.env.HELIUS_API_KEY) {
  console.warn(
    "[walletTracker] No HELIUS_API_KEY set — wallet tracking using Jupiter fallback. " +
    "Set HELIUS_API_KEY for full portfolio data."
  );
}

/**
 * Wallet portfolio tracker — connects a Solana wallet and monitors its health.
 * Fetches token balances, portfolio value, and alerts on significant changes.
 * Uses public APIs (Helius, Jupiter) for on-chain data.
 */

interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  usdValue: number;
  decimals: number;
}

/**
 * Fetch token balances for a Solana wallet via Helius public API.
 * Falls back to a mock response if the API is unavailable.
 */
async function fetchWalletBalances(walletAddress: string, apiKey?: string): Promise<TokenBalance[]> {
  // Try Helius API first
  if (apiKey) {
    try {
      const result = await httpGet(
        `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getTokenAccounts",
            params: {
              owner: walletAddress,
              options: { showZeroBalance: true },
            },
          }),
        }
      );

      if (result.ok && result.data?.result) {
        return (result.data.result as any[]).map((t: any) => ({
          mint: t.mint,
          symbol: t.symbol || t.mint.slice(0, 6),
          amount: t.amount ? parseFloat(t.amount) / Math.pow(10, t.decimals || 0) : 0,
          usdValue: t.price || 0,
          decimals: t.decimals || 0,
        }));
      }
    } catch {
      elizaLogger.warn("Helius API unavailable, trying Jupiter fallback");
    }
  }

  // Fallback: use Jupiter price API for basic token check
  const tokens = ["So11111111111111111111111111111111111111112"]; // SOL
  const priceResult = await httpGet(
    `https://api.jup.ag/price/v2?ids=${tokens.join(",")}`
  );

  if (priceResult.ok) {
    const solPrice = (priceResult.data as any)?.data?.So11111111111111111111111111111111111111112?.price;
    return [{
      mint: tokens[0],
      symbol: "SOL",
      amount: 0, // Would need wallet scan to get actual balance
      usdValue: solPrice ? parseFloat(solPrice) : 0,
      decimals: 9,
    }];
  }

  return [];
}

/**
 * Fetch Solana price for portfolio valuation.
 */
async function getSolPrice(): Promise<number> {
  const result = await httpGet(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
  );
  if (result.ok && result.data) {
    return (result.data as any).solana?.usd ?? 0;
  }
  return 0;
}

/**
 * Cross-reference wallet holdings with whale watch data from store.json.
 * If the user holds coins that whales are actively moving, provide context.
 */
function getSmartMoneyContext(balances: TokenBalance[]): string | null {
  try {
    const dataDir = process.env.DATA_DIR || path.join(__dirname, "../../data");
    const storePath = path.join(dataDir, "store.json");

    if (!fs.existsSync(storePath)) return null;
    const raw = JSON.parse(fs.readFileSync(storePath, "utf8"));
    const logs = (raw.LOGS || []);

    // Find recent whale watcher events
    const whaleLogs = logs.filter((l: any) => l.task_type === "whale_watcher");
    if (!whaleLogs.length) return null;

    // Extract coins mentioned in whale activity
    const whaleCoins = new Set<string>();
    whaleLogs.forEach((l: any) => {
      const coin = (l.output || "").match(/\b(BTC|ETH|SOL|DOGE|ADA|AVAX|BNB|XRP)\b/i);
      if (coin) whaleCoins.add(coin[1].toUpperCase());
    });

    // Find overlap with user's holdings
    const overlap = balances.filter(b => whaleCoins.has(b.symbol.toUpperCase()));
    if (!overlap.length) return null;

    const coinNames = overlap.map(b => b.symbol).join(", ");
    return `Whale activity detected for ${coinNames} in your portfolio. Recent large transfers suggest smart money is positioning in these assets — consider monitoring closely.`;
  } catch {
    return null;
  }
}

/**
 * Generate a narrative interpretation of a wallet's portfolio.
 * Analyzes concentration, diversification, and risk profile from balance data.
 */
function generateWalletNarrative(balances: TokenBalance[], totalValue: number, solPrice: number): string {
  if (!balances.length) return "No priced tokens to analyze.";

  const priced = balances.filter(b => b.usdValue > 0);
  if (!priced.length) return "Holdings detected but no price data available. Most tokens may be illiquid or unlisted.";

  // Calculate concentration — what % is the largest holding?
  const sorted = [...priced].sort((a, b) => b.usdValue - a.usdValue);
  const topPct = (sorted[0].usdValue / totalValue * 100).toFixed(0);
  const topSymbol = sorted[0].symbol;

  // Count unique tokens
  const uniqueCount = priced.length;

  // Determine risk profile
  let riskDesc = "";
  if (Number(topPct) > 70) {
    riskDesc = `highly concentrated — ${topPct}% in ${topSymbol}`;
  } else if (Number(topPct) > 50) {
    riskDesc = `moderately concentrated — ${topPct}% in ${topSymbol} with ${uniqueCount - 1} other token${uniqueCount > 2 ? 's' : ''}`;
  } else if (uniqueCount > 5) {
    riskDesc = `well-diversified across ${uniqueCount} tokens, top holding ${topSymbol} at ${topPct}%`;
  } else {
    riskDesc = `balanced — ${uniqueCount} tokens with ${topSymbol} leading at ${topPct}%`;
  }

  // Check for stablecoin presence
  const stablecoins = priced.filter(b => /^(USDC|USDT|DAI|BUSD|PYUSD)$/i.test(b.symbol));
  const stablePct = totalValue > 0 ? (stablecoins.reduce((s, b) => s + b.usdValue, 0) / totalValue * 100).toFixed(0) : "0";

  // Second sentence: diversification insight
  let secondSentence = "";
  if (Number(stablePct) < 5 && uniqueCount <= 3) {
    secondSentence = `No stablecoin buffer and only ${uniqueCount} position${uniqueCount > 1 ? 's' : ''} — this wallet is taking directional risk.`;
  } else if (Number(stablePct) > 30) {
    secondSentence = `Holding ${stablePct}% in stablecoins suggests a defensive posture or dry powder for an upcoming move.`;
  } else {
    secondSentence = `Portfolio shows ${uniqueCount} active position${uniqueCount > 1 ? 's' : ''} with ${Number(stablePct) > 0 ? `${stablePct}% stablecoin allocation` : 'no stablecoin hedge'}.`;
  }

  return `This wallet is ${riskDesc}. ${secondSentence}`;
}

export const walletTrackerAction: Action = {
  name: "WALLET_TRACKER",
  similes: ["CHECK_WALLET", "PORTFOLIO", "TRACK_WALLET", "BALANCE_CHECK"],
  description: "Track a Solana wallet portfolio with balance and value alerts",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();
    // Match Solana addresses (base58, 32-44 chars)
    const hasAddress = /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(text);
    return (/(wallet|portfolio|balance|track|check).*(sol|solana)/i.test(lower) || hasAddress)
      && /(check|track|monitor|what.*have|portfolio)/i.test(lower);
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";

    // Extract wallet address
    const addrMatch = text.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/);
    const walletAddress = addrMatch ? addrMatch[1] : null;

    if (!walletAddress) {
      callback({
        text: "Need a Solana wallet address to track. Paste the address or say 'track my wallet: <address>'.",
      });
      return;
    }

    // Get current price reference
    const solPrice = await getSolPrice();

    // Fetch wallet balances
    const apiKey = process.env.HELIUS_API_KEY || "";
    const balances = await fetchWalletBalances(walletAddress, apiKey);

    if (!balances.length) {
      callback({
        text: `📋 **Wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}**\n\nNo tokens found (or API unavailable). Want me to monitor this wallet for incoming transfers instead?`,
      });
      return;
    }

    const totalValue = balances.reduce((sum, t) => sum + t.usdValue, 0);
    const tokenList = balances
      .filter(t => t.usdValue > 0)
      .map(t => `• ${t.symbol}: ${t.amount.toFixed(4)} ($${t.usdValue.toFixed(2)})`)
      .join("\n") || "• No priced tokens";

    // Store wallet for recurring monitoring
    const wallets = getStore<any[]>("WALLETS") || [];
    const existing = wallets.findIndex((w: any) => w.address === walletAddress);
    const walletEntry = {
      address: walletAddress,
      name: `Wallet ${walletAddress.slice(0, 8)}`,
      last_value: totalValue,
      created_at: new Date().toISOString(),
      is_active: true,
    };

    if (existing >= 0) {
      wallets[existing] = { ...wallets[existing], ...walletEntry };
    } else {
      wallets.push(walletEntry);
    }
    setStore("WALLETS", wallets);

    // ── Generate wallet narrative ──
    const narrative = generateWalletNarrative(balances, totalValue, solPrice);

    // ── Smart Money context ──
    const smartMoneyContext = getSmartMoneyContext(balances);

    let response = `📋 **Wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}**\n`;
    response += `Total Value: **$${totalValue.toFixed(2)}**\n`;
    if (solPrice) response += `SOL Price: $${solPrice.toFixed(2)}\n\n`;
    response += `**Holdings:**\n${tokenList}`;
    response += `\n\n💡 **Analyst Reading:**\n${narrative}`;
    if (smartMoneyContext) {
      response += `\n\n🐋 **Smart Money:**\n${smartMoneyContext}`;
    }
    response += `\n\nWant me to set up alerts for this wallet? I can notify you on big moves.`;

    callback({ text: response });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Check my wallet balance 7xKq...pR3m" } },
      { user: "ElizClaw", content: { text: "Checking wallet...", action: "WALLET_TRACKER" } },
    ],
  ],
};
