'use client';

import { useEffect, useMemo, useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ChatWindow } from "@/components/ChatWindow";
import { RefreshIcon } from "@/components/Icons";
import { StatCard } from "@/components/StatCard";
import { TaskCreator } from "@/components/TaskCreator";
import { WhaleTimeline } from "@/components/WhaleTimeline";
import { Badge } from "@/components/ui/Badge";
import { Divider } from "@/components/ui/Divider";
import { LiveDot } from "@/components/ui/LiveDot";
import { MonoText } from "@/components/ui/MonoText";
import { Panel } from "@/components/ui/Panel";
import { fetchJson } from "@/lib/api";
import { clamp, formatDateStamp, formatDuration, formatTimestamp } from "@/lib/format";
import type { DigestRecord, LogRecord, ReportRecord, TaskRecord } from "@/lib/types";

type DashboardPayload = {
  digest: DigestRecord | null;
  report: ReportRecord | null;
  logs: LogRecord[];
  tasks: TaskRecord[];
};

type DashboardState = DashboardPayload & {
  loading: boolean;
};

function computeHealth(report: ReportRecord | null, logs: LogRecord[]) {
  const successRate = report?.successRate ?? 0;
  const uptimeNorm = clamp(((report?.uptime ?? 0) / (60 * 60 * 12)) * 100, 0, 100);
  const activityNorm = clamp(logs.length * 12, 0, 100);
  return Math.round(clamp(successRate * 0.5 + uptimeNorm * 0.3 + activityNorm * 0.2, 0, 100));
}

function digestLines(digest: DigestRecord | null, tasks: TaskRecord[], logs: LogRecord[]) {
  const output = digest?.brief || "";
  const marketLine = output.match(/MARKET:\s*(.+)/i)?.[1] || "The market line is still forming.";
  const whaleLine = output.match(/WHALE ACTIVITY:\s*(.+)/i)?.[1] || `${logs.filter((entry) => entry.task_type === "whale_watcher").length} whale checks recorded`;
  const tasksLine = output.match(/YOUR TASKS:\s*(.+)/i)?.[1] || `${tasks.filter((task) => task.is_active).length} active tasks on the desk`;
  const alertLine = digest?.topAlert || output.match(/TOP ALERT:\s*(.+)/i)?.[1] || "No top alert recorded yet.";
  return { marketLine, whaleLine, tasksLine, alertLine };
}

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({
    digest: null,
    report: null,
    logs: [],
    tasks: [],
    loading: true,
  });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [digestResponse, reportResponse, logsResponse, tasksResponse] = await Promise.all([
          fetchJson<{ digest: DigestRecord | null }>("/api/digest"),
          fetchJson<{ report: ReportRecord | null }>("/api/report"),
          fetchJson<{ logs?: LogRecord[] }>("/api/logs?limit=12"),
          fetchJson<{ tasks?: TaskRecord[] }>("/api/tasks"),
        ]);

        if (!active) return;
        setState({
          digest: digestResponse.digest,
          report: reportResponse.report,
          logs: logsResponse.logs || [],
          tasks: tasksResponse.tasks || [],
          loading: false,
        });
      } catch {
        if (!active) return;
        setState((current) => ({ ...current, loading: false }));
      }
    };

    load();
    const digestTimer = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(digestTimer);
    };
  }, []);

  const metrics = useMemo(() => {
    const health = computeHealth(state.report, state.logs);
    const lastExecution = state.logs[0]?.executed_at || null;
    const activeTasks = state.tasks.filter((task) => task.is_active).length;
    return {
      health,
      activeTasks,
      uptime: formatDuration(state.report?.uptime),
      lastExecution: formatTimestamp(lastExecution),
    };
  }, [state.logs, state.report, state.tasks]);

  const summary = digestLines(state.digest, state.tasks, state.logs);

  return (
    <div className="page-frame route-fade">
      <div className="page-intro">
        <div className="space-y-3">
          <Badge tone="accent">Morning desk</Badge>
          <div className="space-y-2">
            <h1 className="page-title">A calm intelligence layer for what changed and what needs attention.</h1>
            <p className="page-copy">
              The top of the desk briefs you. The lower half shows the agent quietly working through your live watch.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="button-ghost" onClick={() => window.location.reload()} type="button">
            <RefreshIcon className="h-4 w-4" />
            Refresh
          </button>
          <TaskCreator />
        </div>
      </div>

      <div className="stagger-children space-y-6">
        <Panel>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone="accent">Signal digest</Badge>
              <MonoText className="text-[0.78rem] uppercase tracking-[0.18em] text-text-secondary">{formatDateStamp(state.digest?.timestamp || now.toISOString())}</MonoText>
            </div>
            {state.loading ? (
              <div className="space-y-3">
                <div className="h-6 w-2/5 rounded-full bg-surface-2 animate-pulse" />
                <div className="h-20 rounded-[1.2rem] bg-surface-2 animate-pulse" />
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <div className="space-y-4">
                  <p className="max-w-[60ch] text-[1.02rem] leading-8 text-text-primary">
                    {state.digest?.brief
                      ? state.digest.brief.split("\n\n")[0]
                      : "The first morning digest will appear here once ElizClaw has enough signals to brief."}
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="surface-row">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Market line</p>
                    <p className="pt-2 text-[0.92rem] leading-7 text-text-primary">{summary.marketLine}</p>
                  </div>
                  <div className="surface-row">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Whale activity</p>
                    <p className="pt-2 text-[0.92rem] leading-7 text-text-primary">{summary.whaleLine}</p>
                  </div>
                  <div className="surface-row">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Task line</p>
                    <p className="pt-2 text-[0.92rem] leading-7 text-text-primary">{summary.tasksLine}</p>
                  </div>
                  <div className="surface-row">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Top alert</p>
                    <p className="pt-2 text-[0.92rem] leading-7 text-text-primary">{summary.alertLine}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LiveDot />
                <Badge>Agent status</Badge>
              </div>
              <MonoText className="text-[0.76rem] uppercase tracking-[0.18em] text-text-secondary">{formatTimestamp(now.toISOString())}</MonoText>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard detail="Synthetic score from success, uptime, and recent activity." label="Agent health" value={`${metrics.health}/100`} />
              <StatCard detail="Live runtime reported by the server." label="Uptime" value={metrics.uptime} />
              <StatCard detail="Active tasks currently under watch." label="Tasks active" value={`${metrics.activeTasks}`} />
              <StatCard detail="Most recent recorded execution." label="Last execution" value={metrics.lastExecution} />
            </div>
          </div>
        </Panel>

        <div className="section-grid">
          <Panel className="h-full">
            <ChatWindow />
          </Panel>

          <Panel className="h-full">
            <div className="space-y-5">
              <div className="space-y-2">
                <Badge>Live activity</Badge>
                <p className="max-w-[36ch] text-[0.86rem] leading-6 text-text-secondary">
                  Recent runs and monitored whale moves. Both surfaces refresh every half minute.
                </p>
              </div>
              <ActivityFeed />
              <Divider />
              <div className="space-y-3">
                <Badge>Whale timeline</Badge>
                <WhaleTimeline />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
