import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import CourseClient from './CourseClient';

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const { id } = await params;

  return (
    <div className="flex h-screen bg-[#0A0A0F] text-[#F5F5F7] overflow-hidden">
      <Sidebar userEmail={user.email!} />
      <main className="flex-1 overflow-y-auto dots-bg p-8 md:p-12 relative flex flex-col">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-[#3DD68C]/5 rounded-full blur-[80px] pointer-events-none" />
        
        <CourseClient courseId={id} />
      </main>
    </div>
  );
}
