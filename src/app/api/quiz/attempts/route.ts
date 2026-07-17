import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

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
      // Fetch single attempt with its answers
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('studentId', user.id)
        .single();

      if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }

      const { data: answers } = await supabase
        .from('quiz_attempt_answers')
        .select('*')
        .eq('attemptId', attemptId);

      // Fetch associated questions
      const questionIds = (answers || []).map((a: any) => a.questionId);
      const { data: allQuestions } = await supabase
        .from('quiz_questions')
        .select('*');

      const questions = (allQuestions || []).filter((q: any) => questionIds.includes(q.id));

      return NextResponse.json({ attempt, answers: answers || [], questions });
    }

    // Fetch all attempts for the user, sorted by date descending
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('studentId', user.id)
      .order('createdAt', { ascending: false });

    return NextResponse.json({ attempts: attempts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch attempts' }, { status: 500 });
  }
}
