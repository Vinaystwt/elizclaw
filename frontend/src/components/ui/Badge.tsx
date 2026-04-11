import { cn } from "@/lib/utils";

const badgeTone = {
  neutral: "border-border bg-surface-2 text-text-secondary",
  accent: "border-accent bg-surface-3 text-accent",
  success: "border-success bg-surface-3 text-success",
  danger: "border-danger bg-surface-3 text-danger",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof badgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em]",
        badgeTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
