import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import { dictionary, adjacencyGraphs } from '@zxcvbn-ts/language-common';

// Create a single zxcvbn checker instance configured with standard dictionaries
const checker = new ZxcvbnFactory({
  dictionary: {
    ...dictionary,
  },
  graphs: adjacencyGraphs,
});

export interface PasswordStrengthResult {
  score: number; // 0 (weakest) to 4 (strongest)
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimesDisplay: {
    onlineNoThrottle: string;
    onlineThrottled: string;
    offlineSlowHashing: string;
    offlineFastHashing: string;
  };
}

/**
 * Evaluates the strength of a password and returns the score, feedback, and crack time estimates.
 */
export function evaluatePassword(password: string, userInputs: string[] = []): PasswordStrengthResult {
  const result = checker.check(password, userInputs) as any;
  
  return {
    score: result.score ?? 0,
    feedback: {
      warning: result.feedback?.warning || '',
      suggestions: result.feedback?.suggestions || [],
    },
    crackTimesDisplay: {
      onlineNoThrottle: result.crackTimesDisplay?.onlineNoThrottle100perSecond || 'instant',
      onlineThrottled: result.crackTimesDisplay?.onlineAtTwelvePerMonth || 'instant',
      offlineSlowHashing: result.crackTimesDisplay?.offlineSlowHashing1e4perSecond || 'instant',
      offlineFastHashing: result.crackTimesDisplay?.offlineFastHashing1e10perSecond || 'instant',
    },
  };
}
