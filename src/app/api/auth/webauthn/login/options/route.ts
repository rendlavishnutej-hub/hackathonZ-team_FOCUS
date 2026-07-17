import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();

  try {
    const host = request.headers.get('host') || 'localhost:3000';
    const rpID = host.split(':')[0];

    // Generate authentication options (allowCredentials left empty to support discoverable keys)
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });

    const response = NextResponse.json(options);
    
    // Store challenge in httpOnly cookie
    response.cookies.set('passkey-auth-challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
    });

    cookieStore.set('passkey-auth-challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
    });

    return response;
  } catch (error: any) {
    console.error('WebAuthn login options error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate options' }, { status: 500 });
  }
}
