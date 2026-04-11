import { cn } from "@/lib/utils";

export function MonoText({
  as: Tag = "span",
  className,
  children,
}: {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
}) {
  return <Tag className={cn("mono", className)}>{children}</Tag>;
}
