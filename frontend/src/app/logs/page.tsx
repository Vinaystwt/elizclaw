'use client';
import { useEffect, useState } from 'react';

const icons: Record<string, string> = { success: '✓', failed: '✕', running: '◌', skipped: '↷' };
const badgeClass: Record<string, string> = { success: 'badge-green', failed: 'badge-red', running: 'badge-violet', skipped: 'badge-amber' };

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetch('/api/logs').then(r => r.json()).then(data => { setLogs(data.logs || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.status === filter);
  const filterOptions = ['all', 'success', 'failed', 'running'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-bold text-white tracking-tight">Activity</h1>
        <p className="text-[#5a5a70] mt-1.5 text-[15px]">Complete execution history for all tasks.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filterOptions.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 ${filter === f ? 'bg-violet-500/15 text-violet-400 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]' : 'bg-white/[0.03] text-[#5a5a70] hover:bg-white/[0.06] hover:text-[#a1a1b5]'}`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="glass h-[48px] animate-shimmer rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4"><span className="text-2xl">📜</span></div>
          <p className="text-white font-medium text-lg mb-1">No activity yet</p>
          <p className="text-[#5a5a70] text-[14px]">Logs appear here once tasks start executing.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3.5 px-5 text-[12px] font-medium text-[#5a5a70] uppercase tracking-wider">Status</th>
                  <th className="pb-3.5 px-5 text-[12px] font-medium text-[#5a5a70] uppercase tracking-wider">Task</th>
                  <th className="pb-3.5 px-5 text-[12px] font-medium text-[#5a5a70] uppercase tracking-wider">Type</th>
                  <th className="pb-3.5 px-5 text-[12px] font-medium text-[#5a5a70] uppercase tracking-wider">Duration</th>
                  <th className="pb-3.5 px-5 text-[12px] font-medium text-[#5a5a70] uppercase tracking-wider">Executed At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white ${
                          log.status === 'success' ? 'bg-emerald-500/20' : log.status === 'failed' ? 'bg-rose-500/20' : log.status === 'running' ? 'bg-violet-500/20' : 'bg-amber-500/20'
                        }`}>
                          {icons[log.status] || '·'}
                        </div>
                        <span className={`badge ${badgeClass[log.status] || 'badge-violet'}`}>{log.status}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[14px] text-[#d4d4de] group-hover:text-white transition-colors">{log.task_name || `Task #${log.task_id}`}</td>
                    <td className="py-3.5 px-5 text-[14px] text-[#5a5a70]">{log.task_type || '—'}</td>
                    <td className="py-3.5 px-5 text-[14px] text-[#5a5a70] tabular-nums">{log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '—'}</td>
                    <td className="py-3.5 px-5 text-[14px] text-[#5a5a70] tabular-nums">{new Date(log.executed_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Latest Output */}
      {filtered.length > 0 && filtered[0]?.output && (
        <div className="glass p-5">
          <h3 className="text-[13px] font-medium text-[#5a5a70] mb-3 uppercase tracking-wider">Latest Output</h3>
          <pre className="bg-black/30 border border-white/[0.06] rounded-xl p-4 text-[13px] text-[#a1a1b5] overflow-auto max-h-40 whitespace-pre-wrap font-mono leading-relaxed">
            {filtered[0].output.substring(0, 1500)}
          </pre>
        </div>
      )}
    </div>
  );
}
