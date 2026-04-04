import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore } from "../store.ts";

/**
 * Calculate the next scheduled run date from a human-readable schedule string.
 * Supports: "every N hours/minutes/days/weeks", "daily", "hourly", "weekly".
 */
function calcNextRun(schedule: string): Date {
  const now = new Date();

  // "every day at 8:00" or "daily"
  if (schedule.includes("every day") || schedule.includes("daily")) {
    const m = schedule.match(/at\s*(\d{1,2}):(\d{2})/);
    const next = new Date(now);
    if (m) {
      next.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0);
    } else {
      next.setHours(8, 0, 0, 0);
    }
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  // "every hour" or "hourly"
  if (schedule.includes("every hour") || schedule.includes("hourly")) {
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  // "every N hours/minutes/days/weeks"
  const intervalMatch = schedule.match(/every\s+(\d+)\s*(minute|hour|day|week)s?/i);
  if (intervalMatch) {
    const n = parseInt(intervalMatch[1]);
    const unit = intervalMatch[2].toLowerCase();
    const next = new Date(now);
    if (unit === "minute") next.setMinutes(next.getMinutes() + n);
    else if (unit === "hour") next.setHours(next.getHours() + n);
    else if (unit === "day") next.setDate(next.getDate() + n);
    else if (unit === "week") next.setDate(next.getDate() + n * 7);
    return next;
  }

  // "weekly"
  if (schedule.includes("week")) {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    next.setHours(9, 0, 0, 0);
    return next;
  }

  // Default: 1 hour from now
  return new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Parse a natural language task description into a structured task.
 * Detects: price monitoring, web scraping, API calls.
 */
function parseTask(text: string): { type: string; config: Record<string, any>; condition: string | null; name: string } {
  const lower = text.toLowerCase();
  let type = "custom";
  let config: Record<string, any> = {};
  let condition: string | null = null;

  // Price monitoring
  if (/price|btc|eth|sol|crypto|coin/i.test(lower)) {
    type = "price_monitor";
    const coinMatch = text.match(/(BTC|ETH|SOL|DOGE|ADA|AVAX|MATIC|BNB|XRP)/i);
    const priceMatch = text.match(/\$?([\d,]+\.?\d*)\s*(k|m|b)?/i);
    config.symbol = coinMatch ? coinMatch[1].toUpperCase() : "BTC";
    if (priceMatch) {
      let price = parseFloat(priceMatch[1].replace(/,/g, ""));
      if (priceMatch[2]) price *= { k: 1000, m: 1000000, b: 1000000000 }[priceMatch[2].toLowerCase()];
      config.threshold = price;
    }
    condition = priceMatch ? `price > $${config.threshold.toLocaleString()}` : null;
  }

  // Web scraping
  if (/scrape|fetch|summarize|digest|news/i.test(lower)) {
    type = "web_scrape";
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) config.url = urlMatch[0];
    else if (/hacker.?news/i.test(lower)) config.url = "https://news.ycombinator.com";
    else if (/reddit/i.test(lower)) config.url = "https://reddit.com";
    else if (/techcrunch/i.test(lower)) config.url = "https://techcrunch.com";
    else if (/github/i.test(lower)) config.url = "https://github.com/trending";
  }

  // API call
  if (/api|call|request|endpoint/i.test(lower)) {
    type = "api_call";
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) config.url = urlMatch[0];
  }

  // Generate a readable task name
  let name = "Recurring Task";
  if (type === "price_monitor") name = `${config.symbol || "Crypto"} Price Monitor`;
  else if (type === "web_scrape" && config.url) {
    try { name = `Web Digest: ${new URL(config.url).hostname}`; } catch { name = "Web Digest"; }
  }
  else if (type === "api_call") name = "API Monitor";

  return { type, config, condition, name };
}

export const createTaskAction: Action = {
  name: "CREATE_TASK",
  similes: ["MAKE_TASK", "NEW_TASK", "SCHEDULE_TASK", "SET_TASK"],
  description: "Create a new scheduled task from natural language input",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /check|monitor|track|watch|remind|alert|notify|summarize|digest|every|daily|hourly/i.test(text);
  },

  handler: async (runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();

    const { type, config, condition, name } = parseTask(text);

    // Parse schedule from natural language
    let schedule = "daily";
    const intervalMatch = lower.match(/every\s+(\d+)\s*(hour|minute|day|week)/i);
    if (intervalMatch) {
      const n = intervalMatch[1];
      const unit = intervalMatch[2];
      schedule = `every ${n} ${unit}${parseInt(n) > 1 ? "s" : ""}`;
    } else if (/hourly/i.test(lower)) {
      schedule = "every hour";
    } else if (/daily|every\s*day|every\s*morning/i.test(lower)) {
      schedule = "every day at 8:00";
    } else if (/weekly|every\s*week/i.test(lower)) {
      schedule = "every week on monday at 9:00";
    }

    const nextRun = calcNextRun(schedule);

    // Store task
    const tasks = getStore<any[]>("TASKS") || [];
    const task = {
      id: tasks.length + 1,
      name,
      type,
      description: text,
      schedule,
      config,
      condition,
      is_active: true,
      created_at: new Date().toISOString(),
      next_run: nextRun.toISOString(),
    };
    tasks.push(task);
    setStore("TASKS", tasks);

    elizaLogger.log(`Task created: ${name} [${type}]`);

    let response = `✅ Task created: **${name}**\n\n`;
    response += `• Type: ${type.replace("_", " ")}\n`;
    response += `• Schedule: ${schedule}\n`;
    if (condition) response += `• Alert: ${condition}\n`;
    response += `\nFirst run scheduled. Check your dashboard to manage it.`;

    callback({ text: response, action: "SEND_NOTIFICATION" });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Check BTC price every morning" } },
      { user: "ElizClaw", content: { text: "Got it, I'll set up a daily BTC monitor.", action: "CREATE_TASK" } },
    ],
  ],
};
