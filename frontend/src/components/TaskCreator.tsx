'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';

const coins = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'AVAX', 'BNB', 'XRP'];
const taskTypes = ['price_monitor', 'wallet_tracker', 'whale_watcher', 'signal_monitor', 'web_scrape', 'api_call'];

export function TaskCreator({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('price_monitor');
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('Every day at 8:00 AM');
  const [coin, setCoin] = useState('BTC');
  const [threshold, setThreshold] = useState('');
  const [url, setUrl] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setName(''); setThreshold(''); setUrl(''); setAddress(''); setError(''); };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }

    let config: Record<string, string> = {};
    if (type === 'price_monitor') config = { coin, threshold: threshold || '0' };
    if (type === 'wallet_tracker') config = { address };
    if (type === 'web_scrape' || type === 'api_call') config = { url };

    try {
      setSubmitting(true);
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type, schedule, config }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      setOpen(false);
      reset();
      onCreated?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-primary text-[13px] flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New Task</button>;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#F1F5F9] mb-4">New Task</h3>

        {error && <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">Task Name</label>
            <input className="input-field w-full text-[13px]" placeholder="e.g., BTC price check" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">Type</label>
            <select className="input-field w-full text-[13px]" value={type} onChange={e => setType(e.target.value)}>
              {taskTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>

          {type === 'price_monitor' && (
            <>
              <div>
                <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">Coin</label>
                <select className="input-field w-full text-[13px]" value={coin} onChange={e => setCoin(e.target.value)}>
                  {coins.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">Alert Threshold ($)</label>
                <input className="input-field w-full text-[13px]" type="number" placeholder="e.g., 100000" value={threshold} onChange={e => setThreshold(e.target.value)} />
              </div>
            </>
          )}

          {type === 'wallet_tracker' && (
            <div>
              <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">Wallet Address</label>
              <input className="input-field w-full text-[13px] font-mono" placeholder="Solana address..." value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          )}

          {(type === 'web_scrape' || type === 'api_call') && (
            <div>
              <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">URL</label>
              <input className="input-field w-full text-[13px] font-mono" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-[#94A3B8] mb-1">Schedule</label>
            <select className="input-field w-full text-[13px]" value={schedule} onChange={e => setSchedule(e.target.value)}>
              <option>Every day at 8:00 AM</option>
              <option>Every day at 12:00 PM</option>
              <option>Every hour</option>
              <option>Every 6 hours</option>
              <option>Every week on Monday</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={() => { setOpen(false); reset(); }} className="btn-ghost flex-1 text-[13px]">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 text-[13px] disabled:opacity-50">{submitting ? 'Creating...' : 'Create Task'}</button>
        </div>
      </div>
    </div>
  );
}
