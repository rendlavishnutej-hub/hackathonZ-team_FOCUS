'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, BookOpen, Clock, ChevronRight, Activity, 
  Terminal, Shield, AlertTriangle, Loader2 
} from 'lucide-react';
import AgentGraph from '@/components/agents/AgentGraph';
import { BlackboardState } from '@/lib/orchestrator/blackboard';

interface SessionClientProps {
  sessionId: string;
  prompt: string;
}

export default function SessionClient({ sessionId, prompt }: SessionClientProps) {
  const router = useRouter();
  const timelineEndRef = useRef<HTMLDivElement>(null);
  
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [logs, setLogs] = useState<any[]>([]);
  
  // Outputs
  const [plannerOutput, setPlannerOutput] = useState<any | null>(null);
  const [researcherOutput, setResearcherOutput] = useState<any | null>(null);
  const [coderOutput, setCoderOutput] = useState<any | null>(null);
  const [criticOutput, setCriticOutput] = useState<any | null>(null);
  const [quizzerOutput, setQuizzerOutput] = useState<any | null>(null);

  // Auto-scroll timeline to bottom
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Connect to SSE stream
  useEffect(() => {
    let active = true;
    const runOrchestrator = async () => {
      setStatus('running');
      setLogs([{
        agentId: 'system',
        message: 'Establishing connection to FOCUS Multi-Agent grid...',
        status: 'info',
        timestamp: new Date().toLocaleTimeString()
      }]);

      try {
        const response = await fetch('/api/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, prompt }),
        });

        if (!response.ok) {
          throw new Error('Failed to connect to orchestrator API');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream body returned');

        const decoder = new TextDecoder();
        let buffer = '';

        while (active) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (part.startsWith('data: ')) {
              const state: BlackboardState = JSON.parse(part.slice(6));
              
              // Update state hooks
              if (state.activeAgentId !== undefined) setActiveAgentId(state.activeAgentId);
              if (state.status !== undefined) setStatus(state.status);
              if (state.logs !== undefined) setLogs(state.logs);
              
              if (state.plannerOutput) setPlannerOutput(state.plannerOutput);
              if (state.researcherOutput) setResearcherOutput(state.researcherOutput);
              if (state.coderOutput) setCoderOutput(state.coderOutput);
              if (state.criticOutput) setCriticOutput(state.criticOutput);
              if (state.quizzerOutput) setQuizzerOutput(state.quizzerOutput);

              // If completed, save the course object
              if (state.status === 'completed' && state.plannerOutput && state.quizzerOutput) {
                const newCourse = {
                  id: sessionId,
                  title: state.plannerOutput.title,
                  description: state.plannerOutput.description,
                  createdAt: new Date().toLocaleDateString(),
                  completed: false,
                  syllabus: state.plannerOutput,
                  research: state.researcherOutput,
                  code: state.coderOutput,
                  quiz: state.quizzerOutput,
                };

                // Save to localStorage
                const stored = localStorage.getItem('focus_courses');
                const list = stored ? JSON.parse(stored) : [];
                
                // Prevent duplicate insertions
                if (!list.some((c: any) => c.id === sessionId)) {
                  list.unshift(newCourse);
                  localStorage.setItem('focus_courses', JSON.stringify(list));
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error('SSE Stream error:', err);
        setStatus('failed');
        setLogs(prev => [...prev, {
          agentId: 'system',
          message: `Connection failed: ${err.message || 'Stream read error'}`,
          status: 'error',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };

    runOrchestrator();

    return () => {
      active = false;
    };
  }, [sessionId, prompt]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 flex flex-col h-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#7C5CFF]">
              ACTIVE DEPLOYMENT
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <h2 className="font-display text-2xl tracking-wide uppercase text-white truncate max-w-lg">
            Syllabus: {prompt}
          </h2>
        </div>

        {status === 'completed' && (
          <button
            onClick={() => router.push(`/course/${sessionId}`)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#7C5CFF] to-[#22D3D0] text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-[#7C5CFF]/10 transition-all hover:scale-[1.01]"
          >
            Launch Course Workspace
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* React Flow Graph */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">
          Agent Execution Grid
        </span>
        <AgentGraph
          activeAgentId={activeAgentId}
          status={status}
          plannerOutput={plannerOutput}
          researcherOutput={researcherOutput}
          coderOutput={coderOutput}
          criticOutput={criticOutput}
          quizzerOutput={quizzerOutput}
        />
      </div>

      {/* Logs / Execution Timeline Panel */}
      <div className="flex-1 min-h-[220px] flex flex-col space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">
          Live Agent Activity Stream
        </span>
        
        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-5 overflow-y-auto font-mono text-xs space-y-2.5 max-h-64 shadow-inner">
          {logs.map((log, idx) => {
            let color = 'text-zinc-400';
            let prefix = 'Info';
            if (log.status === 'success') {
              color = 'text-[#3DD68C]';
              prefix = 'Success';
            } else if (log.status === 'warning') {
              color = 'text-[#F5B942]';
              prefix = 'Critique';
            } else if (log.status === 'error') {
              color = 'text-[#F1583D]';
              prefix = 'Alert';
            }

            return (
              <div key={idx} className="flex items-start gap-2.5 border-b border-zinc-900/40 pb-2">
                <span className="text-zinc-600 shrink-0 font-sans text-[10px] mt-0.5">[{log.timestamp}]</span>
                <span className="text-[#7C5CFF] shrink-0 font-bold uppercase text-[10px] px-1.5 py-0.5 bg-[#7C5CFF]/10 rounded border border-[#7C5CFF]/10">
                  {log.agentId}
                </span>
                <span className={`${color} leading-relaxed`}>
                  <strong className="text-[10px] uppercase tracking-wider mr-1.5">({prefix}):</strong>
                  {log.message}
                </span>
              </div>
            );
          })}
          
          {status === 'running' && (
            <div className="flex items-center gap-2 text-zinc-600 animate-pulse pt-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#22D3D0]" />
              <span>Orchestrating agent loop pipelines...</span>
            </div>
          )}
          
          <div ref={timelineEndRef} />
        </div>
      </div>
    </div>
  );
}
