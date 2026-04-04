import { Action, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { getStore, setStore, appendToArray } from "../store.ts";

async function runPriceCheck(symbol: string, threshold?: number) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`);
    const data: any = await res.json();
    const price = data[symbol.toLowerCase()]?.usd;
    if (!price) return { status: "failed", output: `No price for ${symbol}` };

    let msg = `📊 ${symbol}/USD: $${price.toLocaleString()}`;
    if (threshold && price > threshold) {
      msg += `\n\n🔔 **Above your $${threshold.toLocaleString()} threshold!**`;
      return { status: "success", output: msg, alert: true };
    }
    return { status: "success", output: msg };
  } catch (e: any) {
    return { status: "failed", output: `Price check failed: ${e.message}` };
  }
}

async function runScrape(url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ElizClaw/1.0" } });
    const html = await res.text();
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return { status: "success", output: `📄 ${url}\n${text.substring(0, 500)}...` };
  } catch (e: any) {
    return { status: "failed", output: `Failed to fetch ${url}: ${e.message}` };
  }
}

export const executeTaskAction: Action = {
  name: "EXECUTE_TASK",
  similes: ["RUN_TASK", "DO_TASK", "TRIGGER_TASK"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /(run|execute|trigger|start).*(task|monitor|check)|run.*(now|it)/i.test(text);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, _state: State, _options: any, callback: any) => {
    const text = (message.content as any)?.text || "";
    const tasks = getStore<any[]>("TASKS") || [];
    const activeTasks = tasks.filter((t: any) => t.is_active);

    if (!activeTasks.length) {
      callback({ text: "No active tasks to run. Create one first!" });
      return;
    }

    const task = activeTasks[0];
    let result: any;

    if (task.type === "price_monitor") {
      result = await runPriceCheck(task.config?.symbol || "BTC", task.config?.threshold);
    } else if (task.type === "web_scrape") {
      result = await runScrape(task.config?.url || "https://news.ycombinator.com");
    } else {
      result = { status: "skipped", output: "Task type not implemented yet." };
    }

    // Log execution
    appendToArray("LOGS", { task_id: task.id, task_name: task.name, status: result.status, output: result.output?.substring(0, 200), executed_at: new Date().toISOString() });

    // Update next_run
    if (task.next_run) {
      const next = new Date(task.next_run);
      next.setDate(next.getDate() + 1);
      task.next_run = next.toISOString();
      setStore("TASKS", tasks);
    }

    elizaLogger.log(`Executed task: ${task.name} — ${result.status}`);
    callback({ text: result.output || "Done.", action: result.alert ? "SEND_NOTIFICATION" : undefined });
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Run the BTC check now" } },
      { user: "ElizClaw", content: { text: "Running it now.", action: "EXECUTE_TASK" } },
    ],
  ],
};
