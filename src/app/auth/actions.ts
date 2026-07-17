'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/utils/rateLimit';
import { checkLockout, incrementFailedAttempts, resetFailedAttempts } from '@/utils/lockout';
import { evaluatePassword } from '@/utils/passwordStrength';
import { redirect } from 'next/navigation';

// Helper to extract session_id from Supabase JWT access token
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

// Helper to parse client IP and User Agent from request headers
async function getClientMetadata() {
  const headersList = await headers();
  const rawIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  let ipAddress = rawIp.split(',')[0].trim();
  if (ipAddress === '::1') {
    ipAddress = '127.0.0.1';
  }
  const userAgent = headersList.get('user-agent') || 'Unknown Device';
  
  // Local IP check for location formatting
  const isLocal = ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.');
  const location = isLocal ? 'Localhost Development' : 'Remote Client';

  return { ipAddress, userAgent, location };
}

/**
 * Server Action: Sign Up User
 */
export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('displayName') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { ipAddress, userAgent, location } = await getClientMetadata();

  // 1. Rate Limiting Check
  const rateLimitResult = await checkRateLimit(ipAddress);
  if (!rateLimitResult.success) {
    return { error: 'Too many requests. Please wait a minute and try again.' };
  }

  // 2. Password Strength Check (zxcvbn score >= 3 required)
  const strength = evaluatePassword(password, [email, displayName]);
  if (strength.score < 3) {
    return { error: 'Password is too weak. Ensure it is not easily guessable.' };
  }

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const currentAppUrl = `${protocol}://${host}`;

  // 3. HaveIBeenPwned API check to reject compromised passwords
  try {
    const pwnedRes = await fetch(`${currentAppUrl}/api/auth/pwned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (pwnedRes.ok) {
      const pwnedData = await pwnedRes.json();
      if (pwnedData.pwned) {
        return { error: `This password was found in a database breach (${pwnedData.count} times). Please choose a different password.` };
      }
    }
  } catch (err) {
    console.error('Password breach API check failed:', err);
  }

  // 4. Create user via Admin API with auto-confirm (bypasses email rate limits)
  const adminClient = createAdminClient();
  const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName || email.split('@')[0],
    },
  });

  if (adminError) {
    // Handle duplicate user gracefully
    if (adminError.message?.includes('already been registered') || adminError.message?.includes('already exists')) {
      return { error: 'An account with this email already exists. Please sign in instead.' };
    }
    return { error: adminError.message };
  }

  // 5. Immediately sign in the newly created user to establish a session
  const supabase = await createClient();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // User was created but auto-login failed — they can still sign in manually
    return { success: true, message: 'Account created successfully! Please sign in with your credentials.' };
  }

  // 6. Log the session
  const session = signInData.session;
  const sessionId = session ? getSessionIdFromToken(session.access_token) : undefined;
  if (session?.user) {
    await adminClient.from('sessions_log').insert({
      user_id: session.user.id,
      session_id: sessionId || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      location,
      login_status: 'success',
      is_active: true,
    });
  }

  return { success: true, redirect: '/dashboard' };
}

/**
 * Server Action: Sign In User
 */
export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { ipAddress, userAgent, location } = await getClientMetadata();

  // 1. Rate Limiting Check on Route level
  const rateLimitResult = await checkRateLimit(ipAddress);
  if (!rateLimitResult.success) {
    return { error: 'Too many requests. Please wait a minute and try again.' };
  }

  // 2. Account Lockout Check
  const lockout = await checkLockout(email);
  if (lockout.locked) {
    return { error: `Account is temporarily locked due to too many failed attempts. Try again in ${Math.ceil(lockout.remaining / 60)} minutes.` };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Resolve user_id if possible (even for failed attempts)
  let userId: string | undefined;
  try {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (profile) {
      userId = profile.id;
    }
  } catch (err) {
    // Silently continue if we cannot fetch user by email
  }

  // 3. Authenticate with Supabase Auth
  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error && error.message.toLowerCase().includes('email not confirmed') && userId) {
    // Auto-confirm the user to bypass email rate limits on older unconfirmed accounts
    await adminClient.auth.admin.updateUserById(userId, { email_confirm: true });
    const retry = await supabase.auth.signInWithPassword({ email, password });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    // Increments failed attempts and logs audit trail
    await incrementFailedAttempts(email);
    
    // Log failed attempt in sessions_log
    await adminClient.from('sessions_log').insert({
      user_id: userId || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      location,
      login_status: 'failed',
      is_active: false,
    });

    return { error: error.message };
  }

  // Successful login: reset failed attempts
  await resetFailedAttempts(email);

  const session = data.session;
  const sessionId = session ? getSessionIdFromToken(session.access_token) : undefined;

  // Log successful login session
  if (session && session.user) {
    await adminClient.from('sessions_log').insert({
      user_id: session.user.id,
      session_id: sessionId || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      location,
      login_status: 'success',
      is_active: true,
    });
  }

  // Check MFA (AAL status)
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
    // User has MFA enrolled but needs to complete verification
    return { success: true, mfaRequired: true, redirect: '/mfa/verify' };
  }

  return { success: true, redirect: '/dashboard' };
}

/**
 * Server Action: Sign Out User
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

/**
 * Server Action: Request Password Reset
 */
export async function resetPasswordRequestAction(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) {
    return { error: 'Email is required' };
  }

  const { ipAddress } = await getClientMetadata();
  const rateLimitResult = await checkRateLimit(ipAddress);
  if (!rateLimitResult.success) {
    return { error: 'Too many requests. Please wait a minute and try again.' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const currentAppUrl = `${protocol}://${host}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${currentAppUrl}/auth/callback?next=/dashboard/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password reset link sent! Check your inbox.' };
}

/**
 * Server Action: Update/Reset Password (Authenticated session)
 */
export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password') as string;
  if (!password) {
    return { error: 'New password is required' };
  }

  // 1. Password strength checks
  const strength = evaluatePassword(password);
  if (strength.score < 3) {
    return { error: 'New password is too weak. Choose a stronger password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password updated successfully!' };
}
