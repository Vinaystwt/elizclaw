import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";

export const monitorPriceAction: Action = {
  name: "MONITOR_PRICE",
  similes: ["CHECK_PRICE", "PRICE_ALERT", "TRACK_PRICE"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();
    return /(price|monitor|track|watch|check.*(btc|eth|sol|crypto|coin))/i.test(lower)
      && /(btc|bitcoin|eth|ethereum|sol|solana|doge|ada|avax|matic|bnb|xrp)/i.test(lower);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();
    const coinMatch = text.match(/(btc|bitcoin|eth|ethereum|sol|solana|doge|dogecoin|ada|avax|matic|bnb|xrp)/i);
    const priceMatch = text.match(/\$?([\d,]+\.?\d*)\s*(k|m|b)?/i);

    if (!coinMatch) { callback({ text: "Which coin? I support BTC, ETH, SOL, DOGE, ADA, AVAX, MATIC, BNB, XRP." }); return; }

    const coinMap: Record<string, string> = {
      btc: "bitcoin", bitcoin: "bitcoin", eth: "ethereum", ethereum: "ethereum",
      sol: "solana", solana: "solana", doge: "dogecoin", dogecoin: "dogecoin",
      ada: "cardano", avax: "avalanche-2", matic: "matic-network",
      bnb: "binancecoin", xrp: "ripple",
    };

    const coinId = coinMap[coinMatch[1].toLowerCase()] || coinMatch[1].toLowerCase();
    const symbol = coinMatch[1].toUpperCase().substring(0, 4);

    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
      const data: any = await res.json();
      const coinData = data[coinId];

      if (!coinData) { callback({ text: `Could not find price for ${symbol}.` }); return; }

      const price = coinData.usd;
      const change = coinData.usd_24h_change?.toFixed(2) || "N/A";
      let msg = `📊 **${symbol}/USD: $${price.toLocaleString()}**\n24h: ${parseFloat(change) >= 0 ? "🟢" : "🔴"} ${change}%`;

      if (priceMatch) {
        let threshold = parseFloat(priceMatch[1].replace(",", ""));
        if (priceMatch[2]) threshold *= { k: 1000, m: 1000000, b: 1000000000 }[priceMatch[2].toLowerCase()];

        if (price > threshold) {
          msg += `\n\n🔔 **Above your $${threshold.toLocaleString()} threshold!**`;
        } else {
          msg += `\n(Below $${threshold.toLocaleString()} — no alert)`;
        }
      }

      msg += "\n\nWant me to monitor this on a schedule?";
      callback({ text: msg });
    } catch (e: any) {
      callback({ text: `⚠️ Price check failed: ${e.message}` });
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "What's BTC price?" } },
      { user: "ElizClaw", content: { text: "Checking...", action: "MONITOR_PRICE" } },
    ],
  ],
};
