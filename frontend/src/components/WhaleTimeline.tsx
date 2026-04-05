'use client';
import { useEffect, useState } from 'react';

/**
 * WhaleTimeline — visual timeline of whale wallet movements.
 * Restyled to match design system: IN=emerald left border, OUT=red left border.
 */

interface WhaleEvent {
  wallet: string;
  direction: 'IN' | 'OUT';
  amount: number;
  coin: string;
  executed_at: string;
}

export function WhaleTimeline() {
  const [events, setEvents] = useState<WhaleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/logs?limit=20')
      .then(r => r.json())
      .then(data => {
        const whaleLogs = (data.logs || [])
          .filter((l: any) => l.task_type === 'whale_watcher' || (l.task_name && /whale/i.test(l.task_name)))
          .map((l: any) => ({
            wallet: l.wallet || l.task_name || 'Unknown',
            direction: (l.output || '').toLowerCase().includes('out') ? 'OUT' as const : 'IN' as const,
            amount: extractAmount(l.output),
            coin: extractCoin(l.output),
            executed_at: l.executed_at,
          }));
        setEvents(whaleLogs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const ago = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const truncate = (addr: string) => {
    if (addr.length > 12) return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    return addr;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3 py-2 px-2">
            <div className="w-6 h-6 rounded bg-[#1E1E2E] animate-pulse" />
            <div className="flex-1 h-3 bg-[#1E1E2E] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="w-10 h-10 mx-auto rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] flex items-center justify-center mb-3">
          <span className="text-lg">🐋</span>
        </div>
        <p className="text-[#94A3B8] text-[13px]">No whale movements detected.</p>
        <p className="text-[#64748B] text-[11px] mt-0.5">Watching known wallets 24/7.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {events.map((evt, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-all duration-200 animate-slide-in border-l-[3px] ${
            evt.direction === 'IN' ? 'border-l-emerald-500' : 'border-l-red-500'
          }`}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
            evt.direction === 'IN'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          }`}>
            {evt.direction === 'IN' ? '↓' : '↑'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono text-indigo-300">{truncate(evt.wallet)}</span>
              <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
                evt.direction === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {evt.direction}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] font-mono ${evt.direction === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                {evt.coin} — ${evt.amount.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#64748B]">{ago(evt.executed_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function extractAmount(output: string): number {
  const m = output?.match(/\$?([\d,]+(?:\.\d+)?)/);
  return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
}

function extractCoin(output: string): string {
  const m = output?.match(/\b(BTC|ETH|SOL|DOGE|ADA|AVAX|BNB|XRP|USDC|USDT)\b/i);
  return m ? m[1].toUpperCase() : 'Unknown';
}
