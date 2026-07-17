import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeFullAnalytics } from '@/lib/quiz/analytics';
import { generateRecommendations } from '@/lib/quiz/recommendations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all attempts
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('studentId', user.id);

    // Fetch all answers
    const attemptIds = (attempts || []).map((a: any) => a.id);
    let allAnswers: any[] = [];

    if (attemptIds.length > 0) {
      const { data: answers } = await supabase
        .from('quiz_attempt_answers')
        .select('*');

      allAnswers = (answers || []).filter((a: any) => attemptIds.includes(a.attemptId));
    }

    const analytics = computeFullAnalytics(attempts || [], allAnswers);
    const recommendations = await generateRecommendations(analytics);

    return NextResponse.json({ recommendations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate recommendations' }, { status: 500 });
  }
}
