import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import SecurityClient from '@/components/dashboard/SecurityClient';

export const metadata = {
  title: 'Settings & Security | FOCUS Dashboard',
  description: 'Manage MFA, Passkeys, active login sessions, and review your audit history.',
};

export default async function SettingsPage() {
  const supabase = await createClient();

  // 1. Fetch user (securely using getUser)
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // 2. Fetch passkeys/WebAuthn credentials for this user
  const { data: passkeys } = await supabase
    .from('webauthn_credentials')
    .select('id, created_at')
    .eq('user_id', user.id);

  // 3. Fetch session logs audit trail
  const { data: logs } = await supabase
    .from('sessions_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(25);

  // 4. Fetch Multi-Factor Authentication factors status
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const mfaEnabled = factors?.all?.some((f: any) => f.status === 'verified') || false;

  return (
    <div className="flex h-screen bg-[#0A0A0F] text-[#F5F5F7] overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar userEmail={user.email!} />

      {/* Main Settings space */}
      <main className="flex-1 overflow-y-auto dots-bg p-8 md:p-12 relative">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-[#7C5CFF]/5 rounded-full blur-[80px] pointer-events-none" />
        
        <SecurityClient
          initialPasskeys={passkeys || []}
          initialLogs={logs || []}
          mfaEnabled={mfaEnabled}
          currentUserEmail={user.email!}
        />
      </main>
    </div>
  );
}
