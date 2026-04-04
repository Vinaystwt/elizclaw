/**
 * Tasks provider — surfaces active tasks and their schedules to the agent context.
 * Used by the agent to know what tasks exist and when they'll run next.
 */
import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore } from "../store.ts";

export const tasksProvider: Provider = {
  get: async (runtime: IAgentRuntime, _message: Memory, _state?: State) => {
    const tasks = getStore<any[]>("TASKS") || [];
    const active = tasks.filter((t: any) => t.is_active);

    if (!active.length) {
      return { text: "No active tasks. Use natural language to create one, e.g. 'check BTC price every morning'." };
    }

    const list = active
      .map((t: any) => `• ${t.name} [${t.type}] — next: ${t.next_run ? new Date(t.next_run).toLocaleString() : "pending"}`)
      .join("\n");

    return { text: `Active Tasks (${active.length}):\n${list}`, data: { tasks: active } };
  },
};
