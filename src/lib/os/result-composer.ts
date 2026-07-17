import type { WorkspaceResult, AgentId, IntentAnalysis } from './types';

// ─── Result Composer ─────────────────────────────────────────────────────────
// Compiles outputs from all individual agents into the final structured WorkspaceResult.

export function composeWorkspaceResult(
  sessionId: string,
  prompt: string,
  intent: IntentAnalysis,
  agentOutputs: Record<AgentId, any>
): WorkspaceResult {
  // Extract curriculum info
  const curriculum = agentOutputs['curriculum'] || {};
  const research = agentOutputs['research'] || {};
  const code = agentOutputs['code'] || {};
  const quiz = agentOutputs['quiz'] || {};
  const flashcard = agentOutputs['flashcard'] || {};
  const project = agentOutputs['project'] || {};
  const resource = agentOutputs['resource'] || {};
  const career = agentOutputs['career'] || {};
  const roadmap = agentOutputs['roadmap'] || {};
  const resume = agentOutputs['resume'] || {};
  const motivation = agentOutputs['motivation'] || {};
  const summary = agentOutputs['summary'] || {};

  // Formulate lists of agents successfully utilized
  const agentsUsed = Object.keys(agentOutputs).filter(
    key => agentOutputs[key as AgentId] !== undefined
  ) as AgentId[];

  return {
    missionId: sessionId,
    prompt,
    intent,
    overview: curriculum.overview || `Master the concepts of ${intent.domain}.`,
    estimatedTime: curriculum.estimatedTime || '3 hours',
    difficulty: curriculum.difficulty || intent.complexity.charAt(0).toUpperCase() + intent.complexity.slice(1),

    // Roadmaps and structural items
    roadmap: roadmap.roadmap,
    conceptMap: agentOutputs['diagram']?.conceptMap,
    notes: research.notes,
    codeExamples: code.codeExamples,
    quiz: quiz.quiz,
    flashcards: flashcard.flashcards,
    project: project.project,
    resources: resource.resources,

    // Career and Resume items
    careerRelevance: career.careerRelevance,
    jobRoles: career.jobRoles,
    salaryRange: career.salaryRange,
    interviewTips: agentOutputs['evaluation']?.interviewTips,
    resumeSuggestions: resume.resumeSuggestions,

    // Motivation and summary
    motivationalNote: motivation.motivationalNote,
    nextMission: motivation.nextMission || `Deep dive into ${intent.domain} optimizations`,

    // Meta details
    agentsUsed: ['intent', 'planner', ...agentsUsed],
    generatedAt: new Date().toISOString(),
  };
}
