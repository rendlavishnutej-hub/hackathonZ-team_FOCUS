/**
 * FOCUS Quiz Module — Analytics Computation
 * Pure functions that compute analytics from stored attempt data.
 */

import type {
  QuizAttempt, QuizAttemptAnswer,
  AccuracyEntry, TrendPoint, AnalyticsData,
} from './types';

/**
 * Group attempts and compute accuracy per-key.
 */
function computeAccuracyByKey(
  attempts: QuizAttempt[],
  allAnswers: QuizAttemptAnswer[],
  keyFn: (a: QuizAttempt) => { id: string; name: string },
): AccuracyEntry[] {
  const map = new Map<string, { name: string; attempted: number; correct: number }>();

  for (const attempt of attempts) {
    const key = keyFn(attempt);
    const answersForAttempt = allAnswers.filter(a => a.attemptId === attempt.id);
    const attemptedCount = answersForAttempt.filter(a => !a.isSkipped).length;
    const correctCount = answersForAttempt.filter(a => a.isCorrect).length;

    const existing = map.get(key.id) || { name: key.name, attempted: 0, correct: 0 };
    existing.attempted += attemptedCount;
    existing.correct += correctCount;
    map.set(key.id, existing);
  }

  return Array.from(map.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    attempted: data.attempted,
    correct: data.correct,
    accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
  }));
}

export function computeSubjectAccuracy(
  attempts: QuizAttempt[],
  allAnswers: QuizAttemptAnswer[],
): AccuracyEntry[] {
  return computeAccuracyByKey(attempts, allAnswers, a => ({
    id: a.subjectId,
    name: a.subjectName,
  }));
}

export function computeTopicAccuracy(
  attempts: QuizAttempt[],
  allAnswers: QuizAttemptAnswer[],
): AccuracyEntry[] {
  return computeAccuracyByKey(attempts, allAnswers, a => ({
    id: a.topicId,
    name: a.topicName,
  }));
}

export function computeWeakAreas(accuracyEntries: AccuracyEntry[], threshold = 60): AccuracyEntry[] {
  return accuracyEntries
    .filter(e => e.accuracy < threshold && e.attempted > 0)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function computeStrongAreas(accuracyEntries: AccuracyEntry[], threshold = 85): AccuracyEntry[] {
  return accuracyEntries
    .filter(e => e.accuracy >= threshold && e.attempted > 0)
    .sort((a, b) => b.accuracy - a.accuracy);
}

export function computeImprovementTrend(attempts: QuizAttempt[]): TrendPoint[] {
  return [...attempts]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(a => ({
      date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: a.score,
      percentage: a.percentage,
    }));
}

export function computeStreak(attempts: QuizAttempt[]): number {
  if (attempts.length === 0) return 0;

  const days = new Set(
    attempts.map(a => new Date(a.createdAt).toISOString().slice(0, 10))
  );

  const sortedDays = Array.from(days).sort().reverse();
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (sortedDays.includes(expectedStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function computeAverageResponseTime(allAnswers: QuizAttemptAnswer[]): number {
  const answered = allAnswers.filter(a => !a.isSkipped && a.timeSpentSeconds > 0);
  if (answered.length === 0) return 0;
  const total = answered.reduce((sum, a) => sum + a.timeSpentSeconds, 0);
  return Math.round(total / answered.length);
}

/**
 * Compute full analytics from raw attempt data.
 */
export function computeFullAnalytics(
  attempts: QuizAttempt[],
  allAnswers: QuizAttemptAnswer[],
): AnalyticsData {
  const subjectAccuracy = computeSubjectAccuracy(attempts, allAnswers);
  const topicAccuracy = computeTopicAccuracy(attempts, allAnswers);

  const totalScore = attempts.reduce((s, a) => s + a.score, 0);
  const totalPercentage = attempts.reduce((s, a) => s + a.percentage, 0);

  return {
    subjectAccuracy,
    topicAccuracy,
    weakAreas: computeWeakAreas(topicAccuracy),
    strongAreas: computeStrongAreas(topicAccuracy),
    averageScore: attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0,
    averagePercentage: attempts.length > 0 ? Math.round(totalPercentage / attempts.length) : 0,
    averageResponseTime: computeAverageResponseTime(allAnswers),
    improvementTrend: computeImprovementTrend(attempts),
    quizStreak: computeStreak(attempts),
    totalAttempts: attempts.length,
  };
}
