'use client';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch('/api/logs').then(r => r.json()).then(data => { setLogs((data.logs || []).slice(0, 8)); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const ago = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  if (loading) return <div className="animate-shimmer h-32 rounded-xl" />;
  if (logs.length === 0) return <p className="text-[#5a5a70] text-[14px] py-8 text-center">No activity yet</p>;

  return (
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
            {log.output && <p className="text-[12px] text-[#5a5a70] truncate mt-0.5">{log.output.substring(0, 60)}</p>}
          </div>
          <span className="text-[12px] text-[#5a5a70] whitespace-nowrap tabular-nums">{ago(log.executed_at)}</span>
        </div>
      ))}
    </div>
  );
}
