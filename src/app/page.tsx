import React from 'react';
import Link from 'next/link';
import { 
  Shield, Compass, Terminal, Cpu, Play, 
  ArrowRight, CheckCircle2, ChevronRight, Activity 
} from 'lucide-react';

export default function HomePage() {
  const steps = [
    { id: '01', title: 'PLAN', desc: 'Curriculum Architect schedules customized learning map.', color: '#7C5CFF' },
    { id: '02', title: 'RESEARCH', desc: 'Deep Research Agent fetches real documentation.', color: '#22D3D0' },
    { id: '03', title: 'CODE', desc: 'Synthesis Coder builds interactive templates.', color: '#3DD68C' },
    { id: '04', title: 'CRITIC', desc: 'Refinement Agent evaluates and adjusts content.', color: '#F5B942' },
    { id: '05', title: 'QUIZ', desc: 'Assessment Engine challenges retention.', color: '#F1583D' }
  ];

  return (
    <div className="flex-1 bg-[#0A0A0F] text-[#F5F5F7] flex flex-col min-h-screen relative dots-bg">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#7C5CFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#22D3D0]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="w-full border-b border-white/5 py-4 px-6 sm:px-12 flex justify-between items-center max-w-7xl mx-auto z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0] p-[1px]">
            <div className="h-full w-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Terminal className="h-4.5 w-4.5 text-[#22D3D0]" />
            </div>
          </div>
          <span className="font-display text-2xl tracking-wide text-white">FOCUS</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] hover:opacity-90 text-zinc-950 text-xs font-bold rounded-lg transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-12 py-16 md:py-24 flex flex-col items-center justify-center text-center space-y-16 z-10">
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <span className="h-2 w-2 rounded-full bg-[#22D3D0] animate-pulse" />
            <span className="text-[10px] tracking-widest font-semibold uppercase text-zinc-300">
              STAGED MULTI-AGENT SYLLABUS BUILDER
            </span>
          </div>

          {/* Display title with Anton font */}
          <h1 className="font-display text-5xl sm:text-8xl tracking-wide uppercase text-white leading-none">
            LEARN ANYTHING <br />
            <span className="text-gradient">IN SECONDS</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-body leading-relaxed">
            FOCUS orchestrates a network of specialized AI agents (Planning, Research, Coding, Critique, and Assessment) to construct custom curricula on-demand.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto pt-4">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-lg hover:scale-[1.01]"
            >
              Start Learning Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white text-sm font-bold rounded-xl transition-all"
            >
              Explore Auth & Security
            </Link>
          </div>
        </div>

        {/* Dynamic Agent Showcase */}
        <div className="w-full max-w-5xl space-y-6">
          <div className="text-center">
            <span className="font-display text-sm tracking-widest text-[#7C5CFF] uppercase">
              The Agent Orchestration Loop
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">Five Agents. One Flawless Course.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((s, index) => (
              <div 
                key={s.id} 
                className="glass-panel p-5 rounded-2xl text-left border border-white/5 hover:border-white/10 transition-colors relative flex flex-col justify-between h-40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span 
                      className="font-display text-xl"
                      style={{ color: s.color }}
                    >
                      {s.title}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono font-bold">
                      {s.id}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                {index < 4 && (
                  <div className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20">
                    <ChevronRight className="h-5 w-5 text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features / Security Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl w-full pt-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-[#7C5CFF]/20 transition-all">
            <Cpu className="h-6 w-6 text-[#7C5CFF] mb-4" />
            <h3 className="text-base font-bold text-white">Advanced Agent Graph</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Watch agents plan, gather facts, write code, and critique materials live using interactive React Flow visual nodes and SSE streams.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-[#22D3D0]/20 transition-all">
            <Shield className="h-6 w-6 text-[#22D3D0] mb-4" />
            <h3 className="text-base font-bold text-white">WebAuthn & MFA Security</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Log in securely using biometric Passkeys (Touch ID, Face ID, YubiKeys). Elevate account access controls using standard TOTP MFA.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-[#3DD68C]/20 transition-all">
            <Activity className="h-6 w-6 text-[#3DD68C] mb-4" />
            <h3 className="text-base font-bold text-white">Active Session Audits</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Track session logins, approximate location details, IPs, and device user agents. Instantly revoke access to suspicious clients.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-600 max-w-7xl mx-auto w-full z-10">
        &copy; {new Date().getFullYear()} FOCUS Platform. All rights reserved. Hackathon build submission.
      </footer>
    </div>
  );
}
