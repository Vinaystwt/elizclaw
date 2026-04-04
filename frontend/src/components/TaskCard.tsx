const typeIcons: Record<string, string> = { price_monitor: '📊', web_scrape: '🌐', api_call: '🔌', notification: '🔔', custom: '⚙️' };
const typeLabels: Record<string, string> = { price_monitor: 'Price Monitor', web_scrape: 'Web Digest', api_call: 'API Call', notification: 'Notification', custom: 'Custom' };
const typeBadge: Record<string, string> = { price_monitor: 'badge-violet', web_scrape: 'badge-cyan', api_call: 'badge-amber', notification: 'badge-red', custom: 'badge-violet' };

export function TaskCard({ task, onDelete, onToggle }: any) {
  return (
    <div className={`glass glass-hover group p-5 ${!task.is_active ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
            {typeIcons[task.type] || '⚙️'}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[15px] text-white truncate">{task.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`badge ${typeBadge[task.type] || 'badge-violet'}`}>{typeLabels[task.type] || task.type}</span>
              <span className="text-[12px] text-[#5a5a70] flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {task.schedule}
              </span>
              {task.condition && <span className="text-[12px] text-[#5a5a70] flex items-center gap-1">⚡ {task.condition}</span>}
            </div>
            {task.next_run && <p className="text-[12px] text-[#5a5a70] mt-1.5">Next run: {new Date(task.next_run).toLocaleString()}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onToggle(task)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${task.is_active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/[0.04] text-[#5a5a70] hover:bg-white/[0.08]'}`}>
            {task.is_active ? 'Active' : 'Paused'}
          </button>
          <button onClick={() => onDelete(task.id)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
