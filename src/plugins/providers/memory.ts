import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore } from "../store.ts";

export const memoryProvider: Provider = {
  get: async (runtime: IAgentRuntime, _message: Memory, _state?: State) => {
    const logs = getStore<any[]>("LOGS") || [];
    const recent = logs.slice(-5);

    if (!recent.length) return { text: "No recent activity." };

    const summary = recent.map((l: any) => {
      const icon = l.status === "success" ? "✅" : l.status === "failed" ? "❌" : "⏳";
      return `${icon} ${l.task_name || "Task"} — ${l.status}`;
    }).join("\n");

    return { text: `Recent Activity:\n${summary}`, data: { logs: recent } };
  },
};
