import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

function normalizeQuestion(r: any) {
  return {
    id: r.id,
    subjectId: r.subject_id,
    topicId: r.topic_id,
    fileId: r.file_id,
    difficulty: r.difficulty,
    type: r.type,
    question: r.question,
    payload: r.payload,
    correctAnswer: r.correct_answer,
    explanation: r.explanation,
    marks: r.marks,
    negativeMarks: r.negative_marks,
  };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');

    if (attemptId) {
      // Fetch single attempt with answers and questions
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('student_id', user.id)
        .single();

      if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }

      const { data: rawAnswers } = await supabase
        .from('quiz_attempt_answers')
        .select('*')
        .eq('attempt_id', attemptId);

      // Fetch associated questions by their IDs
      const questionIds = (rawAnswers || []).map((a: any) => a.question_id);
      const { data: rawQuestions } = await supabase
        .from('quiz_questions')
        .select('*')
        .in('id', questionIds.length > 0 ? questionIds : ['__none__']);

      return NextResponse.json({
        attempt: normalizeAttempt(attempt),
        answers: (rawAnswers || []).map(normalizeAnswer),
        questions: (rawQuestions || []).map(normalizeQuestion),
      });
    }

    // Fetch all attempts sorted newest first
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ attempts: (attempts || []).map(normalizeAttempt) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch attempts' }, { status: 500 });
  }
}
