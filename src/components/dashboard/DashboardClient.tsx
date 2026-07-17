'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass } from 'lucide-react';
import type { OSState, UserMemory } from '@/lib/os/types';
import { loadMemory, saveMemory, recordMission } from '@/lib/os/memory-manager';

// Core Components
import UserAnalytics from './UserAnalytics';
import OSCommandCenter from './OSCommandCenter';
import AgentOrchestrationView from './AgentOrchestrationView';
import WorkspaceResult from './WorkspaceResult';
import MissionHistory from './MissionHistory';

const C = {
  cream: '#fef9f2',
  primary: '#000000',
  onPrimary: '#ffffff',
  accentGreen: '#86efac',
  accentBlue: '#bec6e0',
};

interface DashboardClientProps {
  userEmail: string;
}

const DEFAULT_STATE = (sessionId: string): OSState => ({
  sessionId,
  prompt: '',
  status: 'idle',
  phase: 'Ready',
  agents: [],
  startedAt: Date.now(),
});

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [osState, setOsState] = useState<OSState | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // 1. Initial Load of Memory
  useEffect(() => {
    const mem = loadMemory();
    setMemory(mem);
    const newSessionId = crypto.randomUUID();
    setCurrentSessionId(newSessionId);
    setOsState(DEFAULT_STATE(newSessionId));
  }, []);

  // 2. Submit prompt to the multi-agent OS loop
  const handleDeployLoop = async (promptText: string, attachment?: string) => {
    if (loading || !promptText.trim()) return;

    setLoading(true);
    const sessionId = currentSessionId;
    const initial = DEFAULT_STATE(sessionId);
    initial.prompt = promptText;
    initial.status = 'analyzing';
    setOsState(initial);

    try {
      const response = await fetch('/api/os/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, prompt: promptText }),
      });

      if (!response.ok) {
        throw new Error('Failed to start execution stream');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader unavailable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr) {
              try {
                const parsedState = JSON.parse(dataStr) as OSState;
                setOsState(parsedState);

                // If completed, record the mission in memory
                if (parsedState.status === 'completed' && parsedState.result) {
                  recordMission(promptText, parsedState.result.intent.domain);
                  setMemory(loadMemory()); // reload updated memory
                }
              } catch (err) {
                console.error('[FOCUS OS Client] JSON Parse Error:', err);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[FOCUS OS Client] SSE Stream Failure:', err);
      setOsState(prev => ({
        ...prev!,
        status: 'failed',
        phase: 'Failed',
        error: err.message || 'Stream processing failed',
      }));
    } finally {
      setLoading(false);
    }
  };

  // 3. Clear memory history helper
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your learning history?')) {
      const defaultMem: UserMemory = {
        learningHistory: [],
        weakConcepts: [],
        strongConcepts: [],
        preferredStyle: 'mixed',
        completedQuizzes: [],
        interviewHistory: [],
        previousPrompts: [],
        totalHours: 0,
        currentStreak: 0,
        lastActive: new Date().toISOString(),
        skillGraph: {},
        learningGraph: [],
        weaknessGraph: [],
        interviewGraph: {},
        careerGraph: [],
        knowledgeGraph: {},
      };
      saveMemory(defaultMem);
      setMemory(defaultMem);
    }
  };

  const handleSelectTopic = (topic: string) => {
    handleDeployLoop(`Teach me ${topic}`);
  };

  const handleResetWorkspace = () => {
    const newSessionId = crypto.randomUUID();
    setCurrentSessionId(newSessionId);
    setOsState(DEFAULT_STATE(newSessionId));
  };

  if (!memory || !osState) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isExecuting = 
    osState.status === 'analyzing' || 
    osState.status === 'planning' || 
    osState.status === 'executing' || 
    osState.status === 'composing';

  const isCompleted = osState.status === 'completed';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 overflow-x-hidden">
      {/* Greeting Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1.5"
      >
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${C.accentGreen}20`,
            borderColor: `${C.accentGreen}60`,
            color: '#166534',
          }}
        >
          <Sparkles className="h-3 w-3 text-emerald-600 animate-spin-slow" />
          FOCUS OS STATUS: NOMINAL
        </div>
        
        <h1
          className="text-4xl sm:text-5xl font-black tracking-tight leading-tight"
          style={{ color: C.primary }}
        >
          FOCUS AI <span className="text-[#5a6ba8]">Operating System</span>
        </h1>
        <p className="text-xs text-neutral-500 font-medium">
          Deploy modular multi-agent grids to parse intent, formulate plan blueprints, and execute study workspaces.
        </p>
      </motion.div>

      {/* Main OS Workflow state selector */}
      <AnimatePresence mode="wait">
        {/* State A: Running execution pipeline */}
        {isExecuting && (
          <motion.div
            key="orchestration-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <AgentOrchestrationView state={osState} />
          </motion.div>
        )}

        {/* State B: Display final synthesized workspace */}
        {isCompleted && osState.result && (
          <motion.div
            key="result-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <WorkspaceResult result={osState.result} onClose={handleResetWorkspace} />
          </motion.div>
        )}

        {/* State C: Idle Command center */}
        {!isExecuting && !isCompleted && (
          <motion.div
            key="idle-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            {/* User analytics */}
            <UserAnalytics memory={memory} />

            {/* Prompt Command Input */}
            <OSCommandCenter onSubmit={handleDeployLoop} loading={loading} />

            {/* Past missions history */}
            <MissionHistory 
              memory={memory} 
              onSelectTopic={handleSelectTopic} 
              onClearHistory={handleClearHistory} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
