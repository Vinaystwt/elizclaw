'use client';
import { useEffect, useState, useRef } from 'react';
import { TaskCard } from '@/components/TaskCard';
import { TaskCreator } from '@/components/TaskCreator';
import { Download, Upload } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setTasks(data.tasks || []); setLoading(false); setError(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [refreshKey]);

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      console.error('Failed to delete task');
    }
  };

  const handleToggle = async (task: any) => {
    try {
      const updated = { ...task, is_active: task.is_active ? 0 : 1 };
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch {
      console.error('Failed to toggle task');
    }
  };

  const filters: { key: typeof filter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'active', label: 'Active', count: tasks.filter(t => t.is_active).length },
    { key: 'inactive', label: 'Paused', count: tasks.filter(t => !t.is_active).length },
  ];

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.is_active;
    if (filter === 'inactive') return !t.is_active;
    return true;
  });

  // ── Export tasks as JSON file ──
  const exportTasks = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elizclaw-tasks-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import tasks from JSON file ──
  const importTasks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setImportStatus('❌ Please select a .json file');
      setTimeout(() => setImportStatus(null), 3000);
      return;
    }
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) {
        setImportStatus('❌ Invalid format: expected an array of tasks');
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }
      let successCount = 0;
      for (const task of imported) {
        if (!task.name || !task.type || !task.schedule) continue;
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        });
        if (res.ok) successCount++;
      }
      setImportStatus(`✅ Imported ${successCount}/${imported.length} tasks`);
      setRefreshKey(k => k + 1);
      setTimeout(() => setImportStatus(null), 4000);
    } catch {
      setImportStatus('❌ Failed to parse file — invalid JSON');
      setTimeout(() => setImportStatus(null), 3000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-[#5a5a70] mt-1.5 text-[15px]">Manage your automation tasks and schedules.</p>
          {importStatus && <p className="text-[13px] mt-2 text-emerald-400">{importStatus}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportTasks} className="btn-ghost text-[13px] flex items-center gap-1.5" title="Export tasks as JSON">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-[13px] flex items-center gap-1.5" title="Import tasks from JSON">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importTasks} />
          <TaskCreator onCreated={() => setRefreshKey(k => k + 1)} />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 ${
              filter === f.key
                ? 'bg-violet-500/15 text-violet-400 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]'
                : 'bg-white/[0.03] text-[#5a5a70] hover:bg-white/[0.06] hover:text-[#a1a1b5]'
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span className="ml-1.5 text-[11px] opacity-60">{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass h-[100px] animate-shimmer rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="glass p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/10 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-white font-medium text-lg mb-1">Could not load tasks</p>
          <p className="text-[#5a5a70] text-[14px] mb-4">Something went wrong fetching your tasks.</p>
          <button onClick={() => { setRefreshKey(k => k + 1); setError(false); setLoading(true); }} className="btn-primary text-[14px]">
            Try again
          </button>
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
