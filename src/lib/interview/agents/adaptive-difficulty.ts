// ============================================================
// Adaptive Difficulty Agent
// ============================================================
// Dynamically adjusts interview difficulty based on the
// candidate's recent performance trend. Prevents the interview
// from being too easy or too punishing.
// ============================================================

import type { AdaptiveDifficultyState } from '@/lib/interview/types';

// ─── Difficulty Levels (ordered) ─────────────────────────────
const LEVELS = ['Beginner', 'Medium', 'Senior', 'Expert'] as const;
type DifficultyLevel = typeof LEVELS[number];

// ─── Thresholds ──────────────────────────────────────────────
const UPGRADE_THRESHOLD = 78;      // avg score above this → level up
const DOWNGRADE_THRESHOLD = 50;    // avg score below this → level down
const CONSECUTIVE_TRIGGER = 2;     // how many consecutive high/low before adjusting
const MIN_QUESTIONS_BEFORE_ADAPT = 2; // don't adapt on first 2 questions

/**
 * Creates the initial adaptive difficulty state.
 */
export function createAdaptiveDifficultyState(
  initialDifficulty: string
): AdaptiveDifficultyState {
  const level = LEVELS.includes(initialDifficulty as DifficultyLevel)
    ? (initialDifficulty as DifficultyLevel)
    : 'Medium';

  return {
    currentLevel: level,
    consecutiveHighScores: 0,
    consecutiveLowScores: 0,
    lastAdjustedAt: -1,
  };
}

/**
 * Adjusts difficulty based on the latest evaluation score.
 *
 * Returns updated state + optional hint text if difficulty dropped.
 */
export function adjustDifficulty(
  state: AdaptiveDifficultyState,
  latestScore: number,
  questionIndex: number
): {
  updatedState: AdaptiveDifficultyState;
  difficultyChanged: boolean;
  shouldHint: boolean;
  hintText?: string;
} {
  // Don't adapt too early
  if (questionIndex < MIN_QUESTIONS_BEFORE_ADAPT) {
    return {
      updatedState: state,
      difficultyChanged: false,
      shouldHint: false,
    };
  }

  const currentIdx = LEVELS.indexOf(state.currentLevel);
  let newConsecutiveHigh = latestScore >= UPGRADE_THRESHOLD
    ? state.consecutiveHighScores + 1
    : 0;
  let newConsecutiveLow = latestScore <= DOWNGRADE_THRESHOLD
    ? state.consecutiveLowScores + 1
    : 0;

  let newLevel = state.currentLevel;
  let changed = false;
  let shouldHint = false;
  let hintText: string | undefined;

  // Upgrade: candidate is crushing it
  if (newConsecutiveHigh >= CONSECUTIVE_TRIGGER && currentIdx < LEVELS.length - 1) {
    newLevel = LEVELS[currentIdx + 1];
    newConsecutiveHigh = 0;
    changed = true;
  }

  // Downgrade: candidate is struggling
  if (newConsecutiveLow >= CONSECUTIVE_TRIGGER && currentIdx > 0) {
    newLevel = LEVELS[currentIdx - 1];
    newConsecutiveLow = 0;
    changed = true;
    shouldHint = true;
    hintText = `I notice this is a tough area for you. Let me adjust the difficulty slightly. Take your time with the next question.`;
  }

  return {
    updatedState: {
      currentLevel: newLevel,
      consecutiveHighScores: newConsecutiveHigh,
      consecutiveLowScores: newConsecutiveLow,
      lastAdjustedAt: changed ? questionIndex : state.lastAdjustedAt,
    },
    difficultyChanged: changed,
    shouldHint,
    hintText,
  };
}

/**
 * Returns a difficulty descriptor string for prompt injection.
 */
export function getDifficultyDescriptor(level: string): string {
  switch (level) {
    case 'Beginner':
      return 'Ask foundational questions. Expect basic understanding. Provide encouragement.';
    case 'Medium':
      return 'Ask moderate questions requiring working knowledge. Expect concrete examples.';
    case 'Senior':
      return 'Ask deep questions requiring trade-off analysis, architecture thinking, and real-world experience. Expect nuanced answers.';
    case 'Expert':
      return 'Ask Staff/Principal-level questions. Expect systems-level thinking, mentoring signals, and strategic vision. Challenge strongly.';
    default:
      return 'Ask balanced questions appropriate for the role.';
  }
}
