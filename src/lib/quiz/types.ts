/**
 * FOCUS Quiz Module — Shared Type Definitions
 * All quiz-related interfaces live here as the single source of truth.
 */

// ── Entities ────────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
}

export interface QuizFile {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  content: string; // extracted text content
  rawContent?: string; // base64 representation of raw document
  createdAt: string;
}

// ── Question Types ──────────────────────────────────────────────────────────

export type QuestionType = 'mcq' | 'fill-blank' | 'true-false' | 'match' | 'one-word';

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Type-specific payload shapes.
 * The `payload` and `correctAnswer` fields on Question are JSON
 * whose shape depends on the question's `type`.
 */

export interface MCQPayload {
  options: string[]; // exactly 4
}

export interface FillBlankPayload {
  /** The sentence with ___ placeholder(s) */
  text: string;
}

export interface TrueFalsePayload {
  statement: string;
}

export interface MatchPayload {
  leftItems: string[];
  rightItems: string[]; // shuffled for display
}

export interface OneWordPayload {
  /** Intentionally empty — question text is in the top-level `question` field */
}

// Correct answer shapes keyed by type
export interface MCQAnswer {
  correct: number; // index into options[]
}

export interface FillBlankAnswer {
  answers: string[]; // one per blank; alternatives arrays optional
  alternatives?: string[][]; // per-blank acceptable alternatives
}

export interface TrueFalseAnswer {
  correct: boolean;
}

export interface MatchAnswer {
  /** mapping[i] = index into rightItems that matches leftItems[i] */
  mapping: number[];
}

export interface OneWordAnswer {
  correct: string;
  alternatives?: string[];
}

// ── Question ────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  fileId?: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string; // the question text
  payload: MCQPayload | FillBlankPayload | TrueFalsePayload | MatchPayload | OneWordPayload;
  correctAnswer: MCQAnswer | FillBlankAnswer | TrueFalseAnswer | MatchAnswer | OneWordAnswer;
  explanation: string;
  marks: number;
  negativeMarks: number;
}

// ── Quiz Configuration ──────────────────────────────────────────────────────

export interface QuizConfig {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  fileId?: string;
  difficulty: Difficulty;
  questionCount: number;
  timerEnabled: boolean;
  /** Total quiz time in seconds (only relevant when timerEnabled=true) */
  timerDuration: number;
}

// ── Quiz State (in-flight) ──────────────────────────────────────────────────

export type PaletteStatus = 'not-visited' | 'answered' | 'not-answered' | 'marked' | 'answered-marked';

export interface QuizDraft {
  sessionId: string;
  config: QuizConfig;
  questions: Question[];
  answers: Record<string, any>; // questionId → student answer (type-specific)
  bookmarks: string[]; // questionId[]
  currentIndex: number;
  timeRemaining: number; // seconds
  questionTimes: Record<string, number>; // questionId → seconds spent
  startedAt: string; // ISO timestamp
}

// ── Attempt / Result ────────────────────────────────────────────────────────

export interface QuizAttempt {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  fileId?: string;
  difficulty: Difficulty;
  totalQuestions: number;
  timerEnabled: boolean;
  timerDuration: number;
  timeTakenSeconds: number;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  accuracy: number;
  createdAt: string;
}

export interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  studentAnswer: any;
  isCorrect: boolean;
  isBookmarked: boolean;
  isSkipped: boolean;
  timeSpentSeconds: number;
}

export interface QuizResult {
  attempt: QuizAttempt;
  answers: QuizAttemptAnswer[];
  questions: Question[];
}

// ── Analytics ───────────────────────────────────────────────────────────────

export interface AccuracyEntry {
  id: string;
  name: string;
  attempted: number;
  correct: number;
  accuracy: number; // 0-100
}

export interface TrendPoint {
  date: string; // ISO or display date
  score: number;
  percentage: number;
}

export interface AnalyticsData {
  subjectAccuracy: AccuracyEntry[];
  topicAccuracy: AccuracyEntry[];
  weakAreas: AccuracyEntry[];
  strongAreas: AccuracyEntry[];
  averageScore: number;
  averagePercentage: number;
  averageResponseTime: number; // seconds
  improvementTrend: TrendPoint[];
  quizStreak: number;
  totalAttempts: number;
}

// ── Recommendations ─────────────────────────────────────────────────────────

export interface RecommendedTopic {
  topicId: string;
  topicName: string;
  subjectName: string;
  accuracy: number;
  reason: string;
}

export interface SuggestedQuiz {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  difficulty: Difficulty;
  reason: string;
}

export interface Recommendations {
  topicsToRevise: RecommendedTopic[];
  suggestedQuizzes: SuggestedQuiz[];
  learningResources: { topic: string; resources: string[] }[];
  nextSteps: string; // natural language summary
}
