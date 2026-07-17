'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Terminal, Compass, Award, Play, ChevronRight, Activity, 
  Lightbulb, Users, CheckCircle, ArrowRight 
} from 'lucide-react';

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo + Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0] p-[1px]">
              <div className="h-full w-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                <Terminal className="h-4.5 w-4.5 text-[#22D3D0]" />
              </div>
            </div>
            <span className="font-display text-2xl tracking-wide text-white uppercase">Focus</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#agents" className="hover:text-white transition-colors">Agents</a>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors px-4 py-2"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-[#7C5CFF]/10 transition-all hover:scale-[1.01]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Content */}
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/5 bg-white/5 text-[#22D3D0]">
            <span className="w-2 h-2 rounded-full bg-[#3DD68C] animate-pulse" />
            Gemini 2.0 Flash Multi-Agent Grid Active
          </div>

          <h1 className="text-5xl sm:text-6xl font-display uppercase leading-none tracking-wide text-white">
            Orchestrate the Future of Learning from a{' '}
            <span className="text-gradient">Single Prompt</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-body">
            Stop the daily hassle of disconnected tools. FOCUS dynamically coordinates specialist AI agents to research, design, and generate complete personalised learning experiences — instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/signup"
              className="text-center px-8 py-4 rounded-xl font-bold text-sm text-zinc-950 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] hover:opacity-90 transition-all shadow-lg hover:scale-[1.01]"
            >
              Get Started Free
            </Link>
            <a
              href="#how-it-works"
              className="text-center px-8 py-4 rounded-xl font-bold text-sm border border-zinc-800 bg-zinc-900/30 text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-zinc-300 text-zinc-300" />
              Watch Agents Collaborate
            </a>
          </div>
        </div>

        {/* Visual Mockups */}
        <div className="relative h-[500px] flex items-center justify-center">
          {/* Glowing blobs */}
          <div className="absolute inset-0 blob-shape transform rotate-12 scale-110 bg-[#7C5CFF]/5 blur-[60px]" />
          <div className="absolute inset-0 blob-shape transform -rotate-12 scale-90 bg-[#22D3D0]/5 blur-[60px]" />

          {/* Central card panel */}
          <div className="relative z-10 p-8 rounded-3xl border border-white/5 bg-[#13131A]/60 shadow-2xl max-w-sm w-full glass-panel">
            <div className="flex items-center justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0]">
                <Activity className="w-7 h-7 text-zinc-950" />
              </div>
            </div>

            {/* Agent progress rows */}
            <div className="space-y-3">
              {[
                { letter: 'P', label: 'Planner Agent', activeWidth: '75%', color: 'from-[#7C5CFF] to-[#7C5CFF]/60' },
                { letter: 'R', label: 'Researcher Agent', activeWidth: '55%', color: 'from-[#22D3D0] to-[#22D3D0]/60' },
                { letter: 'C', label: 'Coder Agent', activeWidth: '85%', color: 'from-[#3DD68C] to-[#3DD68C]/60' },
                { letter: 'K', label: 'Critic Agent', activeWidth: '40%', color: 'from-[#F5B942] to-[#F5B942]/60' },
                { letter: 'Q', label: 'Quizzer Agent', activeWidth: '65%', color: 'from-[#F1583D] to-[#F1583D]/60' },
              ].map(({ letter, label, activeWidth, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-zinc-950/40 text-xs"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-zinc-950 shrink-0 bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0]">
                    {letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-zinc-300 font-bold block">{label}</span>
                    <div className="mt-1.5 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: activeWidth }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute top-8 right-4 px-4 py-2 rounded-xl shadow-lg border border-white/5 bg-[#13131A]/80 flex items-center gap-2 transform rotate-6 text-xs glass-panel">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3DD68C]" />
            <span className="font-semibold text-zinc-300">Research Complete</span>
          </div>
          <div className="absolute bottom-8 left-4 px-4 py-2 rounded-xl shadow-lg border border-white/5 bg-[#13131A]/80 flex items-center gap-2 transform -rotate-6 text-xs glass-panel">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22D3D0]" />
            <span className="font-semibold text-zinc-300">Syllabus Generated</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-20 border-t border-white/5 pt-10 flex flex-wrap justify-center gap-12 sm:gap-24 text-center">
        {[
          { value: '10x', label: 'Faster Creation' },
          { value: '5+', label: 'Specialised Agents' },
          { value: '∞', label: 'Personalisation' },
        ].map(({ value, label }) => (
          <div key={label}>
            <div className="text-4xl font-display text-white uppercase">{value}</div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const angle = Math.atan2(deltaY, deltaX);
      const maxDist = 6;
      const dist = Math.min(Math.hypot(deltaX, deltaY) / 40, maxDist);
      const moveX = Math.cos(angle) * dist;
      const moveY = Math.sin(angle) * dist;
      container.style.setProperty('--eye-x', `${moveX}px`);
      container.style.setProperty('--eye-y', `${moveY}px`);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="py-24 bg-zinc-950/60 border-y border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Character with eye-tracking */}
        <div className="flex justify-center mb-10">
          <div ref={containerRef} className="w-32 h-32 relative group transition-transform hover:scale-110">
            {/* Character SVG */}
            <svg viewBox="0 0 120 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="60" cy="75" rx="32" ry="38" fill="#13131A" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <circle cx="60" cy="45" r="32" fill="#13131A" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <polygon points="35,22 28,8 43,18" fill="#7C5CFF" />
              <polygon points="85,22 92,8 77,18" fill="#7C5CFF" />
              <circle cx="45" cy="44" r="13" fill="#0A0A0F" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <circle cx="75" cy="44" r="13" fill="#0A0A0F" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <polygon points="60,52 53,62 67,62" fill="#22D3D0" />
              <ellipse cx="28" cy="80" rx="12" ry="22" fill="#7C5CFF" opacity="0.8" transform="rotate(-15 28 80)" />
              <ellipse cx="92" cy="80" rx="12" ry="22" fill="#7C5CFF" opacity="0.8" transform="rotate(15 92 80)" />
              <ellipse cx="48" cy="112" rx="10" ry="5" fill="#22D3D0" />
              <ellipse cx="72" cy="112" rx="10" ry="5" fill="#22D3D0" />
            </svg>
            {/* Pupils */}
            <div
              className="absolute pupil bg-white"
              style={{
                width: 14, height: 14,
                borderRadius: '50%',
                left: '32%', top: '34%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            </div>
            <div
              className="absolute pupil bg-white"
              style={{
                width: 16, height: 16,
                borderRadius: '50%',
                left: '57%', top: '32%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-wide text-white">
          The Content Creation <span className="text-gradient">Maze</span>
        </h2>
        <p className="max-w-2xl mx-auto mb-12 text-sm text-zinc-400 leading-relaxed font-body mt-4">
          Educators and course designers are trapped in a maze of disconnected tools. Writing docs, compiling code blocks, designing lessons — the immense manual workload drains speed. It&apos;s time to break free.
        </p>

        {/* Stats */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { emoji: '⏱', title: '40+ Hours', desc: 'Average time to plan and compile one comprehensive syllabus' },
            { emoji: '⚙', title: '8+ Tools', desc: 'Different systems educators juggle to generate content templates' },
            { emoji: '📈', title: '72% Drop', desc: 'Of course engagements fail due to generic layout pacing' },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-2xl border border-white/5 bg-[#13131A]/40 text-left space-y-2"
            >
              <div className="text-2xl">{emoji}</div>
              <div className="text-xl font-bold text-white">{title}</div>
              <p className="text-xs text-zinc-400 leading-relaxed font-body">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Solution / Features Section ──────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-display uppercase text-white">
            Dynamic Multi-Agent <span className="text-gradient">Collaboration</span>
          </h2>
          <p className="max-w-xl mx-auto text-xs text-zinc-400 font-body">
            Our platform brings together specialist AI agents working in harmony to deliver complete interactive workspaces — powered by Gemini 2.0.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="agents">
          {[
            {
              icon: <Terminal className="w-6 h-6 text-zinc-950" />,
              title: 'The AI Orchestrator',
              desc: 'The planning brain that interprets your prompts and schedules the execution pipeline across sub-agents.',
            },
            {
              icon: <Users className="w-6 h-6 text-zinc-950" />,
              title: 'Specialist Agent Council',
              desc: 'Planner, Researcher, Coder, Critic, and Quizzer agents performing dedicated micro-tasks concurrently.',
            },
            {
              icon: <Lightbulb className="w-6 h-6 text-zinc-950" />,
              title: 'Personalised Workspaces',
              desc: 'Generates tailored explanations, monospace syntax layouts, and interactive MCQs in a clean dashboard.',
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="p-8 rounded-3xl border border-white/5 bg-[#13131A]/30 hover:border-[#22D3D0]/20 transition-all flex flex-col justify-between h-64 shadow-md group hover:scale-[1.01]"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0]">
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#22D3D0] transition-colors">{title}</h3>
                <p className="text-xs text-zinc-450 leading-relaxed font-body">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Process Section ──────────────────────────────────────────────────────────
function ProcessSection() {
  const steps = [
    { n: '1', title: 'Prompt Objective', desc: 'Type any topic or syllabus objective in plain text.' },
    { n: '2', title: 'Grid Assembly', desc: 'AI specialists spin up and formulate the curriculum path.' },
    { n: '3', title: 'Loop Execution', desc: 'Agents generate theory, code syntax, and critiques.' },
    { n: '4', title: 'Deploy Course', desc: 'Enter your custom workspace and complete interactive challenges.', accent: true },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-zinc-950/60 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-display uppercase text-white">
            From Prompt to Live <span className="text-gradient">Syllabus</span>
          </h2>
          <p className="max-w-xl mx-auto text-xs text-zinc-455 font-body">
            Watch the step-by-step assembly of custom code sandboxes and lessons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[22px] left-[10%] right-[10%] h-[1px] bg-zinc-800 z-0" />
          
          {steps.map(({ n, title, desc, accent }) => (
            <div key={n} className="text-center relative z-10 space-y-2 bg-[#0A0A0F]/60 md:bg-transparent px-4 py-2">
              <div
                className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center font-bold text-sm shadow-md border ${
                  accent 
                    ? 'bg-gradient-to-tr from-[#7C5CFF] to-[#22D3D0] text-zinc-950 border-transparent' 
                    : 'bg-zinc-900 text-white border-zinc-800'
                }`}
              >
                {n}
              </div>
              <h4 className="font-bold text-sm text-white">{title}</h4>
              <p className="text-xs text-zinc-450 leading-relaxed font-body">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-zinc-950 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] hover:opacity-95 hover:scale-[1.01] transition-all shadow-lg"
          >
            Deploy Your First Learning Grid
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0A0A0F] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4 text-center mb-16 space-y-6">
        <h2 className="text-3xl font-display text-white uppercase">
          Ready to build the ultimate digital Academy?
        </h2>
        <p className="text-sm text-zinc-400 font-body max-w-lg mx-auto">
          Sign up to run instant agent loops, complete customized quizzes, and download coding solutions.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-md"
        >
          Get Early Access — It&apos;s Free
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-zinc-500">
        <div className="text-lg font-bold text-zinc-400 tracking-wider font-display uppercase">Focus.AI</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        <div>© 2026 Focus AI. All rights reserved.</div>
      </div>
    </footer>
  );
}

export default function LandingClient() {
  return (
    <div className="flex-1 bg-[#0A0A0F] text-[#F5F5F7] flex flex-col min-h-screen relative dots-bg">
      <Nav />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <ProcessSection />
      </main>
      <Footer />
    </div>
  );
}
