const gradients: Record<string, string> = {
  violet: 'from-violet-500/20 to-purple-500/20 border-violet-500/10',
  cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/10',
  green: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/10',
  amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/10',
};
const iconBgs: Record<string, string> = {
  violet: 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30',
  cyan: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30',
  green: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30',
  amber: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30',
};

export function StatCard({ icon, label, value, color = 'violet' }: any) {
  return (
    <div className={`glass glass-hover bg-gradient-to-br ${gradients[color]} p-5 cursor-default group`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgs[color]} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <span className="text-[11px] font-medium text-[#5a5a70] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}
