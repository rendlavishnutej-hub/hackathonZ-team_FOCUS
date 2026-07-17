'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History, Clock, Trophy, Target, ChevronDown, ChevronUp,
  Loader2, BookOpen, Filter
} from 'lucide-react';
import type { QuizAttempt, Difficulty } from '@/lib/quiz/types';
import QuizResults from './QuizResults';

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

  const gradeColors: Record<string, string> = {
    'A+': 'text-[#3DD68C] bg-[#3DD68C]/10 border-[#3DD68C]/20',
    'A': 'text-[#3DD68C] bg-[#3DD68C]/10 border-[#3DD68C]/20',
    'B': 'text-[#22D3D0] bg-[#22D3D0]/10 border-[#22D3D0]/20',
    'C': 'text-[#F5B942] bg-[#F5B942]/10 border-[#F5B942]/20',
    'F': 'text-[#F1583D] bg-[#F1583D]/10 border-[#F1583D]/20',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#7C5CFF] animate-spin" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 p-12 rounded-3xl text-center space-y-4 bg-zinc-950/20">
        <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-[#22D3D0]">
          <History className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-white font-bold text-sm">No Quiz History Yet</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Complete your first quiz to see your history here. Head to the Start Quiz tab to begin!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
          <Filter className="h-3 w-3" /> Filters:
        </div>
        <div className="flex gap-1.5">
          {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilterDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterDifficulty === d
                  ? 'bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]'
                  : 'bg-zinc-900/40 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900/40 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all ml-auto"
        >
          {sortOrder === 'newest' ? '↓ Newest First' : '↑ Oldest First'}
        </button>
      </div>

      {/* Attempts List */}
      <div className="space-y-2">
        {filtered.map((attempt, idx) => (
          <motion.div
            key={attempt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="glass-panel rounded-2xl border border-white/5 bg-[#13131A]/40 overflow-hidden"
          >
            <button
              onClick={() => handleExpand(attempt.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
            >
              {/* Grade Badge */}
              <span className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-display border shrink-0 ${gradeColors[attempt.grade] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                {attempt.grade}
              </span>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{attempt.subjectName} — {attempt.topicName}</h4>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${
                    attempt.difficulty === 'easy' ? 'text-[#3DD68C] bg-[#3DD68C]/10 border-[#3DD68C]/20' :
                    attempt.difficulty === 'medium' ? 'text-[#F5B942] bg-[#F5B942]/10 border-[#F5B942]/20' :
                    'text-[#F1583D] bg-[#F1583D]/10 border-[#F1583D]/20'
                  }`}>
                    {attempt.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(attempt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {attempt.totalQuestions} questions
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-white">{attempt.percentage}%</div>
                <div className="text-[10px] text-zinc-500 font-mono">{attempt.score}/{attempt.maxScore}</div>
              </div>

              {expandedAttemptId === attempt.id ? (
                <ChevronUp className="h-5 w-5 text-zinc-500 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-zinc-500 shrink-0" />
              )}
            </button>

            {/* Expanded Detail */}
            {expandedAttemptId === attempt.id && (
              <div className="border-t border-zinc-800/50 p-5">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-[#7C5CFF] animate-spin" />
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
                  <p className="text-sm text-zinc-500 text-center">Failed to load details.</p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-600">
        Showing {filtered.length} of {attempts.length} attempts
      </p>
    </div>
  );
}
