'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History, Clock, Target, ChevronDown, ChevronUp,
  Loader2, Filter
} from 'lucide-react';
import type { QuizAttempt, Difficulty } from '@/lib/quiz/types';
import QuizResults from './QuizResults';

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

interface QuizHistoryProps {
  userId: string;
}

export default function QuizHistory({ userId }: QuizHistoryProps) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Filters
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    fetch('/api/quiz/attempts')
      .then(r => r.json())
      .then(data => {
        setAttempts(data.attempts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExpand = async (attemptId: string) => {
    if (expandedAttemptId === attemptId) {
      setExpandedAttemptId(null);
      setExpandedData(null);
      return;
    }

    setExpandedAttemptId(attemptId);
    setLoadingDetails(true);

    try {
      const res = await fetch(`/api/quiz/attempts?attemptId=${attemptId}`);
      const data = await res.json();
      setExpandedData(data);
    } catch {
      setExpandedData(null);
    }
    setLoadingDetails(false);
  };

  const filtered = attempts
    .filter(a => filterDifficulty === 'all' || a.difficulty === filterDifficulty)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    'A+': { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    'A':  { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    'B':  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    'C':  { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    'F':  { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#d3579a] animate-spin" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div 
        className="border border-dashed p-12 rounded-3xl text-center space-y-4 bg-white"
        style={{ borderColor: C.surfaceVariant }}
      >
        <div 
          className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto text-[#d3579a] border"
          style={{ backgroundColor: `${C.accentPurple}10`, borderColor: `${C.accentPurple}30` }}
        >
          <History className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-black font-extrabold text-sm">No Quiz History Yet</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Complete your first quiz to see your history here. Head to the Start Quiz tab to begin!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans" style={{ color: C.onSurface }}>
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
          <Filter className="h-3.5 w-3.5" /> Filters:
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilterDifficulty(d)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
              style={
                filterDifficulty === d
                  ? { backgroundColor: `${C.accentPurple}15`, borderColor: C.accentPurple, color: C.accentPurple }
                  : { backgroundColor: '#ffffff', borderColor: C.surfaceVariant, color: C.onSurfaceVariant }
              }
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all sm:ml-auto bg-white"
          style={{ borderColor: C.surfaceVariant, color: C.onSurfaceVariant }}
        >
          {sortOrder === 'newest' ? '↓ Newest First' : '↑ Oldest First'}
        </button>
      </div>

      {/* Attempts List */}
      <div className="space-y-3">
        {filtered.map((attempt, idx) => (
          <motion.div
            key={attempt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="rounded-2xl border bg-white overflow-hidden"
            style={{ borderColor: C.surfaceVariant }}
          >
            <button
              onClick={() => handleExpand(attempt.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-zinc-50 transition-colors"
            >
              {/* Grade Badge */}
              {(() => {
                const colors = gradeColors[attempt.grade] || { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7' };
                return (
                  <span 
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-extrabold border shrink-0"
                    style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                  >
                    {attempt.grade}
                  </span>
                );
              })()}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-black truncate max-w-[260px] md:max-w-md">{attempt.subjectName} — {attempt.topicName}</h4>
                  <span 
                    className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border"
                    style={
                      attempt.difficulty === 'easy' ? { color: '#047857', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' } :
                      attempt.difficulty === 'medium' ? { color: '#d97706', backgroundColor: '#fffbeb', borderColor: '#fde68a' } :
                      { color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fca5a5' }
                    }
                  >
                    {attempt.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-zinc-550 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(attempt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    {attempt.totalQuestions} questions
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <div className="text-base font-extrabold text-black">{attempt.percentage}%</div>
                <div className="text-[10px] text-zinc-500 font-mono font-bold mt-0.5">{attempt.score}/{attempt.maxScore}</div>
              </div>

              {expandedAttemptId === attempt.id ? (
                <ChevronUp className="h-5 w-5 text-zinc-400 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-zinc-400 shrink-0" />
              )}
            </button>

            {/* Expanded Detail */}
            {expandedAttemptId === attempt.id && (
              <div 
                className="border-t p-5 bg-[#fcfaf5]"
                style={{ borderColor: C.surfaceVariant }}
              >
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-[#d3579a] animate-spin" />
                  </div>
                ) : expandedData ? (
                  <QuizResults
                    data={{
                      attempt: expandedData.attempt,
                      answers: expandedData.answers,
                      result: {
                        score: expandedData.attempt.score,
                        maxScore: expandedData.attempt.maxScore,
                        percentage: expandedData.attempt.percentage,
                        grade: expandedData.attempt.grade,
                        accuracy: expandedData.attempt.accuracy,
                        totalQuestions: expandedData.attempt.totalQuestions,
                        attempted: expandedData.answers.filter((a: any) => !a.isSkipped).length,
                        correct: expandedData.answers.filter((a: any) => a.isCorrect).length,
                        wrong: expandedData.answers.filter((a: any) => !a.isCorrect && !a.isSkipped).length,
                        unanswered: expandedData.answers.filter((a: any) => a.isSkipped).length,
                      },
                      questions: expandedData.questions,
                    }}
                    onBack={() => {
                      setExpandedAttemptId(null);
                      setExpandedData(null);
                    }}
                  />
                ) : (
                  <p className="text-xs font-semibold text-zinc-500 text-center">Failed to load details.</p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-500 font-semibold pt-1">
        Showing {filtered.length} of {attempts.length} attempts
      </p>
    </div>
  );
}
