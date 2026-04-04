'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

/**
 * TaskCreator — human-friendly form for creating automation tasks.
 * Replaces raw JSON config with contextual inputs based on task type.
 */
export function TaskCreator({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('price_monitor');
  const [schedule, setSchedule] = useState('every day at 8:00');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Type-specific fields
  const [symbol, setSymbol] = useState('BTC');
  const [threshold, setThreshold] = useState('');
  const [url, setUrl] = useState('');

  const typeOptions = [
    { value: 'price_monitor', label: '📊 Price Monitor' },
    { value: 'web_scrape', label: '🌐 Web Digest' },
    { value: 'api_call', label: '🔌 API Call' },
  ];

  const scheduleOptions = [
    { value: 'every day at 8:00', label: 'Daily — 8:00 AM' },
    { value: 'every hour', label: 'Every hour' },
    { value: 'every 6 hours', label: 'Every 6 hours' },
    { value: 'every week on monday at 9:00', label: 'Weekly — Monday 9 AM' },
  ];

  const resetForm = () => {
    setName(''); setSymbol('BTC'); setThreshold(''); setUrl(''); setError(''); setDone(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Build config based on type
    const config: Record<string, any> = {};
    if (type === 'price_monitor') {
      config.symbol = symbol;
      if (threshold) config.threshold = parseFloat(threshold);
    } else if (type === 'web_scrape' || type === 'api_call') {
      if (!url) { setError('URL is required for this task type.'); setSubmitting(false); return; }
      config.url = url;
    }

    const taskName = name || `${type === 'price_monitor' ? `${symbol} Price Monitor` : type === 'web_scrape' ? 'Web Digest' : 'API Monitor'}`;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: taskName, type, schedule, config }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      setDone(true);
      resetForm();
      setTimeout(() => { setOpen(false); onCreated?.(); }, 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-[14px]">
        <Plus className="w-4 h-4" />New Task
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-up" onClick={() => { setOpen(false); resetForm(); }}>
      <div className="glass w-full max-w-lg p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Create Task</h2>
          <button onClick={() => { setOpen(false); resetForm(); }} className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#71717a] hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-16 text-center animate-fade-up">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/10 flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-white font-medium">Task created!</p>
            <p className="text-[#5a5a70] text-[14px] mt-1">It&apos;ll start running on schedule.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Name <span className="text-[#5a5a70]">(optional)</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Auto-generated from type" className="input-field w-full text-[14px]" />
            </div>

            {/* Type + Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="input-field w-full text-[14px]">
                  {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Schedule</label>
                <select value={schedule} onChange={e => setSchedule(e.target.value)} className="input-field w-full text-[14px]">
                  {scheduleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {/* Price Monitor fields */}
            {type === 'price_monitor' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Coin</label>
                  <select value={symbol} onChange={e => setSymbol(e.target.value)} className="input-field w-full text-[14px]">
                    {['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'AVAX', 'BNB', 'XRP'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">Alert threshold <span className="text-[#5a5a70]">(optional)</span></label>
                  <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="e.g. 100000" className="input-field w-full text-[14px]" />
                </div>
              </div>
            )}

            {/* Web Digest / API Call fields */}
            {(type === 'web_scrape' || type === 'api_call') && (
              <div>
                <label className="block text-[13px] font-medium text-[#a1a1b5] mb-1.5">URL</label>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="input-field w-full text-[14px]" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5 text-[13px] text-rose-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button type="button" onClick={() => { setOpen(false); resetForm(); }} className="btn-ghost text-[14px]">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary text-[14px] disabled:opacity-40">
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
