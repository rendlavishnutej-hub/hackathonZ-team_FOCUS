'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, CheckCircle2, XCircle, MinusCircle,
  Clock, ArrowLeft, ChevronDown, ChevronUp, Bookmark
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
  'A+': '#86efac',
  'A': '#86efac',
  'B': '#bec6e0',
  'C': '#ffe24c',
  'F': '#ffafd3',
};

type ReviewFilter = 'all' | 'correct' | 'wrong' | 'unanswered' | 'bookmarked';

export default function QuizResults({ data, onBack }: QuizResultsProps) {
  const { attempt, answers, result, questions } = data;
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const gradeColor = gradeColors[result.grade] || '#ffe24c';

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
    { id: 'all', label: 'ALL', count: answers.length },
    { id: 'correct', label: 'CORRECT', count: result.correct },
    { id: 'wrong', label: 'WRONG', count: result.wrong },
    { id: 'unanswered', label: 'UNANSWERED', count: result.unanswered },
    { id: 'bookmarked', label: 'BOOKMARKS', count: answers.filter((a: any) => a.isBookmarked).length },
  ];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-display uppercase tracking-wider text-black">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-2xl hover:-translate-x-2 transition-transform bg-white border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-fit"
      >
        <ArrowLeft className="h-6 w-6" strokeWidth={3} /> RETURN TO HUB
      </button>

      {/* Header with Grade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 sm:p-12 border-8 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Grade Display */}
          <div 
            className="flex flex-col items-center justify-center p-8 border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-w-[240px] rotate-[-2deg]"
            style={{ backgroundColor: gradeColor }}
          >
            <span className="text-8xl sm:text-9xl leading-none text-black drop-shadow-[4px_4px_0px_rgba(255,255,255,1)]">
              {result.percentage}%
            </span>
            <span className="text-3xl bg-black text-white px-4 py-1 mt-4">
              GRADE {result.grade}
            </span>
          </div>

          {/* Score Summary */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h2 className="text-5xl sm:text-6xl md:text-7xl leading-none">
              {result.percentage >= 85 ? 'MISSION ACCOMPLISHED!' : result.percentage >= 55 ? 'SOLID EFFORT!' : 'MISSION FAILED!'}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
              <span className="px-4 py-2 border-4 border-black bg-white text-xl sm:text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                SCORE: {result.score}/{result.maxScore}
              </span>
              <span className="px-4 py-2 border-4 border-black bg-[#bec6e0] text-xl sm:text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                ACCURACY: {result.accuracy}%
              </span>
              {attempt.timeTakenSeconds > 0 && (
                <span className="px-4 py-2 border-4 border-black bg-[#ffafd3] text-xl sm:text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                  <Clock className="h-6 w-6" strokeWidth={3} />
                  {formatTime(attempt.timeTakenSeconds)}
                </span>
              )}
            </div>
            <p className="text-xl sm:text-2xl bg-zinc-200 inline-block px-4 py-2 border-4 border-black">
              {attempt.subjectName} // {attempt.topicName} // {attempt.difficulty}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'TOTAL', value: result.totalQuestions, icon: Target, bg: 'bg-white' },
          { label: 'ATTEMPTED', value: result.attempted, icon: CheckCircle2, bg: 'bg-[#d3579a]', text: 'text-white' },
          { label: 'CORRECT', value: result.correct, icon: CheckCircle2, bg: 'bg-[#86efac]' },
          { label: 'WRONG', value: result.wrong, icon: XCircle, bg: 'bg-[#ffafd3]' },
          { label: 'SKIPPED', value: result.unanswered, icon: MinusCircle, bg: 'bg-[#ffe24c]' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={`p-6 border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform ${stat.bg} ${stat.text || 'text-black'}`}
            >
              <Icon className="h-8 w-8 mx-auto mb-2" strokeWidth={3} />
              <div className="text-5xl leading-none pt-2 pb-1">{stat.value}</div>
              <div className="text-lg">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Question Review */}
      <div className="space-y-6 pt-8">
        <h3 className="text-4xl sm:text-5xl border-b-8 border-black pb-4">AFTER-ACTION REPORT</h3>

        {/* Filter Tabs */}
        <div className="flex gap-4 flex-wrap pb-4">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-6 py-3 text-xl transition-all border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                filter === f.id
                  ? 'bg-black text-white'
                  : 'bg-white text-black'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Answer Cards */}
        <div className="space-y-4">
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
                className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ans.questionId)}
                  className="w-full flex items-center gap-4 p-4 sm:p-6 text-left hover:bg-zinc-100 transition-colors"
                >
                  <span className={`h-12 w-12 flex items-center justify-center text-3xl border-4 border-black shrink-0 ${
                    ans.isCorrect
                      ? 'bg-[#86efac] text-black'
                      : ans.isSkipped
                        ? 'bg-zinc-300 text-black'
                        : 'bg-[#ffafd3] text-black'
                  }`}>
                    {ans.isCorrect ? '✓' : ans.isSkipped ? '—' : '✗'}
                  </span>
                  <span className="flex-1 text-2xl sm:text-3xl leading-tight line-clamp-2 pt-1">{q.question}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {ans.isBookmarked && <Bookmark className="h-8 w-8 text-[#ffe24c] fill-[#ffe24c] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />}
                    <span className="text-lg px-3 py-1 border-4 border-black bg-[#bec6e0] hidden sm:block">
                      {q.type.replace('-', ' ')}
                    </span>
                    {isExpanded ? <ChevronUp className="h-8 w-8" strokeWidth={3} /> : <ChevronDown className="h-8 w-8" strokeWidth={3} />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-4 sm:px-6 pb-6 space-y-6 border-t-4 border-black pt-6 bg-[#f8f3ec]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border-4 border-black bg-white">
                        <span className="text-xl block mb-2 underline decoration-4 underline-offset-4 decoration-[#ffafd3]">YOUR ANSWER</span>
                        <p className={`text-3xl leading-tight pt-2 ${ans.isCorrect ? 'text-[#000000]' : ans.isSkipped ? 'text-zinc-500' : 'text-[#d3579a]'}`}>
                          {ans.isSkipped ? 'SKIPPED' : formatAnswer(q, ans.studentAnswer)}
                        </p>
                      </div>
                      <div className="p-6 border-4 border-black bg-[#86efac]">
                        <span className="text-xl block mb-2 underline decoration-4 underline-offset-4 decoration-white">CORRECT ANSWER</span>
                        <p className="text-3xl leading-tight pt-2">{formatCorrectAnswer(q)}</p>
                      </div>
                    </div>
                    
                    {q.explanation && (
                      <div className="p-6 border-4 border-black bg-black text-white">
                        <span className="text-xl block mb-2 text-[#ffe24c]">EXPLANATION</span>
                        <p className="text-2xl leading-relaxed whitespace-pre-wrap font-sans normal-case tracking-normal">
                          {q.explanation}
                        </p>
                      </div>
                    )}
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
  if (answer === null || answer === undefined) return 'NO ANSWER';
  switch (q.type) {
    case 'mcq':
      return (q.payload as any).options?.[answer] || String(answer);
    case 'true-false':
      return answer ? 'TRUE' : 'FALSE';
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
      return ca.correct ? 'TRUE' : 'FALSE';
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
