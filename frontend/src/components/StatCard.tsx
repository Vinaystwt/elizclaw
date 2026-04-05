/**
 * StatCard — dashboard metric with icon, label, value, and optional trend.
 */
const accentBorder: Record<string, string> = {
  indigo: 'border-l-[3px] border-l-indigo-500',
  cyan: 'border-l-[3px] border-l-cyan-500',
  emerald: 'border-l-[3px] border-l-emerald-500',
  amber: 'border-l-[3px] border-l-amber-500',
};

export function StatCard({ icon, label, value, accent = 'indigo' }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className={`card ${accentBorder[accent] || accentBorder.indigo}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs text-[#94A3B8] font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono text-[#F1F5F9] tracking-tight">
        {value}
      </div>
    </div>
  );
}
