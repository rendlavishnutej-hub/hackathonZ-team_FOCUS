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

// ─── Colour constants matching the landing page design system ──────────────
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
  inverseOnSurface: '#f5f0e9',
  inverseSurface: '#32302c',
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
  secondaryContainer: '#fcdf46',
};

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

    if (!val || val.length < 6) {
      setIsBreached(null);
      setBreachCount(0);
    }

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
        return { color: 'bg-red-500', text: 'Risky / Very Weak', labelColor: 'text-red-600' };
      case 1:
        return { color: 'bg-orange-500', text: 'Weak / Guessable', labelColor: 'text-orange-600' };
      case 2:
        return { color: 'bg-yellow-500', text: 'Moderate / Vulnerable', labelColor: 'text-yellow-600' };
      case 3:
        return { color: 'bg-green-500', text: 'Strong / Safe', labelColor: 'text-green-600' };
      case 4:
        return { color: 'bg-emerald-500', text: 'Excellent / Very Secure', labelColor: 'text-emerald-600' };
      default:
        return { color: 'bg-neutral-400', text: 'None', labelColor: 'text-neutral-500' };
    }
  };

  const strengthMeta = strength !== null ? getStrengthMeta(strength.score) : null;

  return (
    <div
      className="flex-1 flex min-h-screen relative overflow-hidden"
      style={{ backgroundColor: C.cream, color: C.onSurface, fontFamily: 'var(--font-jakarta), sans-serif' }}
    >
      {/* Visual left pane (split screen) */}
      <div
        className="hidden lg:flex w-1/2 border-r flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.surfaceVariant }}
      >
        {/* Background decorative blobs */}
        <div
          className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full blur-[100px]"
          style={{ backgroundColor: `${C.accentPink}30` }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full blur-[80px]"
          style={{ backgroundColor: `${C.accentGreen}25` }}
        />
        
        <Link href="/" className="flex items-center gap-3 group z-10">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style={{ background: 'linear-gradient(135deg, #bec6e0 0%, #7c839b 100%)', fontFamily: 'var(--font-fredoka), sans-serif' }}
          >
            F
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: C.primary, fontFamily: 'var(--font-fredoka), sans-serif' }}>
            Focus
          </span>
        </Link>

        <div className="space-y-6 max-w-md z-10">
          <h1
            className="text-5xl font-extrabold tracking-tight leading-tight"
            style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
          >
            Start Your <br />
            <span style={{ color: C.accentPurple }}>Journey</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Create an account to build multi-agent learning roadmaps. All accounts are protected by the Aegis Security protocol, implementing client-side entropy checks and leak audits.
          </p>
        </div>

        <div className="text-[10px] uppercase tracking-widest font-bold z-10" style={{ color: C.outline }}>
          SECURED BY AEGIS PROTOCOL &bull; FOCUS STUDY CORP
        </div>
      </div>

      {/* Form right pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative overflow-y-auto">
        <div
          className="w-full max-w-md space-y-8 p-8 sm:p-10 rounded-3xl border shadow-xl"
          style={{
            backgroundColor: C.surfaceContainerLowest,
            borderColor: C.surfaceVariant,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div className="text-center">
            <h2
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
            >
              Create Account
            </h2>
            <p className="text-sm mt-2" style={{ color: C.onSurfaceVariant }}>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold transition-colors" style={{ color: C.accentPurple }}>
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div
              className="text-xs p-3.5 rounded-xl flex items-start gap-2.5"
              style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
            >
              <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: '#dc2626' }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              className="text-xs p-3.5 rounded-xl flex items-start gap-2.5"
              style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
            >
              <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: '#16a34a' }} />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: C.outline }}
              >
                Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4" style={{ color: C.outline }} />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Alex Smith"
                  className="block w-full pl-10 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: C.surfaceContainerLow,
                    borderColor: C.outlineVariant,
                    color: C.onSurface,
                    '--tw-ring-color': C.primary,
                  } as React.CSSProperties}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: C.outline }}
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4" style={{ color: C.outline }} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: C.surfaceContainerLow,
                    borderColor: C.outlineVariant,
                    color: C.onSurface,
                    '--tw-ring-color': C.primary,
                  } as React.CSSProperties}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: C.outline }}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4" style={{ color: C.outline }} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: C.surfaceContainerLow,
                    borderColor: C.outlineVariant,
                    color: C.onSurface,
                    '--tw-ring-color': C.primary,
                  } as React.CSSProperties}
                />
              </div>

              {/* Password strength feedback */}
              {strengthMeta && (
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="uppercase tracking-wider font-semibold" style={{ color: C.outline }}>
                      Password Strength:
                    </span>
                    <span className={`font-bold ${strengthMeta.labelColor}`}>{strengthMeta.text}</span>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full overflow-hidden flex gap-0.5"
                    style={{ backgroundColor: C.surfaceVariant }}
                  >
                    {[0, 1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 transition-all duration-300 ${
                          strength && strength.score > step ? strengthMeta.color : ''
                        }`}
                        style={
                          !(strength && strength.score > step)
                            ? { backgroundColor: C.surfaceContainerHigh }
                            : undefined
                        }
                      />
                    ))}
                  </div>

                  {strength?.feedback?.warning && (
                    <p className="text-[10px] text-yellow-600 font-semibold leading-relaxed">
                      ⚠ {strength?.feedback?.warning}
                    </p>
                  )}
                </div>
              )}

              {/* Breach Leakage Audit Feedback */}
              {formData.password.length >= 6 && (
                <div
                  className="mt-3 flex items-center justify-between text-[10px] p-2 rounded-lg border"
                  style={{
                    backgroundColor: C.surfaceContainerLow,
                    borderColor: C.surfaceVariant,
                  }}
                >
                  <span className="uppercase tracking-wider font-semibold" style={{ color: C.outline }}>
                    Leakage Audit:
                  </span>
                  {checkingBreach ? (
                    <span className="animate-pulse font-semibold" style={{ color: C.onSurfaceVariant }}>
                      Checking data breaches...
                    </span>
                  ) : isBreached === true ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      Leaked ({breachCount} times)
                    </span>
                  ) : isBreached === false ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Secure / Not Leaked
                    </span>
                  ) : (
                    <span style={{ color: C.outline }}>Pending</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || checkingBreach || isBreached === true}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md hover:opacity-90 hover:scale-[1.01]"
                style={{
                  backgroundColor: C.primary,
                  color: C.onPrimary,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
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
