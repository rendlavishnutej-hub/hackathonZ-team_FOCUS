'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, AlertTriangle, CheckCircle2, Loader2, Copy, Download, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function MfaEnrollPage() {
  const router = useRouter();

  // Wizard state: 'start' | 'codes' | 'verify' | 'success'
  const [step, setStep] = useState<'start' | 'codes' | 'verify' | 'success'>('start');

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enroll responses
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUri, setQrCodeUri] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // TOTP verify state
  const [totpCode, setTotpCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Start enrollment
  const handleStartEnroll = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/mfa/enroll', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate MFA enrollment');
      }

      setFactorId(data.factorId);
      setQrCodeUri(data.qrCode);
      setSecretKey(data.secret);
      setBackupCodes(data.backupCodes);

      // Go to display backup codes step
      setStep('codes');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'MFA enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify and confirm enrollment
  const handleVerifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || totpCode.length !== 6) return;

    setError(null);
    setVerifying(true);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factorId,
          code: totpCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setStep('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid code. Check your authenticator app.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleDownloadCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([`SUPABASE SECURE BACKUP RECOVERY CODES\n\nGenerated: ${new Date().toLocaleDateString()}\n\nKeep these codes in a safe place. Each code can be used ONCE to recover your account if you lose your authenticator.\n\n${backupCodes.join('\n')}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `backup_recovery_codes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
          Multi-Factor Setup Wizard
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Secure your account using TOTP Authenticator (Google Authenticator, Authy, etc.)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-zinc-900 border border-zinc-850 py-8 px-4 rounded-2xl shadow-xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-950/40 border border-red-900/60 text-red-200 text-sm p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: START */}
          {step === 'start' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Shield className="h-16 w-16 text-emerald-500 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Add an extra layer of security</h3>
                <p className="text-sm text-zinc-400">
                  By enabling Multi-Factor Authentication (MFA), you will need to enter a 6-digit verification code from your authenticator app in addition to your password.
                </p>
              </div>
              <div>
                <button
                  onClick={handleStartEnroll}
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Begin MFA Setup'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DISPLAY CODES */}
          {step === 'codes' && (
            <div className="space-y-6">
              <div className="space-y-2 border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-medium text-white">Save your recovery backup codes</h3>
                <p className="text-xs text-zinc-400">
                  If you lose your phone or authenticator app, these codes can be used to bypass MFA and access your account. Store them securely (e.g., in a password manager). **They will only be shown once.**
                </p>
              </div>

              {/* Grid of codes */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-4 rounded-xl font-mono text-base font-semibold text-center border border-zinc-850">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 text-emerald-400 tracking-wider">
                    {code}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleCopyCodes}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-950 transition-colors"
                >
                  {copiedCodes ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copiedCodes ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={handleDownloadCodes}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-950 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download Codes (.txt)
                </button>
              </div>

              <div>
                <button
                  onClick={() => setStep('verify')}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 transition-colors"
                >
                  I have saved my backup codes
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SCAN QR & VERIFY */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="space-y-2 border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-medium text-white">Scan the QR Code</h3>
                <p className="text-xs text-zinc-400">
                  Scan this QR code using your authenticator app (Google Authenticator, Authy, Microsoft Authenticator).
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 bg-zinc-950 p-6 rounded-xl border border-zinc-850">
                <div className="bg-white p-3 rounded-lg flex items-center justify-center">
                  {qrCodeUri.startsWith('data:') ? (
                    <img src={qrCodeUri} alt="MFA QR Code" className="w-[180px] h-[180px]" />
                  ) : (
                    <QRCodeSVG value={qrCodeUri || 'placeholder'} size={180} />
                  )}
                </div>
                
                {/* Manual entry secret */}
                <div className="w-full space-y-1">
                  <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider text-center">
                    Can&apos;t scan? Enter this secret key manually
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-lg">
                    <span className="font-mono text-xs text-zinc-300 font-semibold truncate select-all">{secretKey}</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1 hover:bg-zinc-950 rounded transition-colors text-zinc-400 hover:text-white shrink-0"
                    >
                      {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerifyEnroll} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-zinc-300 text-center">
                    Enter Authenticator Verification Code
                  </label>
                  <p className="text-center text-xs text-zinc-500 mt-0.5 mb-3">
                    Input the 6-digit confirmation code generated in your app.
                  </p>
                  <div className="flex justify-center">
                    <input
                      id="code"
                      type="text"
                      required
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="block w-40 text-center tracking-[0.75em] pl-[0.75em] py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('codes')}
                    className="w-1/3 flex justify-center py-2 px-4 border border-zinc-850 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-sm font-medium text-zinc-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || totpCode.length !== 6}
                    className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify and Enable'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">MFA Enabled Successfully!</h3>
                <p className="text-sm text-zinc-400">
                  Your account is now protected with multi-factor authentication. Next time you log in, you will be prompted for your authenticator code.
                </p>
              </div>
              <div>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 transition-colors"
                >
                  Go to Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
