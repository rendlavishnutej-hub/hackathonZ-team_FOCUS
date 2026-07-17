'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, Settings, LogOut, Shield, Award, 
  Terminal, Activity, Compass, Users 
} from 'lucide-react';
import { createClient as createBrowserClient } from '@/utils/supabase/client';

interface SidebarProps {
  userEmail: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createBrowserClient();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
      window.location.href = '/login';
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Compass },
    { name: 'Security Settings', href: '/settings', icon: Shield },
    { name: 'Pricing Tiers', href: '/pricing', icon: Award },
  ];

  const displayName = userEmail.split('@')[0].toUpperCase();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Top Header */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0] p-[1px] shadow-lg shadow-[#7C5CFF]/15">
            <div className="h-full w-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Terminal className="h-5 w-5 text-[#22D3D0] group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div>
            <span className="font-display text-2xl tracking-wide text-white block">FOCUS</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mt-0.5">
              Agent Syllabus
            </span>
          </div>
        </Link>
        
        {/* Navigation */}
        <nav className="mt-8 space-y-1.5">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-900 text-[#22D3D0] border border-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-[#22D3D0]' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session profile / Logout */}
      <div className="p-6 border-t border-zinc-900 space-y-4">
        <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-900 p-3 rounded-xl">
          <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-display text-sm text-[#7C5CFF]">
            {displayName[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-semibold text-zinc-300 block truncate">{displayName}</span>
            <span className="text-[10px] text-zinc-500 block truncate">{userEmail}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 text-sm font-medium rounded-xl transition-all"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
