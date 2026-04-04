/**
 * Price guess provider — surfaces active bets and guesses to the agent context.
 * Shows the last guess and count of active bets.
 */
import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore } from "../store.ts";

export const priceGuessProvider: Provider = {
  get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
    const guesses = getStore<any[]>("PRICE_GUESSES") || [];
    const bets = getStore<any[]>("BETS") || [];

    if (!guesses.length && !bets.length) {
      return { text: "No active predictions or bets. Start a game or place a bet!" };
    }

    let text = "";
    if (guesses.length) {
      const last = guesses[guesses.length - 1];
      text += `🎮 Last guess: $${last.guess.toLocaleString()} (Round ${last.round})\n`;
    }
    if (bets.length) {
      const activeBets = bets.filter((b: any) => b.status === "active");
      text += `🎲 ${activeBets.length} active bet(s)`;
    }
    return { text, data: { guesses, bets } };
  },
};
