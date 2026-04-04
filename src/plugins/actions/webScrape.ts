import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";

function guessUrl(text: string): string | null {
  const lower = text.toLowerCase();
  if (/hacker.?news/i.test(lower)) return "https://news.ycombinator.com";
  if (/reddit/i.test(lower)) return "https://reddit.com";
  if (/tech.?crunch/i.test(lower)) return "https://techcrunch.com";
  if (/github.*trend/i.test(lower)) return "https://github.com/trending";
  return null;
}

export const webScrapeAction: Action = {
  name: "WEB_SCRAPE",
  similes: ["FETCH_PAGE", "READ_URL", "SCRAPER"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /https?:\/\//i.test(text) || /summarize|scrape|fetch|read.*(news|content|page|digest)/i.test(text);
  },
  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const urlMatch = text.match(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i);
    const url = urlMatch ? urlMatch[1] : guessUrl(text);

    if (!url) {
      callback({ text: "Need a URL — paste one or tell me which site (HN, Reddit, TechCrunch)" });
      return;
    }

    try {
      const res = await fetch(url, { headers: { "User-Agent": "ElizClaw/1.0" } });
      if (!res.ok) { callback({ text: `⚠️ HTTP ${res.status} from ${url}` }); return; }

      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : null;
      const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      callback({ text: `📄 **${title || new URL(url).hostname}**\n\n${textContent.substring(0, 800)}...\n\nWant me to set this up as a recurring digest?` });
    } catch (e: any) {
      callback({ text: `⚠️ Failed to fetch: ${e.message}` });
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Summarize Hacker News" } },
      { user: "ElizClaw", content: { text: "Fetching...", action: "WEB_SCRAPE" } },
    ],
  ],
};
