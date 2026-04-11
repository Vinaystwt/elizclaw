'use client';

import { useEffect, useState } from "react";
import { DownloadIcon } from "@/components/Icons";
import { Badge } from "@/components/ui/Badge";
import { MonoText } from "@/components/ui/MonoText";
import { Panel } from "@/components/ui/Panel";
import { fetchText } from "@/lib/api";

export default function SettingsPage() {
  const [notifThreshold, setNotifThreshold] = useState("50000");
  const [modelEndpoint, setModelEndpoint] = useState("http://localhost:8000/v1");
  const [saved, setSaved] = useState(false);
  const [exportState, setExportState] = useState("");

  useEffect(() => {
    const savedSettings = localStorage.getItem("elizclaw-settings");
    if (!savedSettings) return;
    try {
      const parsed = JSON.parse(savedSettings);
      if (parsed.notifThreshold) setNotifThreshold(parsed.notifThreshold);
      if (parsed.modelEndpoint) setModelEndpoint(parsed.modelEndpoint);
    } catch {
      return;
    }
  }, []);

  function saveSettings() {
    localStorage.setItem("elizclaw-settings", JSON.stringify({ notifThreshold, modelEndpoint }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  async function exportConfig() {
    try {
      const text = await fetchText("/api/export-config");
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "elizclaw-deploy-config.txt";
      anchor.click();
      URL.revokeObjectURL(url);
      setExportState("Deploy config exported.");
    } catch {
      setExportState("Export failed. The server did not return config text.");
    } finally {
      window.setTimeout(() => setExportState(""), 2600);
    }
  }

  return (
    <div className="page-frame route-fade max-w-[58rem]">
      <div className="page-intro">
        <div className="space-y-3">
          <Badge tone="accent">Settings</Badge>
          <div className="space-y-2">
            <h1 className="page-title">Quiet controls, no noise.</h1>
            <p className="page-copy">These settings stay functional and on-brand, with the deploy export one click away.</p>
          </div>
        </div>
      </div>

      <Panel>
        <div className="space-y-5">
          <Badge>Agent config</Badge>
          <label className="block space-y-2">
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Model endpoint</span>
            <input className="input-base mono" onChange={(event) => setModelEndpoint(event.target.value)} value={modelEndpoint} />
          </label>
          <label className="block space-y-2">
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Notification threshold</span>
            <input className="input-base mono" onChange={(event) => setNotifThreshold(event.target.value)} value={notifThreshold} />
          </label>
        </div>
      </Panel>

      <Panel>
        <div className="space-y-5">
          <Badge>Deploy</Badge>
          <p className="max-w-[40ch] text-[0.94rem] leading-7 text-text-secondary">
            Download the single-file deployment template when you need to stand up the agent elsewhere.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button className="button-secondary" onClick={exportConfig} type="button">
              <DownloadIcon className="h-4 w-4" />
              Export config
            </button>
            {exportState ? <p className="text-[0.84rem] text-text-secondary">{exportState}</p> : null}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="space-y-5">
          <Badge>About</Badge>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="surface-row">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Version</p>
              <MonoText className="pt-2 text-[1rem] text-text-primary">1.0.0</MonoText>
            </div>
            <div className="surface-row">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Compute</p>
              <p className="pt-2 text-[1rem] text-text-primary">Nosana GPU Network</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button className={saved ? "button-primary" : "button-secondary"} onClick={saveSettings} type="button">
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
