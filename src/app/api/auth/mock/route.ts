import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getMockDb, writeMockDb, generateUUID, 
  createMockToken, getSessionUser, runMockQuery 
} from '@/utils/supabase/mockDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const cookieStore = await cookies();

    if (action === 'getUser') {
      const user = await getSessionUser(cookieStore);
      if (!user) {
        return NextResponse.json({ data: { user: null }, error: null });
      }
      return NextResponse.json({ data: { user }, error: null });

    } else if (action === 'signUp') {
      const { email, password, displayName } = body;
      const db = getMockDb();

      if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return NextResponse.json({ error: { message: 'A user with this email already exists' } });
      }

      const userId = generateUUID();
      const user = { 
        id: userId, 
        email, 
        user_metadata: { display_name: displayName || email.split('@')[0] } 
      };
      db.users.push(user);

      // Automatically create a profile matching public.profiles schema
      const profile = { 
        id: userId, 
        email, 
        display_name: displayName || email.split('@')[0],
        created_at: new Date().toISOString() 
      };
      db.profiles.push(profile);

      const sessionId = generateUUID();
      const token = createMockToken(userId, sessionId);
      const session = { 
        session_id: sessionId, 
        user_id: userId, 
        access_token: token,
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
        user
      };
      db.sessions.push(session);

      writeMockDb(db);

      const response = NextResponse.json({ data: { user, session }, error: null });
      response.cookies.set('focus_mock_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;

    } else if (action === 'signInWithPassword') {
      const { email, password } = body;
      const db = getMockDb();
      
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return NextResponse.json({ error: { message: 'Invalid login credentials' } });
      }

      const sessionId = generateUUID();
      const token = createMockToken(user.id, sessionId);
      const session = { 
        session_id: sessionId, 
        user_id: user.id, 
        access_token: token,
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
        user
      };
      db.sessions.push(session);

      writeMockDb(db);

      const response = NextResponse.json({ data: { user, session }, error: null });
      response.cookies.set('focus_mock_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;

    } else if (action === 'signOut') {
      const sessionCookie = await cookieStore.get('focus_mock_session');
      if (sessionCookie && sessionCookie.value) {
        const db = getMockDb();
        db.sessions = db.sessions.filter(s => s.access_token !== sessionCookie.value);
        writeMockDb(db);
      }

      const response = NextResponse.json({ error: null });
      response.cookies.delete('focus_mock_session');
      return response;

    } else if (action === 'resetPasswordForEmail') {
      return NextResponse.json({ data: {}, error: null });

    } else if (action === 'updateUser') {
      const user = await getSessionUser(cookieStore);
      if (!user) {
        return NextResponse.json({ error: { message: 'Not authenticated' } });
      }
      return NextResponse.json({ data: { user }, error: null });

    } else if (action === 'query') {
      const user = await getSessionUser(cookieStore);
      const currentUserId = user?.id || null;

      const result = await runMockQuery({
        table: body.table,
        queryType: body.queryType,
        filters: body.filters,
        insertData: body.insertData,
        updateData: body.updateData,
        maybeSingleFlag: body.maybeSingleFlag,
        singleFlag: body.singleFlag,
        currentUserId,
        isAdmin: body.isAdmin,
      });
      return NextResponse.json(result);

    } else if (action === 'rpc') {
      const { name, args } = body;
      
      if (name === 'revoke_session') {
        const targetSessionId = args.target_session_id;
        const db = getMockDb();
        db.sessions_log = db.sessions_log.map(log => 
          log.session_id === targetSessionId ? { ...log, is_active: false } : log
        );
        writeMockDb(db);
        return NextResponse.json({ data: true, error: null });
      }
      
      return NextResponse.json({ data: null, error: null });
    }

    return NextResponse.json({ error: { message: 'Invalid mock operation' } }, { status: 400 });
  } catch (error: any) {
    console.error('[FOCUS Mock API] Route handler error:', error);
    return NextResponse.json({ error: { message: error.message || 'An error occurred' } }, { status: 500 });
  }
}
