'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListTodo, ScrollText, Settings, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/logs', label: 'Activity', icon: ScrollText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#0a0a10]/80 backdrop-blur-2xl border-r border-white/[0.06] p-6 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a0a10]">
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-pulse-ring" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">ElizClaw</h1>
          <p className="text-[11px] text-[#5a5a70] tracking-wide uppercase">Agent</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-violet-500/10 text-violet-400 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]'
                  : 'text-[#71717a] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] transition-all duration-300 ${isActive ? 'text-violet-400' : 'text-[#5a5a70] group-hover:text-[#a1a1b5]'}`} />
              <span className="font-medium text-[14px]">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-5 border-t border-white/[0.06]">
        <div className="glass p-3.5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            <span className="text-xs font-medium text-[#a1a1b5]">Agent Running</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5">
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full w-3/4 shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
