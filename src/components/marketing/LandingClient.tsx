'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Colour constants matching the provided design system ─────────────────────
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

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{ backgroundColor: C.cream }} className="sticky top-0 z-50 border-b border-[#e6e2db]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo + Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
              style={{ background: 'linear-gradient(135deg, #bec6e0 0%, #7c839b 100%)', fontFamily: 'var(--font-fredoka), sans-serif' }}>
              F
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: C.primary, fontFamily: 'var(--font-fredoka), sans-serif' }}>Focus</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How it works</a>
            <a href="#agents" className="hover:text-black transition-colors">Agents</a>
            <Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link>
          </div>
        </div>

        {/* Search + CTA */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4" style={{ color: C.outline }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search capabilities..."
              className="block w-full pl-9 pr-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 transition-shadow"
              style={{
                borderColor: C.outlineVariant,
                backgroundColor: C.surfaceContainerLowest,
                color: C.onSurface,
                '--tw-ring-color': C.primary,
              } as React.CSSProperties}
            />
          </div>
          <Link
            href="/login"
            className="px-5 py-2 rounded-full text-sm font-semibold hover:opacity-80 transition-all whitespace-nowrap"
            style={{ backgroundColor: C.primary, color: C.onPrimary }}
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 rounded-full text-sm font-semibold border-2 hover:bg-[#f2ede6] transition-all whitespace-nowrap"
            style={{ borderColor: C.primary, color: C.primary }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Content */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
            style={{ backgroundColor: `${C.accentYellow}30`, borderColor: `${C.accentYellow}80`, color: '#725e00' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Powered by Google Gemini 2.0 Flash
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6"
            style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}>
            Go From One Prompt to a Complete{' '}
            <span style={{ color: C.accentBlue.replace('#bec6e0', '#5a6ba8') }}>Course—Instantly.</span>
          </h1>

          <p className="text-lg mb-8 leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Stop the daily jhanjhat of disconnected tools. Focus dynamically coordinates specialist AI agents to research, design, and generate complete personalized learning experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="text-center px-8 py-4 rounded-full font-semibold transition-all shadow-lg hover:scale-[1.02]"
              style={{ backgroundColor: C.primary, color: C.onPrimary, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
            >
              Shuru Karein (Get Started)
            </Link>
            <a
              href="#how-it-works"
              className="text-center px-8 py-4 rounded-full font-semibold border-2 transition-all flex items-center justify-center gap-2 hover:bg-[#f2ede6]"
              style={{ borderColor: C.surfaceVariant, color: C.primary, backgroundColor: C.surfaceContainerLowest }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" fillRule="evenodd" />
              </svg>
              Watch Agents Collaborate
            </a>
          </div>
        </div>

        {/* Visual */}
        <div className="relative h-[500px] flex items-center justify-center">
          {/* Blob shapes */}
          <div className="absolute inset-0 blob-shape transform rotate-12 scale-110"
            style={{ background: `${C.accentYellow}50` }} />
          <div className="absolute inset-0 blob-shape transform -rotate-12 scale-90"
            style={{ background: `${C.accentPink}30` }} />

          {/* Central card */}
          <div className="relative z-10 p-8 rounded-3xl shadow-2xl border max-w-sm w-full"
            style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}>
            {/* Hub icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
                style={{ backgroundColor: C.accentBlue }}>
                <svg className="w-8 h-8" style={{ color: C.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Agent rows */}
            <div className="space-y-3">
              {[
                { letter: 'P', label: 'Planner Agent', color: C.accentGreen, textColor: '#166534' },
                { letter: 'R', label: 'Researcher Agent', color: C.accentBlue, textColor: '#1e3a6e' },
                { letter: 'C', label: 'Coder Agent', color: C.accentYellow, textColor: '#6b4f00' },
                { letter: 'K', label: 'Critic Agent', color: C.accentPink, textColor: '#831843' },
                { letter: 'Q', label: 'Quizzer Agent', color: C.accentPurple, textColor: '#ffffff' },
              ].map(({ letter, label, color, textColor }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.surfaceVariant }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ backgroundColor: `${color}40`, color: textColor }}
                  >
                    {letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold" style={{ color: C.onSurface }}>{label}</span>
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: C.surfaceVariant, width: '75%' }} />
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: C.surfaceVariant, width: '55%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <div
            className="absolute top-8 right-4 px-4 py-2 rounded-xl shadow-lg border flex items-center gap-2 transform rotate-6"
            style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}
          >
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm font-semibold" style={{ color: C.primary }}>Research Complete</span>
          </div>
          <div
            className="absolute bottom-8 left-4 px-4 py-2 rounded-xl shadow-lg border flex items-center gap-2 transform -rotate-6"
            style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.accentBlue }} />
            <span className="text-sm font-semibold" style={{ color: C.primary }}>Syllabus Generated</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-20 border-t pt-10 flex flex-wrap justify-center gap-12 sm:gap-24 text-center"
        style={{ borderColor: C.surfaceVariant }}>
        {[
          { value: '10x', label: 'Faster Creation' },
          { value: '5+', label: 'Specialised Agents' },
          { value: '∞', label: 'Personalisation' },
        ].map(({ value, label }) => (
          <div key={label}>
            <div className="text-3xl font-extrabold" style={{ color: C.primary }}>{value}</div>
            <div className="text-sm font-medium mt-1" style={{ color: C.onSurfaceVariant }}>{label}</div>
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
    <section style={{ backgroundColor: C.surfaceContainerLowest }} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Character with eye-tracking */}
        <div className="flex justify-center mb-10">
          <div ref={containerRef} className="w-32 h-32 relative group transition-transform hover:scale-110">
            {/* Owl character SVG */}
            <svg viewBox="0 0 120 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Body */}
              <ellipse cx="60" cy="75" rx="32" ry="38" fill="#fcdf46" />
              {/* Head */}
              <circle cx="60" cy="45" r="32" fill="#fcdf46" />
              {/* Ear tufts */}
              <polygon points="35,22 28,8 43,18" fill="#e2a800" />
              <polygon points="85,22 92,8 77,18" fill="#e2a800" />
              {/* Left eye white */}
              <circle cx="45" cy="44" r="13" fill="white" />
              {/* Right eye white */}
              <circle cx="75" cy="44" r="13" fill="white" />
              {/* Beak */}
              <polygon points="60,52 53,62 67,62" fill="#e2a800" />
              {/* Wings */}
              <ellipse cx="28" cy="80" rx="12" ry="22" fill="#e2a800" transform="rotate(-15 28 80)" />
              <ellipse cx="92" cy="80" rx="12" ry="22" fill="#e2a800" transform="rotate(15 92 80)" />
              {/* Feet */}
              <ellipse cx="48" cy="112" rx="10" ry="5" fill="#e2a800" />
              <ellipse cx="72" cy="112" rx="10" ry="5" fill="#e2a800" />
            </svg>
            {/* Left pupil overlay */}
            <div
              className="absolute pupil"
              style={{
                width: 20, height: 20,
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                left: '28%', top: '33%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                padding: 3, zIndex: 20,
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'white' }} />
            </div>
            {/* Right pupil overlay */}
            <div
              className="absolute pupil"
              style={{
                width: 24, height: 24,
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                left: '55%', top: '31%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                padding: 4, zIndex: 20,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white' }} />
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold mb-6" style={{ color: C.primary }}>
          The Content Creation{' '}
          <span style={{ color: C.accentPurple }}>Chakravyuh</span>
        </h2>
        <p className="max-w-2xl mx-auto mb-12 text-lg leading-relaxed" style={{ color: C.onSurfaceVariant }}>
          Educational content creation requires curriculum design, research, assessment creation, and storytelling. Today, these tasks rely on disconnected tools and immense manual effort. Even specialized AI models operate in silos, failing to deliver unified educational lakshya (objectives).
        </p>

        {/* Pain-point cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { emoji: '⏰', title: '47+ Hours', desc: 'Average time to build one complete course module manually' },
            { emoji: '🔧', title: '8+ Tools', desc: 'Different tools educators juggle to produce one course' },
            { emoji: '📉', title: '72% Dropout', desc: 'Of courses fail due to poor personalisation and pacing' },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-3xl border text-left"
              style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.surfaceVariant }}
            >
              <div className="text-3xl mb-3">{emoji}</div>
              <div className="text-2xl font-extrabold mb-1" style={{ color: C.primary }}>{title}</div>
              <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>{desc}</p>
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
    <section id="features" style={{ backgroundColor: C.cream }} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: C.primary }}>
            Dynamic Multi-Agent{' '}
            <span style={{ color: '#5a6ba8' }}>Sangam</span>
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: C.onSurfaceVariant }}>
            Give us an educational challenge. We&apos;ll assemble the ultimate AI mandali (team).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="agents">
          {[
            {
              icon: (
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                 </svg>
              ),
              iconBg: C.accentYellow,
              iconColor: '#6b4f00',
              title: 'The AI Sutradhar',
              desc: 'No fixed workflows. Focus dynamically identifies and deploys the exact AI specialists needed for your specific learning objective.',
            },
            {
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              ),
              iconBg: C.accentBlue,
              iconColor: '#1e3a6e',
              title: 'Specialized Agent Mandali',
              desc: 'Instructional planners, researchers, and visual communicators seamlessly exchange information and review each other\'s outputs.',
            },
            {
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              ),
              iconBg: C.accentPink,
              iconColor: '#831843',
              title: 'Personalized Margdarshan',
              desc: 'Agents adapt the curriculum in real-time based on learner needs, ensuring an optimized and focused educational journey.',
            },
          ].map(({ icon, iconBg, iconColor, title, desc }) => (
            <div
              key={title}
              className="p-8 rounded-3xl border hover:shadow-lg transition-shadow"
              style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${iconBg}30`, color: iconColor }}
              >
                {icon}
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: C.primary }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it Works / Process Section ──────────────────────────────────────────
function ProcessSection() {
  const steps = [
    { n: '1', title: 'Define the Lakshya (Objective)', desc: 'Enter a single prompt detailing your topic, audience, and educational challenge.' },
    { n: '2', title: 'The AI Panchayat Assembles', desc: 'The Orchestrator Agent breaks down the task and spins up specialized agents for research, writing, and assessment.' },
    { n: '3', title: 'Collaborative Execution', desc: 'Agents share context and build the course collaboratively, ensuring pedagogical alignment.' },
    { n: '4', title: 'Ready for Pariksha', desc: 'Export a complete, personalized learning module ready for your LMS or application.', accent: true },
  ];

  return (
    <section id="how-it-works" style={{ backgroundColor: C.surfaceContainerLowest }} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: C.primary }}>
            From Prompt to Complete{' '}
            <span style={{ color: C.accentPurple }}>Curriculum</span>
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: C.onSurfaceVariant }}>
            See how FOCUS transforms a simple idea into a rich, structured learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* connecting line */}
          <div
            className="hidden md:block absolute top-[22px] left-[10%] right-[10%] h-0.5"
            style={{ backgroundColor: C.surfaceVariant, zIndex: 0 }}
          />
          {steps.map(({ n, title, desc, accent }) => (
            <div key={n} className="text-center relative" style={{ backgroundColor: C.surfaceContainerLowest, zIndex: 1 }}>
              <div
                className="w-11 h-11 mx-auto rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-md"
                style={{
                  backgroundColor: accent ? C.accentBlue : C.primary,
                  color: accent ? C.primary : C.onPrimary,
                }}
              >
                {n}
              </div>
              <h4 className="font-bold text-lg mb-2" style={{ color: C.primary }}>{title}</h4>
              <p className="text-sm" style={{ color: C.onSurfaceVariant }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA inside section */}
        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-[1.02] shadow-lg"
            style={{ backgroundColor: C.primary, color: C.onPrimary, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
          >
            Start Your First Session
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ backgroundColor: C.surfaceContainerLow, borderTopColor: C.surfaceVariant }} className="border-t pt-20 pb-10">
      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 text-center mb-16">
        <h2 className="text-3xl font-extrabold mb-4" style={{ color: C.primary }}>
          Ready to build the ultimate digital Gurukul?
        </h2>
        <p className="mb-8 text-lg" style={{ color: C.onSurfaceVariant }}>
          Join the waitlist to access the Focus multi-agent content creation API.
        </p>
        <Link
          href="/signup"
          className="inline-block px-10 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all shadow-lg"
          style={{ backgroundColor: C.primary, color: C.onPrimary }}
        >
          Get Early Access
        </Link>
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t pt-10 flex flex-col md:flex-row justify-between items-center gap-6"
        style={{ borderColor: C.surfaceVariant }}
      >
        <div className="text-xl font-bold tracking-tight" style={{ color: C.outline, fontFamily: 'var(--font-fredoka), sans-serif' }}>Focus.AI</div>
        <div className="flex gap-6 text-sm" style={{ color: C.onSurfaceVariant }}>
          <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-black transition-colors">Contact</a>
        </div>
        <div className="text-sm" style={{ color: C.outline }}>© 2025 Focus AI. All rights reserved.</div>
      </div>
    </footer>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function LandingClient() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <ProcessSection />
      </main>
      <Footer />
    </>
  );
}
