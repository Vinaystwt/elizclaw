'use client';

import { useEffect, useRef, useState } from "react";
import { DownloadIcon, UploadIcon } from "@/components/Icons";
import { TaskCard } from "@/components/TaskCard";
import { TaskCreator } from "@/components/TaskCreator";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { fetchJson, resolveApiUrl } from "@/lib/api";
import type { TaskRecord } from "@/lib/types";

type TasksResponse = {
  tasks?: TaskRecord[];
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "paused">("all");
  const [importStatus, setImportStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchJson<TasksResponse>("/api/tasks");
        if (!active) return;
        setTasks(data.tasks || []);
      } catch {
        if (!active) return;
        setTasks([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  async function toggleTask(task: TaskRecord) {
    const nextActive = task.is_active ? 0 : 1;
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, is_active: nextActive } : item)));
    try {
      await fetch(resolveApiUrl(`/api/tasks/${task.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
    } catch {
      setTasks((current) => current.map((item) => (item.id === task.id ? task : item)));
    }
  }

  async function deleteTask(id: number) {
    const previous = tasks;
    setTasks((current) => current.filter((task) => task.id !== id));
    try {
      await fetch(resolveApiUrl(`/api/tasks/${id}`), { method: "DELETE" });
    } catch {
      setTasks(previous);
    }
  }

  function exportTasks() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `elizclaw-tasks-${new Date().toISOString().split("T")[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importTasks(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const incoming = JSON.parse(text);
      if (!Array.isArray(incoming)) throw new Error();
      let created = 0;
      for (const task of incoming) {
        const response = await fetch(resolveApiUrl("/api/tasks"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });
        if (response.ok) created += 1;
      }
      setImportStatus(`Imported ${created}/${incoming.length} tasks`);
      const fresh = await fetchJson<TasksResponse>("/api/tasks");
      setTasks(fresh.tasks || []);
    } catch {
      setImportStatus("Import failed. Check the file shape and try again.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      window.setTimeout(() => setImportStatus(""), 3000);
    }
  }

  const filtered = tasks.filter((task) => {
    if (filter === "active") return !!task.is_active;
    if (filter === "completed") return !!task.last_run;
    if (filter === "paused") return !task.is_active;
    return true;
  });

  return (
    <div className="page-frame route-fade">
      <div className="page-intro">
        <div className="space-y-3">
          <Badge tone="accent">Tasks</Badge>
          <div className="space-y-2">
            <h1 className="page-title">Schedule what matters and keep the setup out of the way.</h1>
            <p className="page-copy">The drawer handles creation. The list stays flat, legible, and ready to scan.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="button-ghost" onClick={exportTasks} type="button">
            <DownloadIcon className="h-4 w-4" />
            Export
          </button>
          <button className="button-ghost" onClick={() => fileInputRef.current?.click()} type="button">
            <UploadIcon className="h-4 w-4" />
            Import
          </button>
          <input accept=".json" className="hidden" onChange={importTasks} ref={fileInputRef} type="file" />
          <TaskCreator onCreated={(task) => task && setTasks((current) => [task, ...current])} />
        </div>
      </div>

      {importStatus ? <p className="text-[0.84rem] text-text-secondary">{importStatus}</p> : null}

      <div className="flex flex-wrap gap-2">
        {(["all", "active", "completed", "paused"] as const).map((item) => (
          <button className={filter === item ? "button-primary" : "button-ghost"} key={item} onClick={() => setFilter(item)} type="button">
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="panel-shell h-[10rem] animate-pulse" key={index} />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="space-y-4">
          {filtered.map((task) => (
            <TaskCard key={task.id} onDelete={deleteTask} onToggle={toggleTask} task={task} />
          ))}
        </div>
      ) : (
        <Panel>
          <div className="space-y-3 text-center">
            <Badge>No tasks yet</Badge>
            <p className="text-[0.98rem] text-text-primary">The desk is clear.</p>
            <p className="mx-auto max-w-[34ch] text-[0.88rem] leading-6 text-text-secondary">Open the drawer and add a first monitor, brief, or wallet watch.</p>
          </div>
        </Panel>
      )}
    </div>
  );
}
