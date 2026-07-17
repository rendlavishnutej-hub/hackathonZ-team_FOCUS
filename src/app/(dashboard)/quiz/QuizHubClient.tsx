'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, History, BarChart3, Sparkles } from 'lucide-react';
import QuizConfigForm from '@/components/quiz/QuizConfigForm';
import QuizHistory from '@/components/quiz/QuizHistory';
import QuizAnalytics from '@/components/quiz/QuizAnalytics';

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

const tabs = [
  { id: 'start', label: 'Start Quiz', icon: Play },
  { id: 'history', label: 'Quiz History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;

type TabId = typeof tabs[number]['id'];

interface QuizHubClientProps {
  userEmail: string;
  userId: string;
}

export default function QuizHubClient({ userEmail, userId }: QuizHubClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('start');

  return (
    <motion.div 
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[#7C5CFF] text-[10px] font-semibold uppercase tracking-wider">
          <Sparkles className="h-3 w-3 animate-spin-slow" />
          Assessment Module
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide uppercase font-extrabold text-black leading-none">
          QUIZ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d3579a] to-[#5a6ba8]">ARENA</span>
        </h1>
        <p className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
          Upload your study materials and let AI generate a personalised quiz. Track progress and discover weak areas with intelligent analytics.
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="flex gap-1 p-1 bg-zinc-950/60 border border-zinc-800 rounded-2xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
              style={{ color: isActive ? '#000000' : '#71717a' }}
            >
              {isActive && (
                <motion.div
                  layoutId="quiz-tab-bg"
                  className="absolute inset-0 border rounded-xl"
                  style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.surfaceVariant }}
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2 font-bold">
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#d3579a]' : ''}`} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'start' && <QuizConfigForm userId={userId} />}
          {activeTab === 'history' && <QuizHistory userId={userId} />}
          {activeTab === 'analytics' && <QuizAnalytics userId={userId} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
