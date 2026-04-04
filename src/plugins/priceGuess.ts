import { Plugin, Action, Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { priceGuessGameAction } from "./actions/priceGuess.ts";
import { priceGuessProvider } from "./providers/priceGuess.ts";

export const priceGuessPlugin: Plugin = {
  name: "priceGuess",
  description: "Daily BTC price prediction game with leaderboard",
  actions: [priceGuessGameAction],
  providers: [priceGuessProvider],
  evaluators: [],
  services: [],
};
