'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Play, BookOpen, Clock, ChevronRight, Award, 
  HelpCircle, Terminal, Sparkles, Loader2 
} from 'lucide-react';

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
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
  secondaryContainer: '#fcdf46',
};

interface CourseItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  completed: boolean;
}

interface DashboardClientProps {
  userEmail: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('focus_courses');
      if (stored) {
        setCourses(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    // Redirect to dynamic session page with prompt as query parameter
    router.push(`/session/${sessionId}?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const handleSuggestionClick = (topic: string) => {
    setLoading(true);
    const sessionId = crypto.randomUUID();
    router.push(`/session/${sessionId}?prompt=${encodeURIComponent(topic)}`);
  };

  const suggestions = [
    'React Suspense & Server Components',
    'Rust Lifetimes & Memory Safety',
    'TypeScript Conditional Types',
    'PostgreSQL Query Optimization',
  ];

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 overflow-x-hidden">
      {/* Greeting Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-2"
      >
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${C.accentGreen}20`,
            borderColor: `${C.accentGreen}60`,
            color: '#166534',
          }}
        >
          <Sparkles className="h-3 w-3 animate-spin-slow" />
          Active Grid Status: Nominal
        </div>
        <h1
          className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
        >
          Welcome to <span style={{ color: '#5a6ba8' }}>the Focus Grid</span>
        </h1>
        <p className="text-sm" style={{ color: C.onSurfaceVariant }}>
          Deploy structured multi-agent loops to research topics and build interactive quizzes.
        </p>
      </motion.div>

      {/* Main Orchestrator Prompt Panel */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        variants={itemVars}
        className="p-8 sm:p-10 rounded-3xl border shadow-lg space-y-6 relative overflow-hidden group"
        style={{
          backgroundColor: C.surfaceContainerLowest,
          borderColor: C.surfaceVariant,
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        <motion.div 
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
          style={{ backgroundColor: C.accentBlue }}
        />
        
        <form onSubmit={handleStartSession} className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Terminal className="h-5 w-5 transition-colors group-focus-within/input:text-[#5a6ba8]" style={{ color: C.outline }} />
              </div>
              <input
                type="text"
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter topic e.g., Python Decorators, SQL Indexes, CSS Grid..."
                disabled={loading}
                className="block w-full pl-12 pr-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: C.surfaceContainerLow,
                  borderColor: C.outlineVariant,
                  color: C.onSurface,
                  '--tw-ring-color': '#5a6ba8',
                } as React.CSSProperties}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-3 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 shrink-0"
              style={{
                backgroundColor: C.primary,
                color: C.onPrimary,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Deploy Loop
                  <Play className="h-4 w-4" style={{ fill: C.onPrimary }} />
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Quick suggestions */}
        <div className="space-y-3 relative z-10">
          <span
            className="text-[10px] uppercase font-bold tracking-widest block"
            style={{ color: C.outline }}
          >
            Popular Learning Grids:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((topic, i) => (
              <motion.button
                key={topic}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestionClick(topic)}
                disabled={loading}
                className="px-3.5 py-1.5 border rounded-xl text-xs font-semibold"
                style={{
                  borderColor: C.outlineVariant,
                  backgroundColor: C.surfaceContainerLow,
                  color: C.onSurfaceVariant,
                }}
              >
                {topic}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Courses / History Section */}
      <motion.div 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVars}
        className="space-y-6"
      >
        <motion.h2
          variants={itemVars}
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: C.primary, fontFamily: 'var(--font-jakarta), sans-serif' }}
        >
          Active Syllabus History ({courses.length})
        </motion.h2>

        {(!isMounted || courses.length === 0) ? (
          /* Designed empty state */
          <motion.div
            variants={itemVars}
            className="border border-dashed p-12 rounded-3xl text-center space-y-4"
            style={{
              borderColor: C.outlineVariant,
              backgroundColor: C.surfaceContainerLow,
            }}
          >
            <div
              className="h-12 w-12 border rounded-2xl flex items-center justify-center mx-auto"
              style={{
                backgroundColor: `${C.accentBlue}30`,
                borderColor: C.surfaceVariant,
                color: '#5a6ba8',
              }}
            >
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm" style={{ color: C.primary }}>
                No Active Syllabuses Found
              </h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: C.outline }}>
                Type a topic above and deploy the FOCUS orchestration loop to generate your first 3-lesson curriculum.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSuggestionClick('TypeScript Conditional Types')}
              className="px-4 py-2 border text-xs font-semibold rounded-xl"
              style={{
                borderColor: C.outlineVariant,
                backgroundColor: C.surfaceContainerLowest,
                color: C.onSurfaceVariant,
              }}
            >
              Try Demo Suggestion
            </motion.button>
          </motion.div>
        ) : (
          /* Staged Course Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <motion.div 
                key={course.id}
                variants={itemVars}
                whileHover={{ y: -5, scale: 1.01 }}
                onClick={() => router.push(`/course/${course.id}`)}
                className="p-6 rounded-2xl border cursor-pointer group flex flex-col justify-between h-44 relative overflow-hidden"
                style={{
                  backgroundColor: C.surfaceContainerLowest,
                  borderColor: C.surfaceVariant,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
              >
                <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: '#5a6ba8' }} />
                
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5" style={{ color: C.outline }}>
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">{course.createdAt}</span>
                    </div>
                    {course.completed ? (
                      <span
                        className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full border"
                        style={{
                          backgroundColor: `${C.accentGreen}20`,
                          borderColor: `${C.accentGreen}40`,
                          color: '#166534',
                        }}
                      >
                        GRADUATED
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full border"
                        style={{
                          backgroundColor: `${C.accentYellow}25`,
                          borderColor: `${C.accentYellow}60`,
                          color: '#725e00',
                        }}
                      >
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                  <h3
                    className="text-base font-bold transition-colors line-clamp-1 group-hover:text-[#5a6ba8]"
                    style={{ color: C.primary }}
                  >
                    {course.title}
                  </h3>
                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                    {course.description}
                  </p>
                </div>
                
                <div
                  className="flex items-center justify-between border-t pt-4 text-xs font-semibold relative z-10"
                  style={{ borderColor: C.surfaceVariant, color: '#5a6ba8' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    Interactive Syllabus
                  </span>
                  <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Enter Workspace
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
