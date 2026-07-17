import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeFullAnalytics } from '@/lib/quiz/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all attempts for the user
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('studentId', user.id);

    // Fetch all answers for the user's attempts
    const attemptIds = (attempts || []).map((a: any) => a.id);
    let allAnswers: any[] = [];

    if (attemptIds.length > 0) {
      const { data: answers } = await supabase
        .from('quiz_attempt_answers')
        .select('*');

      allAnswers = (answers || []).filter((a: any) => attemptIds.includes(a.attemptId));
    }

    const analytics = computeFullAnalytics(attempts || [], allAnswers);

    return NextResponse.json({ analytics });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to compute analytics' }, { status: 500 });
  }
}
