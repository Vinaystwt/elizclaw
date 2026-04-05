/**
 * Client initialization — returns an empty array.
 *
 * The DirectClient is started directly in src/index.ts.
 * Other clients (Discord, Telegram, Twitter, Auto) are not used
 * in this deployment and have been removed to avoid native
 * compilation dependencies (e.g., @discordjs/opus requires Python).
 */
import { Character, IAgentRuntime } from "@elizaos/core";

export async function initializeClients(
  character: Character,
  runtime: IAgentRuntime
) {
  // DirectClient is started separately in index.ts
  // No additional clients needed for this deployment
  return [];
}
