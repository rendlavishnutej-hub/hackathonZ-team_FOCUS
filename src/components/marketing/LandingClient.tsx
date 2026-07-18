'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// ─── Colour constants matching the provided design system ─────────────────────
// (unchanged token set — only added a couple of derived/soft variants for depth)
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

// ─── Shared helpers ─────────────────────────────────────────────────────────
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/** Subtle magnetic hover — nudges a button toward the cursor within its bounds. */
function useMagnetic(strength = 14) {
  const ref = useRef<HTMLElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
    setStyle({ transform: `translate(${x}px, ${y}px)` });
  };
  const onMouseLeave = () => setStyle({ transform: 'translate(0px, 0px)' });

  return { ref, style, onMouseMove, onMouseLeave };
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = (
    <>
      <a href="#features" onClick={() => setMobileOpen(false)} className="hover:text-black transition-colors">Features</a>
      <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="hover:text-black transition-colors">How it works</a>
      <a href="#agents" onClick={() => setMobileOpen(false)} className="hover:text-black transition-colors">Agents</a>
      <Link href="/pricing" onClick={() => setMobileOpen(false)} className="hover:text-black transition-colors">Pricing</Link>
    </>
  );

  return (
    <nav
      style={{
        backgroundColor: scrolled ? 'rgba(254,249,242,0.85)' : C.cream,
        borderColor: scrolled ? C.surfaceVariant : 'transparent',
        boxShadow: scrolled ? '0 4px 24px rgba(29,28,24,0.06)' : 'none',
      }}
      className="sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo + Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5 group">
            <motion.span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: C.accentPurple }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span
              className="text-3xl font-bold tracking-tight transition-transform group-hover:-translate-y-0.5"
              style={{ color: C.primary, fontFamily: 'var(--font-fredoka), sans-serif' }}
            >
              Focus
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
            {navLinks}
          </div>
        </div>

        {/* Search + CTA */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
          <div className="relative max-w-xs w-full group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 transition-colors group-focus-within:text-black" style={{ color: C.outline }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search capabilities..."
              suppressHydrationWarning
              className="block w-full pl-9 pr-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-shadow"
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
            className="px-5 py-2 rounded-full text-sm font-semibold hover:opacity-80 transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: C.primary, color: C.onPrimary, '--tw-ring-color': C.primary } as React.CSSProperties}
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 rounded-full text-sm font-semibold border-2 hover:bg-[#f2ede6] transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: C.primary, color: C.primary, '--tw-ring-color': C.primary } as React.CSSProperties}
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 rounded-full focus:outline-none focus-visible:ring-2"
          style={{ color: C.primary, '--tw-ring-color': C.primary } as React.CSSProperties}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t"
            style={{ borderColor: C.surfaceVariant, backgroundColor: C.cream }}
          >
            <div className="px-4 sm:px-6 py-5 flex flex-col gap-4 text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
              {navLinks}
              <div className="flex gap-3 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-5 py-2.5 rounded-full text-sm font-semibold" style={{ backgroundColor: C.primary, color: C.onPrimary }}>
                  Login
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-5 py-2.5 rounded-full text-sm font-semibold border-2" style={{ borderColor: C.primary, color: C.primary }}>
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const magnetic = useMagnetic(10);

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, reducedMotion ? 0 : 60]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 5);
    }, 2800);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const agents = [
    { letter: 'P', label: 'Planner Agent', desc: 'Designing curriculum blueprint...', color: C.accentGreen, textColor: '#15803d', strokeColor: '#22c55e' },
    { letter: 'R', label: 'Researcher Agent', desc: 'Sourcing academic references...', color: C.accentBlue, textColor: '#1d4ed8', strokeColor: '#3b82f6' },
    { letter: 'C', label: 'Coder Agent', desc: 'Generating interactive exercises...', color: C.accentYellow, textColor: '#a16207', strokeColor: '#eab308' },
    { letter: 'K', label: 'Critic Agent', desc: 'Auditing pedagogy and feedback flow...', color: C.accentPink, textColor: '#be185d', strokeColor: '#ec4899' },
    { letter: 'Q', label: 'Quizzer Agent', desc: 'Compiling adaptive assessments...', color: C.accentPurple, textColor: '#ffffff', strokeColor: '#d3579a' },
  ];

  return (
    <section ref={sectionRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 overflow-hidden">
      {/* Ambient gradient wash behind the hero — the page's signature atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] -z-10"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${C.accentYellow}22, transparent 55%), radial-gradient(circle at 75% 20%, ${C.accentPink}22, transparent 50%), radial-gradient(circle at 50% 80%, ${C.accentBlue}20, transparent 55%)`,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={reducedMotion ? undefined : { opacity: fade }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
            style={{ backgroundColor: `${C.accentYellow}30`, borderColor: `${C.accentYellow}80`, color: '#725e00' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            A SINGLE PLATFORM FOR ALL YOUR LEARNING NEEDS
          </motion.div>

          <h1
            className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6"
            style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
          >
            Go From One Prompt to a Complete{' '}
            <span className="relative inline-block">
              <span className="relative z-10" style={{ color: '#5a6ba8' }}>Course—Instantly.</span>
              <motion.span
                className="absolute left-0 bottom-1 w-full h-[6px] rounded-full -z-0"
                style={{ backgroundColor: C.accentPink }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.6, duration: 0.8 }}
              />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-lg mb-8 leading-relaxed"
            style={{ color: C.onSurfaceVariant }}
          >
            Stop the daily hassle of disconnected tools. Focus dynamically coordinates specialist AI agents to research, design, and generate complete personalized learning experiences.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              ref={magnetic.ref as React.Ref<HTMLAnchorElement>}
              onMouseMove={magnetic.onMouseMove}
              onMouseLeave={magnetic.onMouseLeave}
              style={{ backgroundColor: C.primary, color: C.onPrimary, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', ...magnetic.style }}
              href="/signup"
              className="text-center px-8 py-4 rounded-full font-semibold transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              className="text-center px-8 py-4 rounded-full font-semibold border-2 transition-all flex items-center justify-center gap-2 hover:bg-[#f2ede6] hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ borderColor: C.surfaceVariant, color: C.primary, backgroundColor: C.surfaceContainerLowest, '--tw-ring-color': C.primary } as React.CSSProperties}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" fillRule="evenodd" />
              </svg>
              Watch Agents Collaborate
            </a>
          </motion.div>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={reducedMotion ? undefined : { y: parallaxY }}
          className="relative h-[550px] flex items-center justify-center"
        >
          {/* Blob shapes with breathing/morphing animation */}
          {!reducedMotion && (
            <>
              <motion.div
                className="absolute inset-0 blob-shape"
                style={{ background: `${C.accentYellow}25`, filter: 'blur(30px)' }}
                animate={{
                  scale: [1, 1.1, 0.95, 1],
                  rotate: [12, 45, -12, 12],
                  borderRadius: ['40% 60% 60% 40% / 40% 50% 50% 60%', '60% 40% 50% 50% / 50% 60% 40% 50%', '40% 60% 60% 40% / 40% 50% 50% 60%'],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0 blob-shape"
                style={{ background: `${C.accentPink}20`, filter: 'blur(30px)' }}
                animate={{
                  scale: [0.9, 1.05, 0.85, 0.9],
                  rotate: [-12, -35, 15, -12],
                  borderRadius: ['50% 50% 40% 60% / 60% 40% 60% 40%', '40% 60% 50% 50% / 50% 50% 40% 60%', '50% 50% 40% 60% / 60% 40% 60% 40%'],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
            </>
          )}

          {/* Central card */}
          <div
            className="relative z-10 p-6 rounded-3xl shadow-2xl border max-w-sm w-full bg-white/80 backdrop-blur-md"
            style={{ borderColor: C.surfaceVariant }}
          >
            {/* Hub icon */}
            <div className="flex items-center justify-center mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center animate-pulse"
                style={{ backgroundColor: `${C.accentBlue}50`, boxShadow: `0 0 20px ${C.accentBlue}` }}
              >
                <svg className="w-7 h-7" style={{ color: C.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Agent rows with real-time active animation layout */}
            <div className="space-y-2.5">
              {agents.map(({ letter, label, desc, color, textColor, strokeColor }, index) => {
                const isActive = index === activeIdx;
                return (
                  <motion.div
                    key={label}
                    className="flex items-center gap-3 p-3 rounded-2xl border transition-colors duration-500"
                    style={{
                      backgroundColor: isActive ? 'white' : `${C.surfaceContainerLow}50`,
                      borderColor: isActive ? strokeColor : C.surfaceVariant,
                      boxShadow: isActive ? `0 8px 20px ${strokeColor}1c` : 'none',
                    }}
                    animate={{ scale: isActive ? 1.02 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-transform duration-500"
                      style={{
                        backgroundColor: isActive ? color : `${color}30`,
                        color: isActive ? (textColor === '#ffffff' ? '#ffffff' : textColor) : textColor,
                        boxShadow: isActive ? `0 0 10px ${color}` : 'none',
                      }}
                    >
                      {letter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: C.onSurface }}>{label}</span>
                        {isActive && (
                          <span className="text-[8px] font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-zinc-900 text-white animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: isActive ? '#4b5563' : '#9ca3af' }}>
                        {isActive ? desc : 'Idle'}
                      </p>
                      <div className="mt-2 relative h-1.5 w-full bg-zinc-200/50 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute left-0 top-0 h-full rounded-full"
                          style={{ backgroundColor: strokeColor }}
                          initial={{ width: '15%' }}
                          animate={{ width: isActive ? '100%' : '15%' }}
                          transition={isActive ? { duration: 2.8, ease: 'linear', repeat: Infinity } : { duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Floating badges with custom motion path */}
          {!reducedMotion && (
            <>
              <motion.div
                className="absolute top-8 right-4 px-4 py-2 rounded-xl shadow-lg border flex items-center gap-2"
                style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}
                animate={{ y: [0, -10, 0], rotate: [6, 4, 6] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
                <span className="text-sm font-semibold" style={{ color: C.primary }}>Research Complete</span>
              </motion.div>
              <motion.div
                className="absolute bottom-8 left-4 px-4 py-2 rounded-xl shadow-lg border flex items-center gap-2"
                style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}
                animate={{ y: [0, 10, 0], rotate: [-6, -4, -6] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.accentBlue }} />
                <span className="text-sm font-semibold" style={{ color: C.primary }}>Syllabus Generated</span>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      {/* Stats bar */}
      <div
        className="mt-20 border-t pt-10 flex flex-wrap justify-center gap-12 sm:gap-24 text-center"
        style={{ borderColor: C.surfaceVariant }}
      >
        {[
          { value: '10x', label: 'Faster Creation' },
          { value: '5+', label: 'Specialised Agents' },
          { value: '∞', label: 'Personalisation' },
        ].map(({ value, label }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
          >
            <div className="text-3xl font-extrabold" style={{ color: C.primary }}>{value}</div>
            <div className="text-sm font-medium mt-1" style={{ color: C.onSurfaceVariant }}>{label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (reducedMotion) return;

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
  }, [reducedMotion]);

  return (
    <section style={{ backgroundColor: C.surfaceContainerLowest }} className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Character with eye-tracking, active hovers, and jump action */}
        <div className="flex justify-center mb-10 select-none">
          <motion.div
            ref={containerRef}
            className="w-32 h-32 relative group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              if (isJumping) return;
              setIsJumping(true);
              setTimeout(() => setIsJumping(false), 900);
            }}
            animate={
              isJumping
                ? {
                    y: [0, -70, 8, -3, 0],
                    rotate: [0, 360, 360, 360, 360],
                    scale: [1, 1.15, 0.92, 1.04, 1],
                  }
                : isHovered
                  ? {
                      y: [0, -10, 0],
                      scale: 1.08,
                      rotate: [0, -2, 2, 0],
                    }
                  : {
                      y: [0, -4, 0],
                      scale: 1,
                    }
            }
            transition={
              isJumping
                ? { duration: 0.9, ease: 'easeInOut' }
                : isHovered
                  ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }
          >
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

              {/* Left Wing with flight/flap animation */}
              <motion.g
                style={{ transformOrigin: '28px 80px' }}
                animate={
                  isJumping
                    ? { rotate: [-15, -95, -15], scaleX: [1, 1.1, 1] }
                    : isHovered
                      ? { rotate: [-15, -80, 20, -15] }
                      : { rotate: [-15, -22, -15] }
                }
                transition={
                  isJumping
                    ? { duration: 0.9, ease: 'easeInOut' }
                    : isHovered
                      ? { duration: 0.22, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                }
              >
                <ellipse cx="28" cy="80" rx="12" ry="22" fill="#e2a800" />
              </motion.g>

              {/* Right Wing with flight/flap animation */}
              <motion.g
                style={{ transformOrigin: '92px 80px' }}
                animate={
                  isJumping
                    ? { rotate: [15, 95, 15], scaleX: [1, 1.1, 1] }
                    : isHovered
                      ? { rotate: [15, 80, -20, 15] }
                      : { rotate: [15, 22, 15] }
                }
                transition={
                  isJumping
                    ? { duration: 0.9, ease: 'easeInOut' }
                    : isHovered
                      ? { duration: 0.22, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                }
              >
                <ellipse cx="92" cy="80" rx="12" ry="22" fill="#e2a800" />
              </motion.g>

              {/* Feet */}
              <motion.g
                style={{ transformOrigin: '60px 112px' }}
                animate={
                  isJumping
                    ? { y: [0, 4, -4, 0], scaleY: [1, 0.7, 1.1, 1] }
                    : isHovered
                      ? { y: [0, -2, 0] }
                      : { y: 0 }
                }
                transition={{ duration: 0.6 }}
              >
                <ellipse cx="48" cy="112" rx="10" ry="5" fill="#e2a800" />
                <ellipse cx="72" cy="112" rx="10" ry="5" fill="#e2a800" />
              </motion.g>
            </svg>

            {/* Left pupil overlay - squints on hover/jump */}
            <motion.div
              className="absolute pupil transition-all duration-75"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                left: '28%',
                top: '33%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                padding: 3,
                zIndex: 20,
                transform: 'translate(var(--eye-x, 0px), var(--eye-y, 0px))',
              }}
              animate={
                isJumping
                  ? { scaleY: 0.15, scaleX: 1.1 }
                  : isHovered
                    ? { scale: 1.15 }
                    : { scale: 1 }
              }
            >
              {!isJumping && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </motion.div>

            {/* Right pupil overlay - winks/squints on hover/jump */}
            <motion.div
              className="absolute pupil transition-all duration-75"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                left: '55%',
                top: '31%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                padding: 4,
                zIndex: 20,
                transform: 'translate(var(--eye-x, 0px), var(--eye-y, 0px))',
              }}
              animate={
                isJumping
                  ? { scaleY: 0.15, scaleX: 1.1 }
                  : isHovered
                    ? { scale: 1.15 }
                    : { scale: 1 }
              }
            >
              {!isJumping && <div className="w-2 h-2 rounded-full bg-white" />}
            </motion.div>
          </motion.div>
        </div>

        <motion.h2
          className="text-3xl sm:text-4xl font-extrabold mb-6"
          style={{ color: C.primary }}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          The Content Creation{' '}
          <span style={{ color: C.accentPurple }}>Challenge</span>
        </motion.h2>
        <motion.p
          className="max-w-2xl mx-auto mb-12 text-lg leading-relaxed"
          style={{ color: C.onSurfaceVariant }}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Educational content creation requires curriculum design, research, assessment creation, and storytelling. Today, these tasks rely on disconnected tools and immense manual effort. Even specialized AI models operate in silos, failing to deliver unified educational goals.
        </motion.p>

        {/* Pain-point cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { emoji: '⏰', title: '47+ Hours', desc: 'Average time to build one complete course module manually' },
            { emoji: '🔧', title: '8+ Tools', desc: 'Different tools educators juggle to produce one course' },
            { emoji: '📉', title: '72% Dropout', desc: 'Of courses fail due to poor personalisation and pacing' },
          ].map(({ emoji, title, desc }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-6 rounded-3xl border text-left transition-all duration-300"
              style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.surfaceVariant }}
            >
              <div className="text-3xl mb-3">{emoji}</div>
              <div className="text-2xl font-extrabold mb-1" style={{ color: C.primary }}>{title}</div>
              <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Solution / Features Section ──────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" style={{ backgroundColor: C.cream }} className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl sm:text-4xl font-extrabold mb-4"
            style={{ color: C.primary }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Dynamic Multi-Agent{' '}
            <span style={{ color: '#5a6ba8' }}>Collaboration</span>
          </motion.h2>
          <motion.p
            className="max-w-2xl mx-auto"
            style={{ color: C.onSurfaceVariant }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Give us an educational challenge. We&apos;ll assemble the ultimate AI team.
          </motion.p>
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
              title: 'The AI Coordinator',
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
              title: 'Specialized Agent Team',
              desc: "Instructional planners, researchers, and visual communicators seamlessly exchange information and review each other's outputs.",
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
              title: 'Personalized Guidance',
              desc: 'Agents adapt the curriculum in real-time based on learner needs, ensuring an optimized and focused educational journey.',
            },
          ].map(({ icon, iconBg, iconColor, title, desc }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -8, boxShadow: '0 16px 36px rgba(0,0,0,0.07)' }}
              className="relative p-8 rounded-3xl border transition-all duration-300 overflow-hidden group"
              style={{ backgroundColor: C.surfaceContainerLowest, borderColor: C.surfaceVariant }}
            >
              <div
                aria-hidden
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                style={{ backgroundColor: iconBg }}
              />
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                style={{ backgroundColor: `${iconBg}30`, color: iconColor }}
              >
                {icon}
              </div>
              <h3 className="relative text-xl font-bold mb-3" style={{ color: C.primary }}>{title}</h3>
              <p className="relative text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it Works / Process Section ──────────────────────────────────────────
function ProcessSection() {
  const magnetic = useMagnetic(10);
  const steps = [
    { n: '1', title: 'Define the Goal', desc: 'Enter a single prompt detailing your topic, audience, and educational challenge.' },
    { n: '2', title: 'The AI Team Assembles', desc: 'The Orchestrator Agent breaks down the task and spins up specialized agents for research, writing, and assessment.' },
    { n: '3', title: 'Collaborative Execution', desc: 'Agents share context and build the course collaboratively, ensuring pedagogical alignment.' },
    { n: '4', title: 'Ready for Assessment', desc: 'Export a complete, personalized learning module ready for your LMS or application.', accent: true },
  ];

  return (
    <section id="how-it-works" style={{ backgroundColor: C.surfaceContainerLowest }} className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl sm:text-4xl font-extrabold mb-4"
            style={{ color: C.primary }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            From Prompt to Complete{' '}
            <span style={{ color: C.accentPurple }}>Curriculum</span>
          </motion.h2>
          <motion.p
            className="max-w-2xl mx-auto"
            style={{ color: C.onSurfaceVariant }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            See how FOCUS transforms a simple idea into a rich, structured learning journey.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* connecting line, animated draw-in */}
          <div
            className="hidden md:block absolute top-[22px] left-[10%] right-[10%] h-0.5 overflow-hidden"
            style={{ backgroundColor: C.surfaceVariant, zIndex: 0 }}
          >
            <motion.div
              className="h-full"
              style={{ backgroundColor: C.primary }}
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
            />
          </div>
          {steps.map(({ n, title, desc, accent }, idx) => (
            <motion.div
              key={n}
              className="text-center relative"
              style={{ backgroundColor: C.surfaceContainerLowest, zIndex: 1 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <motion.div
                className="w-11 h-11 mx-auto rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-md"
                style={{
                  backgroundColor: accent ? C.accentBlue : C.primary,
                  color: accent ? C.primary : C.onPrimary,
                }}
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {n}
              </motion.div>
              <h4 className="font-bold text-lg mb-2" style={{ color: C.primary }}>{title}</h4>
              <p className="text-sm" style={{ color: C.onSurfaceVariant }}>{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA inside section */}
        <div className="mt-16 text-center">
          <Link
            ref={magnetic.ref as React.Ref<HTMLAnchorElement>}
            onMouseMove={magnetic.onMouseMove}
            onMouseLeave={magnetic.onMouseLeave}
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.98] shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: C.primary, color: C.onPrimary, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', ...magnetic.style, '--tw-ring-color': C.primary } as React.CSSProperties}
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 text-center mb-16"
      >
        <h2 className="text-3xl font-extrabold mb-4" style={{ color: C.primary }}>
          Ready to build the ultimate digital learning hub?
        </h2>
        <p className="mb-8 text-lg" style={{ color: C.onSurfaceVariant }}>
          Join the waitlist to access the Focus multi-agent content creation API.
        </p>
        <Link
          href="/signup"
          className="inline-block px-10 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ backgroundColor: C.primary, color: C.onPrimary, '--tw-ring-color': C.primary } as React.CSSProperties}
        >
          Get Early Access
        </Link>
      </motion.div>

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

// ─── Scroll progress bar ───────────────────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      style={{ scaleX: scrollYProgress, backgroundColor: C.primary }}
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[60]"
    />
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function LandingClient() {
  return (
    <>
      <ScrollProgress />
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