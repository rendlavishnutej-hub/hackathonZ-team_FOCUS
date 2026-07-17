import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    const supabase = await createClient();
    let query = supabase.from('quiz_topics').select('*');

    // DB column is subject_id (snake_case)
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data: topics, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize to camelCase for the client
    const normalized = (topics || []).map((t: any) => ({
      id: t.id,
      subjectId: t.subject_id,
      name: t.name,
    }));

    return NextResponse.json({ topics: normalized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch topics' }, { status: 500 });
  }
}
