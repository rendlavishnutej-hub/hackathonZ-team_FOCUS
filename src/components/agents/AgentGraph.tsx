'use client';

import React, { useMemo } from 'react';
import { 
  ReactFlow, Background, Controls, 
  Node, Edge, MarkerType 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Colour constants matching the landing page design system ──────────────
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
  accentBlue: '#bec6e0',
  accentGreen: '#86efac',
  accentPurple: '#d3579a',
};

interface AgentGraphProps {
  activeAgentId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  plannerOutput: any | null;
  researcherOutput: any | null;
  coderOutput: any | null;
  criticOutput: any | null;
  notetakerOutput: any | null;
  quizzerOutput: any | null;
}

export default function AgentGraph({
  activeAgentId,
  status,
  plannerOutput,
  researcherOutput,
  coderOutput,
  criticOutput,
  notetakerOutput,
  quizzerOutput,
}: AgentGraphProps) {
  // Generate nodes based on orchestrator state
  const nodes = useMemo<Node[]>(() => {
    const agentList = [
      { id: 'planner', name: 'PLANNER', label: 'Curriculum Architect', x: 50, y: 150, hasOutput: !!plannerOutput },
      { id: 'researcher', name: 'RESEARCHER', label: 'Deep Research Unit', x: 300, y: 50, hasOutput: !!researcherOutput },
      { id: 'coder', name: 'CODER', label: 'Synthesis Coder', x: 550, y: 150, hasOutput: !!coderOutput },
      { id: 'critic', name: 'CRITIC', label: 'Pedagogical Critic', x: 300, y: 250, hasOutput: !!criticOutput },
      { id: 'notetaker', name: 'NOTETAKER', label: 'Study Scribe', x: 800, y: 150, hasOutput: !!notetakerOutput },
      { id: 'quizzer', name: 'QUIZZER', label: 'Assessment Engine', x: 1050, y: 150, hasOutput: !!quizzerOutput },
    ];

    return agentList.map((agent) => {
      const isActive = activeAgentId === agent.id;
      const isCompleted = agent.hasOutput || (status === 'completed');
      
      let borderColor = C.surfaceVariant;
      let bgColor = C.surfaceContainerLowest;
      let titleColor = C.outline;
      let textColor = C.onSurfaceVariant;
      let glowStyle: React.CSSProperties = {};
      let animateClass = '';

      if (isActive) {
        borderColor = C.accentPurple;
        bgColor = C.surfaceContainerLowest;
        titleColor = C.accentPurple;
        textColor = C.primary;
        animateClass = 'animate-pulse';
        glowStyle = {
          boxShadow: `0 0 20px ${C.accentPurple}40`,
        };
      } else if (isCompleted) {
        borderColor = '#5a6ba8';
        bgColor = `${C.accentBlue}15`;
        titleColor = '#5a6ba8';
        textColor = C.onSurface;
      }

      return {
        id: agent.id,
        position: { x: agent.x, y: agent.y },
        data: {
          label: (
            <div 
              className="p-4 rounded-xl border transition-all duration-300 w-52"
              style={{
                borderColor,
                backgroundColor: bgColor,
                ...glowStyle,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] tracking-widest font-semibold uppercase ${animateClass}`}
                  style={{ color: titleColor }}
                >
                  {agent.name}
                </span>
                {isActive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.accentPurple }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: C.accentPurple }} />
                  </span>
                )}
                {isCompleted && !isActive && (
                  <span className="text-[10px] font-bold" style={{ color: '#5a6ba8' }}>✓</span>
                )}
              </div>
              <p className="text-xs font-semibold" style={{ color: textColor }}>{agent.label}</p>
              <p className="text-[10px] mt-1" style={{ color: C.outline }}>
                {isActive ? 'Processing state...' : isCompleted ? 'Completed' : 'Pending activation'}
              </p>
            </div>
          ),
        },
        type: 'default',
        style: { background: 'none', border: 'none', padding: 0 },
      };
    });
  }, [activeAgentId, status, plannerOutput, researcherOutput, coderOutput, criticOutput, notetakerOutput, quizzerOutput]);

  // Define graph connections (edges)
  const edges = useMemo<Edge[]>(() => {
    const isCompleted = (id: string) => {
      if (id === 'planner') return !!plannerOutput;
      if (id === 'researcher') return !!researcherOutput;
      if (id === 'coder') return !!coderOutput;
      if (id === 'critic') return !!criticOutput;
      if (id === 'notetaker') return !!notetakerOutput;
      if (id === 'quizzer') return !!quizzerOutput;
      return false;
    };

    const getEdgeColor = (source: string, target: string) => {
      // Critique revision loop edge
      if (source === 'critic' && target === 'researcher') {
        return !!criticOutput ? C.accentPurple : C.outlineVariant;
      }
      return isCompleted(source) ? '#5a6ba8' : C.outlineVariant;
    };

    return [
      // Planner -> Researcher
      { 
        id: 'e-p-r', 
        source: 'planner', 
        target: 'researcher', 
        animated: activeAgentId === 'researcher',
        style: { stroke: getEdgeColor('planner', 'researcher'), strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor('planner', 'researcher') }
      },
      // Researcher -> Coder
      { 
        id: 'e-r-co', 
        source: 'researcher', 
        target: 'coder', 
        animated: activeAgentId === 'coder',
        style: { stroke: getEdgeColor('researcher', 'coder'), strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor('researcher', 'coder') }
      },
      // Coder -> Critic
      { 
        id: 'e-co-cr', 
        source: 'coder', 
        target: 'critic', 
        animated: activeAgentId === 'critic',
        style: { stroke: getEdgeColor('coder', 'critic'), strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor('coder', 'critic') }
      },
      // Critic -> Researcher (The Revision Loop!)
      { 
        id: 'e-cr-r', 
        source: 'critic', 
        target: 'researcher', 
        animated: activeAgentId === 'critic' && !!criticOutput,
        label: 'Applies Revision',
        labelStyle: { fill: C.accentPurple, fontSize: 9, fontWeight: 'bold' },
        style: { stroke: getEdgeColor('critic', 'researcher'), strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor('critic', 'researcher') }
      },
      // Critic -> Notetaker
      { 
        id: 'e-cr-n', 
        source: 'critic', 
        target: 'notetaker', 
        animated: activeAgentId === 'notetaker',
        style: { stroke: getEdgeColor('critic', 'notetaker'), strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor('critic', 'notetaker') }
      },
      // Notetaker -> Quizzer
      { 
        id: 'e-n-q', 
        source: 'notetaker', 
        target: 'quizzer', 
        animated: activeAgentId === 'quizzer',
        style: { stroke: getEdgeColor('notetaker', 'quizzer'), strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor('notetaker', 'quizzer') }
      },
    ];
  }, [activeAgentId, plannerOutput, researcherOutput, coderOutput, criticOutput, notetakerOutput, quizzerOutput]);

  return (
    <div
      className="h-[400px] w-full rounded-2xl border relative overflow-hidden"
      style={{
        borderColor: C.surfaceVariant,
        backgroundColor: C.surfaceContainerLow,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnDrag={false}
        preventScrolling={true}
      >
        <Background color={C.outlineVariant} gap={16} size={1} className="opacity-30" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
