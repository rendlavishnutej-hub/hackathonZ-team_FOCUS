'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Key, Mail, User, CheckCircle2, AlertTriangle, 
  Loader2, XCircle, ShieldCheck, Terminal 
} from 'lucide-react';
import { evaluatePassword, type PasswordStrengthResult } from '@/utils/passwordStrength';
import { signUpAction } from '../../auth/actions';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Live zxcvbn strength state
  const [strength, setStrength] = useState<PasswordStrengthResult | null>(null);

  // HaveIBeenPwned breach state
  const [checkingBreach, setCheckingBreach] = useState(false);
  const [isBreached, setIsBreached] = useState<boolean | null>(null);
  const [breachCount, setBreachCount] = useState<number>(0);

  // Debounced breach check
  useEffect(() => {
    if (!formData.password || formData.password.length < 6) {
      setIsBreached(null);
      setBreachCount(0);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingBreach(true);
      try {
        const res = await fetch('/api/auth/pwned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: formData.password }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsBreached(data.pwned);
          setBreachCount(data.count || 0);
        }
      } catch (err) {
        console.error('Pwned password check failed:', err);
      } finally {
        setCheckingBreach(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [formData.password]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, password: val });

    if (!val) {
      setStrength(null);
      return;
    }

    const result = evaluatePassword(val, [formData.email, formData.displayName]);
    setStrength(result);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Final security checks before sending to server
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
    fData.append('email', formData.email);
    fData.append('password', formData.password);
    fData.append('displayName', formData.displayName);

    try {
      const res = await signUpAction(fData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(res.message || 'Account created successfully!');
        if (res.redirect) {
          router.push(res.redirect);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred during signup.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthMeta = (score: number) => {
    switch (score) {
      case 0:
        return { color: 'bg-red-500', text: 'Risky / Very Weak', labelColor: 'text-red-500' };
      case 1:
        return { color: 'bg-orange-500', text: 'Weak / Guessable', labelColor: 'text-orange-500' };
      case 2:
        return { color: 'bg-yellow-500', text: 'Moderate / Vulnerable', labelColor: 'text-yellow-500' };
      case 3:
        return { color: 'bg-green-500', text: 'Strong / Safe', labelColor: 'text-green-500' };
      case 4:
        return { color: 'bg-emerald-500', text: 'Excellent / Very Secure', labelColor: 'text-emerald-500' };
      default:
        return { color: 'bg-neutral-600', text: 'None', labelColor: 'text-neutral-500' };
    }
  };

  const strengthMeta = strength !== null ? getStrengthMeta(strength.score) : null;

  return (
    <div className="flex-1 bg-[#0A0A0F] text-[#F5F5F7] flex min-h-screen relative dots-bg overflow-hidden">
      {/* Visual left pane (split screen) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 border-r border-white/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#7C5CFF]/10 rounded-full blur-[100px]" />
        
        <Link href="/" className="flex items-center gap-3 group z-10">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0] p-[1px]">
            <div className="h-full w-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Terminal className="h-4.5 w-4.5 text-[#22D3D0]" />
            </div>
          </div>
          <span className="font-display text-2xl tracking-wide text-white">FOCUS</span>
        </Link>

        <div className="space-y-6 max-w-md z-10">
          <h1 className="font-display text-6xl tracking-wide uppercase text-white leading-none">
            START YOUR <br />
            <span className="text-gradient">JOURNEY</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-body">
            Create an account to build multi-agent learning roadmaps. All accounts are protected by the Aegis Security protocol, implementing client-side entropy checks and leak audits.
          </p>
        </div>

        <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold z-10">
          SECURED BY AEGIS PROTOCOL &bull; FOCUS STUDY CORP
        </div>
      </div>

      {/* Form right pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 bg-[#13131A]/60 shadow-xl shadow-[#7C5CFF]/5">
          <div className="text-center">
            <h2 className="font-display text-3xl tracking-wide uppercase text-white">
              Create Account
            </h2>
            <p className="text-xs text-zinc-400 mt-2">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#22D3D0] hover:text-[#22D3D0]/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900/40 text-red-200 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/40 border border-emerald-900/40 text-emerald-200 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="displayName" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-zinc-500" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Alex Smith"
                  className="block w-full pl-10 pr-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-zinc-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4.5 w-4.5 text-zinc-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] text-sm transition-all"
                />
              </div>

              {/* Password strength feedback */}
              {strengthMeta && (
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 uppercase tracking-wider font-semibold">Password Strength:</span>
                    <span className={`font-bold ${strengthMeta.labelColor}`}>{strengthMeta.text}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-0.5">
                    {[0, 1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 transition-all duration-300 ${
                          strength && strength.score > step ? strengthMeta.color : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>

                  {strength?.feedback?.warning && (
                    <p className="text-[10px] text-yellow-500 font-semibold leading-relaxed">
                      ⚠ {strength?.feedback?.warning}
                    </p>
                  )}
                </div>
              )}

              {/* Breach Leakage Audit Feedback */}
              {formData.password.length >= 6 && (
                <div className="mt-3 flex items-center justify-between text-[10px] bg-zinc-950/30 p-2 rounded-lg border border-zinc-900">
                  <span className="text-zinc-500 uppercase tracking-wider font-semibold">Leakage Audit:</span>
                  {checkingBreach ? (
                    <span className="text-zinc-400 animate-pulse font-semibold">Checking data breaches...</span>
                  ) : isBreached === true ? (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      Leaked ({breachCount} times)
                    </span>
                  ) : isBreached === false ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Secure / Not Leaked
                    </span>
                  ) : (
                    <span className="text-zinc-600">Pending</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || checkingBreach || isBreached === true}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-zinc-950 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
