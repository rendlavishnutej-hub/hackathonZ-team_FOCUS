import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import InterviewSessionClient from '@/components/interview/InterviewSession';

export default async function InterviewSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    role?: string;
    company?: string;
    difficulty?: string;
    type?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const { id } = await params;
  const { role, company, difficulty, type } = await searchParams;

  if (!role || !company) {
    redirect('/interview');
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: '#0a0a0f', color: '#f0f0f5', fontFamily: 'var(--font-jakarta), sans-serif' }}
    >
      {/* Sidebar — keep consistent */}
      <Sidebar userEmail={user.email!} />

      {/* Interview workspace — full dark immersive */}
      <main className="flex-1 overflow-hidden relative">
        <InterviewSessionClient
          sessionId={id}
          role={role}
          company={company}
          difficulty={difficulty || 'Medium'}
          interviewType={type || 'Technical Interview'}
          userEmail={user.email!}
        />
      </main>
    </div>
  );
}
