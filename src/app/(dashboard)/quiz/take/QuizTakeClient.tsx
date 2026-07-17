'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, SkipForward, Bookmark, BookmarkCheck,
  Send, Clock, AlertTriangle, Loader2, X, CheckCircle2
} from 'lucide-react';
import type { Question, QuizConfig, PaletteStatus } from '@/lib/quiz/types';
import QuizResults from '@/components/quiz/QuizResults';

interface QuizTakeClientProps {
  userId: string;
}

export default function QuizTakeClient({ userId }: QuizTakeClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'loading' | 'active' | 'confirming' | 'submitting' | 'results'>('loading');
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [startedAt] = useState(new Date().toISOString());
  const [resultData, setResultData] = useState<any>(null);
  const questionStartRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load config and fetch questions
  useEffect(() => {
    const raw = sessionStorage.getItem('focus_quiz_config');
    if (!raw) {
      router.push('/quiz');
      return;
    }
    const cfg: QuizConfig = JSON.parse(raw);
    setConfig(cfg);
    setTimeRemaining(cfg.timerDuration);

    fetch(`/api/quiz/questions?subjectId=${cfg.subjectId}&topicId=${cfg.topicId}&difficulty=${cfg.difficulty}&count=${cfg.questionCount}`)
      .then(r => r.json())
      .then(data => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setVisited(new Set([data.questions[0].id]));
          setPhase('active');
        } else {
          alert('No questions found for this configuration. Redirecting...');
          router.push('/quiz');
        }
      })
      .catch(() => {
        router.push('/quiz');
      });
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'active' || !config?.timerEnabled) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, config?.timerEnabled]);

  // Track time spent on each question
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentIndex]);

  const trackQuestionTime = useCallback(() => {
    if (questions.length === 0) return;
    const qId = questions[currentIndex]?.id;
    if (!qId) return;
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    setQuestionTimes(prev => ({ ...prev, [qId]: (prev[qId] || 0) + elapsed }));
  }, [currentIndex, questions]);

  // Persist draft to localStorage
  useEffect(() => {
    if (phase !== 'active' || questions.length === 0) return;
    const draft = {
      config,
      answers,
      bookmarks: Array.from(bookmarks),
      currentIndex,
      timeRemaining,
      questionTimes,
    };
    try {
      localStorage.setItem('focus_quiz_draft', JSON.stringify(draft));
    } catch { /* ignore */ }
  }, [answers, bookmarks, currentIndex, timeRemaining, phase, questions, config, questionTimes]);

  const currentQuestion = questions[currentIndex];

  const setAnswer = (value: any) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const toggleBookmark = () => {
    if (!currentQuestion) return;
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  const goTo = (idx: number) => {
    trackQuestionTime();
    setCurrentIndex(idx);
    setVisited(prev => new Set(prev).add(questions[idx].id));
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };

  const skip = () => {
    goNext();
  };

  const getPaletteStatus = (qId: string): PaletteStatus => {
    const isAnswered = answers[qId] !== undefined && answers[qId] !== null && answers[qId] !== '';
    const isMarked = bookmarks.has(qId);
    const isVisited = visited.has(qId);

    if (isAnswered && isMarked) return 'answered-marked';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'not-answered';
    return 'not-visited';
  };

  const paletteColors: Record<PaletteStatus, string> = {
    'not-visited': 'bg-zinc-800 text-zinc-500',
    'answered': 'bg-[#7C5CFF] text-white',
    'not-answered': 'bg-[#F1583D]/20 text-[#F1583D] border-[#F1583D]/30',
    'marked': 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/30',
    'answered-marked': 'bg-[#3DD68C]/20 text-[#3DD68C] border-[#3DD68C]/30',
  };

  const answeredCount = questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '').length;
  const unansweredCount = questions.length - answeredCount;
  const bookmarkedCount = bookmarks.size;

  const handleSubmit = async () => {
    trackQuestionTime();
    if (phase === 'active') {
      setPhase('confirming');
      return;
    }
    if (phase !== 'confirming') return;

    setPhase('submitting');
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      localStorage.removeItem('focus_quiz_draft');
      sessionStorage.removeItem('focus_quiz_config');

      const timeTaken = config?.timerEnabled
        ? config.timerDuration - timeRemaining
        : Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);

      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          questions,
          answers,
          bookmarks: Array.from(bookmarks),
          questionTimes,
          timeTakenSeconds: timeTaken,
        }),
      });

      const data = await res.json();
      setResultData({ ...data, questions });
      setPhase('results');
    } catch (err) {
      console.error('Submit error:', err);
      setPhase('active');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#7C5CFF] animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────
  if (phase === 'results' && resultData) {
    return <QuizResults data={resultData} onBack={() => router.push('/quiz')} />;
  }

  // ── Active Quiz ──────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto flex gap-6 relative">
      {/* Main Quiz Area */}
      <div className="flex-1 space-y-5">
        {/* Top Bar: Progress + Timer */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                {answeredCount} answered
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((answeredCount) / questions.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          {config?.timerEnabled && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm font-bold ${
                timeRemaining <= 60
                  ? 'bg-[#F1583D]/10 border-[#F1583D]/30 text-[#F1583D] animate-pulse'
                  : timeRemaining <= 300
                    ? 'bg-[#F5B942]/10 border-[#F5B942]/30 text-[#F5B942]'
                    : 'bg-zinc-900/60 border-zinc-800 text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion?.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#13131A]/60 shadow-xl shadow-[#7C5CFF]/5 space-y-6"
          >
            {/* Question Type Badge */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 text-[#7C5CFF] text-[9px] font-bold tracking-wider uppercase rounded-full">
                {currentQuestion?.type.replace('-', ' ')}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {currentQuestion?.marks} mark{currentQuestion?.marks !== 1 ? 's' : ''}
                {currentQuestion?.negativeMarks > 0 && ` · -${currentQuestion.negativeMarks} penalty`}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-lg font-semibold text-white leading-relaxed">
              {currentQuestion?.question}
            </h3>

            {/* Answer Input — type-specific */}
            <div className="space-y-3">
              {currentQuestion?.type === 'mcq' && (
                <MCQInput
                  options={(currentQuestion.payload as any).options}
                  selected={answers[currentQuestion.id]}
                  onSelect={setAnswer}
                />
              )}

              {currentQuestion?.type === 'true-false' && (
                <TrueFalseInput
                  selected={answers[currentQuestion.id]}
                  onSelect={setAnswer}
                />
              )}

              {currentQuestion?.type === 'fill-blank' && (
                <FillBlankInput
                  value={answers[currentQuestion.id] || ''}
                  onChange={setAnswer}
                />
              )}

              {currentQuestion?.type === 'one-word' && (
                <OneWordInput
                  value={answers[currentQuestion.id] || ''}
                  onChange={setAnswer}
                />
              )}

              {currentQuestion?.type === 'match' && (
                <MatchInput
                  leftItems={(currentQuestion.payload as any).leftItems}
                  rightItems={(currentQuestion.payload as any).rightItems}
                  selected={answers[currentQuestion.id] || []}
                  onSelect={setAnswer}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                bookmarks.has(currentQuestion?.id || '')
                  ? 'border-[#F5B942]/30 bg-[#F5B942]/10 text-[#F5B942]'
                  : 'border-zinc-800 text-zinc-400 hover:text-[#F5B942] hover:border-[#F5B942]/30'
              }`}
            >
              {bookmarks.has(currentQuestion?.id || '') ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {bookmarks.has(currentQuestion?.id || '') ? 'Bookmarked' : 'Bookmark'}
            </button>

            <button
              onClick={skip}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="h-4 w-4" /> Skip
            </button>
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-semibold text-white hover:bg-zinc-700 transition-all"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] rounded-xl text-sm font-bold text-zinc-950 hover:opacity-95 transition-all shadow-lg shadow-[#7C5CFF]/15"
            >
              <Send className="h-4 w-4" /> Submit
            </button>
          )}
        </div>
      </div>

      {/* Question Palette (Sidebar) */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13131A]/60 space-y-4 sticky top-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Question Palette</h4>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const status = getPaletteStatus(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(idx)}
                  className={`h-9 w-9 rounded-lg text-xs font-bold border transition-all ${paletteColors[status]} ${
                    idx === currentIndex ? 'ring-2 ring-[#22D3D0] ring-offset-1 ring-offset-[#0A0A0F]' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-3 border-t border-zinc-800">
            <LegendItem color="bg-zinc-800" label="Not Visited" />
            <LegendItem color="bg-[#7C5CFF]" label="Answered" />
            <LegendItem color="bg-[#F1583D]/20" label="Not Answered" />
            <LegendItem color="bg-[#F5B942]/20" label="Marked for Review" />
            <LegendItem color="bg-[#3DD68C]/20" label="Answered & Marked" />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] rounded-xl text-sm font-bold text-zinc-950 hover:opacity-95 transition-all"
          >
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {phase === 'confirming' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-3xl border border-white/10 bg-[#13131A]/90 max-w-md w-full mx-4 space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-[#F5B942]" />
                </div>
                <h3 className="text-lg font-bold text-white">Submit Quiz?</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Answered</span>
                  <span className="text-[#3DD68C] font-bold">{answeredCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Unanswered</span>
                  <span className="text-[#F1583D] font-bold">{unansweredCount}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">Bookmarked</span>
                  <span className="text-[#F5B942] font-bold">{bookmarkedCount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPhase('active')}
                  className="flex-1 py-2.5 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] rounded-xl text-sm font-bold text-zinc-950 hover:opacity-95 transition-all"
                >
                  Confirm Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 'submitting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="text-center space-y-4">
              <Loader2 className="h-10 w-10 text-[#7C5CFF] animate-spin mx-auto" />
              <p className="text-sm text-zinc-400">Grading your quiz...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded ${color} border border-white/10`} />
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}

function MCQInput({ options, selected, onSelect }: { options: string[]; selected: number | undefined; onSelect: (v: number) => void }) {
  return (
    <div className="space-y-2.5">
      {options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
            selected === idx
              ? 'border-[#7C5CFF] bg-[#7C5CFF]/10 text-white ring-1 ring-[#7C5CFF]'
              : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg mr-3 text-xs font-bold ${
            selected === idx ? 'bg-[#7C5CFF] text-white' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {String.fromCharCode(65 + idx)}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}

function TrueFalseInput({ selected, onSelect }: { selected: boolean | undefined; onSelect: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {[true, false].map(val => (
        <button
          key={String(val)}
          onClick={() => onSelect(val)}
          className={`flex-1 py-4 rounded-xl border text-sm font-bold transition-all duration-200 ${
            selected === val
              ? val
                ? 'border-[#3DD68C] bg-[#3DD68C]/10 text-[#3DD68C] ring-1 ring-[#3DD68C]'
                : 'border-[#F1583D] bg-[#F1583D]/10 text-[#F1583D] ring-1 ring-[#F1583D]'
              : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700'
          }`}
        >
          {val ? '✓ True' : '✗ False'}
        </button>
      ))}
    </div>
  );
}

function FillBlankInput({ value, onChange }: { value: string | string[]; onChange: (v: string) => void }) {
  const val = Array.isArray(value) ? value[0] || '' : value;
  return (
    <input
      type="text"
      value={val}
      onChange={e => onChange(e.target.value)}
      placeholder="Type your answer here..."
      className="w-full px-5 py-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
    />
  );
}

function OneWordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Type a single word or short answer..."
      className="w-full px-5 py-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
    />
  );
}

function MatchInput({
  leftItems,
  rightItems,
  selected,
  onSelect,
}: {
  leftItems: string[];
  rightItems: string[];
  selected: number[];
  onSelect: (v: number[]) => void;
}) {
  const handleChange = (leftIdx: number, rightIdx: number) => {
    const next = [...(selected.length === leftItems.length ? selected : new Array(leftItems.length).fill(-1))];
    next[leftIdx] = rightIdx;
    onSelect(next);
  };

  return (
    <div className="space-y-3">
      {leftItems.map((left, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="flex-1 px-4 py-2.5 bg-zinc-950/40 border border-zinc-800 rounded-xl text-sm text-white font-medium">
            {left}
          </span>
          <span className="text-zinc-600">→</span>
          <select
            value={selected[idx] ?? -1}
            onChange={e => handleChange(idx, parseInt(e.target.value))}
            className="flex-1 px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all appearance-none cursor-pointer"
          >
            <option value={-1}>— Select —</option>
            {rightItems.map((right, rIdx) => (
              <option key={rIdx} value={rIdx}>{right}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
