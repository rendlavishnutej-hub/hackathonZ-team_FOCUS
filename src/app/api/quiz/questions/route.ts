import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const difficulty = searchParams.get('difficulty');
    const count = parseInt(searchParams.get('count') || '10', 10);

    const supabase = await createClient();
    let query = supabase.from('quiz_questions').select('*');

    if (subjectId) {
      query = query.eq('subjectId', subjectId);
    }
    if (topicId) {
      query = query.eq('topicId', topicId);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: allQuestions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Shuffle and limit to count
    const shuffled = (allQuestions || [])
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    return NextResponse.json({ questions: shuffled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch questions' }, { status: 500 });
  }
}
