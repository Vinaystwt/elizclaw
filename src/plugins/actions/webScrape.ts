import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { httpGet } from "../utils/http.ts";

/**
 * Guess a URL from common site names in natural language.
 */
function guessUrl(text: string): string | null {
  const lower = text.toLowerCase();
  if (/hacker.?news/i.test(lower)) return "https://news.ycombinator.com";
  if (/reddit/i.test(lower)) return "https://reddit.com";
  if (/tech.?crunch/i.test(lower)) return "https://techcrunch.com";
  if (/github.*trend/i.test(lower)) return "https://github.com/trending";
  return null;
}

/**
 * Fetch a URL, extract page title and readable text content.
 * Handles invalid URLs, empty pages, and non-HTML responses gracefully.
 */
export const webScrapeAction: Action = {
  name: "WEB_SCRAPE",
  similes: ["FETCH_PAGE", "READ_URL", "SCRAPER"],
  description: "Fetch and summarize web content from a URL",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /https?:\/\//i.test(text) || /summarize|scrape|fetch|read.*(news|content|page|digest)/i.test(text);
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const urlMatch = text.match(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i);
    const url = urlMatch ? urlMatch[1] : guessUrl(text);

    if (!url) {
      callback({ text: "Need a URL — paste one or tell me which site (HN, Reddit, TechCrunch, GitHub Trending)." });
      return;
    }

    const result = await httpGet(url, { headers: { "User-Agent": "ElizClaw/1.0" } });

    if (!result.ok) {
      callback({ text: `⚠️ Failed to fetch ${url}: ${result.error}. The site may be down or blocking automated requests.` });
      return;
    }

    const html = String(result.data || "");

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    // Extract readable text
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!textContent) {
      callback({ text: `📄 Fetched ${url} but found no readable content. The page may be image-heavy or require JavaScript.` });
      return;
    }

    let hostname = url;
    try { hostname = new URL(url).hostname; } catch {}

    callback({ text: `📄 **${title || hostname}**\n\n${textContent.substring(0, 800)}...\n\nWant me to set this up as a recurring digest?` });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Summarize Hacker News" } },
      { user: "ElizClaw", content: { text: "Fetching...", action: "WEB_SCRAPE" } },
    ],
  ],
};
