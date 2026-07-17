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

interface QuizAnalyticsProps {
  userId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#13131A] border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
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
        <Loader2 className="h-8 w-8 text-[#7C5CFF] animate-spin" />
      </div>
    );
  }

  if (!analytics || analytics.totalAttempts === 0) {
    return (
      <div className="space-y-8">
        <div className="border border-dashed border-zinc-800 p-12 rounded-3xl text-center space-y-4 bg-zinc-950/20">
          <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-[#22D3D0]">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-white font-bold text-sm">No Analytics Data Yet</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Complete at least one quiz to see your performance analytics here.
            </p>
          </div>
        </div>
        <QuizRecommendations userId={userId} />
      </div>
    );
  }

  const barColors = ['#7C5CFF', '#22D3D0', '#3DD68C', '#F5B942', '#F1583D', '#9C5CFF'];

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Award}
          label="Avg Score"
          value={`${analytics.averagePercentage}%`}
          color="#7C5CFF"
          delay={0}
        />
        <StatCard
          icon={Target}
          label="Total Quizzes"
          value={String(analytics.totalAttempts)}
          color="#22D3D0"
          delay={0.1}
        />
        <StatCard
          icon={Flame}
          label="Quiz Streak"
          value={`${analytics.quizStreak} day${analytics.quizStreak !== 1 ? 's' : ''}`}
          color="#F5B942"
          delay={0.2}
        />
        <StatCard
          icon={Zap}
          label="Avg Response"
          value={`${analytics.averageResponseTime}s`}
          color="#3DD68C"
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
          className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#13131A]/60"
        >
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-[#7C5CFF]" />
            Subject-wise Accuracy
          </h4>
          {analytics.subjectAccuracy.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.subjectAccuracy} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="Accuracy" radius={[0, 6, 6, 0]} barSize={20}>
                  {analytics.subjectAccuracy.map((_, idx) => (
                    <Cell key={idx} fill={barColors[idx % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-zinc-600 text-center py-8">No data yet</p>
          )}
        </motion.div>

        {/* Topic Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#13131A]/60"
        >
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-[#22D3D0]" />
            Topic-wise Accuracy
          </h4>
          {analytics.topicAccuracy.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.topicAccuracy} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="Accuracy" radius={[0, 6, 6, 0]} barSize={16}>
                  {analytics.topicAccuracy.map((_, idx) => (
                    <Cell key={idx} fill={barColors[idx % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-zinc-600 text-center py-8">No data yet</p>
          )}
        </motion.div>
      </div>

      {/* Improvement Trend */}
      {analytics.improvementTrend.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#13131A]/60"
        >
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#3DD68C]" />
            Improvement Trend
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.improvementTrend} margin={{ left: 0, right: 20, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="percentage"
                name="Percentage"
                stroke="#7C5CFF"
                strokeWidth={2.5}
                dot={{ fill: '#7C5CFF', r: 4, strokeWidth: 0 }}
                activeDot={{ fill: '#22D3D0', r: 6, strokeWidth: 2, stroke: '#0A0A0F' }}
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
          iconColor="#F1583D"
          areas={analytics.weakAreas}
          emptyText="No weak areas — you're doing great!"
          badgeColor="text-[#F1583D] bg-[#F1583D]/10"
          delay={0.5}
        />
        <AreaList
          title="Strong Areas"
          icon={Award}
          iconColor="#3DD68C"
          areas={analytics.strongAreas}
          emptyText="Complete more quizzes to identify strong areas."
          badgeColor="text-[#3DD68C] bg-[#3DD68C]/10"
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
      className="glass-panel p-5 rounded-xl border border-white/5 bg-[#13131A]/60"
    >
      <Icon className="h-5 w-5 mb-2" style={{ color }} />
      <div className="text-2xl font-bold text-white">{value}</div>
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
      className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#13131A]/60"
    >
      <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
        {title}
      </h4>
      {areas.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-4">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {areas.map(area => (
            <div key={area.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
              <span className="text-sm text-zinc-300">{area.name}</span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${badgeColor}`}>
                {area.accuracy}%
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
