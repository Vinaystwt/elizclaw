import { clamp } from "@/lib/format";
import type { ReportRecord } from "@/lib/types";

export function computeAgentHealth(report: ReportRecord | null) {
  if (!report) return 0;

  const successRate = report.successRate ?? 0;
  const uptimeNorm = clamp(Math.min((report.uptime ?? 0) / 86400, 1) * 100, 0, 100);
  const activityNorm = clamp(Math.min((report.tasksRunToday ?? report.todayCount ?? 0) / 10, 1) * 100, 0, 100);

  return Math.round(clamp(successRate * 0.5 + uptimeNorm * 0.3 + activityNorm * 0.2, 0, 100));
}
