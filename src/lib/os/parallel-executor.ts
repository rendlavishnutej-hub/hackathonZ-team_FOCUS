import type { AgentId, AgentPlan, AgentCard, IntentAnalysis } from './types';
import {
  runResearchAgent, runCurriculumAgent, runDiagramAgent, runQuizAgent,
  runCodeAgent, runFlashcardAgent, runProjectAgent, runResourceAgent,
  runCareerAgent, runRoadmapAgent, runEvaluationAgent, runResumeAgent,
  runMotivationAgent, runSummaryAgent, AGENT_META,
} from './agent-registry';

type OnAgentUpdate = (agentId: AgentId, status: AgentCard['status'], output?: any) => void;

// ─── Execute a single agent ───────────────────────────────────────────────────
async function executeAgent(
  agentId: AgentId,
  intent: IntentAnalysis,
  outputs: Record<string, any>,
  onUpdate: OnAgentUpdate
): Promise<any> {
  onUpdate(agentId, 'running');
  try {
    let result: any;
    switch (agentId) {
      case 'memory':     result = { memoryLoaded: true }; break; // handled by memory-manager
      case 'research':   result = await runResearchAgent(intent); break;
      case 'curriculum': result = await runCurriculumAgent(intent); break;
      case 'diagram':    result = await runDiagramAgent(intent); break;
      case 'quiz':       result = await runQuizAgent(intent, outputs['research']?.notes); break;
      case 'code':       result = await runCodeAgent(intent); break;
      case 'flashcard':  result = await runFlashcardAgent(intent); break;
      case 'project':    result = await runProjectAgent(intent); break;
      case 'resource':   result = await runResourceAgent(intent); break;
      case 'career':     result = await runCareerAgent(intent); break;
      case 'roadmap':    result = await runRoadmapAgent(intent); break;
      case 'evaluation': result = await runEvaluationAgent(intent); break;
      case 'resume':     result = await runResumeAgent(intent); break;
      case 'motivation': result = await runMotivationAgent(intent); break;
      case 'summary':    result = await runSummaryAgent(intent, outputs); break;
      // meta-agents (intent, planner, teacher) are handled by the orchestrator directly
      default:           result = {}; break;
    }
    onUpdate(agentId, 'completed', result);
    return result;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[FOCUS OS] Agent "${agentId}" failed:`, errMsg);
    onUpdate(agentId, 'failed');
    return null;
  }
}

// ─── Parallel Executor ────────────────────────────────────────────────────────
export async function executePlan(
  plan: AgentPlan,
  onUpdate: OnAgentUpdate
): Promise<Record<AgentId, any>> {
  const outputs: Record<string, any> = {};

  for (const group of plan.executionGroups) {
    if (group.parallel) {
      // Run all agents in this group concurrently
      const results = await Promise.all(
        group.agents.map(agentId =>
          executeAgent(agentId, plan.intent, outputs, onUpdate).then(result => ({
            agentId,
            result,
          }))
        )
      );
      results.forEach(({ agentId, result }) => {
        if (result !== null) outputs[agentId] = result;
      });
    } else {
      // Run agents in this group sequentially
      for (const agentId of group.agents) {
        const result = await executeAgent(agentId, plan.intent, outputs, onUpdate);
        if (result !== null) outputs[agentId] = result;
      }
    }
  }

  return outputs as Record<AgentId, any>;
}

// ─── Build initial agent cards for UI ────────────────────────────────────────
export function buildInitialAgentCards(plan: AgentPlan): AgentCard[] {
  const allAgents = plan.executionGroups.flatMap(g => g.agents);
  return allAgents.map(id => ({
    id,
    label: AGENT_META[id]?.label ?? id,
    icon: AGENT_META[id]?.icon ?? '🤖',
    status: 'pending' as const,
  }));
}
