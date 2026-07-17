import fs from 'fs';
import path from 'path';
import { getQuizSeedData } from '@/lib/quiz/seed';

const DB_FILE = path.join(process.cwd(), 'src/utils/supabase/mock_db.json');

// Interface definition for Mock Database Structure
interface MockUser {
  id: string;
  email: string;
  password?: string;
  user_metadata?: {
    display_name?: string;
    [key: string]: any;
  };
}

interface MockSession {
  session_id: string;
  user_id: string;
  access_token: string;
}

interface MockDbSchema {
  users: MockUser[];
  sessions: MockSession[];
  profiles: any[];
  webauthn_credentials: any[];
  sessions_log: any[];
  backup_codes: any[];
  // Quiz tables
  quiz_subjects: any[];
  quiz_topics: any[];
  quiz_questions: any[];
  quiz_attempts: any[];
  quiz_attempt_answers: any[];
}

const DEFAULT_DB: MockDbSchema = {
  users: [],
  sessions: [],
  profiles: [],
  webauthn_credentials: [],
  sessions_log: [],
  backup_codes: [],
  quiz_subjects: [],
  quiz_topics: [],
  quiz_questions: [],
  quiz_attempts: [],
  quiz_attempt_answers: [],
};

// Safe helper to read the mock database file
export function getMockDb(): MockDbSchema {
  try {
    let db: MockDbSchema;
    if (!fs.existsSync(DB_FILE)) {
      // Create empty db file
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      db = { ...DEFAULT_DB };
    } else {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
    }

    // Ensure quiz tables exist (schema migration)
    if (!db.quiz_subjects) db.quiz_subjects = [];
    if (!db.quiz_topics) db.quiz_topics = [];
    if (!db.quiz_questions) db.quiz_questions = [];
    if (!db.quiz_attempts) db.quiz_attempts = [];
    if (!db.quiz_attempt_answers) db.quiz_attempt_answers = [];

    // Seed quiz data if tables are empty
    if (db.quiz_subjects.length === 0) {
      const seed = getQuizSeedData();
      db.quiz_subjects = seed.subjects;
      db.quiz_topics = seed.topics;
      db.quiz_questions = seed.questions;
      writeMockDb(db);
    }

    return db;
  } catch (err) {
    console.error('[FOCUS Mock DB] Error reading DB file, returning empty default:', err);
    return DEFAULT_DB;
  }
}

// Safe helper to write to the mock database file
export function writeMockDb(db: MockDbSchema): void {
  try {
    // Ensure parent directories exist
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[FOCUS Mock DB] Error writing DB file:', err);
  }
}

// Generate simple mock UUIDs
export function generateUUID(): string {
  return 'mock-uuid-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
}

// Helper to create a JWT-like session token
export function createMockToken(userId: string, sessionId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    session_id: sessionId,
    exp: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
  })).toString('base64url');
  const signature = 'mock-signature';
  return `${header}.${payload}.${signature}`;
}

// Check session in cookies and return current logged in user
export async function getSessionUser(cookieStore: any): Promise<MockUser | null> {
  const sessionCookie = await cookieStore.get('focus_mock_session');
  if (!sessionCookie || !sessionCookie.value) return null;

  const db = getMockDb();
  const session = db.sessions.find(s => s.access_token === sessionCookie.value);
  if (!session) return null;

  const user = db.users.find(u => u.id === session.user_id);
  return user || null;
}

