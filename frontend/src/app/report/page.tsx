'use client';

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MonoText } from "@/components/ui/MonoText";
import { Panel } from "@/components/ui/Panel";
import { fetchJson } from "@/lib/api";
import { formatDuration, formatTimestamp } from "@/lib/format";
import { computeAgentHealth } from "@/lib/health";
import type { ReportRecord } from "@/lib/types";

type ReportResponse = {
  report: ReportRecord | null;
};

export default function ReportPage() {
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let active = true;
    fetchJson<ReportResponse>("/api/report")
      .then((data) => {
        if (!active) return;
        setReport(data.report);
      })
      .catch(() => {
        if (!active) return;
        setReport(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const health = useMemo(() => computeAgentHealth(report), [report]);

  useEffect(() => {
    if (!health) {
      setDisplayScore(0);
      return;
    }
    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 1;
      const next = Math.min(health, Math.round((health / 18) * frame));
      setDisplayScore(next);
      if (next >= health) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [health]);

  if (!loading && !report) {
    return (
      <div className="page-frame route-fade">
        <Panel>
          <div className="space-y-3 text-center">
            <Badge tone="accent">Report</Badge>
            <p className="text-[1rem] text-text-primary">Ask ElizClaw “How are you performing?” to generate your first report.</p>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="page-frame route-fade">
      <div className="page-intro">
        <div className="space-y-3">
          <Badge tone="accent">Report</Badge>
          <div className="space-y-2">
            <h1 className="page-title">A clinical read on how the agent is holding up.</h1>
            <p className="page-copy">One headline score, then the details that explain it.</p>
          </div>
        </div>
      </div>

      <Panel className={health > 85 ? "shadow-glow" : undefined}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
          <div className="space-y-4">
            <Badge>Agent health</Badge>
            <div className="flex items-end gap-3">
              <MonoText className="text-[5rem] font-medium tracking-[-0.08em] text-text-primary md:text-[6.4rem]">{displayScore}</MonoText>
              <MonoText className="pb-4 text-[1.2rem] text-text-secondary">/100</MonoText>
            </div>
            <p className="max-w-[36ch] text-[0.94rem] leading-7 text-text-secondary">
              Success rate, uptime, and recent work volume condensed into one desk-level score.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="surface-row">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Most used action</p>
              <p className="pt-2 text-[0.98rem] text-text-primary">{report?.mostUsedAction || report?.mostUsedName || "No action yet"}</p>
            </div>
            <div className="surface-row">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Uptime</p>
              <MonoText className="pt-2 block text-[0.98rem] text-text-primary">{formatDuration(report?.uptime)}</MonoText>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Panel innerClassName="space-y-2">
          <Badge>Success rate</Badge>
          <MonoText className="text-[1.8rem] text-text-primary">{report?.successRate ?? 0}%</MonoText>
        </Panel>
        <Panel innerClassName="space-y-2">
          <Badge>Total tasks run</Badge>
          <MonoText className="text-[1.8rem] text-text-primary">{report?.totalTasks ?? report?.totalExecuted ?? 0}</MonoText>
        </Panel>
        <Panel innerClassName="space-y-2">
          <Badge>Most used action</Badge>
          <p className="text-[1rem] text-text-primary">{report?.mostUsedAction || report?.mostUsedName || "—"}</p>
        </Panel>
        <Panel innerClassName="space-y-2">
          <Badge>Uptime</Badge>
          <MonoText className="text-[1.8rem] text-text-primary">{formatDuration(report?.uptime)}</MonoText>
        </Panel>
        <Panel innerClassName="space-y-2">
          <Badge>Tasks today</Badge>
          <MonoText className="text-[1.8rem] text-text-primary">{report?.tasksRunToday ?? report?.todayCount ?? report?.activeTasks ?? 0}</MonoText>
        </Panel>
      </div>

      <Panel>
        <div className="space-y-4">
          <Badge>Recent failures</Badge>
          {report?.recentFailures?.length ? (
            <div className="space-y-3">
              {report.recentFailures.map((failure, index) => (
                <article className="surface-row" key={`${failure.taskName}-${index}`}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-[0.95rem] text-text-primary">{failure.task || failure.taskName || "Task failure"}</p>
                      <p className="text-[0.84rem] leading-6 text-danger">{failure.error || failure.output || "Unknown failure"}</p>
                    </div>
                    <MonoText className="text-[0.74rem] text-text-muted">{formatTimestamp(failure.time || failure.executed_at)}</MonoText>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-row">
              <p className="text-[0.95rem] text-text-primary">No failures recorded.</p>
              <p className="pt-2 text-[0.84rem] text-success">The current run history is clean.</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
