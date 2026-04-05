'use client';
import { useEffect, useState } from 'react';

/**
 * ActivityFeed — shows recent task executions with status indicators.
 * Auto-refreshes every 30 seconds to reflect new activity.
 */

const icons: Record<string, string> = { success: '✓', failed: '✕', running: '◌', skipped: '↷' };
const dotColors: Record<string, string> = {
  success: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
  failed: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]',
  running: 'bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.5)] animate-pulse',
  skipped: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
};

export function ActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLogs = () => {
    fetch('/api/logs')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setLogs((data.logs || []).slice(0, 8)); setLoading(false); setError(false); })
      .catch(() => { setLoading(false); setError(true); });
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30_000);
    return () => clearInterval(interval);
  }, []);

  const ago = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3.5 py-3 px-3">
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] animate-pulse" />
            <div className="flex-1 h-4 bg-white/[0.04] rounded animate-pulse" />
            <div className="w-12 h-3 bg-white/[0.04] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-[#5a5a70] text-[14px]">Could not load activity.</p>
        <button onClick={fetchLogs} className="mt-2 text-violet-400 text-[13px] hover:text-violet-300 transition-colors">
          Try again
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
          <span className="text-lg">📋</span>
        </div>
        <p className="text-[#5a5a70] text-[14px]">No activity yet. Tasks will appear here when they run.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with live indicator */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-white">Recent Activity</h3>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* Activity list */}
      <div className="space-y-1">
      {logs.map((log, i) => (
        <div key={log.id || i} className="group flex items-center gap-3.5 py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-all duration-200">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 ${dotColors[log.status] || dotColors.skipped}`}>
            {icons[log.status] || '·'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#d4d4de] truncate group-hover:text-white transition-colors">
              {log.task_name || log.task_type || 'Unnamed task'}
            </p>
            {log.output && (
              <p className="text-[12px] text-[#5a5a70] truncate mt-0.5" title={log.output}>
                {log.output.substring(0, 60)}
              </p>
            )}
          </div>
          <span className="text-[12px] text-[#5a5a70] whitespace-nowrap tabular-nums">
            {ago(log.executed_at)}
          </span>
        </div>
      ))}
    </div>
    </div>
  );
}
