'use client';

import React, { useMemo } from 'react';
import { 
  ReactFlow, Background, Controls, 
  Node, Edge, MarkerType 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface AgentGraphProps {
  activeAgentId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  plannerOutput: any | null;
  researcherOutput: any | null;
  coderOutput: any | null;
  criticOutput: any | null;
  quizzerOutput: any | null;
}

export default function AgentGraph({
  activeAgentId,
  status,
  plannerOutput,
  researcherOutput,
  coderOutput,
  criticOutput,
  quizzerOutput,
}: AgentGraphProps) {
  // Generate nodes based on orchestrator state
  const nodes = useMemo<Node[]>(() => {
    const agentList = [
      { id: 'planner', name: 'PLANNER', label: 'Curriculum Architect', x: 100, y: 150, hasOutput: !!plannerOutput },
      { id: 'researcher', name: 'RESEARCHER', label: 'Deep Research Unit', x: 350, y: 50, hasOutput: !!researcherOutput },
      { id: 'coder', name: 'CODER', label: 'Synthesis Coder', x: 600, y: 150, hasOutput: !!coderOutput },
      { id: 'critic', name: 'CRITIC', label: 'Pedagogical Critic', x: 350, y: 250, hasOutput: !!criticOutput },
      { id: 'quizzer', name: 'QUIZZER', label: 'Assessment Engine', x: 850, y: 150, hasOutput: !!quizzerOutput },
    ];

    return agentList.map((agent) => {
      const isActive = activeAgentId === agent.id;
      const isCompleted = agent.hasOutput || (status === 'completed');
      
      let borderClass = 'border-zinc-800 bg-zinc-950/60';
      let titleClass = 'text-zinc-500 font-display';
      let textClass = 'text-zinc-400';
      let glowStyle = {};

      if (isActive) {
        borderClass = 'border-[#7C5CFF] bg-zinc-950 shadow-2xl';
        titleClass = 'text-[#7C5CFF] font-display font-bold animate-pulse';
        textClass = 'text-white';
        glowStyle = {
          boxShadow: '0 0 20px rgba(124, 92, 255, 0.4)',
        };
      } else if (isCompleted) {
        borderClass = 'border-[#22D3D0] bg-[#22D3D0]/5';
        titleClass = 'text-[#22D3D0] font-display';
        textClass = 'text-zinc-300';
      }

      return {
        id: agent.id,
        position: { x: agent.x, y: agent.y },
        data: {
          label: (
            <div 
              className={`p-4 rounded-xl border transition-all duration-300 w-52 glass-panel ${borderClass}`}
              style={glowStyle}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] tracking-widest font-semibold uppercase ${titleClass}`}>
                  {agent.name}
                </span>
                {isActive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7C5CFF] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7C5CFF]"></span>
                  </span>
                )}
                {isCompleted && !isActive && (
                  <span className="text-[10px] text-[#22D3D0] font-bold">✓</span>
                )}
              </div>
              <p className={`text-xs font-semibold ${textClass}`}>{agent.label}</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                {isActive ? 'Processing state...' : isCompleted ? 'Completed' : 'Pending activation'}
              </p>
            </div>
          ),
        },
        type: 'default',
        style: { background: 'none', border: 'none', padding: 0 },
      };
    });
  }, [activeAgentId, status, plannerOutput, researcherOutput, coderOutput, criticOutput, quizzerOutput]);

  // Define graph connections (edges)
  const edges = useMemo<Edge[]>(() => {
    const isCompleted = (id: string) => {
      if (id === 'planner') return !!plannerOutput;
      if (id === 'researcher') return !!researcherOutput;
      if (id === 'coder') return !!coderOutput;
      if (id === 'critic') return !!criticOutput;
      if (id === 'quizzer') return !!quizzerOutput;
      return false;
    };

    const getEdgeColor = (source: string, target: string) => {
      // Critique revision loop edge
      if (source === 'critic' && target === 'researcher') {
        return !!criticOutput ? '#7C5CFF' : 'rgba(255,255,255,0.06)';
      }
      return isCompleted(source) ? '#22D3D0' : 'rgba(255,255,255,0.06)';
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
        labelStyle: { fill: '#7C5CFF', fontSize: 9, fontWeight: 'bold' },
        style: { stroke: getEdgeColor('critic', 'researcher'), strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor('critic', 'researcher') }
      },
      // Critic -> Quizzer
      { 
        id: 'e-cr-q', 
        source: 'critic', 
        target: 'quizzer', 
        animated: activeAgentId === 'quizzer',
        style: { stroke: getEdgeColor('critic', 'quizzer'), strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor('critic', 'quizzer') }
      },
    ];
  }, [activeAgentId, plannerOutput, researcherOutput, coderOutput, criticOutput, quizzerOutput]);

  return (
    <div className="h-[400px] w-full rounded-2xl border border-zinc-900 bg-zinc-950/20 relative overflow-hidden">
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
        <Background color="#7C5CFF" gap={16} size={1} className="opacity-[0.05]" />
        <Controls showInteractive={false} className="!bg-zinc-950 !border-zinc-800 !text-white" />
      </ReactFlow>
    </div>
  );
}
