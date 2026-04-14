import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore, setStore } from "../store.ts";
import { formatSignalBrief, getSignalSnapshot } from "./signalMonitor.ts";

interface DailyBriefEntry {
  timestamp: string;
  brief: string;
  topAlert: string;
  nextScheduled: string;
}

function getRecentLogs(hours: number) {
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return (getStore<any[]>("LOGS") || []).filter((entry: any) => {
    const ts = new Date(entry.executed_at || entry.timestamp || 0).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function getRecentWhaleEvents(hours: number) {
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return (getStore<any[]>("WHALE_EVENTS") || []).filter((entry: any) => {
    const ts = new Date(entry.timestamp || 0).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function getNextScheduledTask() {
  const tasks = (getStore<any[]>("TASKS") || [])
    .filter((task: any) => task.is_active && task.next_run)
    .sort((a: any, b: any) => new Date(a.next_run).getTime() - new Date(b.next_run).getTime());
  return tasks[0] || null;
}

export const signalDigestAction: Action = {
  name: "SIGNAL_DIGEST",
  similes: ["DAILY_BRIEF", "MORNING_BRIEF", "DAILY_SUMMARY", "WHAT_HAPPENED_TODAY"],
  description: "Generate a morning brief or daily brief summarizing what happened, market conditions, whale activity, task outcomes, and the latest crypto signals.",
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = ((message.content as any)?.text || "").toLowerCase();
    if (text.startsWith("[signal_digest]")) return true;
    return text.includes("brief")
      || text.includes("digest")
      || text.includes("morning")
      || text.includes("summary")
      || text.includes("what happened")
      || text.includes("morning brief")
      || text.includes("daily brief")
      || text.includes("market update")
      || text.includes("crypto news")
      || text.includes("how is market")
      || text.includes("market conditions")
      || text.includes("trending")
      || text.includes("brief me")
      || text.includes("update me")
      || text.includes("what's going on")
      || text.includes("whats going on");
  },

  handler: async (_runtime: IAgentRuntime, _message: Memory, _state: State, _options: any, callback: any) => {
    const snapshot = await getSignalSnapshot();
    const recentLogs = getRecentLogs(24);
    const recentWhales = getRecentWhaleEvents(24);
    const nextTask = getNextScheduledTask();
    const successCount = recentLogs.filter((entry: any) => entry.status === "success").length;
    const failureCount = recentLogs.filter((entry: any) => entry.status === "failed").length;
    const topAlert = recentWhales[0]
      ? `${recentWhales[0].label || recentWhales[0].wallet || "Whale"} moved ${recentWhales[0].symbol || "assets"}`
      : recentLogs[0]?.output?.substring(0, 100) || "No major alerts in the last 24 hours.";

    const brief = [
      `📋 **ElizClaw Daily Brief — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}**`,
      ``,
      `**MARKET:** ${snapshot.momentum} — ${snapshot.overallRead}`,
      `**WHALE ACTIVITY:** ${recentWhales.length > 0 ? `${recentWhales.length} movement${recentWhales.length === 1 ? "" : "s"} detected` : "quiet"}`,
      `**YOUR TASKS:** ${successCount} ran successfully, ${failureCount} failed`,
      `**TOP ALERT:** ${topAlert}`,
      `**NEXT SCHEDULED:** ${nextTask ? `${nextTask.name} at ${new Date(nextTask.next_run).toLocaleString()}` : "No active tasks queued"}`,
      ``,
      `Generated at ${new Date().toLocaleTimeString()} — next brief in 24 hours`,
    ].join("\n");

    const entry: DailyBriefEntry = {
      timestamp: new Date().toISOString(),
      brief,
      topAlert,
      nextScheduled: nextTask ? nextTask.name : "No active tasks queued",
    };

    const briefs = getStore<DailyBriefEntry[]>("DAILY_BRIEFS") || [];
    setStore("DAILY_BRIEFS", [entry, ...briefs].slice(0, 20));

    callback({
      text: `${brief}\n\n${formatSignalBrief(snapshot)}`,
      data: entry,
    });
  },
};
