import { MonoText } from "@/components/ui/MonoText";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="surface-row flex min-h-[7.25rem] flex-col justify-between">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <div className="space-y-2">
        <MonoText className={cn("block text-[1.7rem] font-medium tracking-[-0.05em] text-text-primary md:text-[2rem]")}>
          {value}
        </MonoText>
        {detail ? <p className="text-[0.78rem] leading-6 text-text-muted">{detail}</p> : null}
      </div>
    </div>
  );
}
