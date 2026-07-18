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
      <main className="flex-1 overflow-hidden relative flex flex-col bg-[#f8f3ec]">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(211,87,154,0.12)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(190,198,224,0.18)' }} />

        <CareerGuidanceClient userEmail={user.email!} />
      </main>
    </div>
  );
}
