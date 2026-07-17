'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, History, BarChart3, Sparkles } from 'lucide-react';
import QuizConfigForm from '@/components/quiz/QuizConfigForm';
import QuizHistory from '@/components/quiz/QuizHistory';
import QuizAnalytics from '@/components/quiz/QuizAnalytics';

interface QuizHubClientProps {
  userEmail: string;
  userId: string;
}

const tabs = [
  { id: 'start', label: 'Start Quiz', icon: Play },
  { id: 'history', label: 'Quiz History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;

type TabId = typeof tabs[number]['id'];

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
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide uppercase text-white leading-none">
          QUIZ <span className="text-gradient">ARENA</span>
        </h1>
        <p className="text-sm text-zinc-400 font-body">
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
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="quiz-tab-bg"
                  className="absolute inset-0 bg-zinc-800 border border-zinc-700 rounded-xl"
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#22D3D0]' : ''}`} />
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
