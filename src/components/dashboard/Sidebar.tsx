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

// ─── Colour constants matching the landing page design system ──────────────
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
    <div
      className="w-full flex flex-col justify-between shrink-0 h-full bg-white md:bg-transparent"
      style={{ backgroundColor: C.surfaceContainerLow }}
    >
      {/* Top Header */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center group">
          <div>
            <span className="text-3xl font-bold tracking-tight block" style={{ color: C.primary, fontFamily: 'var(--font-fredoka), sans-serif' }}>
              Focus
            </span>
            <span
              className="text-[10px] uppercase tracking-widest font-semibold block mt-0.5"
              style={{ color: C.outline }}
            >
              Agent Syllabus
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="mt-8 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  isActive
                    ? {
                        backgroundColor: C.surfaceContainerLowest,
                        color: C.primary,
                        border: `1px solid ${C.surfaceVariant}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }
                    : {
                        color: C.onSurfaceVariant,
                        border: '1px solid transparent',
                      }
                }
              >
                <Icon
                  className="h-4 w-4"
                  style={{ color: isActive ? C.primary : C.outline }}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session profile / Logout */}
      <div className="p-6 border-t space-y-4 shrink-0" style={{ borderColor: C.surfaceVariant }}>
        <div
          className="flex items-center gap-3 p-3 rounded-xl border"
          style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: `${C.accentBlue}40`, color: '#5a6ba8' }}
          >
            {displayName[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-semibold block truncate" style={{ color: C.onSurface }}>
              {displayName}
            </span>
            <span className="text-[10px] block truncate" style={{ color: C.outline }}>
              {userEmail}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-xl transition-all hover:shadow-md"
          style={{
            borderColor: C.outlineVariant,
            color: C.onSurfaceVariant,
            backgroundColor: 'transparent',
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl shadow-sm border flex items-center justify-center bg-white hover:bg-zinc-50 transition-colors"
        style={{ borderColor: C.surfaceVariant, color: C.onSurface }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div 
            className="relative w-64 max-w-[80vw] h-full flex flex-col transform transition-transform animate-in slide-in-from-left border-r shadow-xl"
            style={{ borderColor: C.surfaceVariant }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 -right-12 p-2.5 rounded-xl bg-white shadow-sm border flex items-center justify-center text-zinc-500 hover:text-black transition-colors"
              style={{ borderColor: C.surfaceVariant }}
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex w-64 flex-col justify-between shrink-0 h-screen sticky top-0 border-r"
        style={{ borderColor: C.surfaceVariant }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
