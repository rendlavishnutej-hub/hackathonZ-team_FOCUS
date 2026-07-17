import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

class MockServerQueryBuilder {
  table: string;
  queryType: 'select' | 'insert' | 'update' | 'delete' = 'select';
  filters: any[] = [];
  insertData: any = null;
  updateData: any = null;
  singleFlag = false;
  maybeSingleFlag = false;
  isAdmin = false;
  orderField: string | undefined = undefined;
  orderAscending: boolean = true;
  limitCount: number | undefined = undefined;

  constructor(table: string, isAdmin = false) {
    this.table = table;
    this.isAdmin = isAdmin;
  }

  select(columns?: string) {
    this.queryType = 'select';
    return this;
  }

  insert(data: any) {
    this.queryType = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.queryType = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.queryType = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value, type: 'eq' });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, value: values, type: 'in' });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ field, value, type: 'neq' });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleFlag = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleFlag = true;
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      const { runMockQuery, getSessionUser } = await import('./mockDb');
      const cookieStore = await cookies();
      const user = await getSessionUser(cookieStore);
      const currentUserId = user?.id || null;

      const data = await runMockQuery({
        table: this.table,
        queryType: this.queryType,
        filters: this.filters,
        insertData: this.insertData,
        updateData: this.updateData,
        singleFlag: this.singleFlag,
        maybeSingleFlag: this.maybeSingleFlag,
        currentUserId,
        isAdmin: this.isAdmin,
        orderField: this.orderField,
        orderAscending: this.orderAscending,
        limitCount: this.limitCount,
      });
      resolve(data);
    } catch (err) {
      reject(err);
    }
  }
}

// Check if credentials are mock/missing
function isMockEnabled() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey.includes('placeholder');
}

// Server Mock Client Factory helper
async function getMockServerClient(response?: NextResponse) {
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  return {
    auth: {
      async getUser() {
        const { getSessionUser } = await import('./mockDb');
        const cookieStore = await cookies();
        const user = await getSessionUser(cookieStore);
        return { data: { user }, error: null };
      },
      async signUp(options: any) {
        const { getMockDb, writeMockDb, generateUUID, createMockToken } = await import('./mockDb');
        const email = options.email;
        const displayName = options.options?.data?.display_name || email.split('@')[0];
        const db = getMockDb();

        if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return { data: { user: null, session: null }, error: { message: 'A user with this email already exists' } };
        }

        const userId = generateUUID();
        const user = { 
          id: userId, 
          email, 
          user_metadata: { display_name: displayName } 
        };
        db.users.push(user);

        // Auto-create matching profile row
        const profile = { 
          id: userId, 
          email, 
          display_name: displayName, 
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

        const cookieStore = await cookies();
        cookieStore.set('focus_mock_session', token, cookieOpts);
        if (response) {
          response.cookies.set('focus_mock_session', token, cookieOpts);
        }

        return { data: { user, session }, error: null };
      },
      async signInWithPassword(options: any) {
        const { getMockDb, writeMockDb, generateUUID, createMockToken } = await import('./mockDb');
        const email = options.email;
        const db = getMockDb();
        const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
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

        const cookieStore = await cookies();
        cookieStore.set('focus_mock_session', token, cookieOpts);
        if (response) {
          response.cookies.set('focus_mock_session', token, cookieOpts);
        }

        return { data: { user, session }, error: null };
      },
      async signOut() {
        const { getMockDb, writeMockDb } = await import('./mockDb');
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('focus_mock_session');
        if (sessionCookie?.value) {
          const db = getMockDb();
          db.sessions = db.sessions.filter(s => s.access_token !== sessionCookie.value);
          writeMockDb(db);
        }

        cookieStore.delete('focus_mock_session');
        if (response) {
          response.cookies.delete('focus_mock_session');
        }
        return { error: null };
      },
      async exchangeCodeForSession(code: string) {
        const { getMockDb, writeMockDb, generateUUID, createMockToken } = await import('./mockDb');
        const db = getMockDb();
        let user = db.users[0];
        if (!user) {
          const userId = generateUUID();
          user = { id: userId, email: 'dev@focus.ai', user_metadata: { display_name: 'Developer' } };
          db.users.push(user);
          db.profiles.push({ 
            id: userId, 
            email: user.email, 
            display_name: 'Developer', 
            created_at: new Date().toISOString() 
          });
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

        const cookieStore = await cookies();
        cookieStore.set('focus_mock_session', token, cookieOpts);
        if (response) {
          response.cookies.set('focus_mock_session', token, cookieOpts);
        }

        return { data: { session, user }, error: null };
      },
      async resetPasswordForEmail(email: string, options?: any) {
        return { data: {}, error: null };
      },
      async updateUser(attributes: any) {
        return { data: {}, error: null };
      },
      mfa: {
        async getAuthenticatorAssuranceLevel() {
          return { data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null };
        },
        async listFactors() {
          return { data: { all: [], totp: [], phone: [] }, error: null };
        },
        async enroll(params: any) {
          return {
            data: {
              id: 'mock-factor-id',
              type: 'totp',
              totp: { qr_code: 'mock-qr-code', secret: 'mock-secret', uri: 'mock-uri' }
            },
            error: null
          };
        },
        async challenge(params: any) {
          return { data: { id: 'mock-challenge-id' }, error: null };
        },
        async verify(params: any) {
          return { data: {}, error: null };
        },
        async unenroll(params: any) {
          return { data: {}, error: null };
        }
      }
    },
    from(table: string) {
      return new MockServerQueryBuilder(table, false);
    },
    async rpc(name: string, args: any) {
      if (name === 'revoke_session') {
        const targetSessionId = args.target_session_id;
        const { getMockDb, writeMockDb } = await import('./mockDb');
        const db = getMockDb();
        db.sessions_log = db.sessions_log.map(log => 
          log.session_id === targetSessionId ? { ...log, is_active: false } : log
        );
        writeMockDb(db);
      }
      return { data: true, error: null };
    }
  } as any;
}

// Standard client for authenticated user requests (Server Components, Server Actions, Route Handlers)
export async function createClient() {
  if (isMockEnabled()) {
    return await getMockServerClient();
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}

// Special client for Route Handlers to ensure cookies are appended to the returned NextResponse
export async function createClientForResponse(response: NextResponse) {
  if (isMockEnabled()) {
    return await getMockServerClient(response);
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          } catch {
            // Silently fail
          }
        },
      },
    }
  );
}

// Admin client using service role key (for server-side security operations only)
export function createAdminClient() {
  if (isMockEnabled()) {
    return {
      auth: {
        admin: {
          async getUserById(id: string) {
            const { getMockDb } = await import('./mockDb');
            const db = getMockDb();
            const user = db.users.find(u => u.id === id);
            return { data: { user: user || { id, email: 'mock-user@focus.ai' } }, error: null };
          },
          async generateLink(params: any) {
            return {
              data: {
                properties: {
                  action_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?code=mock-code`
                }
              },
              error: null
            };
          },
          mfa: {
            async deleteFactor(params: any) {
              return { data: {}, error: null };
            }
          }
        }
      },
      from(table: string) {
        return new MockServerQueryBuilder(table, true);
      }
    } as any;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
