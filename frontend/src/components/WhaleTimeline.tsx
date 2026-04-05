'use client';
import { useEffect, useState } from 'react';

/**
 * WhaleTimeline — visual timeline of whale wallet movements.
 * Reads whale watch events from the logs API and renders as
 * color-coded cards with directional indicators.
 */

interface WhaleEvent {
  wallet: string;
  direction: 'IN' | 'OUT';
  amount: number;
  coin: string;
  executed_at: string;
  task_name?: string;
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
            task_name: l.task_name,
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
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3 py-3 px-3">
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] animate-pulse" />
            <div className="flex-1 h-4 bg-white/[0.04] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
          <span className="text-lg">🐋</span>
        </div>
        <p className="text-[#5a5a70] text-[14px]">No whale movements detected.</p>
        <p className="text-[#3a3a50] text-[12px] mt-1">Watching known wallets 24/7.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((evt, i) => (
        <div
          key={i}
          className="group flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-all duration-200 animate-slide-in"
        >
          {/* Direction indicator */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 ${
            evt.direction === 'IN'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
          }`}>
            {evt.direction === 'IN' ? '↓' : '↑'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[#d4d4de]">
                {truncate(evt.wallet)}
              </span>
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                evt.direction === 'IN'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}>
                {evt.direction}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] text-[#a1a1b5]">
                {evt.coin} — ${evt.amount.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#5a5a70]">
                {ago(evt.executed_at)}
              </span>
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
