import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import QuizHubClient from './QuizHubClient';

export const metadata = {
  title: 'Quiz | FOCUS Dashboard',
  description: 'Test your knowledge with interactive quizzes across subjects and topics.',
};

export default async function QuizPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-[#fef9f2] text-black overflow-hidden font-sans">
      <Sidebar userEmail={user.email!} />
      <main className="flex-1 overflow-y-auto dots-bg p-8 md:p-12 relative">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-[#d3579a]/0.04 rounded-full blur-[80px] pointer-events-none" />
        <QuizHubClient userEmail={user.email!} userId={user.id} />
      </main>
    </div>
  );
}
