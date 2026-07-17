import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    const supabase = await createClient();
    let query = supabase.from('quiz_topics').select('*');

    if (subjectId) {
      query = query.eq('subjectId', subjectId);
    }

    const { data: topics, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ topics: topics || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch topics' }, { status: 500 });
  }
}
