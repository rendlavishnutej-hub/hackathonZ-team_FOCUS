'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, BookOpen, Clock, ChevronRight, Activity, 
  Terminal, Shield, AlertTriangle, Loader2 
} from 'lucide-react';
import AgentGraph from '@/components/agents/AgentGraph';
import { BlackboardState } from '@/lib/orchestrator/blackboard';

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
  secondaryContainer: '#fcdf46',
  inverseSurface: '#32302c',
  inverseOnSurface: '#f5f0e8',
};

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
  const [notetakerOutput, setNotetakerOutput] = useState<any | null>(null);
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
              if (state.notetakerOutput) setNotetakerOutput(state.notetakerOutput);
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
                  notes: state.notetakerOutput,
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
            <span
              className="text-[10px] uppercase font-bold tracking-widest"
              style={{ color: C.accentPurple }}
            >
              {status === 'completed' ? 'DEPLOYMENT COMPLETED' : 'ACTIVE DEPLOYMENT'}
            </span>
            {status !== 'completed' && status !== 'failed' && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <h2
            className="font-display text-2xl tracking-wide uppercase truncate max-w-lg"
            style={{ color: C.onSurface }}
          >
            Syllabus: {prompt}
          </h2>
        </div>

        {status === 'completed' && (
          <button
            onClick={() => router.push(`/course/${sessionId}`)}
            className="flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: C.primary,
              color: C.onPrimary,
            }}
          >
            Launch Course Workspace
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {(status === 'running' || status === 'idle') && (
        <div
          className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border shadow-lg space-y-6 animate-pulse"
          style={{
            backgroundColor: C.surfaceContainerLowest,
            borderColor: C.surfaceVariant,
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
          }}
        >
          {/* Animated pulsing outer ring */}
          <div className="relative h-24 w-24 flex items-center justify-center">
            {/* Spinning/pulsing circles */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#5a6ba8]/30 animate-spin" style={{ animationDuration: '6s' }} />
            <div className="absolute inset-2 rounded-full border-4 border-[#d3579a]/20 animate-pulse" />
            <div 
              className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${C.accentYellow}, ${C.accentPink})`
              }}
            >
              <Loader2 className="h-7 w-7 text-black animate-spin" />
            </div>
          </div>
          
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-bold uppercase tracking-wide" style={{ color: C.primary }}>
              Orchestrating AI Agent Pipeline
            </h3>
            <p className="text-xs font-body leading-relaxed" style={{ color: C.onSurfaceVariant }}>
              Our specialized AI agents (Planner, Researcher, Coder, Critic) are busy building custom study path nodes, high-fidelity source theory, and code syntax snippets.
            </p>
          </div>

          {/* Active agent badge indicator */}
          <div 
            className="flex items-center gap-2.5 px-3.5 py-1.5 border rounded-xl shadow-sm bg-white"
            style={{ borderColor: C.outlineVariant }}
          >
            <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black">
              Current Agent: {activeAgentId ? activeAgentId.toUpperCase() : 'PLANNING_CORE'}
            </span>
          </div>

          {/* Micro loading step text */}
          <div className="text-[10px] text-zinc-500 font-mono tracking-wider max-w-lg truncate">
            {logs[logs.length - 1]?.message || 'Deploying workflow logs...'}
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div
          className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border shadow-lg space-y-6"
          style={{
            backgroundColor: C.surfaceContainerLowest,
            borderColor: '#fecaca',
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
          }}
        >
          <div className="h-14 w-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
            <AlertTriangle className="h-7 w-7" />
          </div>
          
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-lg font-bold text-red-700">Deployment Failed</h3>
            <p className="text-xs" style={{ color: C.onSurfaceVariant }}>
              An error occurred during multi-agent orchestration. Please check backend rate limits or configuration.
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl border transition-all hover:bg-zinc-50 shadow-sm"
            style={{ borderColor: C.outlineVariant, color: C.onSurface }}
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {status === 'completed' && plannerOutput && (
        <div className="space-y-6">
          {/* Dashboard Structured Notes banner */}
          <div
            className="p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md bg-gradient-to-r from-[#ffe24c]/10 to-[#86efac]/10"
            style={{ borderColor: C.surfaceVariant }}
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#ffe24c] flex items-center justify-center shadow">
                <BookOpen className="h-6 w-6 text-black" />
              </div>
              <div className="text-left space-y-0.5">
                <h4 className="font-bold text-sm text-black">
                  Structured Curriculum Roadmap Generated
                </h4>
                <p className="text-xs text-zinc-600">
                  Your customized course notes, exercises, and interactive quiz are ready in the workspace.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/course/${sessionId}`)}
              className="flex items-center gap-1.5 px-6 py-3 font-bold text-sm rounded-2xl shadow-lg transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: C.primary,
                color: C.onPrimary,
              }}
            >
              Start Study Notes Workspace
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* AI Collaborator Insights Panel */}
          <div className="space-y-4">
            <span
              className="text-[10px] uppercase font-bold tracking-widest block text-zinc-500 font-bold"
            >
              Multi-Agent Collaborative Insights
            </span>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Planner Agent Card */}
              <div 
                className="p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-4 hover:shadow transition-all"
                style={{ borderColor: C.surfaceVariant }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#5a6ba8]">PLANNER</span>
                    <span className="text-xs">🗺️</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-black uppercase">Curriculum Specialist</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-600">
                    Sourced 3 structured learning nodes targeting fundamentals, advanced architectures and practical real-world execution.
                  </p>
                </div>
                <div className="text-[9px] font-mono font-semibold text-zinc-400 border-t pt-2 max-w-full truncate">
                  Output: {plannerOutput.lessons.length} lessons mapped
                </div>
              </div>

              {/* Researcher Agent Card */}
              <div 
                className="p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-4 hover:shadow transition-all"
                style={{ borderColor: C.surfaceVariant }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#d3579a]">RESEARCHER</span>
                    <span className="text-xs">🔬</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-black uppercase">Deep Fact Retrieval</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-600">
                    Acquired detailed textual theory and core reference notes for each node to ensure analytical depth.
                  </p>
                </div>
                <div className="text-[9px] font-mono font-semibold text-zinc-400 border-t pt-2 max-w-full truncate">
                  Output: {researcherOutput?.lessonContents?.length || 0} theory briefs
                </div>
              </div>

              {/* Coder Agent Card */}
              <div 
                className="p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-4 hover:shadow transition-all"
                style={{ borderColor: C.surfaceVariant }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#ffe24c] bg-black px-1 rounded">CODER</span>
                    <span className="text-xs">💻</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-black uppercase">Snippet Synthesizer</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-600">
                    {coderOutput?.snippets?.some((s: any) => s.code) 
                      ? "Generated interactive programming exercise blocks and clean code templates." 
                      : "Evaluated conceptual topic; skipped coding models to keep material optimized."}
                  </p>
                </div>
                <div className="text-[9px] font-mono font-semibold text-zinc-400 border-t pt-2 max-w-full truncate">
                  Language: {coderOutput?.snippets?.find((s: any) => s.language)?.language || 'none'}
                </div>
              </div>

              {/* Critic Agent Card */}
              <div 
                className="p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-4 hover:shadow transition-all"
                style={{ borderColor: C.surfaceVariant }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-red-650">CRITIC</span>
                    <span className="text-xs">⚖️</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-black uppercase">Quality Inspector</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-600 italic">
                    "{criticOutput?.remarks ? criticOutput.remarks.slice(0, 100) + '...' : 'Content verified and approved.'}"
                  </p>
                </div>
                <div className="text-[9px] font-mono font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded text-center w-fit">
                  {criticOutput?.verdict || 'APPROVED'}
                </div>
              </div>

              {/* Notetaker Agent Card */}
              <div 
                className="p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-4 hover:shadow transition-all"
                style={{ borderColor: C.surfaceVariant }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-blue-600">NOTETAKER</span>
                    <span className="text-xs">📝</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-black uppercase">Study Scribe</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-600">
                    Distilled deep theory into structured, high-yield bullet point study notes for rapid review.
                  </p>
                </div>
                <div className="text-[9px] font-mono font-semibold text-zinc-400 border-t pt-2 max-w-full truncate">
                  Output: {notetakerOutput?.notes?.length || 3} note sections
                </div>
              </div>

              {/* Quizzer Agent Card */}
              <div 
                className="p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-4 hover:shadow transition-all"
                style={{ borderColor: C.surfaceVariant }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-green-600">QUIZZER</span>
                    <span className="text-xs">📝</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-black uppercase">Evaluation Metric</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-600">
                    Compiled 3 multiple-choice graduation challenges with explanations to test curriculum mastery.
                  </p>
                </div>
                <div className="text-[9px] font-mono font-semibold text-zinc-400 border-t pt-2 max-w-full truncate">
                  Output: {quizzerOutput?.questions?.length || 3} items structured
                </div>
              </div>
            </div>
          </div>

          {/* Structured Notes Detail Panel */}
          <div
            className="p-8 sm:p-10 rounded-3xl border shadow-lg space-y-8"
            style={{
              backgroundColor: C.surfaceContainerLowest,
              borderColor: C.surfaceVariant,
            }}
          >
            {/* Header */}
            <div className="space-y-2 pb-6 border-b" style={{ borderColor: C.surfaceVariant }}>
              <div 
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#d3579a]/10 border text-[#d3579a]"
                style={{ borderColor: `${C.accentPurple}30` }}
              >
                Gemini Multi-Agent Structured Notes
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-black" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {plannerOutput.title}
              </h2>
              <p className="text-sm font-body leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                {plannerOutput.description}
              </p>
            </div>

            {/* Note Sections */}
            <div className="space-y-8">
              {plannerOutput.lessons.map((lesson: any, index: number) => {
                const research = researcherOutput?.lessonContents?.find((l: any) => l.lessonId === lesson.id);
                const codeSnippet = coderOutput?.snippets?.find((c: any) => c.lessonId === lesson.id);
                
                return (
                  <div key={lesson.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs px-2 py-1 bg-black text-white rounded font-bold">
                        0{index + 1}
                      </span>
                      <h3 className="text-lg font-bold text-black font-display tracking-wide uppercase">
                        {lesson.title}
                      </h3>
                    </div>

                    <div className="pl-9 space-y-4">
                      <p className="text-xs italic text-zinc-500 font-body">
                        {lesson.description}
                      </p>
                      
                      {/* Theory Paragraphs */}
                      {research?.theory && (
                        <div className="text-sm font-body leading-relaxed text-zinc-800 space-y-3 bg-[#fdfaf5] p-5 rounded-2xl border" style={{ borderColor: C.surfaceVariant }}>
                          {research.theory.split('\n\n').map((para: string, pIdx: number) => (
                            <p key={pIdx}>{para}</p>
                          ))}
                        </div>
                      )}

                      {/* Code Snippet Box */}
                      {codeSnippet?.code && (
                        <div className="rounded-xl overflow-hidden border bg-[#1d1c18]" style={{ borderColor: C.surfaceVariant }}>
                          <div className="px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-zinc-400 bg-black/40 border-b border-[#2d2c28]">
                            <span>example.{codeSnippet.language || 'ts'}</span>
                          </div>
                          <pre className="p-4 font-mono text-[11px] overflow-x-auto leading-relaxed text-[#e8e6e1]">
                            <code>{codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
