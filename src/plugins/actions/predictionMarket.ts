import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore, appendToArray } from "../store.ts";
import { httpGet } from "../utils/http.ts";

/**
 * Place a simulated bet on crypto price outcomes.
 * Parses natural language for amount, prediction, timeframe, and coin.
 * Odds are randomly generated (in production, fetch from a prediction market API).
 */
export const predictionMarketAction: Action = {
  name: "PREDICTION_MARKET",
  similes: ["PLACE_BET", "BET", "PREDICT", "PREDICTION_BET"],
  description: "Place a bet on crypto price outcomes with simulated odds",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /(bet|place.*bet|prediction|predict|wager)/i.test(text)
      && /(\$?\d+|btc|eth|price|market)/i.test(text);
  },

  handler: async (runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();

    // Extract bet amount
    const amountMatch = text.match(/\$?(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[1], 10) : 10;
    if (isNaN(amount) || amount < 1) {
      callback({ text: "Invalid bet amount. Please specify a positive number like '$10'." });
      return;
    }

    // Extract prediction details
    let prediction = "General market prediction";
    if (/btc.*(\d+)/i.test(lower)) {
      const priceMatch = text.match(/\$?([\d,]+)/);
      if (priceMatch) prediction = `BTC > $${parseInt(priceMatch[1], 10).toLocaleString()}`;
    } else if (/eth.*(\d+)/i.test(lower)) {
      const priceMatch = text.match(/\$?([\d,]+)/);
      if (priceMatch) prediction = `ETH > $${parseInt(priceMatch[1], 10).toLocaleString()}`;
    }

    // Extract timeframe
    let timeframe = "by end of week";
    if (/friday|end of week/i.test(lower)) timeframe = "by Friday";
    else if (/tomorrow|next 24/i.test(lower)) timeframe = "by tomorrow";
    else if (/month/i.test(lower)) timeframe = "by end of month";

    // Extract coin
    let coin = "BTC";
    if (/eth|ethereum/i.test(lower)) coin = "ETH";
    else if (/sol|solana/i.test(lower)) coin = "SOL";

    // Simulated odds (in production, fetch from Polymarket/Prediction Market API)
    const simulatedOdds = Math.floor(Math.random() * 40) + 20;

    // Store bet
    const bets = getStore<any[]>("BETS") || [];
    const bet = {
      id: bets.length + 1,
      amount,
      prediction,
      coin,
      timeframe,
      odds: simulatedOdds,
      status: "active",
      created_at: new Date().toISOString(),
    };
    bets.push(bet);
    setStore("BETS", bets);

    elizaLogger.log(`Bet placed: $${amount} on ${prediction} ${timeframe}`);

    const response = `🎲 **Bet Placed**\n\n`
      + `• Amount: $${amount}\n`
      + `• Prediction: ${prediction}\n`
      + `• Timeframe: ${timeframe}\n`
      + `• Current odds: ${simulatedOdds}%\n\n`
      + `I'll track this and notify you when the market resolves.`;

    callback({ text: response, action: "SEND_NOTIFICATION" });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Place a $10 bet on BTC above $100k by Friday" } },
      { user: "ElizClaw", content: { text: "🎲 Bet placed: $10 on BTC > $100,000 by Friday. Current odds: 35%.", action: "PREDICTION_MARKET" } },
    ],
  ],
};
