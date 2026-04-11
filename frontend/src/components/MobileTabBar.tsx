'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, DashboardIcon, ReportIcon, TasksIcon, WatchlistIcon } from "@/components/Icons";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Desk", icon: DashboardIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/logs", label: "Activity", icon: ActivityIcon },
  { href: "/watchlist", label: "Watch", icon: WatchlistIcon },
  { href: "/report", label: "Report", icon: ReportIcon },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="chrome-shell fixed inset-x-4 bottom-4 z-50 rounded-[1.8rem] p-2 shadow-panel backdrop-blur-sm md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[1.15rem] text-[0.66rem] font-medium text-text-muted",
                active && "bg-surface-2 text-text-primary",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className={cn(active ? "text-accent" : "text-text-muted")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
