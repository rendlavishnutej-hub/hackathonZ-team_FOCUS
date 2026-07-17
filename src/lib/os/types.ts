// ─── FOCUS AI OS — Shared Type System ───────────────────────────────────────
// Central type definitions for the multi-agent orchestration pipeline.

// ── Intent ───────────────────────────────────────────────────────────────────
export type IntentType =
  | 'learn'
  | 'interview_prep'
  | 'project'
  | 'career'
  | 'quiz'
  | 'code'
  | 'research'
  | 'general';

export interface IntentAnalysis {
  intent: IntentType;
  domain: string;          // e.g. "React", "System Design", "Python"
  urgency: 'low' | 'medium' | 'high';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: string;     // Human-readable summary of what the user wants
}

// ── Agent Plan ────────────────────────────────────────────────────────────────
export type AgentId =
  | 'intent'
  | 'planner'
  | 'research'
  | 'teacher'
  | 'curriculum'
  | 'diagram'
  | 'quiz'
  | 'code'
  | 'project'
  | 'memory'
  | 'profile'
  | 'interview'
  | 'career'
  | 'evaluation'
  | 'motivation'
  | 'resource'
  | 'flashcard'
  | 'roadmap'
  | 'report'
  | 'resume'
  | 'summary';

export interface AgentExecutionGroup {
  parallel: boolean;
  agents: AgentId[];
}

export interface AgentPlan {
  intent: IntentAnalysis;
  executionGroups: AgentExecutionGroup[];  // ordered; parallel groups run concurrently
  estimatedDurationMs: number;
}

// ── Agent Result ─────────────────────────────────────────────────────────────
export type AgentStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed';

export interface AgentCard {
  id: AgentId;
  label: string;
  icon: string;       // emoji icon for UI
  status: AgentStatus;
  startedAt?: number;
  completedAt?: number;
  thinking?: string;
  confidence?: number; // e.g. 0.98
  executionTimeMs?: number;
  dependencies?: AgentId[];
  input?: any;
  output?: any;
  error?: string;
}

// ── User Memory ───────────────────────────────────────────────────────────────
export interface UserMemory {
  userId?: string;
  learningHistory: string[];      // Topics completed
  weakConcepts: string[];
  strongConcepts: string[];
  preferredStyle: 'visual' | 'text' | 'code' | 'mixed';
  completedQuizzes: string[];
  interviewHistory: string[];
  resumeText?: string;
  previousPrompts: string[];
  totalHours: number;
  currentStreak: number;
  lastActive?: string;

  // New graph representations
  skillGraph: Record<string, number>;         // e.g. { "React Hooks": 85 }
  learningGraph: string[];                    // chronological node path
  weaknessGraph: string[];                    // topics needing reinforcement
  interviewGraph: Record<string, number>;     // e.g. { "Google": 72 }
  careerGraph: string[];                      // target jobs
  knowledgeGraph: Record<string, string[]>;   // concept parent-to-children relations
}

// ── Workspace Result ─────────────────────────────────────────────────────────
export interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: string;
  resources?: string[];
}

export interface ConceptNode {
  concept: string;
  children: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIdx: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  difficulty: string;
  estimatedHours: number;
  milestones: string[];
}

export interface LearningResource {
  title: string;
  type: 'article' | 'video' | 'book' | 'course' | 'docs';
  url?: string;
  description: string;
}

export interface WorkspaceResult {
  missionId: string;
  prompt: string;
  intent: IntentAnalysis;
  overview: string;
  estimatedTime: string;
  difficulty: string;

  // Learning content
  roadmap?: RoadmapStep[];
  conceptMap?: ConceptNode[];
  notes?: string;
  codeExamples?: Array<{ title: string; language: string; code: string }>;
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  project?: ProjectIdea;
  resources?: LearningResource[];

  // Career/Interview
  careerRelevance?: string;
  jobRoles?: string[];
  salaryRange?: string;
  interviewTips?: string[];
  resumeSuggestions?: string[];

  // Motivation
  motivationalNote?: string;
  nextMission?: string;

  // Meta
  agentsUsed: AgentId[];
  generatedAt: string;
}

// ── OS Orchestration State ────────────────────────────────────────────────────
export type OSStatus = 'idle' | 'analyzing' | 'planning' | 'executing' | 'composing' | 'completed' | 'failed';

export interface OSState {
  sessionId: string;
  prompt: string;
  status: OSStatus;
  phase: string;           // Human-readable current phase label
  intent?: IntentAnalysis;
  plan?: AgentPlan;
  agents: AgentCard[];     // Live status of every selected agent
  result?: WorkspaceResult;
  error?: string;
  startedAt: number;
}
