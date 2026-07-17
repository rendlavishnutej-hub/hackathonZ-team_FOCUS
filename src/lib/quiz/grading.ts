/**
 * FOCUS Quiz Module — Grading Engine
 * Pure utility functions for answer checking and quiz scoring.
 */

import type {
  Question, QuestionType,
  MCQAnswer, FillBlankAnswer, TrueFalseAnswer, MatchAnswer, OneWordAnswer,
} from './types';

/**
 * Normalise a string for fuzzy comparison:
 * trim, lowercase, collapse whitespace.
 */
function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check whether a student's answer is correct for a given question.
 */
export function checkAnswer(question: Question, studentAnswer: any): boolean {
  if (studentAnswer === undefined || studentAnswer === null) return false;

  switch (question.type as QuestionType) {
    case 'mcq': {
      const correct = (question.correctAnswer as MCQAnswer).correct;
      return Number(studentAnswer) === correct;
    }

    case 'true-false': {
      const correct = (question.correctAnswer as TrueFalseAnswer).correct;
      return Boolean(studentAnswer) === correct;
    }

    case 'one-word': {
      const ans = question.correctAnswer as OneWordAnswer;
      const norm = normalise(String(studentAnswer));
      if (normalise(ans.correct) === norm) return true;
      return (ans.alternatives || []).some(alt => normalise(alt) === norm);
    }

    case 'fill-blank': {
      const ans = question.correctAnswer as FillBlankAnswer;
      const studentAnswers: string[] = Array.isArray(studentAnswer) ? studentAnswer : [String(studentAnswer)];
      if (studentAnswers.length !== ans.answers.length) return false;
      return ans.answers.every((expected, i) => {
        const norm = normalise(studentAnswers[i] || '');
        if (normalise(expected) === norm) return true;
        const alts = ans.alternatives?.[i] || [];
        return alts.some(alt => normalise(alt) === norm);
      });
    }

    case 'match': {
      const ans = question.correctAnswer as MatchAnswer;
      const studentMapping: number[] = Array.isArray(studentAnswer) ? studentAnswer : [];
      if (studentMapping.length !== ans.mapping.length) return false;
      return ans.mapping.every((correct, i) => studentMapping[i] === correct);
    }

    default:
      return false;
  }
}

/**
 * Letter grade from percentage.
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 95) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 55) return 'C';
  return 'F';
}

/**
 * Grade a full quiz attempt and return aggregate metrics.
 */
export function gradeQuiz(
  questions: Question[],
  answers: Record<string, any>, // questionId → student answer
  bookmarks: string[],
  questionTimes: Record<string, number>,
): {
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  accuracy: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  unanswered: number;
  perQuestion: Array<{
    questionId: string;
    studentAnswer: any;
    isCorrect: boolean;
    isBookmarked: boolean;
    isSkipped: boolean;
    timeSpentSeconds: number;
  }>;
} {
  let score = 0;
  let maxScore = 0;
  let correct = 0;
  let wrong = 0;
  let attempted = 0;
  let unanswered = 0;
  const bookmarkSet = new Set(bookmarks);

  const perQuestion = questions.map(q => {
    maxScore += q.marks;
    const studentAnswer = answers[q.id];
    const isSkipped = studentAnswer === undefined || studentAnswer === null || studentAnswer === '';
    const isBookmarked = bookmarkSet.has(q.id);
    const timeSpentSeconds = questionTimes[q.id] || 0;

    if (isSkipped) {
      unanswered++;
      return { questionId: q.id, studentAnswer: null, isCorrect: false, isBookmarked, isSkipped: true, timeSpentSeconds };
    }

    attempted++;
    const isCorrect = checkAnswer(q, studentAnswer);
    if (isCorrect) {
      correct++;
      score += q.marks;
    } else {
      wrong++;
      score -= q.negativeMarks;
    }

    return { questionId: q.id, studentAnswer, isCorrect, isBookmarked, isSkipped: false, timeSpentSeconds };
  });

  // Don't let score go negative
  score = Math.max(0, score);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const grade = calculateGrade(percentage);

  return {
    score,
    maxScore,
    percentage,
    grade,
    accuracy,
    totalQuestions: questions.length,
    attempted,
    correct,
    wrong,
    unanswered,
    perQuestion,
  };
}
