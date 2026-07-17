import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired (getUser is the secure way to fetch session/user info)
  const { data: { user } } = await supabase.auth.getUser();

  const isDashboardRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/session') ||
    request.nextUrl.pathname.startsWith('/course');
  const isAuthRoute = ['/login', '/signup', '/reset-password'].includes(request.nextUrl.pathname);
  const isMfaVerifyRoute = request.nextUrl.pathname === '/mfa/verify';

  if (!user && isDashboardRoute) {
    // 1. Protected route but not logged in: redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    // 2. User is logged in, check MFA (Authenticator Assurance Level)
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    const currentLevel = aalData?.currentLevel;
    const nextLevel = aalData?.nextLevel;

    // Check if the user has verified factors but is currently at AAL1 (MFA challenge required)
    const mfaRequired = nextLevel === 'aal2' && currentLevel === 'aal1';

    if (mfaRequired && !isMfaVerifyRoute && isDashboardRoute) {
      // Force redirect to MFA verification if they try to access the dashboard
      const url = request.nextUrl.clone();
      url.pathname = '/mfa/verify';
      return NextResponse.redirect(url);
    }

    if (!mfaRequired && isMfaVerifyRoute) {
      // Already fully verified or no MFA factors enrolled: redirect to dashboard
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    if (isAuthRoute) {
      // Logged in: redirect away from login/signup pages to dashboard
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
