import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import SessionClient from './SessionClient';

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prompt?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const { id } = await params;
  const { prompt } = await searchParams;

  if (!prompt) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#fef9f2', color: '#1d1c18', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      <Sidebar userEmail={user.email!} />
      <main className="flex-1 overflow-y-auto p-8 md:p-12 relative flex flex-col">
        <SessionClient sessionId={id} prompt={prompt} />
      </main>
    </div>
  );
}
