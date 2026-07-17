import { createBrowserClient } from '@supabase/ssr';

class MockClientQueryBuilder {
  table: string;
  queryType: 'select' | 'insert' | 'update' | 'delete' = 'select';
  filters: any[] = [];
  insertData: any = null;
  updateData: any = null;
  singleFlag = false;
  maybeSingleFlag = false;

  constructor(table: string) {
    this.table = table;
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
      const res = await fetch('/api/auth/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          table: this.table,
          queryType: this.queryType,
          filters: this.filters,
          insertData: this.insertData,
          updateData: this.updateData,
          singleFlag: this.singleFlag,
          maybeSingleFlag: this.maybeSingleFlag,
        }),
      });
      const data = await res.json();
      resolve(data);
    } catch (err) {
      reject(err);
    }
  }
}

async function runMockRpc(name: string, args: any) {
  try {
    const res = await fetch('/api/auth/mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'rpc',
        name,
        args,
      }),
    });
    return await res.json();
  } catch (err) {
    return { data: null, error: err };
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Use mock client if credentials are not configured or are placeholders
  const isMock = (
    !supabaseUrl ||
    supabaseUrl.includes('placeholder') ||
    supabaseUrl.includes('example.com') ||
    !supabaseKey ||
    supabaseKey.includes('placeholder') ||
    supabaseKey === 'your-anon-key'
  );

  if (isMock) {
    return {
      auth: {
        async getUser() {
          try {
            const res = await fetch('/api/auth/mock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'getUser' }),
            });
            return await res.json();
          } catch (err) {
            return { data: { user: null }, error: err };
          }
        },
        async signUp(options: any) {
          try {
            const res = await fetch('/api/auth/mock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'signUp',
                email: options.email,
                password: options.password,
                displayName: options.options?.data?.display_name,
              }),
            });
            return await res.json();
          } catch (err) {
            return { data: { user: null, session: null }, error: err };
          }
        },
        async signInWithPassword(options: any) {
          try {
            const res = await fetch('/api/auth/mock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'signInWithPassword',
                email: options.email,
                password: options.password,
              }),
            });
            return await res.json();
          } catch (err) {
            return { data: { user: null, session: null }, error: err };
          }
        },
        async signOut() {
          try {
            const res = await fetch('/api/auth/mock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'signOut' }),
            });
            return await res.json();
          } catch (err) {
            return { error: err };
          }
        },
        async signInWithOAuth(options: any) {
          const redirectTo = options.options?.redirectTo || '/auth/callback';
          window.location.href = `${redirectTo}&code=mock-oauth-code`;
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
        return new MockClientQueryBuilder(table);
      },
      rpc(name: string, args: any) {
        return runMockRpc(name, args);
      }
    } as any;
  }

  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
