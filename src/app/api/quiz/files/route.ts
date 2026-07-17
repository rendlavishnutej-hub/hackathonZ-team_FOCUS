import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: files, error } = await supabase
      .from('quiz_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize to camelCase for the client
    const normalized = (files || []).map((f: any) => ({
      id: f.id,
      userId: f.user_id,
      name: f.name,
      type: f.type,
      size: f.size,
      content: f.content,
      rawContent: f.raw_content,
      createdAt: f.created_at,
    }));

    return NextResponse.json({ files: normalized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch files' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, size, content, rawContent } = body;

    if (!name || !type || size === undefined) {
      return NextResponse.json({ error: 'Missing required fields: name, type, size' }, { status: 400 });
    }

    const fileId = 'file-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
    const newFile = {
      id: fileId,
      user_id: user.id,
      name,
      type,
      size,
      content: content || '',
      raw_content: rawContent || '',
    };

    const { error } = await supabase.from('quiz_files').insert(newFile);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      file: {
        id: fileId,
        userId: user.id,
        name,
        type,
        size,
        content: content || '',
        rawContent: rawContent || '',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload file' }, { status: 500 });
  }
}
