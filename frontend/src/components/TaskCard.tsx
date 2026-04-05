import { useState } from 'react';

const typeIcons: Record<string, string> = { price_monitor: '📊', web_scrape: '🌐', api_call: '🔌', notification: '🔔', custom: '⚙️', wallet_tracker: '💼', whale_watcher: '🐋', signal_monitor: '📡' };
const typeLabels: Record<string, string> = { price_monitor: 'Price Monitor', web_scrape: 'Web Digest', api_call: 'API Call', notification: 'Notification', custom: 'Custom', wallet_tracker: 'Wallet Tracker', whale_watcher: 'Whale Watcher', signal_monitor: 'Signal Monitor' };
const typeBadge: Record<string, string> = { price_monitor: 'badge-violet', web_scrape: 'badge-cyan', api_call: 'badge-amber', notification: 'badge-red', custom: 'badge-violet', wallet_tracker: 'badge-green', whale_watcher: 'badge-blue', signal_monitor: 'badge-purple' };

/**
 * TaskCard — displays a single task with toggle/pause and delete actions.
 * Shows execution status (running/completed/failed) with visual indicators.
 * Delete requires confirmation to prevent accidental removal.
 */
export function TaskCard({ task, onDelete, onToggle }: { task: any; onDelete: (id: number) => void; onToggle: (task: any) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Determine execution status
  const status = task._status || (task.last_run ? 'completed' : 'idle');

  return (
    <div className={`glass glass-hover group p-5 ${!task.is_active ? 'opacity-40' : ''} ${
      status === 'running' ? 'ring-1 ring-amber-400/30' :
      status === 'failed' ? 'ring-1 ring-rose-400/30' : ''
    }`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left side */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300 relative">
            {typeIcons[task.type] || '⚙️'}
            {/* Status indicator dot */}
            {status === 'running' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
            {status === 'completed' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0d0d14]"></span>
            )}
            {status === 'failed' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-[#0d0d14] flex items-center justify-center">
                <span className="text-[8px] text-white leading-none">×</span>
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[15px] text-white truncate">{task.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`badge ${typeBadge[task.type] || 'badge-violet'}`}>
                {typeLabels[task.type] || task.type}
              </span>
              <span className="text-[12px] text-[#5a5a70] flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {task.schedule}
              </span>
              {task.condition && (
                <span className="text-[12px] text-[#5a5a70] flex items-center gap-1">
                  ⚡ {task.condition}
                </span>
              )}
              {/* Execution status badge */}
              {status === 'running' && (
                <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Running
                </span>
              )}
              {status === 'completed' && task.last_run && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  ✓ Completed {new Date(task.last_run).toLocaleTimeString()}
                </span>
              )}
              {status === 'failed' && (
                <span className="text-[11px] text-rose-400 flex items-center gap-1">
                  ✕ Failed
                </span>
              )}
            </div>
            {task.next_run && (
              <p className="text-[12px] text-[#5a5a70] mt-1.5">
                Next run: {new Date(task.next_run).toLocaleString()}
              </p>
            )}
            {task._error && status === 'failed' && (
              <p className="text-[11px] text-rose-400/70 mt-1 truncate" title={task._error}>
                Error: {task._error.substring(0, 100)}
              </p>
            )}
          </div>
        </div>

        {/* Right side — actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(task)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
              task.is_active
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white/[0.04] text-[#5a5a70] hover:bg-white/[0.08]'
            }`}
          >
            {task.is_active ? 'Active' : 'Paused'}
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { onDelete(task.id); setConfirmDelete(false); }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-[12px] font-medium hover:bg-rose-500/30 transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-[#71717a] text-[12px] hover:bg-white/[0.08] transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Delete task"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
