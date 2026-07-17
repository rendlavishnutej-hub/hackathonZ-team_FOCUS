import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateCareerGuidance, type CareerMessageInput, type CourseContextInput } from '@/lib/geminiService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { message, history, courses } = body as {
      message: string;
      history?: CareerMessageInput[];
      courses?: CourseContextInput[];
    };

    // 3. Validate input
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 4. Call Gemini service
    const reply = await generateCareerGuidance(
      message.trim(),
      history || [],
      courses || []
    );

    // 5. Return response
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('[Career Guidance API Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'An internal error occurred while generating career guidance.' },
      { status: 500 }
    );
  }
}
