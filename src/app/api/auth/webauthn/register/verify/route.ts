import { createClient, createAdminClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const adminClient = createAdminClient();

  // 1. Check if user is logged in
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Read and clear challenge cookie
  const expectedChallenge = cookieStore.get('passkey-reg-challenge')?.value;
  cookieStore.delete('passkey-reg-challenge');

  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or missing' }, { status: 400 });
  }

  try {
    const body = await request.json();

    const host = request.headers.get('host') || 'localhost:3000';
    const rpID = host.split(':')[0];
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const expectedOrigin = `${protocol}://${host}`;

    // 3. Verify Registration Response
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return NextResponse.json({ error: 'Passkey verification failed' }, { status: 400 });
    }

    const { credential } = registrationInfo;
    const { id, publicKey, counter } = credential;

    // Convert publicKey Uint8Array to string representation for DB storage
    const publicKeyBase64 = Buffer.from(publicKey).toString('base64');

    // 4. Save Passkey in DB
    const { error: dbError } = await adminClient
      .from('webauthn_credentials')
      .insert({
        id: id,
        user_id: user.id,
        public_key: publicKeyBase64,
        counter: BigInt(counter),
        transports: body.response.transports || [],
      });

    if (dbError) {
      console.error('Database error saving passkey:', dbError);
      return NextResponse.json({ error: 'Failed to save passkey in database' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('WebAuthn registration verification error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
