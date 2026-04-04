'use client';
import { useEffect, useState, useRef } from 'react';
import { StatCard } from '@/components/StatCard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ChatWindow } from '@/components/ChatWindow';
import { TaskCreator } from '@/components/TaskCreator';
import { Zap, Activity, Clock, Bell, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, running: 0 });
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch initial data
  const fetchData = () => {
    Promise.all([fetch('/api/logs').then(r => r.json()), fetch('/api/tasks').then(r => r.json())])
      .then(([logs, tasks]) => {
        setStats(logs.stats || { total: 0, success: 0, failed: 0, running: 0 });
        setActiveCount((tasks.tasks || []).filter((t: any) => t.is_active).length);
        setLastUpdated(new Date());
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // Poll every 30s for live dashboard updates
    intervalRef.current = setInterval(fetchData, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshKey]);

  const successRate = stats.total > 0 ? `${Math.round((stats.success / stats.total) * 100)}%` : '—';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-bold text-white tracking-tight">Dashboard</h1>
            <button onClick={() => setRefreshKey(k => k + 1)} className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#5a5a70] hover:text-violet-400 transition-all" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-[#5a5a70] text-[15px]">Your personal AI automation agent at a glance.</p>
            {lastUpdated && <span className="text-[11px] text-[#3a3a50] tabular-nums">Updated {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </div>
        <TaskCreator onCreated={() => setRefreshKey(k => k + 1)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up animate-fade-up-delay-1">
        <StatCard icon={<Zap className="w-5 h-5 text-white" />} label="Active Tasks" value={loading ? '—' : activeCount} color="violet" />
        <StatCard icon={<Activity className="w-5 h-5 text-white" />} label="Executed Today" value={loading ? '—' : stats.total} color="cyan" />
        <StatCard icon={<Clock className="w-5 h-5 text-white" />} label="Success Rate" value={loading ? '—' : successRate} color="green" />
        <StatCard icon={<Bell className="w-5 h-5 text-white" />} label="Alerts" value={loading ? '—' : 0} color="amber" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-up animate-fade-up-delay-2">
        {/* Activity Feed */}
        <div className="lg:col-span-2 glass p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              Recent Activity
            </h2>
            <button onClick={() => window.location.href = '/logs'} className="text-[12px] text-[#5a5a70] hover:text-violet-400 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ActivityFeed />
        </div>

        {/* Chat */}
        <div className="lg:col-span-3 glass p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Chat with ElizClaw
            </h2>
          </div>
          <ChatWindow />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass p-6 animate-fade-up animate-fade-up-delay-3">
        <h2 className="text-[15px] font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '💬 Start a conversation', action: () => (document.querySelector('[data-open-chat]') as HTMLElement)?.click() },
            { label: '📋 Manage tasks', action: () => window.location.href = '/tasks' },
            { label: '📜 View activity logs', action: () => window.location.href = '/logs' },
          ].map(item => (
            <button key={item.label} onClick={item.action} className="btn-ghost text-[14px]">{item.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
