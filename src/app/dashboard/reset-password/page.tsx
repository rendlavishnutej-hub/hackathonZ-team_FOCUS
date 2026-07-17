'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { evaluatePassword, type PasswordStrengthResult } from '@/utils/passwordStrength';
import { updatePasswordAction } from '../../auth/actions';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Live zxcvbn strength state
  const [strength, setStrength] = useState<PasswordStrengthResult | null>(null);

  // HaveIBeenPwned breach state
  const [checkingBreach, setCheckingBreach] = useState(false);
  const [isBreached, setIsBreached] = useState<boolean | null>(null);
  const [breachCount, setBreachCount] = useState<number>(0);

  useEffect(() => {
    if (!password || password.length < 6) {
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingBreach(true);
      try {
        const res = await fetch('/api/auth/pwned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsBreached(data.pwned);
          setBreachCount(data.count || 0);
        }
      } catch (err) {
        console.error('Breach check failed:', err);
      } finally {
        setCheckingBreach(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [password]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);

    if (!val || val.length < 6) {
      setIsBreached(null);
      setBreachCount(0);
    }

    if (!val) {
      setStrength(null);
      return;
    }

    const result = evaluatePassword(val);
    setStrength(result);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (strength && strength.score < 3) {
      setError('Please choose a stronger password.');
      return;
    }

    if (isBreached) {
      setError('This password has been pwned in a data breach. Please choose a different password.');
      return;
    }

    setLoading(true);

    const fData = new FormData();
    fData.append('password', password);

    try {
      const res = await updatePasswordAction(fData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(res.message || 'Password updated successfully!');
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthMeta = (score: number) => {
    switch (score) {
      case 0: return { color: 'bg-red-500', text: 'Risky / Very Weak', labelColor: 'text-red-500' };
      case 1: return { color: 'bg-orange-500', text: 'Weak / Guessable', labelColor: 'text-orange-500' };
      case 2: return { color: 'bg-yellow-500', text: 'Moderate / Vulnerable', labelColor: 'text-yellow-500' };
      case 3: return { color: 'bg-green-500', text: 'Strong / Safe', labelColor: 'text-green-500' };
      case 4: return { color: 'bg-emerald-500', text: 'Excellent / Very Secure', labelColor: 'text-emerald-500' };
      default: return { color: 'bg-neutral-600', text: 'None', labelColor: 'text-neutral-500' };
    }
  };

  const strengthMeta = strength !== null ? getStrengthMeta(strength.score) : null;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-zinc-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Shield className="h-6 w-6 text-emerald-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Enter new password
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Ensure it is strong, unique, and not breached.
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Password Strength Visualization */}
              {strength && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-400">Password Strength:</span>
                    <span className={`font-bold ${strengthMeta?.labelColor}`}>{strengthMeta?.text}</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 1, 2, 3].map((val) => (
                      <div
                        key={val}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          strength.score > val ? strengthMeta?.color : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Offline Slow Attack:</span>
                      <span className="text-zinc-300 font-mono">{strength.crackTimesDisplay.offlineSlowHashing}</span>
                    </div>
                    {strength.feedback.warning && (
                      <p className="text-amber-500 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 inline shrink-0" />
                        {strength.feedback.warning}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* HIBP Breach Indicators */}
              {password && (
                <div className="mt-3 text-xs flex items-center justify-between border-t border-zinc-850 pt-2">
                  <span className="text-zinc-400">Breach Check:</span>
                  {checkingBreach ? (
                    <span className="text-zinc-500 flex items-center gap-1 font-mono">
                      <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                      Auditing...
                    </span>
                  ) : isBreached === true ? (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      Compromised ({breachCount.toLocaleString()} leaks)
                    </span>
                  ) : isBreached === false ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      Clean / Safe
                    </span>
                  ) : (
                    <span className="text-zinc-650">Too short</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || (strength !== null && strength.score < 3) || isBreached === true}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
