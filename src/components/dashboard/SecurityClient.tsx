'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Key, Fingerprint, Trash2, ShieldCheck, ShieldAlert, 
  Clock, MapPin, Laptop, Plus, AlertCircle, Loader2, LogOut, CheckCircle2 
} from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { createClient } from '@/utils/supabase/client';

interface SecurityClientProps {
  initialPasskeys: Array<{ id: string; created_at: string }>;
  initialLogs: Array<{
    id: string;
    session_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    location: string | null;
    is_active: boolean;
    login_status: string;
    created_at: string;
  }>;
  mfaEnabled: boolean;
  currentUserEmail: string;
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown Device';
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('Android')) return 'Android Phone';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Macintosh')) return 'MacBook / iMac';
  if (ua.includes('Linux')) return 'Linux Machine';
  return 'Desktop Device';
}

function formatIpAddress(ip: string | null): string {
  if (!ip) return 'Unknown IP';
  if (ip === '::1') return '127.0.0.1';
  return ip;
}

export default function SecurityClient({
  initialPasskeys,
  initialLogs,
  mfaEnabled,
  currentUserEmail,
}: SecurityClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [passkeys, setPasskeys] = useState(initialPasskeys);
  const [logs, setLogs] = useState(initialLogs);

  const [loading, setLoading] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegisterPasskey = async () => {
    setError(null);
    setSuccess(null);
    setPasskeyLoading(true);

    try {
      const optionsRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
      });
      if (!optionsRes.ok) {
        const errData = await optionsRes.json();
        throw new Error(errData.error || 'Failed to get registration options');
      }
      const options = await optionsRes.json();
      const credential = await startRegistration(options);

      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Verification failed');
      }

      setSuccess('Passkey registered successfully! You can now use it to sign in.');
      
      const { data: newPasskeys } = await supabase
        .from('webauthn_credentials')
        .select('id, created_at');
      if (newPasskeys) setPasskeys(newPasskeys);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register passkey. Verify HTTPS/Localhost environment.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setError(null);
    setSuccess(null);
    setLoading(id);

    try {
      const { error: dbError } = await supabase
        .from('webauthn_credentials')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setSuccess('Passkey deleted successfully.');
      setPasskeys(passkeys.filter(pk => pk.id !== id));
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete passkey: ' + err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleRevokeSession = async (sessionId: string, isCurrentSession: boolean) => {
    setError(null);
    setSuccess(null);
    setLoading(sessionId);

    try {
      const { error: rpcError } = await supabase.rpc('revoke_session', {
        target_session_id: sessionId,
      });

      if (rpcError) throw rpcError;

      setSuccess('Session revoked successfully.');
      
      setLogs(logs.map(log => 
        log.session_id === sessionId 
          ? { ...log, is_active: false }
          : log
      ));

      if (isCurrentSession) {
        setSuccess('Current session revoked. Logging out...');
        setTimeout(async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch {}
          await supabase.auth.signOut();
          router.push('/login');
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to revoke session: ' + err.message);
    } finally {
      if (!isCurrentSession) {
        setLoading(null);
      }
    }
  };

  const activeSessions = logs.filter(log => log.is_active && log.session_id);
  const auditLogs = logs.filter(log => !log.is_active || log.login_status === 'failed');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="space-y-1.5 border-b border-zinc-900 pb-6">
        <h1 className="font-display text-3xl sm:text-5xl tracking-wide uppercase text-white leading-none">
          Grid Settings
        </h1>
        <p className="text-sm text-zinc-400 font-body">
          Manage your credentials, active login keys, and audit logs.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900/40 text-red-200 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/40 border border-emerald-900/40 text-emerald-200 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passkeys Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#13131A]/30 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-white uppercase tracking-wider">
              Biometric Passkeys
            </h3>
            <button
              onClick={handleRegisterPasskey}
              disabled={passkeyLoading}
              className="px-3 py-1.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 text-xs font-bold rounded-lg flex items-center gap-1 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {passkeyLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3 stroke-[3]" />
              )}
              Add Passkey
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-body">
            Register face/fingerprint credentials to sign in directly from this device without typing passwords.
          </p>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {passkeys.map(pk => (
              <div key={pk.id} className="flex items-center justify-between bg-zinc-950/60 border border-zinc-900 p-3 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4.5 w-4.5 text-[#22D3D0]" />
                  <div>
                    <span className="font-mono text-zinc-300 font-semibold truncate block w-40">
                      {pk.id.slice(0, 10)}...{pk.id.slice(-6)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5" suppressHydrationWarning>
                      Added: {new Date(pk.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePasskey(pk.id)}
                  disabled={loading === pk.id}
                  className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                >
                  {loading === pk.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
            {passkeys.length === 0 && (
              <p className="text-xs text-zinc-650 text-center py-6">No passkeys registered yet.</p>
            )}
          </div>
        </div>

        {/* Multi-Factor Authentication Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#13131A]/30 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-display text-lg text-white uppercase tracking-wider">
              Multi-Factor Auth (MFA)
            </h3>
            
            <p className="text-xs text-zinc-400 leading-relaxed font-body">
              Enable two-step verification using Google Authenticator, Authy, or Microsoft Authenticator to add an extra layer of protection.
            </p>

            <div className="flex items-center gap-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-900">
              {mfaEnabled ? (
                <>
                  <ShieldCheck className="h-6 w-6 text-[#3DD68C] shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">Status: ENABLED & SECURED</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Account is guarded by a 6-digit TOTP secret.</span>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-6 w-6 text-yellow-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">Status: UNPROTECTED</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">MFA is recommended to prevent password compromises.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900/60">
            <button
              onClick={() => router.push('/dashboard/mfa/enroll')}
              className="w-full flex justify-center py-2.5 px-4 border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
            >
              {mfaEnabled ? 'Manage MFA Factors' : 'Set Up Two-Factor Auth'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 bg-[#13131A]/30 space-y-5">
        <h3 className="font-display text-lg text-white uppercase tracking-wider">
          Active Sessions ({activeSessions.length})
        </h3>
        
        <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/50">
          {activeSessions.map((session, idx) => (
            <div key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <Laptop className="h-5 w-5 text-zinc-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{parseUserAgent(session.user_agent)}</span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 bg-[#22D3D0]/10 text-[#22D3D0] text-[9px] font-bold rounded border border-[#22D3D0]/15 tracking-wider uppercase">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-500">
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Logged in: {new Date(session.created_at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {session.location} ({formatIpAddress(session.ip_address)})
                    </span>
                  </div>
                </div>
              </div>
              
              {session.session_id && (
                <button
                  onClick={() => handleRevokeSession(session.session_id!, idx === 0)}
                  disabled={loading === session.session_id}
                  className="sm:self-center px-3 py-1.5 border border-red-950/30 text-red-400 hover:text-white hover:bg-red-950/20 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {loading === session.session_id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Revoke Access'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 bg-[#13131A]/30 space-y-5">
        <h3 className="font-display text-lg text-white uppercase tracking-wider">
          Security Audit Trail
        </h3>
        
        <div className="overflow-x-auto border border-zinc-900 rounded-xl">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="bg-zinc-950/80 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-900">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Device Details</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60 bg-zinc-950/30">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/10">
                  <td className="px-4 py-3.5 font-semibold text-white">
                    {log.login_status === 'failed' ? 'Failed Sign In' : 'Successful Authentication'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.login_status === 'failed' 
                        ? 'bg-[#F1583D]/10 text-[#F1583D] border border-[#F1583D]/15' 
                        : 'bg-[#3DD68C]/10 text-[#3DD68C] border border-[#3DD68C]/15'
                    }`}>
                      {log.login_status === 'failed' ? 'Blocked' : 'Authorized'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono">{formatIpAddress(log.ip_address)}</td>
                  <td className="px-4 py-3.5 truncate max-w-xs" title={log.user_agent || ''}>
                    {parseUserAgent(log.user_agent)}
                  </td>
                  <td className="px-4 py-3.5" suppressHydrationWarning>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-zinc-600">
                    No historical logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
