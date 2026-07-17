// ============================================================
// FOCUS AI Interview Engine — Shared Type Definitions
// ============================================================
// All TypeScript interfaces used across the multi-agent
// interview system. Import from here, never re-declare.
// ============================================================

// ─── Logging ────────────────────────────────────────────────
export interface AgentLog {
  agentId: string;
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

// ─── Evaluation ─────────────────────────────────────────────
export interface EvaluationResult {
  /** Overall score 0-100 */
  score: number;
  communication: number;
  technicalAccuracy: number;
  confidence: number;
  grammar: number;
  problemSolving: number;
  depth: number;
  clarity: number;
  professionalism: number;
  leadershipSignals: number;
  /** AI-generated paragraph feedback */
  feedback: string;
  /** Topics detected in the answer */
  topicsCovered: string[];
  /** Optional short follow-up hint from evaluator */
  suggestedFollowUp?: string;
}

// ─── Q&A History ────────────────────────────────────────────
export interface InterviewHistoryItem {
  question: string;
  answer: string;
  evaluation?: EvaluationResult;
  isFollowUp: boolean;
  questionIndex: number;
  /** Unix timestamp when question was asked */
  askedAt: number;
  /** Unix timestamp when answer was submitted */
  answeredAt?: number;
}

// ─── Resume Profile ──────────────────────────────────────────
export interface ResumeProfile {
  skills: string[];
  technologies: string[];
  projectHighlights: string[];
  experienceYears: number;
  educationLevel: string;
  strongAreas: string[];
  weakAreas: string[];
  /** Free-text summary for prompt injection */
  summary: string;
}

// ─── Knowledge Graph ─────────────────────────────────────────
export interface TopicNode {
  topic: string;
  known: boolean;
  confidence: number;        // 0-100
  timesAsked: number;
  mistakesMade: string[];
  lastSeenAt?: number;       // question index
}

export type KnowledgeGraph = Record<string, TopicNode>;

// ─── Company Profile ─────────────────────────────────────────
export interface CompanyProfile {
  name: string;
  interviewStyle: string;
  evaluationWeights: {
    technical: number;       // sum of all weights should be 100
    behavioral: number;
    communication: number;
    leadership: number;
    problemSolving: number;
  };
  questionPriorities: string[];  // ordered list of focus areas
  systemInstruction: string;     // injected into every LLM call
  maxQuestions: {
    technical: number;
    behavioral: number;
    systemDesign: number;
    hr: number;
    coding: number;
    product: number;
    aptitude: number;
    custom: number;
  };
}

// ─── Candidate Profile (evolves throughout interview) ─────────
export interface CandidateProfile {
  resumeProfile?: ResumeProfile;
  /** Topics clearly mastered */
  strongTopics: string[];
  /** Topics with low scores or errors */
  weakTopics: string[];
  /** Chronological confidence scores (1 per question) */
  confidenceTrend: number[];
  /** Communication score trend */
  communicationTrend: number[];
  /** Total hints given */
  hintsReceived: number;
  /** Overall score trend */
  scoreTrend: number[];
  /** Detected leadership signals */
  leadershipSignals: string[];
  /** Notes on communication style */
  communicationNotes: string[];
}

// ─── Adaptive Difficulty ─────────────────────────────────────
export interface AdaptiveDifficultyState {
  currentLevel: 'Beginner' | 'Medium' | 'Senior' | 'Expert';
  consecutiveHighScores: number;
  consecutiveLowScores: number;
  lastAdjustedAt: number;    // question index
}

// ─── Recommended Project ─────────────────────────────────────
export interface RecommendedProject {
  title: string;
  description: string;
  tech: string[];
  estimatedWeeks: number;
}

// ─── Learning Resource ───────────────────────────────────────
export interface LearningResource {
  topic: string;
  resourceName: string;
  type: 'Book' | 'Course' | 'Practice' | 'Documentation';
  priority: 'High' | 'Medium' | 'Low';
}

// ─── Final Report ────────────────────────────────────────────
export interface FinalReport {
  overallScore: number;
  skillRadar: {
    communication: number;
    technical: number;
    behavioral: number;
    confidence: number;
    problemSolving: number;
  };
  // New analytics fields
  leadershipScore: number;
  behavioralScore: number;
  companyReadiness: number;          // 0-10 scale
  probabilityOfSelection: number;    // 0-100 %
  estimatedLevel: 'Intern' | 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
  confidenceTrend: number[];         // per-question confidence scores
  scoreTrend: number[];              // per-question overall scores
  timeAnalysis: string;
  // Strengths / weaknesses
  strongAreas: string[];
  weakAreas: string[];
  topicsToLearn: string[];
  recommendedProjects: RecommendedProject[];
  learningResources: LearningResource[];
  practiceQuestions: string[];       // 3-5 practice questions per weak area
  careerCoachFeedback: string;
  reInterviewRecommendation: string;
  learningTimeline: string;          // e.g. "4-6 weeks to reach Senior bar"
}

// ─── Core Interview State ────────────────────────────────────
export interface InterviewState {
  // Identity
  sessionId: string;
  role: string;
  company: string;
  difficulty: string;
  interviewType: string;
  resumeText?: string;

  // History & progress
  history: InterviewHistoryItem[];
  currentQuestionIndex: number;
  maxQuestions: number;
  followUpCount: number;
  hintsGiven: number;

  // Question hashing (prevent repeats)
  questionHashes: string[];

  // Agent state
  activeAgentId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  logs: AgentLog[];

  // Current turn outputs
  nextQuestion?: string;
  spokenPrompt?: string;

  // Rich context (populated on init)
  companyProfile?: CompanyProfile;
  candidateProfile?: CandidateProfile;
  knowledgeGraph?: KnowledgeGraph;
  adaptiveDifficulty?: AdaptiveDifficultyState;
  resumeAnalysis?: string;
  companyStyle?: string;

  // Last evaluation (for frontend display)
  lastEvaluation?: EvaluationResult;

  // Final output
  finalReport?: FinalReport;
}
