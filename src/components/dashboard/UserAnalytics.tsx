'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Award, BookOpen, ChevronUp, Zap } from 'lucide-react';
import type { UserMemory } from '@/lib/os/types';

interface UserAnalyticsProps {
  memory: UserMemory;
}

export default function UserAnalytics({ memory }: UserAnalyticsProps) {
  // Stats calculations
  const totalMissions = memory.learningHistory.length;
  const quizSuccessRate = totalMissions > 0 
    ? Math.round((memory.completedQuizzes.length / totalMissions) * 100) 
    : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } }
  };

  const statCards = [
    {
      label: 'Focus Streak',
      value: `${memory.currentStreak} Days`,
      sub: memory.currentStreak > 0 ? 'Consistent learner!' : 'Start your streak today',
      icon: Flame,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
    },
    {
      label: 'Learning Hours',
      value: `${memory.totalHours} hrs`,
      sub: 'Time spent in grid sessions',
      icon: Clock,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.2)',
    },
    {
      label: 'Missions Finished',
      value: totalMissions,
      sub: 'Syllabus paths generated',
      icon: BookOpen,
      color: '#d3579a',
      bg: 'rgba(211, 87, 154, 0.08)',
      border: 'rgba(211, 87, 154, 0.2)',
    },
    {
      label: 'Quiz Graduation',
      value: `${quizSuccessRate}%`,
      sub: `${memory.completedQuizzes.length} concepts validated`,
      icon: Award,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.2)',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-5 rounded-2xl border flex flex-col justify-between h-32 relative overflow-hidden backdrop-blur-md transition-shadow hover:shadow-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              borderColor: 'rgba(0, 0, 0, 0.06)',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
            }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                {card.label}
              </span>
              <div 
                className="p-2 rounded-xl flex items-center justify-center border"
                style={{ 
                  backgroundColor: card.bg, 
                  borderColor: card.border,
                  color: card.color 
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight text-black">
                {card.value}
              </h3>
              <p className="text-[10px] font-medium text-neutral-400">
                {card.sub}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
