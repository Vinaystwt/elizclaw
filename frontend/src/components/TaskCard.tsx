import { useState } from 'react';

/**
 * TaskCard — displays a single task with status indicators.
 * Redesigned with design system: colored left border by status, clean typography.
 */
export function TaskCard({ task, onDelete, onToggle }: { task: any; onDelete: (id: number) => void; onToggle: (task: any) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = task._status || (task.last_run ? 'completed' : task.is_active ? 'active' : 'paused');

  const borderColor = {
    active: 'border-l-indigo-500',
    completed: 'border-l-emerald-500',
    failed: 'border-l-red-500',
    running: 'border-l-amber-500',
    paused: 'border-l-[#1E1E2E]',
  }[status] || 'border-l-[#1E1E2E]';

  const statusBadge = {
    active: <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">Active</span>,
    completed: <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Completed</span>,
    failed: <span className="text-[10px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">Failed</span>,
    running: <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"><svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Running</span>,
    paused: <span className="text-[10px] font-medium text-[#64748B] bg-white/[0.04] border border-[#1E1E2E] px-1.5 py-0.5 rounded">Paused</span>,
  }[status];

  const typeIcons: Record<string, string> = { price_monitor: '📊', web_scrape: '🌐', api_call: '🔌', notification: '🔔', custom: '⚙️', wallet_tracker: '💼', whale_watcher: '🐋', signal_monitor: '📡' };
  const typeLabels: Record<string, string> = { price_monitor: 'Price Monitor', web_scrape: 'Web Digest', api_call: 'API Call', notification: 'Notification', custom: 'Custom', wallet_tracker: 'Wallet Tracker', whale_watcher: 'Whale Watcher', signal_monitor: 'Signal Monitor' };

  return (
    <div className={`card glass-hover border-l-[3px] ${borderColor} ${!task.is_active ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] flex items-center justify-center text-lg flex-shrink-0">
            {typeIcons[task.type] || '⚙️'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[14px] text-[#F1F5F9] truncate">{task.name}</h3>
              {statusBadge}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="text-[11px] font-mono text-[#94A3B8]">{task.schedule}</span>
              {task.last_run && (
                <span className="text-[11px] text-[#64748B]">Last: {new Date(task.last_run).toLocaleString()}</span>
              )}
              {task.next_run && (
                <span className="text-[11px] text-[#64748B]">Next: {new Date(task.next_run).toLocaleString()}</span>
              )}
            </div>
            {task._error && status === 'failed' && (
              <p className="text-[11px] text-red-400/70 mt-1 truncate" title={task._error}>Error: {task._error.substring(0, 100)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(task)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              task.is_active
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08] border border-[#1E1E2E]'
            }`}
          >
            {task.is_active ? 'Active' : 'Paused'}
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => { onDelete(task.id); setConfirmDelete(false); }} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/30 transition-all">Confirm</button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded bg-white/[0.04] text-[#64748B] text-[11px] hover:bg-white/[0.08] transition-all">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              title="Delete task"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
