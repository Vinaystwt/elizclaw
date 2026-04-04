import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore } from "../store.ts";

export const tasksProvider: Provider = {
  get: async (runtime: IAgentRuntime, _message: Memory, _state?: State) => {
    const tasks = getStore<any[]>("TASKS") || [];
    const active = tasks.filter((t: any) => t.is_active);

    if (!active.length) return { text: "No active tasks." };

    const list = active.map((t: any) => `• ${t.name} [${t.type}] — next: ${t.next_run ? new Date(t.next_run).toLocaleString() : "pending"}`).join("\n");
    return { text: `Active Tasks (${active.length}):\n${list}`, data: { tasks: active } };
  },
};
