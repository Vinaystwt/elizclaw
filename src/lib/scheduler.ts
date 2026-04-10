import fs from "fs";
import path from "path";

interface SchedulerTask {
  id: number;
  name: string;
  type: string;
  schedule: string;
  config?: Record<string, any> | null;
  is_active?: number | boolean;
  next_run?: string | null;
  last_run?: string | null;
  updated_at?: string;
}

interface StartSchedulerOptions {
  agentId: string;
  serverPort: number;
}

const isProduction = process.env.NODE_ENV === "production";
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

function schedLog(level: "info" | "warn" | "error", msg: string, meta: Record<string, any> = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component: "scheduler",
    msg,
    ...meta,
  };

  if (isProduction || level === "error") {
    console.log(JSON.stringify(entry));
    return;
  }

  const prefix = { info: "ℹ", warn: "⚠", error: "✕" }[level] || "·";
  console.log(`${prefix} [scheduler] ${msg}${Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""}`);
}

function readStore(): Record<string, any> {
  if (!fs.existsSync(storePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(storePath, "utf8"));
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, any>) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

function calcNextRun(schedule: string): Date | null {
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
    return new Date(now.getTime() + (m ? parseInt(m[1]) : 1) * 3600000);
  }
  if (schedule.includes("week")) {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    return next;
  }
  return new Date(now.getTime() + 3600000);
}

function buildCommand(task: SchedulerTask): string {
  const config = task.config || {};
  switch (task.type) {
    case "price_monitor":
      return `Check ${config.coin || "BTC"} price and alert if ${config.threshold || "above $100k"}`;
    case "wallet_tracker":
      return `Check wallet balance for ${config.address || "tracked wallet"}`;
    case "whale_watcher":
      return `Check whale activity for ${config.address || "tracked whale"}`;
    case "signal_monitor":
      return "What's happening in the crypto market?";
    case "web_scrape":
      return `Summarize ${config.url || "the webpage"}`;
    case "api_call":
      return `Call API at ${config.url || "endpoint"}`;
    default:
      return task.name || `Execute task ${task.id}`;
  }
}

async function triggerTask(task: SchedulerTask, agentId: string, serverPort: number) {
  const command = buildCommand(task);
  schedLog("info", "Executing task", { taskId: task.id, name: task.name, type: task.type });

  const store = readStore();
  const tasks = store.TASKS || [];
  const taskIndex = tasks.findIndex((entry: SchedulerTask) => entry.id === task.id);
  if (taskIndex === -1) return;

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    last_run: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.TASKS = tasks;
  writeStore(store);

  try {
    const response = await fetch(`http://localhost:${serverPort}/${agentId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: command, roomId: "scheduler", userId: "system" }),
    });

    const data = await response.json();
    const output = Array.isArray(data)
      ? data.map((message: any) => message.text || message.content?.text).filter(Boolean).join("\n\n")
      : (data.text || JSON.stringify(data));

    const logStore = readStore();
    const logs = logStore.LOGS || [];
    logs.push({
      task_id: task.id,
      type: task.type,
      status: response.ok ? "success" : "failed",
      output: output?.substring(0, 500) || (response.ok ? "Completed" : `Agent returned ${response.status}`),
      executed_at: new Date().toISOString(),
    });
    logStore.LOGS = logs;

    const updatedTasks = logStore.TASKS || [];
    const updatedIndex = updatedTasks.findIndex((entry: SchedulerTask) => entry.id === task.id);
    if (updatedIndex !== -1) {
      updatedTasks[updatedIndex] = {
        ...updatedTasks[updatedIndex],
        next_run: calcNextRun(task.schedule)?.toISOString() || null,
        updated_at: new Date().toISOString(),
      };
      logStore.TASKS = updatedTasks;
    }

    writeStore(logStore);
    schedLog(response.ok ? "info" : "warn", response.ok ? "Task completed" : "Task failed", {
      taskId: task.id,
      name: task.name,
      status: response.status,
    });
  } catch (error: any) {
    const logStore = readStore();
    const logs = logStore.LOGS || [];
    logs.push({
      task_id: task.id,
      type: task.type,
      status: "failed",
      output: error.message,
      executed_at: new Date().toISOString(),
    });
    logStore.LOGS = logs;
    writeStore(logStore);
    schedLog("error", "Task failed", { taskId: task.id, name: task.name, error: error.message });
  }
}

export function startScheduler({ agentId, serverPort }: StartSchedulerOptions) {
  const runOnce = async () => {
    try {
      const store = readStore();
      const tasks = (store.TASKS || []).filter((task: SchedulerTask) => task.is_active && task.next_run);
      const now = new Date();
      const dueTasks = tasks.filter((task: SchedulerTask) => new Date(task.next_run as string) <= now);

      if (dueTasks.length > 0) {
        schedLog("info", "Found due tasks", { count: dueTasks.length });
        for (const task of dueTasks) {
          await triggerTask(task, agentId, serverPort);
        }
      }
    } catch (error: any) {
      schedLog("error", "Error checking tasks", { error: error.message });
    }
  };

  schedLog("info", "Background task scheduler started", { intervalMs: 60000, agentId });
  const interval = setInterval(runOnce, 60_000);
  return { interval, runOnce };
}
