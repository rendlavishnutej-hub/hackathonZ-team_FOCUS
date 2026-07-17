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
    <div className="flex h-screen bg-[#0A0A0F] text-[#F5F5F7] overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar userEmail={user.email!} />

      {/* Main Dashboard space */}
      <main className="flex-1 overflow-y-auto dots-bg p-8 md:p-12 relative">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-[#22D3D0]/5 rounded-full blur-[80px] pointer-events-none" />
        
        <DashboardClient userEmail={user.email!} />
      </main>
    </div>
  );
}
