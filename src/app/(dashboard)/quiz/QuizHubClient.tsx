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
  accentYellow: '#ffe24c',
  accentBlue: '#bec6e0',
  accentPink: '#ffafd3',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
};

const tabs = [
  { id: 'start', label: 'START QUIZ', icon: Play, bg: 'bg-[#ffe24c]' },
  { id: 'history', label: 'HISTORY', icon: History, bg: 'bg-[#bec6e0]' },
  { id: 'analytics', label: 'ANALYTICS', icon: BarChart3, bg: 'bg-[#ffafd3]' },
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
      className="max-w-7xl mx-auto py-8 lg:py-4 px-4 sm:px-6 xl:px-8"
    >
      <div className="flex flex-col xl:flex-row gap-12 items-start">
        {/* Left Column: Header & Navigation */}
        <div className="flex-1 space-y-10 xl:max-w-2xl xl:sticky xl:top-8">
          {/* Header */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-4 border-black text-black text-sm font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="h-4 w-4 animate-spin-slow text-[#d3579a]" strokeWidth={3} />
              ASSESSMENT MODULE
            </div>
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl tracking-wide uppercase text-black leading-none pt-2">
              QUIZ <span className="text-white bg-black px-4 inline-block mt-2 xl:mt-0 shadow-[6px_6px_0px_0px_rgba(211,87,154,1)]">ARENA</span>
            </h1>
            <p className="text-xl sm:text-2xl font-bold max-w-xl text-black border-l-8 border-[#ffe24c] pl-4 pt-2 uppercase tracking-wide">
              Upload your study materials and let AI generate a personalised quiz. Track progress and discover weak areas with intelligent analytics.
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="flex flex-wrap gap-4 pt-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 text-xl font-display uppercase tracking-widest transition-all border-4 border-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                    isActive
                      ? `${tab.bg} text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1 -translate-x-1`
                      : 'bg-white text-black'
                  }`}
                >
                  <Icon className="h-6 w-6 shrink-0" strokeWidth={3} />
                  {tab.label}
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="flex-1 w-full xl:max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'start' && <QuizConfigForm userId={userId} />}
              {activeTab === 'history' && <QuizHistory userId={userId} />}
              {activeTab === 'analytics' && <QuizAnalytics userId={userId} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
