import { cn } from "@/lib/utils";

export function LiveDot({ className }: { className?: string }) {
  return <span className={cn("pulse-live inline-flex h-2.5 w-2.5 rounded-full bg-success", className)} />;
}
