import { createClient, createAdminClient } from './src/utils/supabase/server.ts';

// We have to mock Next.js headers/cookies for this to run in Node
import * as nextHeaders from 'next/headers';
nextHeaders.cookies = () => ({
  getAll: () => [],
  setAll: () => {},
  get: () => null,
  set: () => {},
  delete: () => {}
});
nextHeaders.headers = () => ({
  get: () => null
});

async function run() {
  console.log('Testing createClient()...');
  const client = await createClient();
  console.log('Client created. Is it a mock client?');
  
  // A mock client has `from(table: string)` returning a MockServerQueryBuilder.
  // A real client returns a SupabaseQueryBuilder.
  const query = client.from('users').select('*');
  console.log(query.constructor.name);
  
  const adminClient = createAdminClient();
  const adminQuery = adminClient.from('users').select('*');
  console.log(adminQuery.constructor.name);
}

run().catch(console.error);
