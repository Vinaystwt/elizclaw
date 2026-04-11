'use client';

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MonoText } from "@/components/ui/MonoText";
import { fetchJson } from "@/lib/api";
import { formatCurrency, formatRelativeTime, truncateMiddle } from "@/lib/format";
import type { LogRecord } from "@/lib/types";

type LogsResponse = {
  logs?: LogRecord[];
};

type WhaleEvent = {
  direction: "IN" | "OUT";
  amountLabel: string;
  wallet: string;
  time: string | null | undefined;
};

function extractWhaleEvents(logs: LogRecord[]) {
  return logs
    .filter((entry) => entry.task_type === "whale_watcher" || /whale/i.test(entry.task_name || ""))
    .map<WhaleEvent>((entry) => {
      const output = entry.output || "";
      const direction = /out/i.test(output) ? "OUT" : "IN";
      const amount = output.match(/\$([\d,.]+)/)?.[1];
      return {
        direction,
        amountLabel: amount ? formatCurrency(Number(amount.replace(/,/g, ""))) : output.split(".")[0] || "Whale activity detected",
        wallet: entry.task_name || "Tracked wallet",
        time: entry.executed_at,
      };
    });
}

export function WhaleTimeline() {
  const [events, setEvents] = useState<WhaleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchJson<LogsResponse>("/api/logs?limit=18");
        if (!active) return;
        setEvents(extractWhaleEvents(data.logs || []));
      } catch {
        if (!active) return;
        setEvents([]);
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
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="surface-row h-[4.75rem] animate-pulse" key={index} />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="subpanel flex min-h-[11rem] flex-col justify-center gap-2 text-center">
        <p className="text-[0.94rem] text-text-primary">No whale movement yet.</p>
        <p className="mx-auto max-w-[34ch] text-[0.82rem] leading-6 text-text-secondary">
          Tracked wallets will surface here as soon as the agent spots a notable transfer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <article className="surface-row fade-in" key={`${event.wallet}-${event.time}-${index}`} style={{ animationDelay: `${index * 80}ms` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={event.direction === "IN" ? "success" : "danger"}>{event.direction}</Badge>
                <MonoText className="text-[0.72rem] uppercase tracking-[0.16em] text-text-muted">
                  {formatRelativeTime(event.time)}
                </MonoText>
              </div>
              <MonoText className="block text-[0.98rem] text-text-primary">{event.amountLabel}</MonoText>
              <MonoText className="text-[0.8rem] text-text-secondary">{truncateMiddle(event.wallet, 6, 4)}</MonoText>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
