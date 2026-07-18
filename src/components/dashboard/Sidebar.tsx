'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, Settings, LogOut, Shield, Award,
  Terminal, Activity, Compass, Users, Mic, HelpCircle, GraduationCap, FileText,
  Menu, X
} from 'lucide-react';
import { signOutAction } from '@/app/auth/actions';

// ─── Colour constants matching the brutalist design system ──────────────
const C = {
  cream: '#fef9f2',
  primary: '#000000',
  onPrimary: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f3ec',
  surfaceContainer: '#f2ede6',
  surfaceContainerHigh: '#ece7e1',
  surfaceVariant: '#e6e2db',
  onSurface: '#1d1c18',
  onSurfaceVariant: '#45464d',
  outline: '#76777d',
  outlineVariant: '#c6c6cd',
  accentBlue: '#bec6e0',
  accentPurple: '#d3579a',
  accentYellow: '#ffe24c',
};

interface SidebarProps {
  userEmail: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOutAction();
      router.push('/login');
    } catch (err) {
      console.error(err);
      // Fallback
      window.location.href = '/login';
    }
  };

  const navItems = [
    { name: 'Dashboard',            href: '/dashboard',       icon: Compass },
    { name: 'Study Notes',          href: '/notes',           icon: FileText },
    { name: 'Quiz',                 href: '/quiz',            icon: HelpCircle },
    { name: 'AI Mock Interview',    href: '/interview',       icon: Mic },
    { name: 'Career Guidance',      href: '/career-guidance', icon: GraduationCap },
    { name: 'Security Settings',    href: '/settings',        icon: Shield }
  ];

  const displayName = userEmail.split('@')[0].toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full w-full bg-white border-r-4 border-black text-black">
      {/* Top Header */}
      <div className="p-6 border-b-4 border-black bg-[#ffe24c]">
        <Link href="/dashboard" className="flex items-center group">
          <div>
            <span className="text-4xl font-display tracking-widest block uppercase text-black">
              Focus
            </span>
            <span
              className="text-[10px] uppercase tracking-widest font-bold block mt-1 text-black bg-white px-2 py-0.5 border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Agent Syllabus
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="space-y-4">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-transform border-4 border-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  isActive
                    ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 -translate-x-1'
                    : 'bg-white text-black'
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={isActive ? 3 : 2}
                  style={{ color: isActive ? C.accentYellow : C.primary }}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session profile / Logout */}
      <div className="p-6 border-t-4 border-black bg-[#bec6e0] space-y-4">
        <div className="flex items-center gap-3 p-3 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-10 w-10 border-4 border-black bg-[#d3579a] flex items-center justify-center font-display text-xl text-white shrink-0">
            {displayName[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <span className="text-sm font-bold uppercase tracking-wider block truncate text-black">
              {displayName}
            </span>
            <span className="text-[10px] font-bold block truncate text-zinc-600">
              {userEmail}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-4 border-black bg-white text-black font-bold uppercase tracking-wider hover:bg-[#ffafd3] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <LogOut className="h-5 w-5" strokeWidth={3} />
          LOGOUT
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 border-4 border-black bg-[#ffe24c] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <Menu className="h-6 w-6 text-black" strokeWidth={3} />
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative w-72 max-w-[80vw] h-full flex flex-col transform transition-transform animate-in slide-in-from-left">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 -right-12 p-2 border-4 border-black bg-[#ffafd3] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="h-6 w-6 text-black" strokeWidth={3} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col justify-between shrink-0 h-screen sticky top-0 w-72">
        {sidebarContent}
      </aside>
    </>
  );
}
