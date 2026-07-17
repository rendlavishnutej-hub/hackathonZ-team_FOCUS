import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // 1. Check if user is logged in
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';

  try {
    // 2. Resolve Relying Party (RP) ID
    const host = request.headers.get('host') || 'localhost:3000';
    const rpID = host.split(':')[0];

    // 3. Generate Registration Options
    const options = await generateRegistrationOptions({
      rpName: 'Antigravity Secure Auth',
      rpID,
      userID: Buffer.from(user.id),
      userName: user.email!,
      userDisplayName: displayName,
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'required', // Required for discoverable/usernameless credentials
        requireResidentKey: true,
      },
    });

    const response = NextResponse.json(options);

    // 4. Store challenge in an httpOnly cookie
    response.cookies.set('passkey-reg-challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
    });

    cookieStore.set('passkey-reg-challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
    });

    return response;
  } catch (error: any) {
    console.error('WebAuthn registration options error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate options' }, { status: 500 });
  }
}
