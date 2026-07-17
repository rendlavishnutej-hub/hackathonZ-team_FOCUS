'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Cpu, Clock, Compass } from 'lucide-react';
import type { OSState, AgentCard, AgentId } from '@/lib/os/types';

interface AgentOrchestrationViewProps {
  state: OSState;
}

export default function AgentOrchestrationView({ state }: AgentOrchestrationViewProps) {
  // Sort agents for list view: running first, then completed, then pending
  const sortedAgents = [...state.agents].sort((a, b) => {
    const priority = { running: 0, completed: 1, failed: 2, pending: 3, skipped: 4 };
    return priority[a.status] - priority[b.status];
  });

  const getStatusColor = (status: AgentCard['status']) => {
    switch (status) {
      case 'running': return '#d3579a'; // pink
      case 'completed': return '#10b981'; // green
      case 'failed': return '#ef4444'; // red
      default: return '#cbd5e1'; // gray
    }
  };

  // SVG Coordinates mapping for visual execution graph
  // Creates a balanced flowchart layout
  const nodeCoords: Record<string, { x: number; y: number }> = {
    intent:     { x: 50,  y: 50 },
    planner:    { x: 180, y: 50 },
    memory:     { x: 310, y: 50 },
    profile:    { x: 310, y: 130 },
    research:   { x: 180, y: 130 },
    curriculum: { x: 180, y: 220 },
    teacher:    { x: 50,  y: 130 },
    code:       { x: 50,  y: 220 },
    quiz:       { x: 310, y: 220 },
    interview:  { x: 50,  y: 310 },
    evaluation: { x: 180, y: 310 },
    career:     { x: 310, y: 310 },
    roadmap:    { x: 180, y: 400 },
    resume:     { x: 310, y: 400 },
    motivation: { x: 50,  y: 400 },
    summary:    { x: 180, y: 480 },
  };

  // Execution connection links
  const links = [
    { from: 'intent', to: 'planner' },
    { from: 'planner', to: 'memory' },
    { from: 'planner', to: 'research' },
    { from: 'planner', to: 'curriculum' },
    { from: 'memory', to: 'profile' },
    { from: 'curriculum', to: 'diagram' },
    { from: 'research', to: 'teacher' },
    { from: 'curriculum', to: 'code' },
    { from: 'research', to: 'quiz' },
    { from: 'curriculum', to: 'interview' },
    { from: 'interview', to: 'evaluation' },
    { from: 'profile', to: 'career' },
    { from: 'curriculum', to: 'roadmap' },
    { from: 'memory', to: 'resume' },
    { from: 'evaluation', to: 'motivation' },
    { from: 'motivation', to: 'summary' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. Terminal Console Logs */}
      <div 
        className="lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between h-[540px] relative overflow-hidden backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderColor: 'rgba(0, 0, 0, 0.06)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
        }}
      >
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b pb-3 border-neutral-100 shrink-0">
            <span className="text-xs font-bold text-neutral-800 tracking-wide uppercase">
              Orchestrator Terminal
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d3579a] animate-ping" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Active Loop
              </span>
            </div>
          </div>
          
          <div className="space-y-1 shrink-0">
            <h3 className="text-base font-bold text-neutral-900 leading-tight truncate">
              {state.prompt}
            </h3>
            <p className="text-[10px] text-[#5a6ba8] font-bold tracking-widest uppercase">
              {state.status.toUpperCase()} PHASE
            </p>
          </div>

          <div className="p-3 rounded-xl border border-neutral-100 bg-white/70 text-[11px] font-medium text-neutral-600 shrink-0">
            {state.phase}
          </div>

          {/* Scrolling Terminal Code Console */}
          <div className="flex-1 mt-3 overflow-y-auto font-mono text-[9px] space-y-1.5 border border-neutral-800 p-4 rounded-2xl bg-neutral-950 text-neutral-300 min-h-0">
            <div className="text-neutral-500">// INITIALIZING FOCUS OS GRID...</div>
            <div className="text-[#d3579a]">&gt; kernel.boot_success: OK</div>
            {state.intent && (
              <div className="text-sky-400">&gt; intent_detector: parsed domain = &quot;{state.intent.domain}&quot;</div>
            )}
            {state.plan && (
              <div className="text-emerald-400">&gt; plan_blueprints: {state.plan.executionGroups.length} parallel modules staged</div>
            )}
            
            {state.agents.map((a) => {
              if (a.status === 'running') {
                return (
                  <div key={a.id} className="text-pink-400 animate-pulse">
                    &gt; [RUNNING] {a.label.toUpperCase()} : {a.thinking || 'Processing...'}
                  </div>
                );
              }
              if (a.status === 'completed') {
                return (
                  <div key={a.id} className="text-emerald-400">
                    &gt; [OK] {a.label.toUpperCase()} finished. Time={a.executionTimeMs ? `${a.executionTimeMs}ms` : 'N/A'} Conf={a.confidence ? `${Math.round(a.confidence * 100)}%` : 'N/A'}
                  </div>
                );
              }
              if (a.status === 'failed') {
                return (
                  <div key={a.id} className="text-rose-500">
                    &gt; [ERR] {a.label.toUpperCase()} execution failed: {a.error || 'Unknown Error'}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {/* 2. Visual Connection Node Graph */}
      <div 
        className="lg:col-span-4 p-6 rounded-3xl border flex flex-col h-[540px] relative overflow-hidden backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderColor: 'rgba(0, 0, 0, 0.06)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
        }}
      >
        <div className="flex items-center gap-2 border-b pb-3 border-neutral-100 shrink-0">
          <Cpu className="h-4.5 w-4.5 text-[#5a6ba8]" />
          <span className="text-xs font-bold text-neutral-800 tracking-wide uppercase">
            Execution Flow Graph
          </span>
        </div>

        <div className="flex-1 relative flex items-center justify-center min-h-0 bg-neutral-50/50 rounded-2xl border border-neutral-100 mt-4 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 360 520">
            {/* Draw Links/Connectors */}
            {links.map((link, idx) => {
              const fromNode = nodeCoords[link.from];
              const toNode = nodeCoords[link.to];
              
              if (!fromNode || !toNode) return null;
              
              // Get active state to animate lines
              const fromAgent = state.agents.find(a => a.id === link.from);
              const toAgent = state.agents.find(a => a.id === link.to);
              
              const isActive = fromAgent?.status === 'completed' && toAgent?.status === 'running';
              const isFinished = fromAgent?.status === 'completed' && toAgent?.status === 'completed';

              return (
                <g key={idx}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={isActive ? '#d3579a' : isFinished ? '#10b981' : '#e2e8f0'}
                    strokeWidth={isActive || isFinished ? 2.5 : 1.5}
                    strokeDasharray={isActive ? '4,4' : 'none'}
                    className={isActive ? 'animate-dash-flow' : ''}
                    style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
                  />
                </g>
              );
            })}

            {/* Draw Nodes */}
            {Object.entries(nodeCoords).map(([id, coord]) => {
              const agent = state.agents.find(a => a.id === id);
              if (!agent) return null;

              const color = getStatusColor(agent.status);
              const isRunning = agent.status === 'running';

              return (
                <g key={id} className="cursor-pointer group">
                  {/* Pulsing ring on active */}
                  {isRunning && (
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={15}
                      fill="none"
                      stroke="#d3579a"
                      strokeWidth={1.5}
                      className="animate-ping"
                      style={{ transformOrigin: `${coord.x}px ${coord.y}px` }}
                    />
                  )}
                  {/* Outer circle */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={9}
                    fill={color}
                    className="transition-colors duration-300"
                  />
                  {/* Node label */}
                  <text
                    x={coord.x}
                    y={coord.y - 14}
                    textAnchor="middle"
                    fill="#45464d"
                    fontSize="7"
                    fontWeight="bold"
                    className="font-mono tracking-tighter"
                  >
                    {agent.label.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 3. Detailed Agents Status Deck */}
      <div 
        className="lg:col-span-4 p-6 rounded-3xl border h-[540px] overflow-y-auto backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderColor: 'rgba(0, 0, 0, 0.06)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
        }}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4 border-neutral-100">
          <span className="text-xs font-bold text-neutral-800 tracking-wide uppercase">
            Agents Status Deck
          </span>
          <span className="text-[10px] text-neutral-400 font-bold uppercase">
            {state.agents.length} active
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {sortedAgents.map((agent) => {
              const isRunning = agent.status === 'running';
              const isCompleted = agent.status === 'completed';
              
              return (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                    isRunning 
                      ? 'bg-neutral-50/80 border-[#d3579a] shadow-sm' 
                      : isCompleted 
                        ? 'bg-emerald-50/10 border-emerald-500/20' 
                        : 'bg-white/40 border-neutral-200/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2.5">
                      <span className="text-lg select-none shrink-0">{agent.icon}</span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-neutral-800 block leading-tight">
                          {agent.label}
                        </span>
                        
                        {/* Thinking Sub-process */}
                        {isRunning && agent.thinking && (
                          <span className="text-[9px] font-medium text-[#d3579a] block leading-tight animate-pulse">
                            Thinking: {agent.thinking}
                          </span>
                        )}

                        {/* Timing and Confidence values */}
                        {isCompleted && (
                          <div className="flex gap-2 text-[9px] font-bold text-neutral-400">
                            {agent.executionTimeMs !== undefined && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {Math.round(agent.executionTimeMs) / 1000}s
                              </span>
                            )}
                            {agent.confidence !== undefined && (
                              <span className="flex items-center gap-0.5 text-emerald-600">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                Conf: {Math.round(agent.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        )}

                        {/* Dependencies list */}
                        {agent.dependencies && agent.dependencies.length > 0 && (
                          <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-tight block pt-0.5">
                            Depends on: {agent.dependencies.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isRunning && <Loader2 className="h-3.5 w-3.5 text-[#d3579a] animate-spin" />}
                      {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-50" />}
                      {agent.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-rose-500 fill-rose-50" />}
                      {agent.status === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 block" />}
                    </div>
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
