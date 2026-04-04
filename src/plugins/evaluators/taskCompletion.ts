/**
 * Task completion evaluator — auto-logs task outcomes.
 * Watches agent responses for success/failure keywords and records them in the activity log.
 */
import { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";
import { appendToArray } from "../store.ts";

export const taskCompletionEvaluator: Evaluator = {
  name: "TASK_COMPLETION",
  similes: [],
  description: "Auto-log task execution status from agent responses",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    return /success|failed|error|completed|executed|running/i.test(text);
  },

  handler: async (_runtime: IAgentRuntime, message: Memory, _state?: State) => {
    const text = (message.content as any)?.text || "";
    const status = /failed|error|could not|unable/i.test(text) ? "failed" : "success";

    try {
      appendToArray("LOGS", {
        status,
        note: "Auto-logged by evaluator",
        executed_at: new Date().toISOString(),
      });
    } catch (e) {
      // Silently fail — logging isn't critical path
    }

    return true;
  },
};
