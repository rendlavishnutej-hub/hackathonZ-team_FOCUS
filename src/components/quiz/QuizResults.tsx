'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Target, CheckCircle2, XCircle, MinusCircle,
  Clock, ArrowLeft, ChevronDown, ChevronUp, Bookmark, Filter
} from 'lucide-react';
import type { Question } from '@/lib/quiz/types';

interface QuizResultsProps {
  data: {
    attempt: any;
    answers: any[];
    result: {
      score: number;
      maxScore: number;
      percentage: number;
      grade: string;
      accuracy: number;
      totalQuestions: number;
      attempted: number;
      correct: number;
      wrong: number;
      unanswered: number;
    };
    questions: Question[];
  };
  onBack: () => void;
}

const gradeColors: Record<string, string> = {
  'A+': '#3DD68C',
  'A': '#3DD68C',
  'B': '#22D3D0',
  'C': '#F5B942',
  'F': '#F1583D',
};

type ReviewFilter = 'all' | 'correct' | 'wrong' | 'unanswered' | 'bookmarked';

export default function QuizResults({ data, onBack }: QuizResultsProps) {
  const { attempt, answers, result, questions } = data;
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const gradeColor = gradeColors[result.grade] || '#7C5CFF';

  // Build a map for quick lookups
  const answerMap = new Map(answers.map((a: any) => [a.questionId, a]));
  const questionMap = new Map(questions.map(q => [q.id, q]));

  const filteredAnswers = answers.filter((a: any) => {
    if (filter === 'all') return true;
    if (filter === 'correct') return a.isCorrect;
    if (filter === 'wrong') return !a.isCorrect && !a.isSkipped;
    if (filter === 'unanswered') return a.isSkipped;
    if (filter === 'bookmarked') return a.isBookmarked;
    return true;
  });

  const filters: { id: ReviewFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: answers.length },
    { id: 'correct', label: 'Correct', count: result.correct },
    { id: 'wrong', label: 'Wrong', count: result.wrong },
    { id: 'unanswered', label: 'Unanswered', count: result.unanswered },
    { id: 'bookmarked', label: 'Bookmarked', count: answers.filter((a: any) => a.isBookmarked).length },
  ];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Quiz Hub
      </button>

      {/* Header with Grade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#13131A]/60 shadow-xl shadow-[#7C5CFF]/5"
      >
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Grade Circle */}
          <div className="relative">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke={gradeColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - result.percentage / 100) }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display" style={{ color: gradeColor }}>{result.grade}</span>
              <span className="text-xs text-zinc-500 font-bold">{result.percentage}%</span>
            </div>
          </div>

          {/* Score Summary */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <h2 className="font-display text-3xl tracking-wide uppercase text-white">
              {result.percentage >= 85 ? 'Excellent!' : result.percentage >= 55 ? 'Good Effort!' : 'Keep Practicing!'}
            </h2>
            <p className="text-sm text-zinc-400">
              {attempt.subjectName} · {attempt.topicName} · {attempt.difficulty.charAt(0).toUpperCase() + attempt.difficulty.slice(1)}
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-white">
                Score: {result.score}/{result.maxScore}
              </span>
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-[#22D3D0]">
                Accuracy: {result.accuracy}%
              </span>
              {attempt.timeTakenSeconds > 0 && (
                <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatTime(attempt.timeTakenSeconds)}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: result.totalQuestions, icon: Target, color: '#9C9CA8' },
          { label: 'Attempted', value: result.attempted, icon: CheckCircle2, color: '#7C5CFF' },
          { label: 'Correct', value: result.correct, icon: CheckCircle2, color: '#3DD68C' },
          { label: 'Wrong', value: result.wrong, icon: XCircle, color: '#F1583D' },
          { label: 'Unanswered', value: result.unanswered, icon: MinusCircle, color: '#F5B942' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="glass-panel p-4 rounded-xl border border-white/5 bg-[#13131A]/60 text-center"
            >
              <Icon className="h-5 w-5 mx-auto mb-1" style={{ color: stat.color }} />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Question Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl tracking-wide uppercase text-white">Question Review</h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]'
                  : 'bg-zinc-900/40 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Answer Cards */}
        <div className="space-y-2">
          {filteredAnswers.map((ans: any, idx: number) => {
            const q = questionMap.get(ans.questionId);
            if (!q) return null;
            const isExpanded = expandedId === ans.questionId;

            return (
              <motion.div
                key={ans.questionId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-panel rounded-xl border border-white/5 bg-[#13131A]/40 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ans.questionId)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    ans.isCorrect
                      ? 'bg-[#3DD68C]/15 text-[#3DD68C]'
                      : ans.isSkipped
                        ? 'bg-zinc-800 text-zinc-500'
                        : 'bg-[#F1583D]/15 text-[#F1583D]'
                  }`}>
                    {ans.isCorrect ? '✓' : ans.isSkipped ? '—' : '✗'}
                  </span>
                  <span className="flex-1 text-sm text-zinc-300 line-clamp-1">{q.question}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {ans.isBookmarked && <Bookmark className="h-3.5 w-3.5 text-[#F5B942]" />}
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">
                      {q.type.replace('-', ' ')}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-4 pb-4 space-y-3 border-t border-zinc-800/50 pt-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">Your Answer</span>
                        <p className={`font-medium ${ans.isCorrect ? 'text-[#3DD68C]' : ans.isSkipped ? 'text-zinc-600 italic' : 'text-[#F1583D]'}`}>
                          {ans.isSkipped ? 'Skipped' : formatAnswer(q, ans.studentAnswer)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">Correct Answer</span>
                        <p className="text-[#3DD68C] font-medium">{formatCorrectAnswer(q)}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/50">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 block mb-1">Explanation</span>
                      <p className="text-xs text-zinc-400 leading-relaxed">{q.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatAnswer(q: Question, answer: any): string {
  if (answer === null || answer === undefined) return 'No answer';
  switch (q.type) {
    case 'mcq':
      return (q.payload as any).options?.[answer] || String(answer);
    case 'true-false':
      return answer ? 'True' : 'False';
    case 'fill-blank':
    case 'one-word':
      return String(answer);
    case 'match':
      if (Array.isArray(answer)) {
        const rightItems = (q.payload as any).rightItems;
        return answer.map((ri: number, i: number) => `${(q.payload as any).leftItems[i]} → ${rightItems[ri] || '?'}`).join(', ');
      }
      return String(answer);
    default:
      return String(answer);
  }
}

function formatCorrectAnswer(q: Question): string {
  const ca = q.correctAnswer as any;
  switch (q.type) {
    case 'mcq':
      return (q.payload as any).options?.[ca.correct] || String(ca.correct);
    case 'true-false':
      return ca.correct ? 'True' : 'False';
    case 'fill-blank':
      return (ca.answers || []).join(', ');
    case 'one-word':
      return ca.correct;
    case 'match': {
      const leftItems = (q.payload as any).leftItems;
      const rightItems = (q.payload as any).rightItems;
      return ca.mapping.map((ri: number, i: number) => `${leftItems[i]} → ${rightItems[ri]}`).join(', ');
    }
    default:
      return JSON.stringify(ca);
  }
}
