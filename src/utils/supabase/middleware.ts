import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase Middleware] Missing env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return response;
  }

  let user: any = null;

  try {
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

    // Refresh session if expired
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const isDashboardRoute =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/session') ||
        request.nextUrl.pathname.startsWith('/course');
      const isMfaVerifyRoute = request.nextUrl.pathname === '/mfa/verify';

      // Check MFA (Authenticator Assurance Level)
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const currentLevel = aalData?.currentLevel;
      const nextLevel = aalData?.nextLevel;
      const mfaRequired = nextLevel === 'aal2' && currentLevel === 'aal1';

      if (mfaRequired && !isMfaVerifyRoute && isDashboardRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/mfa/verify';
        return NextResponse.redirect(url);
      }

      if (!mfaRequired && isMfaVerifyRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  } catch (error: any) {
    console.error('[Supabase Middleware] Unexpected error during updateSession:', error);
  }

  const isDashboardRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/session') ||
    request.nextUrl.pathname.startsWith('/course');
  const isAuthRoute = ['/login', '/signup', '/reset-password'].includes(request.nextUrl.pathname);

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
