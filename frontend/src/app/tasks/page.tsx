'use client';
import { useEffect, useState } from 'react';
import { TaskCard } from '@/components/TaskCard';
import { TaskCreator } from '@/components/TaskCreator';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { fetch('/api/tasks').then(r => r.json()).then(data => { setTasks(data.tasks || []); setLoading(false); }).catch(() => setLoading(false)); }, [refreshKey]);

  const filtered = tasks.filter(t => { if (filter === 'active') return t.is_active === 1; if (filter === 'inactive') return t.is_active === 0; return true; });
  const handleDelete = async (id: number) => { await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }); setTasks(prev => prev.filter(t => t.id !== id)); };
  const handleToggle = async (task: any) => { const updated = { ...task, is_active: task.is_active ? 0 : 1 }; await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }); setTasks(prev => prev.map(t => t.id === task.id ? updated : t)); };

  const filters: { key: typeof filter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'active', label: 'Active', count: tasks.filter(t => t.is_active).length },
    { key: 'inactive', label: 'Paused' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div><h1 className="text-[32px] font-bold text-white tracking-tight">Tasks</h1><p className="text-[#5a5a70] mt-1.5 text-[15px]">Manage your automation tasks and schedules.</p></div>
        <TaskCreator onCreated={() => setRefreshKey(k => k + 1)} />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 ${filter === f.key ? 'bg-violet-500/15 text-violet-400 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]' : 'bg-white/[0.03] text-[#5a5a70] hover:bg-white/[0.06] hover:text-[#a1a1b5]'}`}>
            {f.label}{f.count !== undefined && <span className="ml-1.5 text-[11px] opacity-60">{f.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass h-[100px] animate-shimmer rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/10 flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-white font-medium text-lg mb-1">No tasks yet</p>
          <p className="text-[#5a5a70] text-[14px]">Create your first automation task to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
