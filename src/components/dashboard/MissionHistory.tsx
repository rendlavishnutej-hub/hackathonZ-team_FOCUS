'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, ChevronRight, Award, Trash2 } from 'lucide-react';
import type { UserMemory } from '@/lib/os/types';

interface MissionHistoryProps {
  memory: UserMemory;
  onSelectTopic: (topic: string) => void;
  onClearHistory?: () => void;
}

export default function MissionHistory({ memory, onSelectTopic, onClearHistory }: MissionHistoryProps) {
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } }
  };

  const hasHistory = memory.learningHistory && memory.learningHistory.length > 0;

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <motion.h3 
          variants={itemVars}
          className="text-lg font-black text-neutral-800 tracking-tight"
        >
          Active Workspace Missions ({memory.learningHistory.length})
        </motion.h3>

        {hasHistory && onClearHistory && (
          <motion.button
            variants={itemVars}
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-700 transition-all hover:bg-rose-50 border border-transparent hover:border-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </motion.button>
        )}
      </div>

      {!hasHistory ? (
        <motion.div
          variants={itemVars}
          className="border border-dashed p-10 rounded-2xl text-center space-y-3.5"
          style={{
            borderColor: 'rgba(0, 0, 0, 0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
          }}
        >
          <div
            className="h-11 w-11 border rounded-2xl flex items-center justify-center mx-auto"
            style={{
              backgroundColor: 'rgba(90, 107, 168, 0.08)',
              borderColor: 'rgba(90, 107, 168, 0.15)',
              color: '#5a6ba8',
            }}
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-neutral-700">
              No Learning Grids Deployed Yet
            </h4>
            <p className="text-[10px] max-w-sm mx-auto text-neutral-400 leading-normal">
              Type a custom topic or select a suggestion above to deploy the multi-agent orchestration kernel.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memory.learningHistory.map((topic, index) => {
            const hasQuiz = memory.completedQuizzes.includes(topic);
            return (
              <motion.div 
                key={index}
                variants={itemVars}
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => onSelectTopic(topic)}
                className="p-5 rounded-2xl border cursor-pointer group flex flex-col justify-between h-36 relative overflow-hidden backdrop-blur-sm transition-shadow hover:shadow-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.55)',
                  borderColor: 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#5a6ba8] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-[9px] uppercase font-bold tracking-wider">Mission #{memory.learningHistory.length - index}</span>
                    </div>
                    {hasQuiz ? (
                      <span className="px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                        Graduated
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase rounded-full border border-sky-100 bg-sky-50 text-sky-700">
                        In Progress
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-neutral-800 transition-colors line-clamp-1 group-hover:text-[#5a6ba8]">
                    {topic.toUpperCase()}
                  </h3>
                  <p className="text-[10px] line-clamp-2 leading-relaxed text-neutral-400">
                    Deployed loop mapping key concepts, roadmaps, and code templates for {topic}.
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t pt-3 text-[10px] font-bold text-[#5a6ba8] relative z-10 border-neutral-100/50">
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    Multi-Agent Verified
                  </span>
                  <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Enter Grid
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
