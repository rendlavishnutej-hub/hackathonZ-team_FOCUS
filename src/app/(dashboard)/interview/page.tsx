import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import InterviewDashboardClient from '@/components/interview/InterviewDashboard';

export const metadata = {
  title: 'AI Mock Interview | FOCUS Operating System',
  description: 'Practice high-impact, voice-based technical and behavioral mock interviews with expert AI agents.',
};

export default async function InterviewDashboardPage() {
  const supabase = await createClient();

  // Fetch user (securely using getUser)
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in" style={{ backgroundColor: '#fef9f2', color: '#1d1c18', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      {/* Sidebar navigation */}
      <Sidebar userEmail={user.email!} />

      {/* Main dashboard space */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle blur highlights */}
        <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(211,87,154,0.06)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(190,198,224,0.08)' }} />
        
        <div className="p-8 md:p-12 min-h-full">
          <InterviewDashboardClient userEmail={user.email!} />
        </div>
      </main>
    </div>
  );
}
