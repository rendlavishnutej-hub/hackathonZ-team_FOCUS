'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Key, Mail, AlertTriangle, Loader2, Fingerprint, 
  Brain, ArrowRight, ShieldCheck, Globe, GitBranch 
} from 'lucide-react';
import { signInAction } from '../../auth/actions';
import { startAuthentication } from '@simplewebauthn/browser';
import { createClient } from '@/utils/supabase/client';

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') ? 'Authentication failed. Please try again.' : null
  );
  const [info, setInfo] = useState<string | null>(
    searchParams.get('reset') === 'success' ? 'Password reset successfully. Please log in.' : null
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const fData = new FormData();
    fData.append('email', formData.email);
    fData.append('password', formData.password);

    try {
      const res = await signInAction(fData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        if (res.mfaRequired) {
          router.push('/mfa/verify');
        } else {
          router.push(res.redirect || nextPath);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    setInfo(null);
    setPasskeyLoading(true);

    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw new Error('Passkeys require a secure connection (HTTPS or localhost).');
      }

      const optionsRes = await fetch('/api/auth/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!optionsRes.ok) {
        const errData = await optionsRes.json();
        throw new Error(errData.error || 'Failed to fetch WebAuthn options');
      }
      
      const options = await optionsRes.json();
      const credential = await startAuthentication(options);

      const verifyRes = await fetch('/api/auth/webauthn/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });

      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok || !verifyResult.success) {
        throw new Error(verifyResult.error || 'Passkey verification failed');
      }

      if (verifyResult.redirect) {
        router.push(verifyResult.redirect);
      } else {
        router.push(nextPath);
      }
    } catch (err: any) {
      console.error('Passkey authentication error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Passkey login was cancelled or is not allowed on this device.');
      } else {
        setError(err.message || 'Passkey authentication failed. Ensure you have registered a passkey first.');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google') => {
    setError(null);
    setOauthLoading(provider);
    
    try {
      const supabase = createClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      console.error(`${provider} login error:`, err);
      setError(`OAuth authentication failed: ${err.message}`);
      setOauthLoading(null);
    }
  };

  return (
    <div
      className="w-full max-w-md space-y-8 p-8 sm:p-10 rounded-[2rem] border relative overflow-hidden transition-all duration-500 hover:shadow-2xl"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.2)',
      }}
    >
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-[#7C5CFF]/10 to-[#22D3D0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-[#3DD68C]/10 to-[#F5B942]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="text-center">
        <h2
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
        >
          Sign In
        </h2>
        <p className="text-sm mt-2" style={{ color: C.onSurfaceVariant }}>
          New to FOCUS?{' '}
          <Link href="/signup" className="font-semibold transition-colors" style={{ color: C.accentPurple }}>
            Create an account
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

      {info && (
        <div
          className="text-xs p-3.5 rounded-xl flex items-start gap-2.5"
          style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
        >
          <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: '#16a34a' }} />
          <span>{info}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
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
              className="block w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
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
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider"
              style={{ color: C.outline }}
            >
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-xs font-semibold"
              style={{ color: C.accentPurple }}
            >
              Forgot?
            </Link>
          </div>
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
              onChange={handleInputChange}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
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
          <button
            type="submit"
            disabled={loading || passkeyLoading}
            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:opacity-90 hover:scale-[1.01]"
            style={{
              backgroundColor: C.primary,
              color: C.onPrimary,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log In'}
          </button>
        </div>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t" style={{ borderColor: C.surfaceVariant }} />
        <span
          className="flex-shrink mx-4 text-[10px] uppercase font-bold tracking-widest"
          style={{ color: C.outline }}
        >
          or secure sign-in
        </span>
        <div className="flex-grow border-t" style={{ borderColor: C.surfaceVariant }} />
      </div>

      <div className="space-y-3">
        {/* Passkey Login */}
        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={loading || passkeyLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:shadow-md"
          style={{
            borderColor: C.outlineVariant,
            backgroundColor: C.surfaceContainerLow,
            color: C.onSurface,
          }}
        >
          {passkeyLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: C.accentPurple }} />
          ) : (
            <Fingerprint className="h-4 w-4" style={{ color: C.accentPurple }} />
          )}
          Sign In with Passkey
        </button>

        {/* Google OAuth Login */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          disabled={oauthLoading !== null}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-xl text-sm font-semibold transition-all hover:shadow-md"
          style={{
            borderColor: C.outlineVariant,
            backgroundColor: C.surfaceContainerLow,
            color: C.onSurface,
          }}
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: C.primary }} />
          ) : (
            <Globe className="h-4 w-4" style={{ color: C.outline }} />
          )}
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
          style={{ backgroundColor: `${C.accentBlue}40` }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full blur-[80px]"
          style={{ backgroundColor: `${C.accentYellow}30` }}
        />
        
        <Link href="/" className="flex items-center group z-10">
          <span className="text-4xl font-bold tracking-tight" style={{ color: C.primary, fontFamily: 'var(--font-fredoka), sans-serif' }}>
            Focus
          </span>
        </Link>

        {/* Dynamic floating network animation mapping to AI agents */}
        <div className="relative w-full flex justify-center items-center h-[320px] z-10 my-8">
          {/* Outer glowing ring */}
          <div className="absolute w-[300px] h-[300px] rounded-full border border-zinc-800/10" style={{ animation: 'spin 25s linear infinite' }} />
          
          <div className="absolute w-[240px] h-[240px] rounded-full border-2 border-dashed border-zinc-800/20 flex items-center justify-center" style={{ animation: 'spin 18s linear infinite' }}>
            {/* Floating Orbiting Agents */}
            <div className="absolute -translate-x-[120px] w-12 h-12 rounded-full bg-white border border-[#7C5CFF]/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,92,255,0.2)]" style={{ animation: 'spin 18s linear infinite reverse' }}>
              <Globe className="h-5 w-5 text-[#7C5CFF]" />
            </div>
            <div className="absolute translate-x-[120px] w-12 h-12 rounded-full bg-white border border-[#22D3D0]/30 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,208,0.2)]" style={{ animation: 'spin 18s linear infinite reverse' }}>
              <ShieldCheck className="h-5 w-5 text-[#22D3D0]" />
            </div>
            <div className="absolute -translate-y-[120px] w-12 h-12 rounded-full bg-white border border-[#3DD68C]/30 flex items-center justify-center shadow-[0_0_20px_rgba(61,214,140,0.2)]" style={{ animation: 'spin 18s linear infinite reverse' }}>
              <GitBranch className="h-5 w-5 text-[#3DD68C]" />
            </div>
            <div className="absolute translate-y-[120px] w-12 h-12 rounded-full bg-white border border-[#F5B942]/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,185,66,0.2)]" style={{ animation: 'spin 18s linear infinite reverse' }}>
              <Fingerprint className="h-5 w-5 text-[#F5B942]" />
            </div>
          </div>
          
          {/* Middle pulsing rings */}
          <div className="absolute w-[160px] h-[160px] rounded-full border border-[#7C5CFF]/40 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-[120px] h-[120px] rounded-full border-2 border-[#22D3D0]/50 animate-pulse" style={{ animationDuration: '2s' }} />

          {/* Central Orchestrator Core */}
          <div className="absolute w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-[#7C5CFF] via-[#d3579a] to-[#22D3D0] flex items-center justify-center shadow-[0_0_40px_rgba(124,92,255,0.4)] z-20 transition-transform duration-500 hover:scale-110" style={{ animation: 'bounce 3s infinite' }}>
            <Brain className="h-10 w-10 text-white drop-shadow-md" style={{ animation: 'pulse 2s infinite' }} />
          </div>
        </div>

        <div className="space-y-6 max-w-md z-10">
          <h1
            className="text-5xl font-extrabold tracking-tight leading-tight"
            style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
          >
            Accelerate <br />
            Your <span style={{ color: '#5a6ba8' }}>Flow</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Log in to access your customized agent-generated learning pathways. Switch seamlessly between biometrics, standard keys, or Google Sign-In.
          </p>
        </div>

        <div className="text-[10px] uppercase tracking-widest font-bold z-10" style={{ color: C.outline }}>
          SECURED BY AEGIS PROTOCOL &bull; FOCUS STUDY CORP
        </div>
      </div>

      {/* Form right pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <Suspense fallback={
          <div className="flex items-center gap-2" style={{ color: C.outline }}>
            <Loader2 className="h-5 w-5 animate-spin" /> Loading forms...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
