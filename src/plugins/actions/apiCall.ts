import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";

export const apiCallAction: Action = {
  name: "API_CALL",
  similes: ["HTTP_REQUEST", "FETCH_API", "CALL_ENDPOINT"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /(call\s*api|hit\s*endpoint|request\s*url|fetch\s*api)/i.test(text) && /https?:\/\//i.test(text);
  },
  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const urlMatch = text.match(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i);
    if (!urlMatch) { callback({ text: "Need a URL for the API call." }); return; }

    const url = urlMatch[1];
    const method = /post/i.test(text) ? "POST" : /put/i.test(text) ? "PUT" : /delete/i.test(text) ? "DELETE" : "GET";

    try {
      const res = await fetch(url, { method, headers: { "Accept": "application/json", "User-Agent": "ElizClaw/1.0" } });
      const data = await res.text();
      const preview = data.length > 500 ? data.substring(0, 500) + "..." : data;
      callback({ text: `**${method} ${res.status} ${res.statusText}**\n\n\`\`\`json\n${preview}\n\`\`\`` });
    } catch (e: any) {
      callback({ text: `⚠️ API call failed: ${e.message}` });
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Call https://api.github.com/repos/elizaOS/eliza" } },
      { user: "ElizClaw", content: { text: "Making GET request...", action: "API_CALL" } },
    ],
  ],
};
