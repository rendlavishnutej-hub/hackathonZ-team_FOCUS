import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { gradeQuiz } from '@/lib/quiz/grading';
import type { Question } from '@/lib/quiz/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { config, questions, answers, bookmarks, questionTimes, timeTakenSeconds } = body;

    if (!config || !questions || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Grade the quiz
    const result = gradeQuiz(
      questions as Question[],
      answers,
      bookmarks || [],
      questionTimes || {},
    );

    // Create attempt record
    const attemptId = 'attempt-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
    const attempt = {
      id: attemptId,
      studentId: user.id,
      subjectId: config.subjectId,
      subjectName: config.subjectName,
      topicId: config.topicId,
      topicName: config.topicName,
      difficulty: config.difficulty,
      totalQuestions: result.totalQuestions,
      timerEnabled: config.timerEnabled || false,
      timerDuration: config.timerDuration || 0,
      timeTakenSeconds: timeTakenSeconds || 0,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      grade: result.grade,
      accuracy: result.accuracy,
      createdAt: new Date().toISOString(),
    };

    // Store the attempt
    await supabase.from('quiz_attempts').insert(attempt);

    // Store individual answers
    const attemptAnswers = result.perQuestion.map((pq, idx) => ({
      id: 'ans-' + Math.random().toString(36).substring(2, 15) + '-' + idx,
      attemptId,
      questionId: pq.questionId,
      studentAnswer: pq.studentAnswer,
      isCorrect: pq.isCorrect,
      isBookmarked: pq.isBookmarked,
      isSkipped: pq.isSkipped,
      timeSpentSeconds: pq.timeSpentSeconds,
    }));

    for (const ans of attemptAnswers) {
      await supabase.from('quiz_attempt_answers').insert(ans);
    }

    return NextResponse.json({
      attempt,
      answers: attemptAnswers,
      result: {
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
        grade: result.grade,
        accuracy: result.accuracy,
        totalQuestions: result.totalQuestions,
        attempted: result.attempted,
        correct: result.correct,
        wrong: result.wrong,
        unanswered: result.unanswered,
      },
    });
  } catch (err: any) {
    console.error('Quiz submit error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit quiz' }, { status: 500 });
  }
}
