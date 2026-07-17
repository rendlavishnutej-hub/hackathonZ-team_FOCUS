'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Key, Fingerprint, Trash2, ShieldCheck, ShieldAlert, 
  Clock, MapPin, Laptop, Plus, AlertCircle, Loader2, LogOut, CheckCircle2 
} from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { createClient } from '@/utils/supabase/client';

const C = {
  cream: '#fef9f2',
  primary: '#000000',
  onPrimary: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f3ec',
  surfaceContainer: '#f2ede6',
  surfaceContainerHigh: '#ece7e1',
  surfaceVariant: '#e6e2db',
  onSurface: '#1d1c18',
  onSurfaceVariant: '#45464d',
  outline: '#76777d',
  outlineVariant: '#c6c6cd',
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
  secondaryContainer: '#fcdf46',
};

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
      <div className="space-y-1.5 pb-6" style={{ borderBottom: `1px solid ${C.surfaceVariant}` }}>
        <h1 className="font-display text-3xl sm:text-5xl tracking-wide uppercase leading-none" style={{ color: C.primary }}>
          Grid Settings
        </h1>
        <p className="text-sm font-body" style={{ color: C.onSurfaceVariant }}>
          Manage your credentials, active login keys, and audit logs.
        </p>
      </div>

      {error && (
        <div className="text-xs p-3.5 rounded-xl flex items-start gap-2.5" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          <AlertCircle className="h-5 w-5 shrink-0" style={{ color: '#dc2626' }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="text-xs p-3.5 rounded-xl flex items-start gap-2.5" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}>
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#059669' }} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passkeys Panel */}
        <div className="p-6 rounded-2xl space-y-5" style={{ backgroundColor: C.surfaceContainerLowest, border: `1px solid ${C.surfaceVariant}` }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: C.primary }}>
              Biometric Passkeys
            </h3>
            <button
              onClick={handleRegisterPasskey}
              disabled={passkeyLoading}
              className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: C.primary, color: C.onPrimary }}
            >
              {passkeyLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3 stroke-[3]" />
              )}
              Add Passkey
            </button>
          </div>

          <p className="text-xs leading-relaxed font-body" style={{ color: C.onSurfaceVariant }}>
            Register face/fingerprint credentials to sign in directly from this device without typing passwords.
          </p>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {passkeys.map(pk => (
              <div key={pk.id} className="flex items-center justify-between p-3 rounded-xl text-xs" style={{ backgroundColor: C.surfaceContainerLow, border: `1px solid ${C.surfaceVariant}` }}>
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4.5 w-4.5" style={{ color: '#5a6ba8' }} />
                  <div>
                    <span className="font-mono font-semibold truncate block w-40" style={{ color: C.onSurface }}>
                      {pk.id.slice(0, 10)}...{pk.id.slice(-6)}
                    </span>
                    <span className="text-[10px] block mt-0.5" style={{ color: C.outline }} suppressHydrationWarning>
                      Added: {new Date(pk.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePasskey(pk.id)}
                  disabled={loading === pk.id}
                  className="p-2 rounded-lg transition-colors hover:bg-red-50"
                  style={{ color: C.outline }}
                >
                  {loading === pk.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
            {passkeys.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: C.outline }}>No passkeys registered yet.</p>
            )}
          </div>
        </div>

        {/* Multi-Factor Authentication Panel */}
        <div className="p-6 rounded-2xl space-y-5 flex flex-col justify-between" style={{ backgroundColor: C.surfaceContainerLowest, border: `1px solid ${C.surfaceVariant}` }}>
          <div className="space-y-4">
            <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: C.primary }}>
              Multi-Factor Auth (MFA)
            </h3>
            
            <p className="text-xs leading-relaxed font-body" style={{ color: C.onSurfaceVariant }}>
              Enable two-step verification using Google Authenticator, Authy, or Microsoft Authenticator to add an extra layer of protection.
            </p>

            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: C.surfaceContainerLow, border: `1px solid ${C.surfaceVariant}` }}>
              {mfaEnabled ? (
                <>
                  <ShieldCheck className="h-6 w-6 shrink-0" style={{ color: '#059669' }} />
                  <div>
                    <span className="text-xs font-bold block" style={{ color: C.primary }}>Status: ENABLED & SECURED</span>
                    <span className="text-[10px] block mt-0.5" style={{ color: C.outline }}>Account is guarded by a 6-digit TOTP secret.</span>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-6 w-6 shrink-0" style={{ color: '#d97706' }} />
                  <div>
                    <span className="text-xs font-bold block" style={{ color: C.primary }}>Status: UNPROTECTED</span>
                    <span className="text-[10px] block mt-0.5" style={{ color: C.outline }}>MFA is recommended to prevent password compromises.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-4" style={{ borderTop: `1px solid ${C.surfaceVariant}` }}>
            <button
              onClick={() => router.push('/dashboard/mfa/enroll')}
              className="w-full flex justify-center py-2.5 px-4 text-xs font-semibold rounded-xl transition-all hover:opacity-80"
              style={{ border: `1px solid ${C.outlineVariant}`, backgroundColor: C.surfaceContainerLow, color: C.onSurface }}
            >
              {mfaEnabled ? 'Manage MFA Factors' : 'Set Up Two-Factor Auth'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="p-6 sm:p-8 rounded-2xl space-y-5" style={{ backgroundColor: C.surfaceContainerLowest, border: `1px solid ${C.surfaceVariant}` }}>
        <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: C.primary }}>
          Active Sessions ({activeSessions.length})
        </h3>
        
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.surfaceVariant}`, backgroundColor: C.surfaceContainerLow }}>
          {activeSessions.map((session, idx) => (
            <div key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs" style={{ borderBottom: idx < activeSessions.length - 1 ? `1px solid ${C.surfaceVariant}` : 'none' }}>
              <div className="flex items-start gap-3">
                <Laptop className="h-5 w-5 mt-0.5 shrink-0" style={{ color: C.outline }} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: C.primary }}>{parseUserAgent(session.user_agent)}</span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded tracking-wider uppercase" style={{ backgroundColor: '#eff6ff', color: '#5a6ba8', border: '1px solid #bec6e0' }}>
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ color: C.outline }}>
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
                  className="sm:self-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 hover:bg-red-50"
                  style={{ border: '1px solid #fecaca', color: '#dc2626' }}
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
      <div className="p-6 sm:p-8 rounded-2xl space-y-5" style={{ backgroundColor: C.surfaceContainerLowest, border: `1px solid ${C.surfaceVariant}` }}>
        <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: C.primary }}>
          Security Audit Trail
        </h3>
        
        <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${C.surfaceVariant}` }}>
          <table className="w-full text-left text-xs" style={{ color: C.onSurfaceVariant }}>
            <thead className="font-bold uppercase tracking-wider" style={{ backgroundColor: C.surfaceContainerHigh, color: C.outline, borderBottom: `1px solid ${C.surfaceVariant}` }}>
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Device Details</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: C.surfaceContainerLowest }}>
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:opacity-80" style={{ borderBottom: `1px solid ${C.surfaceVariant}` }}>
                  <td className="px-4 py-3.5 font-semibold" style={{ color: C.primary }}>
                    {log.login_status === 'failed' ? 'Failed Sign In' : 'Successful Authentication'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={
                      log.login_status === 'failed' 
                        ? { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } 
                        : { backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }
                    }>
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
                  <td colSpan={5} className="text-center py-6" style={{ color: C.outline }}>
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
