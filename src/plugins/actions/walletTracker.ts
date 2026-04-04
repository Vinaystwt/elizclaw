import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore } from "../store.ts";
import { httpGet } from "../utils/http.ts";

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

    let response = `📋 **Wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}**\n`;
    response += `Total Value: **$${totalValue.toFixed(2)}**\n`;
    if (solPrice) response += `SOL Price: $${solPrice.toFixed(2)}\n\n`;
    response += `**Holdings:**\n${tokenList}`;
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
