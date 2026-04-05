'use client';
import { useState, useEffect } from 'react';
import { Check, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [notifThreshold, setNotifThreshold] = useState('50000');
  const [modelEndpoint, setModelEndpoint] = useState('http://localhost:8000/v1');

  useEffect(() => {
    const s = localStorage.getItem('elizclaw-settings');
    if (s) {
      try {
        const p = JSON.parse(s);
        if (p.notifThreshold) setNotifThreshold(p.notifThreshold);
        if (p.modelEndpoint) setModelEndpoint(p.modelEndpoint);
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('elizclaw-settings', JSON.stringify({ notifThreshold, modelEndpoint }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const accents = ['#6366F1', '#F59E0B', '#10B981', '#EF4444'];

  return (
    <div className="space-y-8 max-w-2xl relative z-10">
      <div>
        <h1 className="text-3xl font-semibold text-[#F1F5F9] tracking-tight">Settings</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Configure your ElizClaw agent.</p>
      </div>

      {/* Agent Configuration */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Agent Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">Model Endpoint</label>
            <input className="input-field w-full text-[13px] font-mono" value={modelEndpoint} onChange={e => setModelEndpoint(e.target.value)} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">Notification Threshold ($)</label>
            <input className="input-field w-full text-[13px] font-mono" type="number" value={notifThreshold} onChange={e => setNotifThreshold(e.target.value)} />
            <p className="text-[11px] text-[#64748B] mt-1">Alert when portfolio changes exceed this amount</p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[#F1F5F9] font-medium">Deep Space</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Current theme</p>
          </div>
          <div className="flex gap-2">
            {accents.map(c => (
              <div key={c} className="w-5 h-5 rounded-full border border-[#1E1E2E]" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">About</h2>
        <div className="space-y-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#94A3B8]">Version</span>
            <span className="text-[#F1F5F9] font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#94A3B8]">Built on</span>
            <span className="text-[#F1F5F9]">ElizaOS v2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#94A3B8]">Compute</span>
            <span className="text-[#F1F5F9]">Nosana GPU Network</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#94A3B8]">Repository</span>
            <a href="https://github.com/Vinaystwt/elizclaw" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[12px]">
              github.com/Vinaystwt/elizclaw <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className={`btn-primary text-[13px] min-w-[120px] ${saved ? '!bg-emerald-600 !shadow-emerald-500/20' : ''}`}>
          {saved ? <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Saved</span> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
