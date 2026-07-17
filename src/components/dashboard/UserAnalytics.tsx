'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Award, BookOpen, GitMerge, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
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

  // Skill graph data extraction
  const skillList = Object.entries(memory.skillGraph || {}).slice(0, 4);
  const targetCareers = memory.careerGraph || ['Software Engineer', 'Frontend Developer'];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={cardVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="p-5 rounded-2xl border flex flex-col justify-between h-32 relative overflow-hidden backdrop-blur-md transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                borderColor: 'rgba(0, 0, 0, 0.06)',
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

      {/* Graphs Dashboard Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graph A: Skill Mastery Matrix & Careers */}
        <div 
          className="p-6 rounded-2xl border bg-white/60 backdrop-blur-md space-y-5"
          style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
              Skill Mastery Matrix
            </span>
            <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded font-bold uppercase">
              Active Graph
            </span>
          </div>

          {skillList.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-400">
              No skills in matrix yet. Run a learning grid to populate.
            </div>
          ) : (
            <div className="space-y-3.5">
              {skillList.map(([skill, val]) => (
                <div key={skill} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-neutral-700">{skill.toUpperCase()}</span>
                    <span className="text-[#5a6ba8]">{val}%</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-[#d3579a] to-[#5a6ba8]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Career Alignments */}
          <div className="pt-4 border-t border-neutral-100 space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase block">Target Career Placement:</span>
            <div className="flex flex-wrap gap-2">
              {targetCareers.map((career) => (
                <span 
                  key={career} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5a6ba8]/5 border border-[#5a6ba8]/15 rounded-xl text-xs font-semibold text-[#5a6ba8]"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {career}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Graph B: Concept Nodes & Weaknesses */}
        <div 
          className="p-6 rounded-2xl border bg-white/60 backdrop-blur-md space-y-5"
          style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
              Parent-Child Knowledge Graph
            </span>
            <span className="text-[10px] bg-pink-50 text-[#d3579a] px-2 py-0.5 rounded font-bold uppercase">
              Relational Linkages
            </span>
          </div>

          {Object.keys(memory.knowledgeGraph || {}).length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-400">
              No knowledge nodes linked. Initiate courses to map concept branches.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(memory.knowledgeGraph || {}).slice(0, 2).map(([parent, children]) => (
                <div key={parent} className="p-3 bg-white/70 rounded-xl border border-neutral-200/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                    <GitMerge className="h-3.5 w-3.5 text-[#d3579a]" />
                    <span>{parent.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-5">
                    {children.map((child) => (
                      <span key={child} className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded text-[10px] font-semibold">
                        {child}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Strengths and Weaknesses summaries */}
          <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] font-bold text-emerald-600 tracking-wider uppercase block mb-1">Strengths:</span>
              {memory.strongConcepts.length === 0 ? (
                <span className="text-[10px] text-neutral-400">Awaiting evaluations</span>
              ) : (
                <span className="text-xs font-bold text-neutral-700 truncate block">
                  {memory.strongConcepts[0]}
                </span>
              )}
            </div>
            <div>
              <span className="text-[9px] font-bold text-rose-500 tracking-wider uppercase block mb-1">Focus Areas:</span>
              {memory.weaknessGraph.length === 0 ? (
                <span className="text-[10px] text-neutral-400">All nominal</span>
              ) : (
                <span className="text-xs font-bold text-neutral-700 truncate block">
                  {memory.weaknessGraph[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
