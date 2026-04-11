'use client';

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MonoText } from "@/components/ui/MonoText";
import { Panel } from "@/components/ui/Panel";
import { fetchJson } from "@/lib/api";
import { formatRelativeTime, formatTimestamp } from "@/lib/format";
import type { LogRecord } from "@/lib/types";

type LogsResponse = {
  logs?: LogRecord[];
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    fetchJson<LogsResponse>("/api/logs?limit=100")
      .then((data) => {
        if (!active) return;
        setLogs(data.logs || []);
      })
      .catch(() => {
        if (!active) return;
        setLogs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const types = useMemo(() => {
    const names = Array.from(new Set(logs.map((entry) => entry.task_type || entry.type || "event")));
    return ["all", ...names];
  }, [logs]);

  const filtered = logs.filter((entry) => filter === "all" || (entry.task_type || entry.type || "event") === filter);

  return (
    <div className="page-frame route-fade">
      <div className="page-intro">
        <div className="space-y-3">
          <Badge tone="accent">Activity</Badge>
          <div className="space-y-2">
            <h1 className="page-title">Execution history, reduced to the details worth reading.</h1>
            <p className="page-copy">A clean timeline for recent agent work, with type filtering when you want to isolate a signal class.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map((item) => (
          <button className={filter === item ? "button-primary" : "button-ghost"} key={item} onClick={() => setFilter(item)} type="button">
            {item.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="surface-row h-[5rem] animate-pulse" key={index} />
          ))}
        </div>
      ) : filtered.length ? (
        <Panel>
          <div className="space-y-3">
            {filtered.map((entry, index) => (
              <article className="surface-row" key={`${entry.id || index}`} style={index % 2 ? { backgroundColor: "rgba(44, 40, 32, 0.38)" } : undefined}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={entry.status === "failed" ? "danger" : entry.status === "success" ? "success" : "neutral"}>
                        {(entry.task_type || entry.type || "event").replace(/_/g, " ")}
                      </Badge>
                      <MonoText className="text-[0.72rem] uppercase tracking-[0.16em] text-text-muted">{formatTimestamp(entry.executed_at)}</MonoText>
                    </div>
                    <p className="text-[0.95rem] leading-7 text-text-primary">{entry.output || "Execution recorded."}</p>
                    <p className="text-[0.84rem] text-text-secondary">{entry.task_name || "ElizClaw task"}</p>
                  </div>
                  <MonoText className="text-[0.74rem] text-text-muted">{formatRelativeTime(entry.executed_at)}</MonoText>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="space-y-3 text-center">
            <Badge>No activity</Badge>
            <p className="text-[0.95rem] text-text-primary">There are no log entries for this filter.</p>
            <p className="mx-auto max-w-[34ch] text-[0.84rem] leading-6 text-text-secondary">Switch filters or let the agent run a few cycles to fill the timeline.</p>
          </div>
        </Panel>
      )}
    </div>
  );
}
