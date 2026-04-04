import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore, appendToArray } from "../store.ts";
import { httpGet } from "../utils/http.ts";

/**
 * Fetches crypto price from CoinGecko with threshold checking.
 * Handles rate limits, timeouts, and malformed responses gracefully.
 */
async function runPriceCheck(symbol: string, threshold?: number) {
  const coinMap: Record<string, string> = {
    BTC: "bitcoin", ETH: "ethereum", SOL: "solana", DOGE: "dogecoin",
    ADA: "cardano", AVAX: "avalanche-2", MATIC: "matic-network",
    BNB: "binancecoin", XRP: "ripple",
  };

  const coinId = coinMap[symbol.toUpperCase()] || symbol.toLowerCase();

  const result = await httpGet(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
  );

  if (!result.ok || !result.data) {
    return { status: "failed", output: `Failed to fetch ${symbol} price: ${result.error}` };
  }

  const coinData = (result.data as any)[coinId];
  if (!coinData || !coinData.usd) {
    return { status: "failed", output: `No price data for ${symbol}. Try a different coin.` };
  }

  const price = coinData.usd;
  const change = coinData.usd_24h_change?.toFixed(2) || "N/A";
  let msg = `📊 ${symbol}/USD: $${price.toLocaleString()} (24h: ${change}%)`;

  if (threshold !== undefined && price > threshold) {
    msg += `\n\n🔔 **Above your $${threshold.toLocaleString()} threshold!**`;
    return { status: "success", output: msg, alert: true };
  }

  return { status: "success", output: msg };
}

/**
 * Fetches a URL and extracts readable text content.
 * Strips scripts, styles, and limits output to 800 chars.
 */
async function runScrape(url: string) {
  try {
    // Validate URL format
    new URL(url);
  } catch {
    return { status: "failed", output: `Invalid URL: ${url}` };
  }

  const result = await httpGet(url, { headers: { "User-Agent": "ElizClaw/1.0" } });

  if (!result.ok) {
    return { status: "failed", output: `Failed to fetch ${url}: ${result.error}` };
  }

  const html = String(result.data || "");
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return { status: "failed", output: `No content found at ${url}` };
  }

  return { status: "success", output: `📄 ${url}\n\n${text.substring(0, 800)}...` };
}

export const executeTaskAction: Action = {
  name: "EXECUTE_TASK",
  similes: ["RUN_TASK", "DO_TASK", "TRIGGER_TASK"],
  description: "Execute the next scheduled task immediately",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /(run|execute|trigger|start).*(task|monitor|check)|run.*(now|it)/i.test(text);
  },

  handler: async (runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const tasks = getStore<any[]>("TASKS") || [];
    const activeTasks = tasks.filter((t: any) => t.is_active);

    if (!activeTasks.length) {
      callback({ text: "No active tasks to run. Create one first with 'check BTC price every morning'." });
      return;
    }

    const task = activeTasks[0];
    let result: any;

    try {
      if (task.type === "price_monitor") {
        result = await runPriceCheck(task.config?.symbol || "BTC", task.config?.threshold);
      } else if (task.type === "web_scrape") {
        result = await runScrape(task.config?.url || "https://news.ycombinator.com");
      } else if (task.type === "api_call") {
        result = { status: "success", output: "API calls execute on-demand. Use the API_CALL action directly." };
      } else {
        result = { status: "skipped", output: `Task type '${task.type}' not implemented yet.` };
      }
    } catch (e: any) {
      result = { status: "failed", output: `Unexpected error: ${e.message}` };
    }

    // Log execution
    appendToArray("LOGS", {
      task_id: task.id,
      task_name: task.name,
      status: result.status,
      output: result.output?.substring(0, 200),
      executed_at: new Date().toISOString(),
    });

    // Advance next_run for recurring tasks
    if (task.next_run && task.schedule) {
      const now = new Date();
      const parts = task.schedule.match(/every\s+(\d+)\s*(hour|minute|day|week)/i);
      if (parts) {
        const interval = parseInt(parts[1]);
        const unit = parts[2].toLowerCase();
        const next = new Date(now);
        if (unit === "hour") next.setHours(next.getHours() + interval);
        else if (unit === "minute") next.setMinutes(next.getMinutes() + interval);
        else if (unit === "day") next.setDate(next.getDate() + interval);
        else if (unit === "week") next.setDate(next.getDate() + interval * 7);
        task.next_run = next.toISOString();
      }
      setStore("TASKS", tasks);
    }

    elizaLogger.log(`Executed task: ${task.name} → ${result.status}`);
    callback({ text: result.output || "Done.", action: result.alert ? "SEND_NOTIFICATION" : undefined });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Run the BTC check now" } },
      { user: "ElizClaw", content: { text: "Running it now.", action: "EXECUTE_TASK" } },
    ],
  ],
};
