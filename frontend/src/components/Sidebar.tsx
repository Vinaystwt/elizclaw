'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTodo, Activity, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/logs', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#0A0A0F] border-r border-[#1E1E2E] p-5 flex flex-col z-50">
      {/* Logo */}
      <div className="mb-8 px-1">
        <div className="flex items-center gap-0.5 mb-1">
          <span className="text-indigo-400 font-black tracking-tighter text-lg">⟋⟋⟋</span>
          <span className="font-light text-slate-300 text-lg">ELIZ</span>
          <span className="font-black text-indigo-400 text-lg">CLAW</span>
        </div>
        <p className="text-[10px] text-[#94A3B8] tracking-wider uppercase">on-chain intelligence · always watching</p>
      </div>

      {/* Nav */}
      <nav className="space-y-1 flex-1">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-[14px] font-medium ${
                isActive ? 'nav-active' : 'nav-inactive'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="pt-4 border-t border-[#1E1E2E]">
        <div className="flex items-center gap-2 px-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div>
            <p className="text-[12px] font-medium text-[#F1F5F9]">Agent Active</p>
            <p className="text-[10px] text-[#94A3B8]">Nosana GPU Network</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
