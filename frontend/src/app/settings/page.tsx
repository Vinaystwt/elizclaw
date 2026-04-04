'use client';
import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-8 max-w-2xl">
      <div><h1 className="text-[32px] font-bold text-white tracking-tight">Settings</h1><p className="text-[#5a5a70] mt-1.5 text-[15px]">Configure your ElizClaw agent.</p></div>

      {/* Agent */}
      <div className="glass p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-white">Agent Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Model Endpoint</label><input type="text" className="input-field w-full text-[14px]" placeholder="http://localhost:8000/v1" defaultValue="http://localhost:8000/v1" /></div>
          <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Model Name</label><input type="text" className="input-field w-full text-[14px]" placeholder="qwen3.5-27b-awq-4bit" defaultValue="qwen3.5-27b-awq-4bit" /></div>
        </div>
      </div>

      {/* Defaults */}
      <div className="glass p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-white">Task Defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Default Schedule</label>
            <select className="input-field w-full text-[14px]"><option>Daily at 8:00 AM</option><option>Every hour</option><option>Every 6 hours</option><option>Weekly on Monday</option></select>
          </div>
          <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Notifications</label>
            <select className="input-field w-full text-[14px]"><option>Dashboard only</option><option>Email</option><option>Webhook</option></select>
          </div>
        </div>
      </div>

      {/* Danger */}
      <div className="glass p-6 border-rose-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-rose-400">Danger Zone</h2>
            <p className="text-[#5a5a70] text-[14px] mt-0.5">Delete all tasks, logs, and notifications.</p>
          </div>
          <button className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-[14px]">
            <Trash2 className="w-4 h-4" />Clear Data
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className={`btn-primary min-w-[140px] text-[14px] ${saved ? '!bg-emerald-500 !shadow-emerald-500/20' : ''}`}>
          {saved ? <span className="flex items-center gap-2"><Check className="w-4 h-4" />Saved</span> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