// Run a query builder operation
export async function runMockQuery(builder: {
  table: string;
  queryType: 'select' | 'insert' | 'update' | 'delete';
  filters: Array<{ field: string; value: any; type: 'eq' | 'in' | 'neq' }>;
  insertData: any;
  updateData: any;
  maybeSingleFlag: boolean;
  singleFlag: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
  orderField?: string;
  orderAscending?: boolean;
  limitCount?: number;
}) {
  const db = getMockDb();
  const tableData: any[] = (db as any)[builder.table] || [];

  // 1. Fetch & Filter Data (Respecting simulated RLS)
  let filtered = [...tableData];
  
  // Apply RLS if not admin client
  if (!builder.isAdmin && builder.currentUserId) {
    if (builder.table === 'profiles') {
      // Profiles are publicly readable, but only owner can write
    } else if (builder.table === 'webauthn_credentials' || builder.table === 'sessions_log' || builder.table === 'backup_codes') {
      // Strict RLS: can only access row belonging to user_id
      filtered = filtered.filter(row => row.user_id === builder.currentUserId);
    }
  }

  // Apply explicit query filters (e.g. .eq('id', value))
  for (const filter of builder.filters) {
    if (filter.type === 'eq') {
      filtered = filtered.filter(row => {
        const val = row[filter.field];
        if (typeof val === 'string' && typeof filter.value === 'string') {
          return val.toLowerCase() === filter.value.toLowerCase();
        }
        return val === filter.value;
      });
    } else if (filter.type === 'in') {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value];
      filtered = filtered.filter(row => values.includes(row[filter.field]));
    } else if (filter.type === 'neq') {
      filtered = filtered.filter(row => row[filter.field] !== filter.value);
    }
  }

  // 2. Perform Database Operation
  if (builder.queryType === 'select') {
    // Apply ordering
    if (builder.orderField) {
      filtered.sort((a, b) => {
        const aVal = a[builder.orderField!];
        const bVal = b[builder.orderField!];
        if (aVal < bVal) return builder.orderAscending ? -1 : 1;
        if (aVal > bVal) return builder.orderAscending ? 1 : -1;
        return 0;
      });
    }
    // Apply limit
    if (builder.limitCount && builder.limitCount > 0) {
      filtered = filtered.slice(0, builder.limitCount);
    }
    if (builder.singleFlag || builder.maybeSingleFlag) {
      const record = filtered[0] || null;
      if (builder.singleFlag && !record) {
        return { data: null, error: { message: 'Row not found' } };
      }
      return { data: record, error: null };
    }
    return { data: filtered, error: null };

  } else if (builder.queryType === 'insert') {
    const recordsToInsert = Array.isArray(builder.insertData) ? builder.insertData : [builder.insertData];
    const insertedRecords: any[] = [];

    for (const record of recordsToInsert) {
      const newRecord = {
        id: record.id || generateUUID(),
        created_at: new Date().toISOString(),
        ...record,
      };
      
      // Enforce RLS on insert
      if (!builder.isAdmin && builder.currentUserId && newRecord.user_id && newRecord.user_id !== builder.currentUserId) {
        return { data: null, error: { message: 'Row Level Security policy violation on insert' } };
      }

      tableData.push(newRecord);
      insertedRecords.push(newRecord);
    }

    (db as any)[builder.table] = tableData;
    writeMockDb(db);

    return { data: Array.isArray(builder.insertData) ? insertedRecords : insertedRecords[0], error: null };

  } else if (builder.queryType === 'update') {
    let updatedCount = 0;
    const updatedRecords: any[] = [];

    const updatedTable = tableData.map(row => {
      // Check if this row is in our filtered (and matched) set
      const isMatched = filtered.some(f => f.id === row.id);
      if (isMatched) {
        // Enforce RLS on update
        if (!builder.isAdmin && builder.currentUserId && row.user_id && row.user_id !== builder.currentUserId) {
          return row; // Ignore/deny update
        }
        updatedCount++;
        const newRow = { ...row, ...builder.updateData, updated_at: new Date().toISOString() };
        updatedRecords.push(newRow);
        return newRow;
      }
      return row;
    });

    (db as any)[builder.table] = updatedTable;
    writeMockDb(db);

    return { data: builder.singleFlag || builder.maybeSingleFlag ? (updatedRecords[0] || null) : updatedRecords, error: null };

  } else if (builder.queryType === 'delete') {
    const deletedRecords: any[] = [];
    const remainingTable = tableData.filter(row => {
      const isMatched = filtered.some(f => f.id === row.id);
      if (isMatched) {
        // Enforce RLS on delete
        if (!builder.isAdmin && builder.currentUserId && row.user_id && row.user_id !== builder.currentUserId) {
          return true; // Keep row (deny delete)
        }
        deletedRecords.push(row);
        return false; // Remove row
      }
      return true; // Keep row
    });

    (db as any)[builder.table] = remainingTable;
    writeMockDb(db);

    return { data: deletedRecords, error: null };
  }

  return { data: null, error: { message: 'Unsupported query type' } };
}
