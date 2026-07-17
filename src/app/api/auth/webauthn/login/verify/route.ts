import { createClient, createAdminClient, createClientForResponse } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { cookies } from 'next/headers';

import { checkRateLimit } from '@/utils/rateLimit';

function getSessionIdFromToken(token: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.session_id;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const ipAddress = rawIp.split(',')[0].trim();
  const rateLimitResult = await checkRateLimit(ipAddress);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.' }, { status: 429 });
  }

  const supabase = await createClient();
  const cookieStore = await cookies();
  const adminClient = createAdminClient();

  // 1. Read and clear challenge cookie
  const expectedChallenge = cookieStore.get('passkey-auth-challenge')?.value;
  cookieStore.delete('passkey-auth-challenge');

  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or missing' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // 2. Fetch credential details from database
    const credentialId = body.id;
    const { data: dbCredential, error: dbError } = await adminClient
      .from('webauthn_credentials')
      .select('user_id, public_key, counter')
      .eq('id', credentialId)
      .maybeSingle();

    if (dbError || !dbCredential) {
      return NextResponse.json({ error: 'Passkey not recognized' }, { status: 400 });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const rpID = host.split(':')[0];
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const expectedOrigin = `${protocol}://${host}`;

    // Convert stored public key base64 back to Uint8Array
    const publicKeyUint8 = Buffer.from(dbCredential.public_key, 'base64');
    const credentialIDUint8 = Buffer.from(credentialId, 'base64url');

    // 3. Verify Authentication Response
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: credentialId,
        publicKey: publicKeyUint8,
        counter: Number(dbCredential.counter),
      },
      requireUserVerification: true,
    });

    const { verified, authenticationInfo } = verification;

    if (!verified || !authenticationInfo) {
      return NextResponse.json({ error: 'Fingerprint / biometrics verification failed' }, { status: 400 });
    }

    // 4. Update credential counter in DB
    await adminClient
      .from('webauthn_credentials')
      .update({ counter: BigInt(authenticationInfo.newCounter) })
      .eq('id', credentialId);

    // 5. Retrieve user details to log them in
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(dbCredential.user_id);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 400 });
    }

    const userEmail = userData.user.email!;

    // 6. Programmatically generate a magic link session
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: 'Failed to create session link' }, { status: 500 });
    }

    // 7. Verify the OTP on the user client to establish the session and set the cookies!
    const response = NextResponse.json({ success: true, redirect: '/dashboard' });
    const userClient = await createClientForResponse(response);

    const { data: sessionData, error: sessionError } = await userClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (sessionError || !sessionData?.session) {
      return NextResponse.json({ error: 'Failed to establish session: ' + sessionError?.message }, { status: 500 });
    }

    // 8. Log the successful login in sessions_log
    const session = sessionData.session;
    const sessionId = getSessionIdFromToken(session.access_token);
    
    const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    let ipAddress = rawIp.split(',')[0].trim();
    if (ipAddress === '::1') {
      ipAddress = '127.0.0.1';
    }
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    
    const isLocal = ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.');
    const location = isLocal ? 'Localhost Development' : 'Remote Client';

    await adminClient.from('sessions_log').insert({
      user_id: session.user.id,
      session_id: sessionId || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      location,
      login_status: 'success',
      is_active: true,
    });

    return response;
  } catch (error: any) {
    console.error('WebAuthn login verification error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
