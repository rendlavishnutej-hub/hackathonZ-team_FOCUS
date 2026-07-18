import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import NotesClient from './NotesClient';

export const metadata = {
  title: 'My Study Notes | FOCUS Dashboard',
  description: 'Review your personalized AI-generated study notes and curriculum summaries.',
};

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#fef9f2', color: '#1d1c18', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      <Sidebar userEmail={user.email!} />
      <main className="flex-1 overflow-y-auto p-8 md:p-12 relative flex flex-col">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: 'rgba(190,198,224,0.15)' }} />
        
        <NotesClient />
      </main>
    </div>
  );
}
