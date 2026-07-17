import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { Question } from '@/lib/quiz/types';

export const dynamic = 'force-dynamic';

function normalizeQuestion(r: any): Question {
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
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const fileId = searchParams.get('fileId');
    const difficulty = searchParams.get('difficulty');
    const count = parseInt(searchParams.get('count') || '10', 10);

    const supabase = await createClient();
    let query = supabase.from('quiz_questions').select('*');

    if (fileId) {
      // Document-based quiz: filter by file_id
      query = query.eq('file_id', fileId);
    } else {
      // Subject/topic-based quiz: filter by subject_id and topic_id
      if (subjectId) query = query.eq('subject_id', subjectId);
      if (topicId) query = query.eq('topic_id', topicId);
    }

    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data: allQuestions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Shuffle and limit
    const shuffled = (allQuestions || [])
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(normalizeQuestion);

    return NextResponse.json({ questions: shuffled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch questions' }, { status: 500 });
  }
}
