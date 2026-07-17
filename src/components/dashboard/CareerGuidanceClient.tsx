'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, MessageCircle, Briefcase, GraduationCap, ArrowDown } from 'lucide-react';
import { getCareerSuggestions, type CareerMessage } from '@/lib/careerGuidanceService';
import { motion } from 'framer-motion';

// ─── Colour constants matching the design system ────────────────────────────
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
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
};

// ─── Suggested starter questions ────────────────────────────────────────────
const STARTER_QUESTIONS = [
  { label: 'Careers in maths & art', question: 'What careers suit someone good at maths and art?' },
  { label: 'Programming career paths', question: 'What career paths are available for someone learning programming?' },
  { label: 'Science careers', question: 'What careers can I pursue if I love science and research?' },
  { label: 'Business & startups', question: 'I\'m interested in business and entrepreneurship. What should I explore?' },
];

interface CareerGuidanceClientProps {
  userEmail: string;
}

export default function CareerGuidanceClient({ userEmail }: CareerGuidanceClientProps) {
  const [messages, setMessages] = useState<CareerMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mascot states
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

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
  }, [messages]);

  // Read courses from localStorage for context
  const getCourses = () => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('focus_courses');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })) : [];
    } catch {
      return [];
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Track scroll position for "scroll to bottom" button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSend = async (text?: string) => {
    const message = (text || input).trim();
    if (!message || isLoading) return;

    const userMsg: CareerMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getCareerSuggestions(message, getCourses(), messages);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('Error fetching career suggestions:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayName = userEmail.split('@')[0];

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      {/* Mascot Bird AI Agent */}
      <div className="flex justify-center mb-8 select-none">
        <motion.div 
          ref={containerRef} 
          className="w-28 h-28 relative group cursor-pointer"
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
                  y: [0, -60, 5, -2, 0],
                  rotate: [0, 360, 360, 360, 360],
                  scale: [1, 1.15, 0.92, 1.04, 1] 
                }
              : isHovered
                ? { 
                    y: [0, -8, 0],
                    scale: 1.06,
                    rotate: [0, -1.5, 1.5, 0]
                  }
                : { 
                    y: [0, -3, 0],
                    scale: 1
                  }
          }
          transition={
            isJumping
              ? { duration: 0.9, ease: "easeInOut" }
              : isHovered
                ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
                : { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {/* Owl character SVG */}
          <svg viewBox="0 0 120 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="75" rx="32" ry="38" fill="#fcdf46" />
            <circle cx="60" cy="45" r="32" fill="#fcdf46" />
            <polygon points="35,22 28,8 43,18" fill="#e2a800" />
            <polygon points="85,22 92,8 77,18" fill="#e2a800" />
            <circle cx="45" cy="44" r="13" fill="white" />
            <circle cx="75" cy="44" r="13" fill="white" />
            <polygon points="60,52 53,62 67,62" fill="#e2a800" />
            
            {/* Left Wing */}
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
                  ? { duration: 0.9, ease: "easeInOut" }
                  : isHovered
                    ? { duration: 0.22, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <ellipse cx="28" cy="80" rx="12" ry="22" fill="#e2a800" />
            </motion.g>

            {/* Right Wing */}
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
                  ? { duration: 0.9, ease: "easeInOut" }
                  : isHovered
                    ? { duration: 0.22, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
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

          {/* Left pupil */}
          <motion.div
            className="absolute pupil transition-all duration-75"
            style={{
              width: 18, height: 18,
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              left: '29%', top: '33%',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
              padding: 2.5, zIndex: 20,
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
            {!isJumping && <div className="w-1 h-1 rounded-full bg-white" />}
          </motion.div>

          {/* Right pupil */}
          <motion.div
            className="absolute pupil transition-all duration-75"
            style={{
              width: 22, height: 22,
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              left: '55%', top: '31%',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
              padding: 3, zIndex: 20,
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
        </motion.div>
      </div>

      <h2
        className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-2"
        style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
      >
        Career Guidance
      </h2>
      <p className="text-sm text-center max-w-md mb-10" style={{ color: C.onSurfaceVariant }}>
        Ask me anything about career paths, skills, and opportunities. I&apos;ll give you personalised suggestions
        {getCourses().length > 0 ? ' based on your current courses.' : '.'}
      </p>

      {/* Starter question cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {STARTER_QUESTIONS.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq.question)}
            className="group text-left p-4 rounded-2xl border transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: C.surfaceContainerLowest,
              borderColor: C.surfaceVariant,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accentPurple;
              e.currentTarget.style.backgroundColor = `${C.accentPink}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.surfaceVariant;
              e.currentTarget.style.backgroundColor = C.surfaceContainerLowest;
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${C.accentBlue}30` }}
              >
                <Briefcase className="h-4 w-4" style={{ color: '#5a6ba8' }} />
              </div>
              <div>
                <span className="text-sm font-semibold block" style={{ color: C.onSurface }}>
                  {sq.label}
                </span>
                <span className="text-xs mt-0.5 block" style={{ color: C.outline }}>
                  {sq.question}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMessage = (msg: CareerMessage) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in`}
        style={{ animation: 'fadeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Assistant avatar */}
        {!isUser && (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mr-3 mt-1"
            style={{
              background: 'linear-gradient(135deg, #bec6e0 0%, #7c839b 100%)',
            }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        )}

        {/* Bubble */}
        <div
          className="max-w-[75%] sm:max-w-[70%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed"
          style={
            isUser
              ? {
                  backgroundColor: C.primary,
                  color: C.onPrimary,
                  borderBottomRightRadius: '6px',
                }
              : {
                  backgroundColor: C.surfaceContainerLowest,
                  color: C.onSurface,
                  border: `1px solid ${C.surfaceVariant}`,
                  borderBottomLeftRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }
          }
        >
          {/* Render content with basic markdown-like formatting */}
          {msg.content.split('\n').map((line, i) => {
            // Bold text
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic text
            const withItalic = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

            return (
              <p
                key={i}
                className={line === '' ? 'h-2' : ''}
                dangerouslySetInnerHTML={{ __html: withItalic }}
              />
            );
          })}
        </div>

        {/* User avatar */}
        {isUser && (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ml-3 mt-1 font-bold text-xs"
            style={{ backgroundColor: `${C.accentBlue}40`, color: '#5a6ba8' }}
          >
            {displayName[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    );
  };

  const renderLoadingBubble = () => (
    <div className="flex justify-start mb-4" style={{ animation: 'fadeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mr-3 mt-1"
        style={{ background: 'linear-gradient(135deg, #bec6e0 0%, #7c839b 100%)' }}
      >
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div
        className="px-5 py-4 rounded-2xl border"
        style={{
          backgroundColor: C.surfaceContainerLowest,
          borderColor: C.surfaceVariant,
          borderBottomLeftRadius: '6px',
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: C.outline, animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: C.outline, animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: C.outline, animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      {/* Inline keyframe animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="space-y-2 mb-6 shrink-0">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${C.accentPink}20`,
            borderColor: `${C.accentPink}60`,
            color: C.accentPurple,
          }}
        >
          <MessageCircle className="h-3 w-3" />
          Career AI Advisor
        </div>
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
        >
          Career <span style={{ color: '#5a6ba8' }}>Guidance</span>
        </h1>
        <p className="text-sm" style={{ color: C.onSurfaceVariant }}>
          Explore career paths tailored to your skills and interests.
        </p>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 rounded-3xl border shadow-lg flex flex-col overflow-hidden relative"
        style={{
          backgroundColor: C.surfaceContainerLow,
          borderColor: C.surfaceVariant,
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          minHeight: '400px',
        }}
      >
        {/* Messages container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          {messages.length === 0 && !isLoading ? (
            renderEmptyState()
          ) : (
            <>
              {messages.map(renderMessage)}
              {isLoading && renderLoadingBubble()}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 h-9 w-9 rounded-full border shadow-md flex items-center justify-center transition-all hover:shadow-lg"
            style={{
              backgroundColor: C.surfaceContainerLowest,
              borderColor: C.outlineVariant,
            }}
          >
            <ArrowDown className="h-4 w-4" style={{ color: C.onSurfaceVariant }} />
          </button>
        )}

        {/* Input bar */}
        <div
          className="px-4 py-4 border-t shrink-0"
          style={{ borderColor: C.surfaceVariant, backgroundColor: C.surfaceContainerLowest }}
        >
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about career paths, skills, opportunities…"
              disabled={isLoading}
              className="flex-1 px-5 py-3 rounded-xl border text-sm outline-none transition-all duration-150 placeholder:text-gray-400 disabled:opacity-50"
              style={{
                backgroundColor: C.surfaceContainerLow,
                borderColor: C.surfaceVariant,
                color: C.onSurface,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#5a6ba8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90,107,168,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.surfaceVariant; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 disabled:opacity-40"
              style={{
                backgroundColor: input.trim() && !isLoading ? C.primary : C.surfaceContainerHigh,
                color: input.trim() && !isLoading ? C.onPrimary : C.outline,
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !isLoading) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
