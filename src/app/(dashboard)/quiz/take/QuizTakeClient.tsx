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
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
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
    'not-visited': 'bg-white border-black text-black',
    'answered': 'bg-[#000000] border-[#000000] text-white',
    'not-answered': 'bg-[#ffafd3] text-black border-black',
    'marked': 'bg-[#ffe24c] text-black border-black',
    'answered-marked': 'bg-[#86efac] text-black border-black',
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
      
      try {
        const topic = data.attempt?.topicName || config?.topicId || 'General Quiz';
        const score = data.result?.percentage ? data.result.percentage / 20 : 0;
        const { recordMission } = require('@/lib/os/memory-manager');
        recordMission(`Quiz Complete: ${topic}`, topic, score);
      } catch (e) {
        console.error('Failed to record quiz mission:', e);
      }

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
      <div className="flex items-center justify-center h-full py-28 font-display uppercase tracking-wide text-2xl text-black">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 text-black animate-spin mx-auto" />
          <p>INITIALIZING TERMINAL...</p>
        </div>
      </div>
    );
  }

  if (phase === 'results' && resultData) {
    return <QuizResults data={resultData} onBack={() => router.push('/quiz')} />;
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative font-display uppercase tracking-wider text-black">
      {/* Main Quiz Area */}
      <div className="flex-1 space-y-8">
        
        {/* TOP BAR: Brutalist Progress + Timer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          <div className="flex-1 border-4 border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm md:text-xl">
                Q {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-sm md:text-xl text-[#d3579a]">
                {answeredCount} DONE
              </span>
            </div>
            <div className="w-full h-4 bg-zinc-200 border-2 border-black overflow-hidden">
              <motion.div
                className="h-full bg-[#d3579a] border-r-2 border-black"
                initial={{ width: 0 }}
                animate={{ width: `${((answeredCount) / questions.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          {config?.timerEnabled && (
            <div
              className={`flex items-center justify-center gap-3 px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-2xl sm:text-4xl ${
                timeRemaining <= 60
                  ? 'bg-[#ffafd3] text-black animate-pulse'
                  : 'bg-[#ffe24c] text-black'
              }`}
            >
              <Clock className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={3} />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion?.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-10 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8"
          >
            {/* Question Type Badge */}
            <div className="flex items-center justify-between border-b-4 border-black pb-4">
              <span className="px-4 py-2 text-sm sm:text-xl bg-[#bec6e0] border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {currentQuestion?.type.replace('-', ' ')}
              </span>
              <span className="text-lg sm:text-2xl">
                {currentQuestion?.marks} PTS
                {currentQuestion?.negativeMarks > 0 && ` (-${currentQuestion.negativeMarks} PENALTY)`}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-2xl sm:text-4xl md:text-5xl leading-[1.1] whitespace-pre-wrap">
              {currentQuestion?.question}
            </h3>

            {/* Answer Input */}
            <div className="pt-6">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 border-4 border-black bg-white text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={3} /> PREV
          </button>

          <div className="flex items-center gap-4 flex-1 justify-center">
            <button
              onClick={toggleBookmark}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 border-4 border-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all ${
                bookmarks.has(currentQuestion?.id || '') ? 'bg-[#ffe24c]' : 'bg-white'
              }`}
            >
              {bookmarks.has(currentQuestion?.id || '') ? (
                <BookmarkCheck className="h-6 w-6" strokeWidth={3} />
              ) : (
                <Bookmark className="h-6 w-6" strokeWidth={3} />
              )}
              <span className="hidden sm:inline">
                {bookmarks.has(currentQuestion?.id || '') ? 'BOOKMARKED' : 'BOOKMARK'}
              </span>
            </button>

            <button
              onClick={skip}
              disabled={currentIndex === questions.length - 1}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 border-4 border-black bg-[#bec6e0] text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <SkipForward className="h-6 w-6" strokeWidth={3} /> SKIP
            </button>
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={goNext}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 border-4 border-black bg-[#86efac] text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all"
            >
              NEXT <ChevronRight className="h-6 w-6" strokeWidth={3} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 border-4 border-black bg-[#d3579a] text-white text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all"
            >
              <Send className="h-6 w-6" strokeWidth={3} /> SUBMIT
            </button>
          )}
        </div>
      </div>

      {/* Question Palette Sidebar */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-6 space-y-6">
          <h4 className="text-2xl border-b-4 border-black pb-4 text-center">MATRIX</h4>
          
          <div className="grid grid-cols-5 gap-3">
            {questions.map((q, idx) => {
              const status = getPaletteStatus(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(idx)}
                  className={`h-12 w-full text-xl flex items-center justify-center border-4 border-black transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${paletteColors[status]} ${
                    idx === currentIndex ? 'ring-4 ring-black ring-offset-2' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-6 border-t-4 border-black">
            <LegendItem color="bg-white border-black" label="UNVISITED" />
            <LegendItem color="bg-black text-white" label="ANSWERED" />
            <LegendItem color="bg-[#ffafd3] border-black" label="SKIPPED" />
            <LegendItem color="bg-[#ffe24c] border-black" label="REVIEW" />
            <LegendItem color="bg-[#86efac] border-black" label="DONE + REVIEW" />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-4 mt-4 border-4 border-black text-2xl text-white bg-black hover:bg-[#d3579a] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            END SIMULATION
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-display uppercase tracking-wider"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="p-8 border-8 border-black bg-white max-w-xl w-full shadow-[16px_16px_0px_0px_rgba(255,226,76,1)] space-y-8"
            >
              <div className="flex items-center gap-4 border-b-4 border-black pb-6">
                <AlertTriangle className="h-12 w-12 text-black" strokeWidth={3} />
                <h3 className="text-4xl md:text-5xl text-black">SUBMIT QUIZ?</h3>
              </div>

              <div className="space-y-4 text-2xl text-black">
                <div className="flex justify-between border-b-4 border-black pb-4">
                  <span>ANSWERED</span>
                  <span className="text-[#86efac] px-3 py-1 bg-black">{answeredCount}</span>
                </div>
                <div className="flex justify-between border-b-4 border-black pb-4">
                  <span>UNANSWERED</span>
                  <span className="text-[#ffafd3] px-3 py-1 bg-black">{unansweredCount}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span>BOOKMARKED</span>
                  <span className="text-[#ffe24c] px-3 py-1 bg-black">{bookmarkedCount}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-4 border-black">
                <button
                  onClick={() => setPhase('active')}
                  className="flex-1 py-4 border-4 border-black bg-white text-2xl text-black hover:bg-zinc-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-4 border-4 border-black bg-[#d3579a] text-white text-2xl hover:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                >
                  CONFIRM EXECUTION
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 font-display uppercase tracking-widest text-white"
          >
            <div className="text-center space-y-8">
              <Loader2 className="h-24 w-24 text-[#ffe24c] animate-spin mx-auto" strokeWidth={3} />
              <p className="text-4xl sm:text-6xl text-[#ffe24c]">CALCULATING SCORE...</p>
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
    <div className="flex items-center gap-4">
      <div className={`h-6 w-6 border-4 ${color}`} />
      <span className="text-lg text-black">{label}</span>
    </div>
  );
}

function MCQInput({ options, selected, onSelect }: { options: string[]; selected: number | undefined; onSelect: (v: number) => void }) {
  return (
    <div className="space-y-4 text-black">
      {options.map((opt, idx) => {
        const isSelected = selected === idx;
        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`w-full text-left px-6 py-5 border-4 border-black transition-all flex items-center gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              isSelected ? 'bg-[#ffe24c]' : 'bg-white hover:bg-zinc-100'
            }`}
          >
            <span 
              className={`flex items-center justify-center h-10 w-10 shrink-0 border-4 border-black text-xl ${
                isSelected ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-xl sm:text-2xl leading-[1.2] pt-1">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseInput({ selected, onSelect }: { selected: boolean | undefined; onSelect: (v: boolean) => void }) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 text-black">
      {[true, false].map(val => {
        const isSelected = selected === val;
        return (
          <button
            key={String(val)}
            onClick={() => onSelect(val)}
            className={`flex-1 py-8 border-4 border-black text-3xl sm:text-4xl transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
              isSelected
                ? val
                  ? 'bg-[#86efac]'
                  : 'bg-[#ffafd3]'
                : 'bg-white hover:bg-zinc-100'
            }`}
          >
            {val ? 'TRUE' : 'FALSE'}
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
      placeholder="ENTER VALUE..."
      className="w-full px-6 py-6 bg-white border-4 border-black text-2xl sm:text-4xl placeholder-zinc-300 focus:outline-none focus:ring-4 focus:ring-[#ffe24c] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
    />
  );
}

function OneWordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="ENTER SINGLE WORD..."
      className="w-full px-6 py-6 bg-white border-4 border-black text-2xl sm:text-4xl placeholder-zinc-300 focus:outline-none focus:ring-4 focus:ring-[#d3579a] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
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
    <div className="space-y-6 text-black">
      {leftItems.map((left, idx) => (
        <div key={idx} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <span className="flex-1 px-6 py-4 border-4 border-black bg-[#bec6e0] text-xl sm:text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {left}
          </span>
          <span className="hidden lg:block text-4xl">→</span>
          <select
            value={selected[idx] ?? -1}
            onChange={e => handleChange(idx, parseInt(e.target.value))}
            className="flex-1 px-6 py-4 bg-white border-4 border-black text-xl sm:text-2xl focus:outline-none focus:ring-4 focus:ring-[#86efac] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer appearance-none text-black"
          >
            <option value={-1}>— ASSIGN MATCH —</option>
            {rightItems.map((right, rIdx) => (
              <option key={rIdx} value={rIdx}>{right}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
