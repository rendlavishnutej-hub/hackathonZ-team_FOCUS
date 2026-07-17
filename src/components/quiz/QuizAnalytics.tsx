'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Target, Flame, Loader2, AlertTriangle,
  Award, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell
} from 'recharts';
import type { AnalyticsData, AccuracyEntry } from '@/lib/quiz/types';
import QuizRecommendations from './QuizRecommendations';

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

interface QuizAnalyticsProps {
  userId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-zinc-550 font-bold mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-extrabold" style={{ color: p.color }}>
          {p.name}: {p.value}{p.name === 'Accuracy' || p.name === 'Percentage' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

export default function QuizAnalytics({ userId }: QuizAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quiz/analytics')
      .then(r => r.json())
      .then(data => {
        setAnalytics(data.analytics || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#d3579a] animate-spin" />
      </div>
    );
  }

  if (!analytics || analytics.totalAttempts === 0) {
    return (
      <div className="space-y-8">
        <div 
          className="border border-dashed p-12 rounded-3xl text-center space-y-4 bg-white"
          style={{ borderColor: C.surfaceVariant }}
        >
          <div 
            className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto text-[#d3579a] border"
            style={{ backgroundColor: `${C.accentPurple}10`, borderColor: `${C.accentPurple}30` }}
          >
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-black font-extrabold text-sm">No Analytics Data Yet</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Complete at least one quiz to see your performance analytics here.
            </p>
          </div>
        </div>
        <QuizRecommendations userId={userId} />
      </div>
    );
  }

  // Soft palette color array for charts
  const barColors = ['#d3579a', '#5a6ba8', '#047857', '#d97706', '#ea580c', '#ffe24c'];

  return (
    <div className="space-y-8 font-sans" style={{ color: C.onSurface }}>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Award}
          label="Avg Score"
          value={`${analytics.averagePercentage}%`}
          color="#d3579a"
          delay={0}
        />
        <StatCard
          icon={Target}
          label="Total Quizzes"
          value={String(analytics.totalAttempts)}
          color="#5a6ba8"
          delay={0.1}
        />
        <StatCard
          icon={Flame}
          label="Quiz Streak"
          value={`${analytics.quizStreak} day${analytics.quizStreak !== 1 ? 's' : ''}`}
          color="#d97706"
          delay={0.2}
        />
        <StatCard
          icon={Zap}
          label="Avg Response"
          value={`${analytics.averageResponseTime}s`}
          color="#047857"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subject Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border bg-white shadow-sm"
          style={{ borderColor: C.surfaceVariant }}
        >
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-[#d3579a]" />
            Subject-wise Accuracy
          </h4>
          {analytics.subjectAccuracy.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.subjectAccuracy} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="Accuracy" radius={[0, 6, 6, 0]} barSize={20}>
                  {analytics.subjectAccuracy.map((_, idx) => (
                    <Cell key={idx} fill={barColors[idx % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-zinc-500 font-semibold text-center py-8">No data yet</p>
          )}
        </motion.div>

        {/* Topic Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border bg-white shadow-sm"
          style={{ borderColor: C.surfaceVariant }}
        >
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#76777d] mb-4 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-[#5a6ba8]" />
            Topic-wise Accuracy
          </h4>
          {analytics.topicAccuracy.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.topicAccuracy} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="Accuracy" radius={[0, 6, 6, 0]} barSize={16}>
                  {analytics.topicAccuracy.map((_, idx) => (
                    <Cell key={idx} fill={barColors[idx % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-zinc-500 font-semibold text-center py-8">No data yet</p>
          )}
        </motion.div>
      </div>

      {/* Improvement Trend */}
      {analytics.improvementTrend.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl border bg-white shadow-sm"
          style={{ borderColor: C.surfaceVariant }}
        >
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Improvement Trend
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.improvementTrend} margin={{ left: 0, right: 20, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e2db" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="percentage"
                name="Percentage"
                stroke="#d3579a"
                strokeWidth={2.5}
                dot={{ fill: '#d3579a', r: 4, strokeWidth: 0 }}
                activeDot={{ fill: '#5a6ba8', r: 6, strokeWidth: 2, stroke: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Weak / Strong Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AreaList
          title="Weak Areas"
          icon={AlertTriangle}
          iconColor="#dc2626"
          areas={analytics.weakAreas}
          emptyText="No weak areas — you're doing great!"
          badgeColor="text-red-750 bg-red-50 border border-red-100"
          delay={0.5}
        />
        <AreaList
          title="Strong Areas"
          icon={Award}
          iconColor="#047857"
          areas={analytics.strongAreas}
          emptyText="Complete more quizzes to identify strong areas."
          badgeColor="text-emerald-750 bg-emerald-50 border border-emerald-100"
          delay={0.6}
        />
      </div>

      {/* Recommendations */}
      <QuizRecommendations userId={userId} />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, delay }: {
  icon: any; label: string; value: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 rounded-xl border bg-white shadow-sm"
      style={{ borderColor: C.surfaceVariant }}
    >
      <Icon className="h-5 w-5 mb-2" style={{ color }} />
      <div className="text-2xl font-extrabold text-black">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mt-0.5">{label}</div>
    </motion.div>
  );
}

function AreaList({ title, icon: Icon, iconColor, areas, emptyText, badgeColor, delay }: {
  title: string; icon: any; iconColor: string; areas: AccuracyEntry[];
  emptyText: string; badgeColor: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: C.surfaceVariant }}
    >
      <h4 className="text-xs font-bold uppercase tracking-widest text-[#76777d] mb-4 flex items-center gap-1.5">
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
        {title}
      </h4>
      {areas.length === 0 ? (
        <p className="text-xs text-zinc-500 font-semibold text-center py-4">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {areas.map(area => (
            <div 
              key={area.id} 
              className="flex items-center justify-between py-2 border-b last:border-0"
              style={{ borderColor: C.surfaceVariant }}
            >
              <span className="text-sm font-semibold text-zinc-800">{area.name}</span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${badgeColor}`}>
                {area.accuracy}%
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
