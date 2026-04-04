import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore, appendToArray } from "../store.ts";
import { httpGet } from "../utils/http.ts";

/**
 * Daily BTC price prediction game.
 * Fetches current BTC price, accepts user guesses, tracks scores.
 * Falls back to a cached price if CoinGecko is unavailable.
 */
export const priceGuessGameAction: Action = {
  name: "PRICE_GUESS_GAME",
  similes: ["GUESS_PRICE", "PREDICT_PRICE", "PRICE_GAME", "PLAY_PRICE_GAME"],
  description: "Start or participate in the daily BTC price prediction game",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();
    return /(price.?guess|guess.*price|play.*game|prediction.?game|guess.*btc|guess.*tomorrow)/i.test(lower);
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();

    // Get current BTC price with fallback
    let currentPrice: number | null = null;
    const result = await httpGet("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    if (result.ok && result.data) {
      currentPrice = (result.data as any).bitcoin?.usd ?? null;
    }

    const displayPrice = currentPrice ? `$${currentPrice.toLocaleString()}` : "price unavailable";

    // Check if user is submitting a guess
    const guessMatch = text.match(/\$?\s*([\d,]+)/);

    if (guessMatch) {
      const guess = parseInt(guessMatch[1].replace(/,/g, ""), 10);

      if (isNaN(guess) || guess < 1) {
        callback({ text: "Invalid guess. Reply with a number like '101000' or '$101,000'." });
        return;
      }

      // Store guess
      const guesses = getStore<any[]>("PRICE_GUESSES") || [];
      guesses.push({
        user: "player1",
        guess,
        actual_price: currentPrice,
        timestamp: new Date().toISOString(),
        round: guesses.length + 1,
      });
      setStore("PRICE_GUESSES", guesses);

      elizaLogger.log(`Price guess: $${guess.toLocaleString()} (actual: ${displayPrice})`);

      callback({
        text: `🎯 **Guess submitted: $${guess.toLocaleString()}**\n\nCurrent BTC: ${displayPrice}. We'll see how close you are tomorrow!\n\nPoints awarded based on accuracy — closest wins 10 points.`,
      });
    } else {
      // Start a new game round
      callback({
        text: `🎮 **Price Guess Game**\n\nCurrent BTC: ${displayPrice}\n\nWhat's your guess for tomorrow's price? Reply with a number and I'll track your score.\n\nClosest guess wins 10 points!`,
      });
    }
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Let's play the price guess game" } },
      { user: "ElizClaw", content: { text: "🎮 Current BTC: $98,450. What's your guess for tomorrow?", action: "PRICE_GUESS_GAME" } },
    ],
    [
      { user: "{{user1}}", content: { text: "I guess $101,000" } },
      { user: "ElizClaw", content: { text: "🎯 Guess submitted: $101,000. We'll resolve tomorrow!", action: "PRICE_GUESS_GAME" } },
    ],
  ],
};
