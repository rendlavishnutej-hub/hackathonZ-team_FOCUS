import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DashboardClient from '@/components/dashboard/DashboardClient';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user (securely using getUser)
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#fef9f2', color: '#1d1c18', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      {/* Sidebar navigation */}
      <Sidebar userEmail={user.email!} />

      {/* Main Dashboard space */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12 relative">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: 'rgba(190,198,224,0.15)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: 'rgba(255,226,76,0.1)' }} />
        
        <DashboardClient userEmail={user.email!} />
      </main>
    </div>
  );
}
