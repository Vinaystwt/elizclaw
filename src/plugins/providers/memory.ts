/**
 * Memory provider — surfaces recent task execution history to the agent.
 * Shows the last 5 log entries with status indicators.
 */
import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore } from "../store.ts";

export const memoryProvider: Provider = {
  get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
    const logs = getStore<any[]>("LOGS") || [];
    const recent = logs.slice(-5);

    if (!recent.length) {
      return { text: "No activity yet. Create and run a task to get started." };
    }

    const summary = recent
      .map((l: any) => {
        const icon = l.status === "success" ? "✅" : l.status === "failed" ? "❌" : "⏳";
        const time = l.executed_at ? new Date(l.executed_at).toLocaleTimeString() : "";
        return `${icon} ${l.task_name || "Task"} — ${l.status} ${time}`;
      })
      .join("\n");

    return { text: `Recent Activity:\n${summary}`, data: { logs: recent } };
  },
};
