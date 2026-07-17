import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import CareerGuidanceClient from '@/components/dashboard/CareerGuidanceClient';

export const metadata = {
  title: 'Career Guidance | FOCUS Dashboard',
  description: 'Get personalised career suggestions powered by AI based on your skills and interests.',
};

export default async function CareerGuidancePage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#fef9f2', color: '#1d1c18', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      {/* Sidebar navigation */}
      <Sidebar userEmail={user.email!} />

      {/* Main Career Guidance space */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12 relative">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: 'rgba(211,87,154,0.10)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: 'rgba(190,198,224,0.15)' }} />

        <CareerGuidanceClient userEmail={user.email!} />
      </main>
    </div>
  );
}
