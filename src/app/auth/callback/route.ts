import { createAdminClient, createClientForResponse } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    // Create a base redirection response to collect cookies from exchangeCodeForSession
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = await createClientForResponse(response);
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session) {
      // Session established successfully, log it in sessions_log
      const session = data.session;
      const sessionId = getSessionIdFromToken(session.access_token);
      
      const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      let ipAddress = rawIp.split(',')[0].trim();
      if (ipAddress === '::1') {
        ipAddress = '127.0.0.1';
      }
      const userAgent = request.headers.get('user-agent') || 'Unknown Device';
      
      const isLocal = ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.');
      const location = isLocal ? 'Localhost Development' : 'Remote Client';

      const adminClient = createAdminClient();
      await adminClient.from('sessions_log').insert({
        user_id: session.user.id,
        session_id: sessionId || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        location,
        login_status: 'success',
        is_active: true,
      });

      // Check if MFA is required
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
        const mfaResponse = NextResponse.redirect(`${origin}/mfa/verify`);
        // Copy cookies over to the MFA redirect response
        response.cookies.getAll().forEach(c => {
          mfaResponse.cookies.set(c.name, c.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
        });
        return mfaResponse;
      }

      return response;
    }
  }

  // Redirect to login if anything goes wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
