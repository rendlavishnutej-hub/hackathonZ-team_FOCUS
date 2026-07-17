import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import QuizTakeClient from './QuizTakeClient';

export const metadata = {
  title: 'Take Quiz | FOCUS Dashboard',
  description: 'Answer quiz questions and test your knowledge.',
};

export default async function QuizTakePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-[#fef9f2] text-black overflow-hidden font-sans">
      <Sidebar userEmail={user.email!} />
      <main className="flex-1 overflow-y-auto dots-bg p-4 md:p-8 relative">
        <QuizTakeClient userId={user.id} />
      </main>
    </div>
  );
}
