'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export function TaskCreator({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('price_monitor');
  const [schedule, setSchedule] = useState('every day at 8:00');
  const [config, setConfig] = useState('');
  const [condition, setCondition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const taskData = {
      name: name || `${type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} Task`,
      type, schedule,
      config: config ? JSON.parse(config.startsWith('{') ? config : `{${config}}`) : {},
      condition: condition || null,
    };
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskData) });
      if (res.ok) { setDone(true); setName(''); setConfig(''); setCondition(''); setTimeout(() => { setDone(false); setOpen(false); onCreated?.(); }, 1200); }
    } catch { console.error('Failed'); } finally { setSubmitting(false); }
  };

  if (!open) return <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-[14px]"><Plus className="w-4 h-4" />New Task</button>;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-up" onClick={() => setOpen(false)}>
      <div className="glass w-full max-w-lg p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Create Task</h2>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#71717a] hover:text-white transition-all"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/10 flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-white font-medium">Task created!</p>
            <p className="text-[#5a5a70] text-[14px] mt-1">It'll start running on schedule.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BTC Price Monitor" className="input-field w-full text-[14px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="input-field w-full text-[14px]"><option value="price_monitor">📊 Price Monitor</option><option value="web_scrape">🌐 Web Digest</option><option value="api_call">🔌 API Call</option><option value="custom">⚙️ Custom</option></select>
              </div>
              <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Schedule</label>
                <select value={schedule} onChange={e => setSchedule(e.target.value)} className="input-field w-full text-[14px]">
                  <option value="every day at 8:00">Daily 8:00 AM</option><option value="every hour">Every hour</option><option value="every 6 hours">Every 6 hours</option><option value="every week on monday at 9:00">Weekly</option>
                </select>
              </div>
            </div>
            <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Config (JSON)</label><textarea value={config} onChange={e => setConfig(e.target.value)} placeholder='{"symbol": "BTC", "threshold": 100000}' className="input-field w-full h-[72px] resize-none font-mono text-[13px]" /></div>
            <div><label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Condition</label><input type="text" value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g. price > 100000" className="input-field w-full text-[14px]" /></div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-[14px]">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary text-[14px] disabled:opacity-40">{submitting ? 'Creating...' : 'Create Task'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
