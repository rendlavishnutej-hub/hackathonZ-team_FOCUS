import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: subjects, error } = await supabase.from('quiz_subjects').select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subjects: subjects || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch subjects' }, { status: 500 });
  }
}
