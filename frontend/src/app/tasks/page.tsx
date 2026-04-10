'use client';
import { useEffect, useState, useRef } from 'react';
import { TaskCard } from '@/components/TaskCard';
import { TaskCreator } from '@/components/TaskCreator';
import { Download, Upload, ListTodo } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
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
    } catch { console.error('Failed to delete task'); }
  };

  const handleToggle = async (task: any) => {
    try {
      const updated = { ...task, is_active: task.is_active ? 0 : 1 };
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, is_active: updated.is_active, schedule: updated.schedule, config: updated.config }),
      });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch { console.error('Failed to toggle task'); }
  };

  const exportTasks = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `elizclaw-tasks-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const importTasks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { setImportStatus('❌ Please select a .json file'); setTimeout(() => setImportStatus(null), 3000); return; }
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) { setImportStatus('❌ Invalid format: expected an array of tasks'); setTimeout(() => setImportStatus(null), 3000); return; }
      let successCount = 0;
      for (const task of imported) {
        if (!task.name || !task.type || !task.schedule) continue;
        const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) });
        if (res.ok) successCount++;
      }
      setImportStatus(`✅ Imported ${successCount}/${imported.length} tasks`);
      setRefreshKey(k => k + 1);
      setTimeout(() => setImportStatus(null), 4000);
    } catch { setImportStatus('❌ Failed to parse file — invalid JSON'); setTimeout(() => setImportStatus(null), 3000); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
  ];

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.is_active;
    if (filter === 'completed') return t.last_run && !t._error;
    if (filter === 'failed') return t._error;
    return true;
  });

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#F1F5F9] tracking-tight">Tasks</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Manage your automation tasks and schedules.</p>
          {importStatus && <p className="text-[12px] mt-2 text-emerald-400">{importStatus}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportTasks} className="btn-ghost text-[12px] flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-accent text-[12px] flex items-center gap-1.5">
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
            className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
              filter === f.key
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-[70px] animate-shimmer" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-12 text-center border-red-500/20">
          <p className="text-[#F1F5F9] font-medium text-lg mb-1">Could not load tasks</p>
          <p className="text-[#94A3B8] text-[13px] mb-4">Something went wrong fetching your tasks.</p>
          <button onClick={() => { setRefreshKey(k => k + 1); setError(false); setLoading(true); }} className="btn-primary text-[13px]">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ListTodo className="w-12 h-12 mx-auto text-indigo-500/20 mb-4" />
          <p className="text-[#F1F5F9] font-medium text-lg mb-1">No tasks yet</p>
          <p className="text-[#94A3B8] text-[13px]">Tell ElizClaw what to monitor in plain English.</p>
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
