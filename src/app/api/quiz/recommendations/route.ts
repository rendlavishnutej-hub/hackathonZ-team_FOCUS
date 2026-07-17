import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeFullAnalytics } from '@/lib/quiz/analytics';
import { generateRecommendations } from '@/lib/quiz/recommendations';

export const dynamic = 'force-dynamic';

function normalizeAttempt(r: any) {
  return {
    id: r.id,
    studentId: r.student_id,
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    topicId: r.topic_id,
    topicName: r.topic_name,
    fileId: r.file_id,
    difficulty: r.difficulty,
    totalQuestions: r.total_questions,
    timerEnabled: r.timer_enabled,
    timerDuration: r.timer_duration,
    timeTakenSeconds: r.time_taken_seconds,
    score: r.score,
    maxScore: r.max_score,
    percentage: r.percentage,
    grade: r.grade,
    accuracy: r.accuracy,
    createdAt: r.created_at,
  };
}

function normalizeAnswer(r: any) {
  return {
    id: r.id,
    attemptId: r.attempt_id,
    questionId: r.question_id,
    studentAnswer: r.student_answer,
    isCorrect: r.is_correct,
    isBookmarked: r.is_bookmarked,
    isSkipped: r.is_skipped,
    timeSpentSeconds: r.time_spent_seconds,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rawAttempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('student_id', user.id);

    const attempts = (rawAttempts || []).map(normalizeAttempt);
    const attemptIds = attempts.map((a: any) => a.id);

    let allAnswers: any[] = [];
    if (attemptIds.length > 0) {
      const { data: rawAnswers } = await supabase
        .from('quiz_attempt_answers')
        .select('*')
        .in('attempt_id', attemptIds);
      allAnswers = (rawAnswers || []).map(normalizeAnswer);
    }

    const analytics = computeFullAnalytics(attempts, allAnswers);
    const recommendations = await generateRecommendations(analytics);

    return NextResponse.json({ recommendations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate recommendations' }, { status: 500 });
  }
}
