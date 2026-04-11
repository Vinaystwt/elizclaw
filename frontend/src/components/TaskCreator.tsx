'use client';

import { useEffect, useState } from "react";
import { CloseIcon, PlusIcon } from "@/components/Icons";
import { Badge } from "@/components/ui/Badge";
import { fetchJson } from "@/lib/api";
import type { TaskRecord } from "@/lib/types";

const taskTypes = [
  { value: "price_monitor", label: "Price monitor" },
  { value: "wallet_tracker", label: "Wallet tracker" },
  { value: "whale_watcher", label: "Whale watcher" },
  { value: "signal_monitor", label: "Signal brief" },
  { value: "web_scrape", label: "Web digest" },
  { value: "api_call", label: "API call" },
];

const schedules = [
  "Every day at 8:00 AM",
  "Every day at 12:00 PM",
  "Every hour",
  "Every 6 hours",
  "Every week on Monday",
];

export function TaskCreator({ onCreated }: { onCreated?: (task?: TaskRecord) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("price_monitor");
  const [schedule, setSchedule] = useState(schedules[0]);
  const [coin, setCoin] = useState("BTC");
  const [threshold, setThreshold] = useState("");
  const [address, setAddress] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const reset = () => {
    setName("");
    setThreshold("");
    setAddress("");
    setUrl("");
    setError("");
  };

  async function handleSubmit() {
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    let config: Record<string, string> = {};
    if (type === "price_monitor") config = { coin, threshold: threshold || "0" };
    if (type === "wallet_tracker" || type === "whale_watcher") config = { address };
    if (type === "web_scrape" || type === "api_call") config = { url };

    setSubmitting(true);
    try {
      const data = await fetchJson<{ task: TaskRecord }>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          schedule,
          config,
        }),
      });
      onCreated?.(data.task);
      setOpen(false);
      reset();
    } catch {
      setError("Task creation failed. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button className="button-primary" onClick={() => setOpen(true)} type="button">
        <PlusIcon className="h-4 w-4" />
        New task
      </button>

      <div
        aria-hidden={!open}
        className={`drawer-backdrop fixed inset-0 z-[60] transition-opacity duration-300 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div
          className={`absolute inset-y-0 right-0 w-full max-w-[32rem] transform border-l border-border bg-background p-4 shadow-panel backdrop-blur-sm transition-transform duration-500 ease-[var(--ease-drawer)] md:p-6 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="chrome-shell flex h-full flex-col rounded-[2rem] p-[0.38rem]">
            <div className="chrome-core flex h-full flex-col rounded-[1.6rem] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <Badge tone="accent">Command drawer</Badge>
                  <div className="space-y-2">
                    <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-text-primary">Create a new automation</h2>
                    <p className="max-w-[34ch] text-[0.92rem] leading-7 text-text-secondary">
                      Keep the ask plain and practical. The drawer keeps the mechanics out of the way.
                    </p>
                  </div>
                </div>
                <button className="button-ghost !min-h-10 !px-3" onClick={() => setOpen(false)} type="button">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
                {error ? (
                  <div className="rounded-[1.2rem] border border-danger bg-surface-3 px-4 py-3 text-[0.84rem] text-danger">{error}</div>
                ) : null}

                <label className="block space-y-2">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Task name</span>
                  <input className="input-base" onChange={(event) => setName(event.target.value)} placeholder="Morning whale overlap brief" value={name} />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Task type</span>
                    <select className="input-base" onChange={(event) => setType(event.target.value)} value={type}>
                      {taskTypes.map((taskType) => (
                        <option key={taskType.value} value={taskType.value}>
                          {taskType.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Schedule</span>
                    <select className="input-base" onChange={(event) => setSchedule(event.target.value)} value={schedule}>
                      {schedules.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {type === "price_monitor" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Coin</span>
                      <input className="input-base mono" onChange={(event) => setCoin(event.target.value.toUpperCase())} value={coin} />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Alert threshold</span>
                      <input className="input-base mono" onChange={(event) => setThreshold(event.target.value)} placeholder="95000" value={threshold} />
                    </label>
                  </div>
                ) : null}

                {(type === "wallet_tracker" || type === "whale_watcher") ? (
                  <label className="block space-y-2">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Wallet</span>
                    <input className="input-base mono" onChange={(event) => setAddress(event.target.value)} placeholder="Solana address" value={address} />
                  </label>
                ) : null}

                {(type === "web_scrape" || type === "api_call") ? (
                  <label className="block space-y-2">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">URL</span>
                    <input className="input-base mono" onChange={(event) => setUrl(event.target.value)} placeholder="https://..." value={url} />
                  </label>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button className="button-ghost" onClick={() => setOpen(false)} type="button">
                  Cancel
                </button>
                <button className="button-primary" disabled={submitting} onClick={handleSubmit} type="button">
                  {submitting ? "Creating" : "Create task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
