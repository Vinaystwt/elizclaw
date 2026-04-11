'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, DashboardIcon, ReportIcon, SettingsIcon, TasksIcon, WatchlistIcon } from "@/components/Icons";
import { MonoText } from "@/components/ui/MonoText";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/logs", label: "Activity", icon: ActivityIcon },
  { href: "/watchlist", label: "Watchlist", icon: WatchlistIcon },
  { href: "/report", label: "Report", icon: ReportIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-6 hidden h-[calc(100dvh-3rem)] w-[14rem] shrink-0 rounded-[2rem] p-[0.45rem] shadow-panel chrome-shell md:block">
      <div className="chrome-core flex h-full flex-col rounded-[1.6rem] px-4 py-5">
        <div className="space-y-3">
          <div>
            <p className="text-[0.76rem] font-extrabold uppercase tracking-[0.15em] text-text-primary">
              ELIZCLAW
            </p>
            <p className="pt-2 text-[0.76rem] leading-6 text-text-secondary">
              Quiet market intelligence for mornings that need clarity.
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                className={cn(
                  "group flex items-center gap-3 rounded-[1.15rem] border px-3 py-3 text-[0.94rem] text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                  active ? "border-accent text-text-primary" : "border-transparent",
                )}
                href={item.href}
                key={item.href}
              >
                <span className={cn("h-8 w-px rounded-full bg-transparent", active && "bg-accent")} />
                <Icon className={cn("text-text-muted group-hover:text-accent", active && "text-accent")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-border pt-4 text-[0.78rem] text-text-muted">
          <p>Personal intelligence desk</p>
          <MonoText className="text-[0.76rem] text-text-secondary">v1.0.0</MonoText>
        </div>
      </div>
    </aside>
  );
}
