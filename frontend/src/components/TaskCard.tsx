'use client';

import { Badge } from "@/components/ui/Badge";
import { MonoText } from "@/components/ui/MonoText";
import { Panel } from "@/components/ui/Panel";
import { formatTimestamp } from "@/lib/format";
import type { TaskRecord } from "@/lib/types";

function getTaskStatus(task: TaskRecord) {
  if (task._status) return task._status;
  if (task._error) return "failed";
  if (task.last_run) return "completed";
  return task.is_active ? "active" : "paused";
}

function statusTone(status: string) {
  if (status === "failed") return "danger";
  if (status === "completed" || status === "active") return "success";
  return "neutral";
}

export function TaskCard({
  task,
  onDelete,
  onToggle,
}: {
  task: TaskRecord;
  onDelete: (id: number) => void;
  onToggle: (task: TaskRecord) => void;
}) {
  const status = getTaskStatus(task);

  return (
    <Panel innerClassName="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(status)}>{status}</Badge>
            <Badge>{task.type.replace(/_/g, " ")}</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-[1.06rem] font-semibold tracking-[-0.03em] text-text-primary">{task.name}</h3>
            <MonoText className="block text-[0.8rem] uppercase tracking-[0.18em] text-text-secondary">{task.schedule}</MonoText>
          </div>
          <div className="grid gap-2 text-[0.84rem] text-text-secondary md:grid-cols-2">
            <p>
              Last run:{" "}
              <MonoText className="text-[0.82rem] text-text-primary">{formatTimestamp(task.last_run)}</MonoText>
            </p>
            <p>
              Next run:{" "}
              <MonoText className="text-[0.82rem] text-text-primary">{formatTimestamp(task.next_run)}</MonoText>
            </p>
          </div>
          {task._error ? <p className="text-[0.82rem] leading-6 text-danger">{task._error}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <button className={task.is_active ? "button-primary" : "button-secondary"} onClick={() => onToggle(task)} type="button">
            {task.is_active ? "Active" : "Paused"}
          </button>
          <button className="button-ghost" onClick={() => onDelete(task.id)} type="button">
            Remove
          </button>
        </div>
      </div>
    </Panel>
  );
}
