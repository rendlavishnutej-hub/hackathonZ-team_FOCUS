'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, PlayCircle, HelpCircle } from 'lucide-react';
import type { OSState, AgentCard } from '@/lib/os/types';

interface AgentOrchestrationViewProps {
  state: OSState;
}

export default function AgentOrchestrationView({ state }: AgentOrchestrationViewProps) {
  // Sort agents: running or completed first, then pending
  const sortedAgents = [...state.agents].sort((a, b) => {
    const priority = { running: 0, completed: 1, failed: 2, pending: 3, skipped: 4 };
    return priority[a.status] - priority[b.status];
  });

  const getStatusStyle = (status: AgentCard['status']) => {
    switch (status) {
      case 'running':
        return {
          bg: 'rgba(211, 87, 154, 0.06)',
          border: 'border-[#d3579a]',
          text: 'text-[#d3579a]',
          shadow: 'shadow-[0_0_15px_rgba(211,87,154,0.15)]',
        };
      case 'completed':
        return {
          bg: 'rgba(16, 185, 129, 0.05)',
          border: 'border-emerald-500/40',
          text: 'text-emerald-600',
          shadow: '',
        };
      case 'failed':
        return {
          bg: 'rgba(239, 68, 68, 0.05)',
          border: 'border-rose-500/40',
          text: 'text-rose-600',
          shadow: '',
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.4)',
          border: 'border-neutral-200/60',
          text: 'text-neutral-400',
          shadow: '',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Active Grid Status Terminal */}
      <div 
        className="lg:col-span-1 p-6 rounded-2xl border flex flex-col justify-between h-[450px] relative overflow-hidden backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          borderColor: 'rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-neutral-100">
            <span className="text-xs font-bold text-neutral-800 tracking-wide uppercase">
              Orchestrator Terminal
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#d3579a] animate-ping" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Active Loop
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-black text-neutral-900 leading-tight truncate">
              {state.prompt}
            </h3>
            <p className="text-[10px] text-[#5a6ba8] font-bold tracking-widest uppercase">
              {state.status.toUpperCase()} PHASE
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-100 bg-white/70 text-xs font-medium text-neutral-600 leading-relaxed">
            {state.phase}
          </div>
        </div>

        {/* Streaming Logs */}
        <div className="flex-1 mt-4 overflow-y-auto font-mono text-[10px] space-y-2 border border-neutral-100 p-3 rounded-xl bg-neutral-900 text-neutral-300">
          <div className="text-[#d3579a]">&gt; Initializing FOCUS multi-agent OS kernel...</div>
          {state.intent && (
            <div className="text-emerald-400">&gt; Intent parsed: {state.intent.intent.toUpperCase()} ({state.intent.domain})</div>
          )}
          {state.plan && (
            <div className="text-sky-400">&gt; Planner loaded. Execution roadmap calculated.</div>
          )}
          {state.agents.map((a) => {
            if (a.status === 'running') {
              return <div key={a.id} className="text-pink-400 animate-pulse">&gt; Running: {a.label}...</div>;
            }
            if (a.status === 'completed') {
              return <div key={a.id} className="text-emerald-400">&gt; [OK] Finished {a.label} execution.</div>;
            }
            return null;
          })}
        </div>
      </div>

      {/* Agents Timeline/Grid */}
      <div 
        className="lg:col-span-2 p-6 rounded-2xl border h-[450px] overflow-y-auto backdrop-blur-md relative"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          borderColor: 'rgba(0, 0, 0, 0.06)',
        }}
      >
        <h4 className="text-xs font-extrabold text-neutral-700 tracking-wider uppercase border-b pb-3 mb-4 border-neutral-100">
          Specialized Collaboration Grid ({state.agents.length} Agents)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {sortedAgents.map((agent) => {
              const style = getStatusStyle(agent.status);
              return (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${style.bg} ${style.border} ${style.shadow}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl filter drop-shadow-sm select-none">
                      {agent.icon}
                    </span>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-neutral-800 block">
                        {agent.label}
                      </span>
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    {agent.status === 'running' && (
                      <Loader2 className="h-4 w-4 text-[#d3579a] animate-spin" />
                    )}
                    {agent.status === 'completed' && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                    )}
                    {agent.status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-rose-500 fill-rose-50" />
                    )}
                    {agent.status === 'pending' && (
                      <div className="h-2 w-2 rounded-full bg-neutral-300" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
