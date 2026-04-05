'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Radio, Eye, Globe, Zap } from 'lucide-react';

/**
 * ActivityFeed — shows recent task executions with status indicators.
 * Auto-refreshes every 30 seconds. Renders sparklines for price_monitor entries.
 */

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  price_monitor: TrendingUp,
  wallet_tracker: Wallet,
  signal_monitor: Radio,
  whale_watcher: Eye,
  web_scrape: Globe,
};

const typeColors: Record<string, string> = {
  price_monitor: 'text-amber-400',
  wallet_tracker: 'text-indigo-400',
  signal_monitor: 'text-emerald-400',
  whale_watcher: 'text-red-400',
  web_scrape: 'text-slate-400',
};

/**
 * Sparkline — inline SVG mini-chart for price history.
 */
function Sparkline({ prices, width = 120, height = 28 }: { prices: number[]; width?: number; height?: number }) {
  if (prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const isUp = prices[prices.length - 1] >= prices[0];
  const color = isUp ? '#10B981' : '#EF4444';
  const fill = isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
  const areaPath = `M0,${height} L${points.split(' ')[0]} ${points.split(' ').map((p, i) => i === 0 ? '' : `L${p}`).join(' ')} L${width},${height} Z`;
  return (
    <svg width={width} height={height} className="mt-1.5" style={{ display: 'block' }}>
      <path d={areaPath} fill={fill} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function extractPrices(output: string): number[] {
  const matches = output.match(/\$([\d,]+(?:\.\d+)?)/g);
  if (!matches) return [];
  return matches.map(m => parseFloat(m.replace(/[$,]/g, ''))).filter(n => !isNaN(n) && n > 0);
}

export function ActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    fetch('/api/logs')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setLogs((data.logs || []).slice(0, 8)); setLoading(false); })
      .catch(() => { setLogs([]); setLoading(false); });
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
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-2 px-2">
            <div className="w-6 h-6 rounded bg-[#1E1E2E] animate-pulse" />
            <div className="flex-1 h-3 bg-[#1E1E2E] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 mx-auto rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] flex items-center justify-center mb-3">
          <Zap className="w-4 h-4 text-indigo-500/30" />
        </div>
        <p className="text-[#94A3B8] text-[13px]">No activity yet.</p>
        <p className="text-[#64748B] text-[11px] mt-0.5">Tasks will appear here when they execute.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {logs.map((log, i) => {
        const Icon = typeIcons[log.task_type] || Globe;
        const color = typeColors[log.task_type] || 'text-slate-400';
        const prices = log.type === 'price_monitor' ? extractPrices(log.output || '') : [];
        return (
          <div key={log.id || i} className="group flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-all duration-200">
            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#E2E8F0] truncate group-hover:text-white transition-colors">
                {log.task_name || log.task_type || 'Unnamed task'}
              </p>
              {log.output && (
                <p className="text-[11px] text-[#64748B] truncate mt-0.5" title={log.output}>
                  {log.output.substring(0, 60)}
                </p>
              )}
              {prices.length >= 2 && <Sparkline prices={prices} />}
            </div>
            <div className="flex flex-col items-end gap-0.5 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                log.status === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : log.status === 'failed'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {log.status === 'success' ? 'OK' : log.status === 'failed' ? 'FAIL' : 'RUN'}
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">{ago(log.executed_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
