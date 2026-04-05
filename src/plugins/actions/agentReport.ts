/**
 * Agent Self-Report — reads execution history and generates a first-person
 * performance summary. Shows success rate, total tasks, failures, uptime.
 *
 * Trigger: "how are you performing", "your performance", "self report",
 *          "status report", "how are you doing"
 */
import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getStore } from "../store.ts";

export const agentReportAction: Action = {
  name: "AGENT_REPORT",
  similes: ["SELF_REPORT", "PERFORMANCE_REPORT", "STATUS_REPORT"],
  description: "Generate a first-person performance report of the agent's execution history",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content as any)?.text || "";
    const lower = text.toLowerCase();
    return /how are you (performing|doing)|your performance|self report|status report/i.test(lower);
  },

  handler: async (_runtime: IAgentRuntime, _message: Memory, _state: State, _options: any, callback: any) => {
    const store = getStore<Record<string, any>>("LOGS") || {};
    // Support both array stored as LOGS key and nested structure
    const logs = Array.isArray(store) ? store : (getStore("LOGS") || []);
    const tasks = getStore<any[]>("TASKS") || [];

    const totalExecuted = logs.length;
    const successful = logs.filter((l: any) => l.status === "success").length;
    const failed = logs.filter((l: any) => l.status === "failed").length;
    const successRate = totalExecuted > 0 ? ((successful / totalExecuted) * 100).toFixed(1) : "0";

    // Most used feature
    const typeCounts: Record<string, number> = {};
    logs.forEach((l: any) => {
      const type = l.type || l.task_type || "unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const mostUsed = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    const mostUsedName = mostUsed ? mostUsed[0].replace(/_/g, " ") : "none yet";
    const mostUsedCount = mostUsed ? mostUsed[1] : 0;

    // Recent failures
    const recentFailures = logs.filter((l: any) => l.status === "failed").slice(-3);

    // Active tasks
    const activeTasks = tasks.filter((t: any) => t.is_active).length;

    // Build report
    let report = `📊 **Performance Report**\n\n`;
    report += `I've executed **${totalExecuted} task${totalExecuted !== 1 ? 's' : ''}** so far — `;
    report += `${successful} success${successful !== 1 ? 'es' : ''}, `;
    report += `${failed} failure${failed !== 1 ? 's' : ''}. `;
    report += `That's a **${successRate}% success rate**.\n\n`;

    report += `Most used feature: **${mostUsedName}** (${mostUsedCount} times)\n`;
    report += `Currently monitoring: **${activeTasks} active task${activeTasks !== 1 ? 's' : ''}**\n`;

    if (recentFailures.length > 0) {
      report += `\n⚠️ Recent issues:\n`;
      recentFailures.forEach((f: any) => {
        const taskName = tasks.find((t: any) => t.id === f.task_id)?.name || `Task #${f.task_id}`;
        report += `• ${taskName}: ${(f.output || "Unknown error").substring(0, 80)}\n`;
      });
    } else if (failed === 0) {
      report += `\n✅ No failures — running clean.`;
    }

    callback({ text: report });
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "How are you performing?" } },
      { user: "ElizClaw", content: { text: "Checking my stats...", action: "AGENT_REPORT" } },
    ],
  ],
};
