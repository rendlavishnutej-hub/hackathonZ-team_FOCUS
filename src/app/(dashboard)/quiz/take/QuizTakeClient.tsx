'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, SkipForward, Bookmark, BookmarkCheck,
  Send, Clock, AlertTriangle, Loader2
} from 'lucide-react';
import type { Question, QuizConfig, PaletteStatus } from '@/lib/quiz/types';
import QuizResults from '@/components/quiz/QuizResults';

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

  useEffect(() => {
    const raw = sessionStorage.getItem('focus_quiz_config');
    if (!raw) {
      router.push('/quiz');
      return;
    }
    const cfg: QuizConfig = JSON.parse(raw);
    setConfig(cfg);
    setTimeRemaining(cfg.timerDuration);

    const preGenRaw = sessionStorage.getItem('focus_quiz_questions');
    if (preGenRaw) {
      try {
        const preGen = JSON.parse(preGenRaw);
        if (preGen && preGen.length > 0) {
          sessionStorage.removeItem('focus_quiz_questions');
          setQuestions(preGen);
          setVisited(new Set([preGen[0].id]));
          setPhase('active');
          return;
        }
      } catch { /* fall through to API */ }
    }

    const url = cfg.fileId
      ? `/api/quiz/questions?fileId=${cfg.fileId}&difficulty=${cfg.difficulty}&count=${cfg.questionCount}`
      : `/api/quiz/questions?subjectId=${cfg.subjectId}&topicId=${cfg.topicId}&difficulty=${cfg.difficulty}&count=${cfg.questionCount}`;

    fetch(url)
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
    'not-visited': 'bg-white border-zinc-200 text-zinc-500',
    'answered': 'bg-[#d3579a] border-transparent text-white',
    'not-answered': 'bg-red-50 text-[#dc2626] border-red-200',
    'marked': 'bg-amber-50 text-[#d97706] border-amber-250',
    'answered-marked': 'bg-emerald-50 text-[#047857] border-emerald-250',
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

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-full py-28 font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#d3579a] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-zinc-550">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  if (phase === 'results' && resultData) {
    return <QuizResults data={resultData} onBack={() => router.push('/quiz')} />;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 relative font-sans" style={{ color: C.onSurface }}>
      {/* Main Quiz Area */}
      <div className="flex-1 space-y-5">
        {/* Top Bar: Progress + Timer */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#76777d]">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#76777d]">
                {answeredCount} answered
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#d3579a] to-[#5a6ba8] rounded-full"
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
                  ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                  : timeRemaining <= 300
                    ? 'bg-amber-50 border-amber-250 text-amber-600'
                    : 'bg-white border-zinc-250 text-black'
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
            className="p-8 rounded-[2rem] border bg-white shadow-sm space-y-6"
            style={{ borderColor: C.surfaceVariant }}
          >
            {/* Question Type Badge */}
            <div className="flex items-center justify-between">
              <span 
                className="px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase rounded-full border"
                style={{ backgroundColor: `${C.accentPurple}10`, borderColor: `${C.accentPurple}35`, color: C.accentPurple }}
              >
                {currentQuestion?.type.replace('-', ' ')}
              </span>
              <span className="text-[10px] text-zinc-550 font-mono font-bold">
                {currentQuestion?.marks} mark{currentQuestion?.marks !== 1 ? 's' : ''}
                {currentQuestion?.negativeMarks > 0 && ` · -${currentQuestion.negativeMarks} penalty`}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-lg font-extrabold text-black leading-relaxed whitespace-pre-wrap">
              {currentQuestion?.question}
            </h3>

            {/* Answer Input — type-specific */}
            <div className="space-y-3 pt-2">
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-semibold text-zinc-650 hover:bg-zinc-50 transition-all bg-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderColor: C.surfaceVariant }}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleBookmark}
              className="flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all bg-white"
              style={
                bookmarks.has(currentQuestion?.id || '')
                  ? { borderColor: '#fde68a', backgroundColor: '#fffbeb', color: '#d97706' }
                  : { borderColor: C.surfaceVariant, color: '#71717a' }
              }
            >
              {bookmarks.has(currentQuestion?.id || '') ? (
                <BookmarkCheck className="h-4.5 w-4.5 text-[#d97706]" />
              ) : (
                <Bookmark className="h-4.5 w-4.5" />
              )}
              {bookmarks.has(currentQuestion?.id || '') ? 'Bookmarked' : 'Bookmark'}
            </button>

            <button
              onClick={skip}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-semibold text-zinc-650 hover:bg-zinc-50 transition-all bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: C.surfaceVariant }}
            >
              <SkipForward className="h-4 w-4" /> Skip
            </button>
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-bold text-black bg-white hover:bg-zinc-55 transition-all"
              style={{ borderColor: C.surfaceVariant }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-95 shadow transition-all"
              style={{ backgroundColor: C.accentPurple }}
            >
              <Send className="h-4 w-4" /> Submit
            </button>
          )}
        </div>
      </div>

      {/* Question Palette (Sidebar) */}
      <div className="w-full lg:w-64 shrink-0">
        <div 
          className="p-5 rounded-2xl border bg-white space-y-4 lg:sticky lg:top-4"
          style={{ borderColor: C.surfaceVariant }}
        >
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#76777d]">Question Palette</h4>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const status = getPaletteStatus(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(idx)}
                  className={`h-9 w-9 rounded-lg text-xs font-bold border transition-all ${paletteColors[status]} ${
                    idx === currentIndex ? 'ring-2 ring-zinc-550 ring-offset-2 ring-offset-white' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: C.surfaceVariant }}>
            <LegendItem color="bg-white border-zinc-250" label="Not Visited" />
            <LegendItem color="bg-[#d3579a]" label="Answered" />
            <LegendItem color="bg-red-50 border-red-200" label="Not Answered" />
            <LegendItem color="bg-amber-50 border-amber-250" label="Marked for Review" />
            <LegendItem color="bg-emerald-50 border-emerald-250" label="Answered & Marked" />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-95 transition-all shadow"
            style={{ backgroundColor: C.accentPurple }}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-8 rounded-[2rem] border bg-white max-w-md w-full mx-4 space-y-6 shadow-2xl"
              style={{ borderColor: C.surfaceVariant }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-[#d97706]" />
                </div>
                <h3 className="text-lg font-extrabold text-black">Submit Quiz?</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b" style={{ borderColor: C.surfaceVariant }}>
                  <span className="text-zinc-650 font-semibold">Answered</span>
                  <span className="text-[#047857] font-extrabold">{answeredCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: C.surfaceVariant }}>
                  <span className="text-zinc-650 font-semibold">Unanswered</span>
                  <span className="text-[#dc2626] font-extrabold">{unansweredCount}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-650 font-semibold">Bookmarked</span>
                  <span className="text-[#d97706] font-extrabold">{bookmarkedCount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPhase('active')}
                  className="flex-1 py-2.5 border rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all bg-white"
                  style={{ borderColor: C.surfaceVariant }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-95 transition-all"
                  style={{ backgroundColor: C.accentPurple }}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="text-center space-y-4">
              <Loader2 className="h-10 w-10 text-[#d3579a] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-zinc-600">Grading your quiz...</p>
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
      <div className={`h-3 w-3 rounded border ${color}`} />
      <span className="text-[10px] text-zinc-500 font-semibold">{label}</span>
    </div>
  );
}

function MCQInput({ options, selected, onSelect }: { options: string[]; selected: number | undefined; onSelect: (v: number) => void }) {
  return (
    <div className="space-y-2.5">
      {options.map((opt, idx) => {
        const isSelected = selected === idx;
        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className="w-full text-left px-5 py-3.5 rounded-xl border text-sm font-medium transition-all duration-205 flex items-center"
            style={
              isSelected
                ? { borderColor: C.accentPurple, backgroundColor: `${C.accentPurple}08` }
                : { borderColor: C.surfaceVariant, backgroundColor: '#ffffff' }
            }
          >
            <span 
              className="inline-flex items-center justify-center h-6 w-6 rounded-lg mr-3 text-xs font-bold shrink-0 border"
              style={
                isSelected
                  ? { backgroundColor: C.accentPurple, color: '#ffffff', borderColor: C.accentPurple }
                  : { backgroundColor: '#f9f9fafb', color: '#71717a', borderColor: C.surfaceVariant }
              }
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className={isSelected ? 'text-black font-semibold' : 'text-zinc-800'}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseInput({ selected, onSelect }: { selected: boolean | undefined; onSelect: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {[true, false].map(val => {
        const isSelected = selected === val;
        return (
          <button
            key={String(val)}
            onClick={() => onSelect(val)}
            className="flex-1 py-4 rounded-xl border text-sm font-extrabold transition-all duration-200"
            style={
              isSelected
                ? val
                  ? { borderColor: '#86efac', backgroundColor: '#f0fdf4', color: '#166534' }
                  : { borderColor: '#fca5a5', backgroundColor: '#fef2f2', color: '#991b1b' }
                : { borderColor: C.surfaceVariant, backgroundColor: '#ffffff', color: '#4b5563' }
            }
          >
            {val ? '✓ True' : '✗ False'}
          </button>
        );
      })}
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
      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-xl text-black text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#d3579a] transition-all"
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
      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-xl text-black text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#d3579a] transition-all"
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
        <div key={idx} className="flex flex-wrap items-center gap-3">
          <span 
            className="flex-1 min-w-[200px] px-4 py-2.5 border rounded-xl text-sm text-black font-semibold bg-zinc-50"
            style={{ borderColor: C.surfaceVariant }}
          >
            {left}
          </span>
          <span className="text-zinc-400 font-bold">→</span>
          <select
            value={selected[idx] ?? -1}
            onChange={e => handleChange(idx, parseInt(e.target.value))}
            className="flex-1 min-w-[200px] px-4 py-2.5 bg-white border rounded-xl text-sm text-black focus:outline-none focus:ring-1 focus:ring-[#d3579a] transition-all cursor-pointer font-medium"
            style={{ borderColor: C.surfaceVariant }}
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
