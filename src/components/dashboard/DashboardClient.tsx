'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, BookOpen, Clock, ChevronRight, Award, 
  HelpCircle, Terminal, Sparkles, Loader2 
} from 'lucide-react';

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

  // Load courses from localStorage on mount
  useEffect(() => {
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

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Greeting Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[#22D3D0] text-[10px] font-semibold uppercase tracking-wider">
          <Sparkles className="h-3 w-3 animate-spin-slow" />
          Active Grid Status: Nominal
        </div>
        <h1 className="font-display text-4xl sm:text-6xl tracking-wide uppercase text-white leading-none">
          WELCOME TO <span className="text-gradient">THE FOCUS GRID</span>
        </h1>
        <p className="text-sm text-zinc-400 font-body">
          Deploy structured multi-agent loops to research topics and build interactive quizzes.
        </p>
      </div>

      {/* Main Orchestrator Prompt Panel */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 bg-[#13131A]/60 shadow-xl shadow-[#7C5CFF]/5 space-y-6">
        <form onSubmit={handleStartSession} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Terminal className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="text"
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter topic e.g., Python Decorators, SQL Indexes, CSS Grid..."
                disabled={loading}
                className="block w-full pl-12 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-[#7C5CFF] rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#7C5CFF] text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 font-bold text-sm rounded-2xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  Deploy Loop
                  <Play className="h-4 w-4 fill-zinc-950 text-zinc-950" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick suggestions */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">
            Popular Learning Grids:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((topic) => (
              <button
                key={topic}
                onClick={() => handleSuggestionClick(topic)}
                disabled={loading}
                className="px-3.5 py-1.5 border border-white/5 bg-zinc-950/30 hover:border-[#7C5CFF]/30 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-all hover:scale-[1.01]"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses / History Section */}
      <div className="space-y-6">
        <h2 className="font-display text-2xl tracking-wide uppercase text-white">
          Active Syllabus History ({courses.length})
        </h2>

        {courses.length === 0 ? (
          /* Designed empty state */
          <div className="border border-dashed border-zinc-800 p-12 rounded-3xl text-center space-y-4 bg-zinc-950/20">
            <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-[#22D3D0]">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-white font-bold text-sm">No Active Syllabuses Found</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Type a topic above and deploy the FOCUS orchestration loop to generate your first 3-lesson curriculum.
              </p>
            </div>
            <button
              onClick={() => handleSuggestionClick('TypeScript Conditional Types')}
              className="px-4 py-2 border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
            >
              Try Demo Suggestion
            </button>
          </div>
        ) : (
          /* Staged Course Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div 
                key={course.id}
                onClick={() => router.push(`/course/${course.id}`)}
                className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#13131A]/30 hover:border-[#22D3D0]/20 hover:bg-[#13131A]/50 transition-all cursor-pointer group flex flex-col justify-between h-44"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">{course.createdAt}</span>
                    </div>
                    {course.completed ? (
                      <span className="px-2 py-0.5 bg-[#3DD68C]/15 border border-[#3DD68C]/20 text-[#3DD68C] text-[9px] font-bold tracking-wider uppercase rounded-full">
                        GRADUATED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold tracking-wider uppercase rounded-full">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#22D3D0] transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs font-semibold text-[#22D3D0]">
                  <span className="flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    Interactive Syllabus
                  </span>
                  <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Enter Workspace
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
