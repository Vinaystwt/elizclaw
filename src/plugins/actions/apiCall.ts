import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { httpGet } from "../utils/http.ts";

/**
 * Make an HTTP request to any API endpoint.
 * Supports GET, POST, PUT, DELETE with proper error handling.
 */
export const apiCallAction: Action = {
  name: "API_CALL",
  similes: ["HTTP_REQUEST", "FETCH_API", "CALL_ENDPOINT"],
  description: "Make an HTTP request to any API endpoint",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /(call\s*api|hit\s*endpoint|request\s*url|fetch\s*api)/i.test(text) && /https?:\/\//i.test(text);
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const urlMatch = text.match(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i);

    if (!urlMatch) {
      callback({ text: "Need a URL for the API call. Paste the full endpoint URL." });
      return;
    }

    const url = urlMatch[1];
    const method = /post/i.test(text) ? "POST"
      : /put/i.test(text) ? "PUT"
      : /delete/i.test(text) ? "DELETE"
      : "GET";

    const result = await httpGet(url, {
      method,
      headers: { "Accept": "application/json", "User-Agent": "ElizClaw/1.0" },
    });

    if (!result.ok) {
      callback({ text: `⚠️ ${method} ${url} → ${result.error}. Check the URL and try again.` });
      return;
    }

    const data = JSON.stringify(result.data, null, 2);
    const preview = data.length > 600 ? data.substring(0, 600) + "\n... (truncated)" : data;

    callback({ text: `**${method} → ${result.status}**\n\n\`\`\`json\n${preview}\n\`\`\`` });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Call https://api.github.com/repos/elizaOS/eliza" } },
      { user: "ElizClaw", content: { text: "Making GET request...", action: "API_CALL" } },
    ],
  ],
};
