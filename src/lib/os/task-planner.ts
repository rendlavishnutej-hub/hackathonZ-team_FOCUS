import type { IntentAnalysis, IntentType, AgentId, AgentExecutionGroup, AgentPlan } from './types';

// ─── Agent activation rules per intent ────────────────────────────────────────
// Defines which agents are activated for each intent, in execution groups.
// Groups with parallel:true run concurrently. parallel:false = sequential.

const INTENT_PLANS: Record<IntentType, AgentExecutionGroup[]> = {
  learn: [
    { parallel: false, agents: ['memory'] },
    { parallel: true,  agents: ['curriculum', 'research', 'diagram'] },
    { parallel: true,  agents: ['code', 'quiz', 'flashcard'] },
    { parallel: true,  agents: ['project', 'resource'] },
    { parallel: false, agents: ['motivation'] },
    { parallel: false, agents: ['summary'] },
  ],
  interview_prep: [
    { parallel: false, agents: ['memory'] },
    { parallel: true,  agents: ['roadmap', 'evaluation', 'career'] },
    { parallel: true,  agents: ['quiz', 'code'] },
    { parallel: true,  agents: ['resume', 'resource'] },
    { parallel: false, agents: ['motivation'] },
    { parallel: false, agents: ['summary'] },
  ],
  project: [
    { parallel: false, agents: ['memory'] },
    { parallel: true,  agents: ['research', 'code'] },
    { parallel: false, agents: ['project'] },
    { parallel: true,  agents: ['resource', 'motivation'] },
    { parallel: false, agents: ['summary'] },
  ],
  career: [
    { parallel: false, agents: ['memory'] },
    { parallel: true,  agents: ['career', 'roadmap'] },
    { parallel: false, agents: ['resume'] },
    { parallel: true,  agents: ['resource', 'motivation'] },
    { parallel: false, agents: ['summary'] },
  ],
  quiz: [
    { parallel: false, agents: ['memory'] },
    { parallel: false, agents: ['research'] },
    { parallel: true,  agents: ['quiz', 'flashcard'] },
    { parallel: false, agents: ['summary'] },
  ],
  code: [
    { parallel: false, agents: ['memory'] },
    { parallel: false, agents: ['research'] },
    { parallel: false, agents: ['code'] },
    { parallel: true,  agents: ['quiz', 'resource'] },
    { parallel: false, agents: ['summary'] },
  ],
  research: [
    { parallel: false, agents: ['memory'] },
    { parallel: true,  agents: ['research', 'diagram'] },
    { parallel: true,  agents: ['resource', 'flashcard'] },
    { parallel: false, agents: ['career'] },
    { parallel: false, agents: ['summary'] },
  ],
  general: [
    { parallel: false, agents: ['memory'] },
    { parallel: true,  agents: ['research', 'motivation'] },
    { parallel: false, agents: ['summary'] },
  ],
};

// Estimated durations (ms) per intent based on agent count and LLM latency
const DURATION_MAP: Record<IntentType, number> = {
  learn:           22000,
  interview_prep:  25000,
  project:         18000,
  career:          16000,
  quiz:            12000,
  code:            14000,
  research:        15000,
  general:          9000,
};

// ─── Task Planner ─────────────────────────────────────────────────────────────
export function buildAgentPlan(intent: IntentAnalysis): AgentPlan {
  const groups = INTENT_PLANS[intent.intent] ?? INTENT_PLANS.general;

  return {
    intent,
    executionGroups: groups,
    estimatedDurationMs: DURATION_MAP[intent.intent] ?? 12000,
  };
}

// Returns flat list of all agents in the plan
export function getAllAgentsInPlan(plan: AgentPlan): AgentId[] {
  return plan.executionGroups.flatMap(g => g.agents);
}
