'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import type { Recommendations } from '@/lib/quiz/types';

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

interface QuizRecommendationsProps {
  userId: string;
}

export default function QuizRecommendations({ userId }: QuizRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/quiz/recommendations');
      const data = await res.json();
      setRecommendations(data.recommendations || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center p-8 rounded-2xl border bg-white"
        style={{ borderColor: C.surfaceVariant }}
      >
        <Loader2 className="h-5 w-5 text-[#d3579a] animate-spin mr-2" />
        <span className="text-xs text-zinc-500 font-semibold">Generating coaching recommendations...</span>
      </div>
    );
  }

  if (!recommendations) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="p-6 sm:p-8 rounded-[2rem] border bg-white shadow-sm space-y-6 font-sans"
      style={{ borderColor: C.surfaceVariant }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-50 border flex items-center justify-center shadow-inner">
            <Sparkles className="h-4.5 w-4.5 text-[#d3579a]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">AI Coaching Recommendations</h3>
            <p className="text-[10px] text-zinc-500">Personalised insights generated from your performance</p>
          </div>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={refreshing}
          className="p-2 hover:bg-zinc-100 text-zinc-500 hover:text-black rounded-xl border border-zinc-200 transition-all bg-white disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Next Steps Coach Text */}
      <div 
        className="p-4 border rounded-2xl"
        style={{ backgroundColor: `${C.accentPink}08`, borderColor: `${C.accentPink}30` }}
      >
        <p className="text-xs text-zinc-800 leading-relaxed font-semibold">
          <span className="font-extrabold text-black mr-1" style={{ color: C.accentPurple }}>Coach Insight:</span>
          {recommendations.nextSteps}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Topics to Revise */}
        <div className="space-y-3">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#76777d] flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-[#ea580c]" /> Topics to Revise
          </h4>
          <div className="space-y-2">
            {recommendations.topicsToRevise.length === 0 ? (
              <p className="text-xs text-zinc-650 italic">No topics marked for revision yet. Keep it up!</p>
            ) : (
              recommendations.topicsToRevise.map((topic, i) => (
                <div key={i} className="p-3.5 rounded-xl border bg-[#fcfaf5] border-zinc-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-black">{topic.topicName}</span>
                    <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-100 text-orange-750 text-[9px] font-bold">
                      {topic.accuracy}% accuracy
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-650 font-semibold leading-normal">{topic.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resources & suggested actions */}
        <div className="space-y-3">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#76777d] flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-[#5a6ba8]" /> Recommended Resources
          </h4>
          <div className="space-y-2">
            {recommendations.learningResources.length === 0 ? (
              <p className="text-xs text-zinc-650 italic">No resources to display. Take more quizzes to generate them!</p>
            ) : (
              recommendations.learningResources.map((res, i) => (
                <div key={i} className="p-3.5 rounded-xl border bg-[#fcfaf5] border-zinc-200 space-y-1.5">
                  <span className="text-xs font-semibold block" style={{ color: C.accentPurple }}>{res.topic}</span>
                  <ul className="space-y-1">
                    {res.resources.map((item, j) => (
                      <li key={j} className="text-[10px] text-zinc-700 font-medium flex items-start gap-1.5">
                        <ArrowRight className="h-3 w-3 text-zinc-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
