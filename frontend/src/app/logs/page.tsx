'use client';
import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

const typeColors: Record<string, string> = {
  price_monitor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  wallet_tracker: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  signal_monitor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  whale_watcher: 'text-red-400 bg-red-500/10 border-red-500/20',
  web_scrape: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  api_call: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, running: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/logs?limit=100')
      .then(r => r.json())
      .then(data => {
        setLogs((data.logs || []).reverse());
        setStats(data.stats || { total: 0, success: 0, failed: 0, running: 0 });
        setLoading(false);
      })
      .catch(() => { setLogs([]); setStats({ total: 0, success: 0, failed: 0, running: 0 }); setLoading(false); });
  }, []);

  const successRate = stats.total > 0 ? `${Math.round((stats.success / stats.total) * 100)}%` : '—';

  return (
    <div className="space-y-6 relative z-10">
      <div>
        <h1 className="text-3xl font-semibold text-[#F1F5F9] tracking-tight">Activity Log</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Execution history and performance stats.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card border-l-[3px] border-l-cyan-500">
          <p className="text-xs text-[#94A3B8] mb-1">Total Executions</p>
          <p className="text-2xl font-bold font-mono text-[#F1F5F9]">{loading ? '—' : stats.total}</p>
        </div>
        <div className="card border-l-[3px] border-l-emerald-500">
          <p className="text-xs text-[#94A3B8] mb-1">Success Rate</p>
          <p className="text-2xl font-bold font-mono text-[#F1F5F9]">{loading ? '—' : successRate}</p>
        </div>
        <div className="card border-l-[3px] border-l-amber-500">
          <p className="text-xs text-[#94A3B8] mb-1">Most Active</p>
          <p className="text-sm font-mono text-[#F1F5F9]">{loading ? '—' : getMostActiveType(logs)}</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 py-2.5 px-3">
              <div className="w-20 h-3 bg-[#1E1E2E] rounded animate-pulse" />
              <div className="w-24 h-3 bg-[#1E1E2E] rounded animate-pulse" />
              <div className="flex-1 h-3 bg-[#1E1E2E] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-16 text-center">
          <Activity className="w-12 h-12 mx-auto text-indigo-500/30 mb-4" />
          <p className="text-[#F1F5F9] text-lg font-medium mb-1">No executions yet</p>
          <p className="text-[#94A3B8] text-sm">Tasks will appear here as ElizClaw runs them.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#1E1E2E]">
                <th className="text-left py-2.5 px-4 text-[#94A3B8] font-medium text-[11px] uppercase tracking-wider">Time</th>
                <th className="text-left py-2.5 px-4 text-[#94A3B8] font-medium text-[11px] uppercase tracking-wider">Type</th>
                <th className="text-left py-2.5 px-4 text-[#94A3B8] font-medium text-[11px] uppercase tracking-wider">Target</th>
                <th className="text-left py-2.5 px-4 text-[#94A3B8] font-medium text-[11px] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className={`border-b border-[#1E1E2E]/50 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="py-2 px-4 font-mono text-[#94A3B8] text-[11px]">
                    {log.executed_at ? new Date(log.executed_at).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 px-4">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeColors[log.task_type] || 'text-[#94A3B8] bg-white/[0.04] border-[#1E1E2E]'}`}>
                      {log.task_type || 'unknown'}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-[#E2E8F0] truncate max-w-[200px]" title={log.output}>
                    {log.task_name || log.output?.substring(0, 40) || '—'}
                  </td>
                  <td className="py-2 px-4">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      log.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {log.status === 'success' ? 'OK' : log.status === 'failed' ? 'FAIL' : 'RUN'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getMostActiveType(logs: any[]): string {
  if (!logs.length) return '—';
  const counts: Record<string, number> = {};
  logs.forEach(l => { const t = l.task_type || 'unknown'; counts[t] = (counts[t] || 0) + 1; });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries.length > 0 ? entries[0][0].replace(/_/g, ' ') : '—';
}
