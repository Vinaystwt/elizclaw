'use client';
import { useEffect, useState, useRef } from 'react';
import { StatCard } from '@/components/StatCard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { WhaleTimeline } from '@/components/WhaleTimeline';
import { ChatWindow } from '@/components/ChatWindow';
import { TaskCreator } from '@/components/TaskCreator';
import { Zap, Activity, Clock, Eye, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, running: 0 });
  const [activeCount, setActiveCount] = useState(0);
  const [whaleCount, setWhaleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live clock
  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // Fetch initial data
  const fetchData = () => {
    Promise.all([fetch('/api/logs').then(r => r.json()), fetch('/api/tasks').then(r => r.json())])
      .then(([logs, tasks]) => {
        setStats(logs.stats || { total: 0, success: 0, failed: 0, running: 0 });
        setActiveCount((tasks.tasks || []).filter((t: any) => t.is_active).length);
        const whaleTasks = (tasks.tasks || []).filter((t: any) => t.type === 'whale_watcher');
        setWhaleCount(whaleTasks.length);
        setLastUpdated(new Date());
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshKey]);

  const successRate = stats.total > 0 ? `${Math.round((stats.success / stats.total) * 100)}%` : '—';

  return (
    <>
      {/* Ambient watermark — fixed positioning creates own stacking context */}
      <div className="fixed top-8 right-8 text-[120px] font-black text-indigo-500/[0.08] select-none pointer-events-none hidden lg:block">
        WATCHING
      </div>

      <div className="space-y-6 relative z-10">
        {/* Page Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-3xl font-semibold text-[#F1F5F9] tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-[#94A3B8]">Your on-chain intelligence at a glance</span>
            <span className="text-xs font-mono text-[#94A3B8] tabular-nums">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {now.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k + 1)} className="w-9 h-9 rounded-lg bg-[#111118] border border-[#1E1E2E] hover:border-indigo-500/30 flex items-center justify-center text-[#94A3B8] hover:text-indigo-400 transition-all" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <TaskCreator onCreated={() => setRefreshKey(k => k + 1)} />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up animate-fade-up-delay-1">
        <StatCard icon={<Zap className="w-4 h-4 text-white" />} label="Active Tasks" value={loading ? '—' : activeCount} accent="indigo" />
        <StatCard icon={<Activity className="w-4 h-4 text-white" />} label="Executions Today" value={loading ? '—' : stats.total} accent="cyan" />
        <StatCard icon={<Clock className="w-4 h-4 text-white" />} label="Success Rate" value={loading ? '—' : successRate} accent="emerald" />
        <StatCard icon={<Eye className="w-4 h-4 text-white" />} label="Whales Watched" value={loading ? '—' : whaleCount} accent="amber" />
      </div>

      {/* Main Grid: Chat (60%) + Activity (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-up animate-fade-up-delay-2">
        {/* Chat — 60% */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Talk to ElizClaw</h2>
            <div className="flex items-center gap-1.5">
              <span className="live-dot" />
              <span className="text-[11px] text-emerald-400 font-medium">Live</span>
            </div>
          </div>
          <ChatWindow />
        </div>

        {/* Activity Feed — 40% */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Live Activity</h2>
            <span className="text-[11px] text-[#94A3B8]">Auto-refreshes every 30s</span>
          </div>
          <ActivityFeed />
        </div>
      </div>

      {/* Whale Timeline */}
      <div className="card animate-fade-up animate-fade-up-delay-3">
        <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Whale Watch</h2>
        <WhaleTimeline />
      </div>
      </div>
    </>
  );
}
