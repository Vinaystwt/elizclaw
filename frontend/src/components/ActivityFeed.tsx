'use client';

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MonoText } from "@/components/ui/MonoText";
import { fetchJson } from "@/lib/api";
import { formatRelativeTime, formatTimestamp } from "@/lib/format";
import type { LogRecord } from "@/lib/types";

type LogsResponse = {
  logs?: LogRecord[];
};

function summarizeLog(log: LogRecord) {
  if (log.output) return log.output.replace(/\s+/g, " ").trim();
  return "Execution recorded";
}

function logTone(status?: string | null) {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  return "accent";
}

export function ActivityFeed() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchJson<LogsResponse>("/api/logs?limit=8");
        if (!active) return;
        setLogs(data.logs || []);
      } catch {
        if (!active) return;
        setLogs([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="surface-row h-[5.5rem] animate-pulse" key={index} />
        ))}
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="subpanel flex min-h-[16rem] flex-col justify-center gap-3 text-center">
        <p className="text-[0.95rem] text-text-primary">No recent executions.</p>
        <p className="mx-auto max-w-[30ch] text-[0.82rem] leading-6 text-text-secondary">
          Live runs will settle here as ElizClaw checks prices, watches wallets, and writes its brief.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log, index) => (
        <article className="surface-row fade-in" key={log.id || `${log.task_name}-${index}`} style={{ animationDelay: `${index * 80}ms` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={logTone(log.status)}>{(log.task_type || log.type || "event").replace(/_/g, " ")}</Badge>
                <MonoText className="text-[0.72rem] uppercase tracking-[0.16em] text-text-muted">
                  {formatTimestamp(log.executed_at)}
                </MonoText>
              </div>
              <p className="text-[0.92rem] leading-7 text-text-primary">{summarizeLog(log)}</p>
              <p className="text-[0.82rem] text-text-secondary">{log.task_name || "Agent task"}</p>
            </div>
            <MonoText className="text-[0.74rem] text-text-muted">{formatRelativeTime(log.executed_at)}</MonoText>
          </div>
        </article>
      ))}
    </div>
  );
}
