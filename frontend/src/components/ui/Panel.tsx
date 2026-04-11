import { cn } from "@/lib/utils";

export function Panel({
  className,
  innerClassName,
  children,
}: {
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("panel-shell", className)}>
      <div className={cn("panel-core", innerClassName)}>{children}</div>
    </section>
  );
}
