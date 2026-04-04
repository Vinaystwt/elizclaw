import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore } from "../store.ts";

function calcNext(schedule: string): Date | null {
  const now = new Date();
  if (schedule.includes("every day") || schedule.includes("daily")) {
    const m = schedule.match(/at\s*(\d{1,2}):(\d{2})/);
    if (m) {
      const next = new Date(now);
      next.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next;
    }
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
  if (schedule.includes("hour")) {
    const m = schedule.match(/(\d+)/);
    const hrs = m ? parseInt(m[1]) : 1;
    return new Date(now.getTime() + hrs * 60 * 60 * 1000);
  }
  if (schedule.includes("week")) {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    next.setHours(9, 0, 0, 0);
    return next;
  }
  return new Date(now.getTime() + 60 * 60 * 1000);
}

export const createTaskAction: Action = {
  name: "CREATE_TASK",
  similes: ["MAKE_TASK", "NEW_TASK", "SCHEDULE_TASK", "SET_TASK"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /check|monitor|track|watch|remind|alert|notify|summarize|digest|every|daily|hourly/i.test(text);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();

    let type = "custom";
    let config: any = {};
    let condition: string | null = null;

    if (/price|btc|eth|sol|crypto|coin/i.test(lower)) {
      type = "price_monitor";
      const coinMatch = text.match(/(BTC|ETH|SOL|DOGE|ADA|AVAX|MATIC)/i);
      const priceMatch = text.match(/\$?([\d,]+\.?\d*)\s*(k|m|b)?/i);
      config.symbol = coinMatch ? coinMatch[1].toUpperCase() : "BTC";
      if (priceMatch) {
        let price = parseFloat(priceMatch[1].replace(",", ""));
        if (priceMatch[2]) price *= { k: 1000, m: 1000000, b: 1000000000 }[priceMatch[2].toLowerCase()];
        config.threshold = price;
      }
      condition = priceMatch ? `price > ${config.threshold}` : null;
    }

    if (/scrape|fetch|summarize|digest|news/i.test(lower)) {
      type = "web_scrape";
      const urlMatch = text.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) config.url = urlMatch[0];
      else if (/hacker.?news/i.test(lower)) config.url = "https://news.ycombinator.com";
      else if (/reddit/i.test(lower)) config.url = "https://reddit.com";
    }

    if (/api|call|request|endpoint/i.test(lower)) {
      type = "api_call";
      const urlMatch = text.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) config.url = urlMatch[0];
    }

    let schedule = "daily";
    if (/every\s*(\d+)\s*(hour|minute|day|week)/i.test(lower)) {
      const m = lower.match(/every\s*(\d+)\s*(hour|minute|day|week)/i);
      schedule = `every ${m![1]} ${m![2]}${parseInt(m![1]) > 1 ? "s" : ""}`;
    } else if (/hourly/i.test(lower)) schedule = "every hour";
    else if (/daily|every\s*day|every\s*morning/i.test(lower)) schedule = "every day at 8:00";
    else if (/weekly|every\s*week/i.test(lower)) schedule = "every week on monday at 9:00";

    let name = "Recurring Task";
    if (type === "price_monitor") name = `${config.symbol || "Crypto"} Price Monitor`;
    else if (type === "web_scrape") name = config.url ? `Web Digest: ${new URL(config.url).hostname}` : "Web Digest";
    else if (type === "api_call") name = "API Monitor";

    const nextRun = calcNext(schedule);

    // Store task
    const tasks = getStore<any[]>("TASKS") || [];
    const task = { id: tasks.length + 1, name, type, description: text, schedule, config, condition, is_active: true, created_at: new Date().toISOString(), next_run: nextRun?.toISOString() || null };
    tasks.push(task);
    setStore("TASKS", tasks);

    elizaLogger.log(`Task created: ${name}`);

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
