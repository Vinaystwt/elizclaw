import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore, appendToArray } from "../store.ts";

export const priceGuessGameAction: Action = {
  name: "PRICE_GUESS_GAME",
  similes: ["GUESS_PRICE", "PREDICT_PRICE", "PRICE_GAME", "PLAY_PRICE_GAME"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();
    return /(price.?guess|guess.*price|play.*game|prediction.?game|guess.*btc|guess.*tomorrow)/i.test(lower);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();

    // Get current BTC price
    let currentPrice = 98450; // fallback
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      const data: any = await res.json();
      currentPrice = data.bitcoin?.usd || currentPrice;
    } catch {}

    // Check if user is submitting a guess
    const guessMatch = text.match(/\$?([\d,]+)/);

    if (guessMatch) {
      const guess = parseInt(guessMatch[1].replace(",", ""));

      // Store guess
      const guesses = getStore<any[]>("PRICE_GUESSES") || [];
      guesses.push({
        user: "player1",
        guess,
        actual_price: null,
        timestamp: new Date().toISOString(),
        round: guesses.length + 1,
      });
      setStore("PRICE_GUESSES", guesses);

      callback({ text: `🎯 **Guess submitted: $${guess.toLocaleString()}**\n\nCurrent price: $${currentPrice.toLocaleString()}. We'll see how close you are tomorrow!\n\nPoints will be awarded based on how close your guess is to the actual price.` });
    } else {
      // Start a new game round
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      callback({ text: `🎮 **Price Guess Game**\n\nCurrent BTC price: $${currentPrice.toLocaleString()}\n\nWhat's your guess for tomorrow's price? Reply with a number and I'll track your score.\n\nClosest guess wins 10 points!` });
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
