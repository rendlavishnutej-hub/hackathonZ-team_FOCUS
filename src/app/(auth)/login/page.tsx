'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Key, Mail, AlertTriangle, Loader2, Fingerprint, 
  Terminal, ArrowRight, ShieldCheck, Globe 
} from 'lucide-react';
import { signInAction } from '../../auth/actions';
import { startAuthentication } from '@simplewebauthn/browser';
import { createClient } from '@/utils/supabase/client';

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
      setError(err.message || 'Passkey authentication failed. Ensure you have registered a passkey first.');
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
    <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 bg-[#13131A]/60 shadow-xl shadow-[#7C5CFF]/5">
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-wide uppercase text-white">
          Sign In
        </h2>
        <p className="text-xs text-zinc-400 mt-2">
          New to FOCUS?{' '}
          <Link href="/signup" className="font-semibold text-[#22D3D0] hover:text-[#22D3D0]/80 transition-colors">
            Create an account
          </Link>
        </p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900/40 text-red-200 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="bg-emerald-950/40 border border-emerald-900/40 text-emerald-200 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{info}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
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
              className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <Link href="/reset-password" className="text-xs font-semibold text-[#7C5CFF] hover:text-[#7C5CFF]/80">
              Forgot?
            </Link>
          </div>
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
              onChange={handleInputChange}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || passkeyLoading}
            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-zinc-950 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log In'}
          </button>
        </div>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-zinc-900"></div>
        <span className="flex-shrink mx-4 text-zinc-600 text-[10px] uppercase font-bold tracking-widest">
          or secure sign-in
        </span>
        <div className="flex-grow border-t border-zinc-900"></div>
      </div>

      <div className="space-y-3">
        {/* Passkey Login */}
        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={loading || passkeyLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all disabled:opacity-50"
        >
          {passkeyLoading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin text-[#22D3D0]" />
          ) : (
            <Fingerprint className="h-4.5 w-4.5 text-[#22D3D0]" />
          )}
          Sign In with Passkey
        </button>

        {/* Google OAuth Login */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          disabled={oauthLoading !== null}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-zinc-850 rounded-xl bg-zinc-900/30 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/60 transition-all"
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin text-[#7C5CFF]" />
          ) : (
            <Globe className="h-4.5 w-4.5 text-zinc-400" />
          )}
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
            ACCELERATE <br />
            YOUR <span className="text-gradient">FLOW</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-body">
            Log in to access your customized agent-generated learning pathways. Switch seamlessly between biometrics, standard keys, or Google Sign-In.
          </p>
        </div>

        <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold z-10">
          SECURED BY AEGIS PROTOCOL &bull; FOCUS STUDY CORP
        </div>
      </div>

      {/* Form right pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <Suspense fallback={
          <div className="text-zinc-500 flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading forms...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
