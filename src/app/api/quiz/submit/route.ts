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

    // Create attempt record (snake_case for Supabase)
    const attemptId = 'attempt-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
    const attemptRow = {
      id: attemptId,
      student_id: user.id,
      subject_id: config.subjectId,
      subject_name: config.subjectName,
      topic_id: config.topicId,
      topic_name: config.topicName,
      file_id: config.fileId || null,
      difficulty: config.difficulty,
      total_questions: result.totalQuestions,
      timer_enabled: config.timerEnabled || false,
      timer_duration: config.timerDuration || 0,
      time_taken_seconds: timeTakenSeconds || 0,
      score: result.score,
      max_score: result.maxScore,
      percentage: result.percentage,
      grade: result.grade,
      accuracy: result.accuracy,
    };

    const { error: insertErr } = await supabase.from('quiz_attempts').insert(attemptRow);
    if (insertErr) {
      console.error('Attempt insert error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Store individual answers (snake_case)
    const attemptAnswerRows = result.perQuestion.map((pq, idx) => ({
      id: 'ans-' + Math.random().toString(36).substring(2, 15) + '-' + idx,
      attempt_id: attemptId,
      question_id: pq.questionId,
      student_answer: pq.studentAnswer,
      is_correct: pq.isCorrect,
      is_bookmarked: pq.isBookmarked,
      is_skipped: pq.isSkipped,
      time_spent_seconds: pq.timeSpentSeconds,
    }));

    for (const ans of attemptAnswerRows) {
      await supabase.from('quiz_attempt_answers').insert(ans);
    }

    // Normalize attempt back to camelCase for client
    const attempt = {
      id: attemptId,
      studentId: user.id,
      subjectId: config.subjectId,
      subjectName: config.subjectName,
      topicId: config.topicId,
      topicName: config.topicName,
      fileId: config.fileId || null,
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

    const answers_camel = attemptAnswerRows.map(a => ({
      id: a.id,
      attemptId: a.attempt_id,
      questionId: a.question_id,
      studentAnswer: a.student_answer,
      isCorrect: a.is_correct,
      isBookmarked: a.is_bookmarked,
      isSkipped: a.is_skipped,
      timeSpentSeconds: a.time_spent_seconds,
    }));

    return NextResponse.json({
      attempt,
      answers: answers_camel,
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
