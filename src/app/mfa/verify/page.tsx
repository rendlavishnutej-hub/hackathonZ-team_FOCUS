'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function MfaVerifyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isUsingBackup, setIsUsingBackup] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingFactors, setFetchingFactors] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch enrolled TOTP factors
  useEffect(() => {
    async function loadFactors() {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;

        // Find the first active/verified TOTP factor
        const totpFactor = data.totp?.find(f => f.status === 'verified');
        if (totpFactor) {
          setFactorId(totpFactor.id);
        } else {
          // If no verified factors are found, the user shouldn't be here
          setError('No enrolled MFA factors found for this account.');
          setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
        }
      } catch (err: any) {
        console.error('Failed to load MFA factors:', err);
        setError(err.message || 'Failed to load MFA factors');
      } finally {
        setFetchingFactors(false);
      }
    }
    loadFactors();
  }, [supabase, router]);

  // Handle standard TOTP validation
  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || totpCode.length !== 6) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factorId,
          code: totpCode,
          isBackupCode: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'MFA verification failed');
      }

      setSuccess('Verification successful! Access granted.');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle Backup Code validation
  const handleBackupVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backupCode.length !== 8) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: backupCode,
          isBackupCode: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify backup code');
      }

      setSuccess(data.message || 'MFA disabled using recovery code.');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid backup code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-zinc-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Shield className="h-6 w-6 text-emerald-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Multi-Factor Verification
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          This account requires verification before continuing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/55 backdrop-blur-md py-8 px-4 border border-zinc-850 rounded-2xl shadow-xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-950/40 border border-red-900/60 text-red-200 text-sm p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-950/40 border border-emerald-900/60 text-emerald-200 text-sm p-4 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {fetchingFactors ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              <span className="text-sm text-zinc-400">Resolving security credentials...</span>
            </div>
          ) : !isUsingBackup ? (
            /* TOTP Code Form */
            <form onSubmit={handleTotpVerify} className="space-y-6">
              <div>
                <label htmlFor="totp" className="block text-center text-sm font-medium text-zinc-300">
                  Enter Authenticator Code
                </label>
                <p className="text-center text-xs text-zinc-500 mt-1 mb-4">
                  Open your authenticator app and enter the 6-digit verification code.
                </p>
                <div className="mt-1 relative flex justify-center">
                  <input
                    id="totp"
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="block w-48 text-center tracking-[0.75em] pl-[0.75em] py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify TOTP Code'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsUsingBackup(true);
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors underline"
                >
                  Lost your authenticator? Use a backup recovery code
                </button>
              </div>
            </form>
          ) : (
            /* Backup Recovery Code Form */
            <form onSubmit={handleBackupVerify} className="space-y-6">
              <div>
                <label htmlFor="backup" className="block text-center text-sm font-medium text-zinc-300">
                  Enter Backup Recovery Code
                </label>
                <p className="text-center text-xs text-zinc-500 mt-1 mb-4">
                  Enter one of the 8-character recovery codes generated during MFA enrollment.
                </p>
                <div className="mt-1 relative flex justify-center">
                  <input
                    id="backup"
                    type="text"
                    required
                    maxLength={8}
                    autoCapitalize="characters"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                    placeholder="ABCDEFGH"
                    className="block w-48 text-center tracking-[0.25em] pl-[0.25em] py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || backupCode.length !== 8}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Use Recovery Code'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsUsingBackup(false);
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors underline"
                >
                  Back to standard TOTP verification
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
