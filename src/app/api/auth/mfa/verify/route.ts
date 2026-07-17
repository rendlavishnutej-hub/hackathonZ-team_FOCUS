import { createClient, createAdminClient, createClientForResponse } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { hashBackupCode } from '../enroll/route';
import { checkRateLimit } from '@/utils/rateLimit';

export async function POST(request: Request) {
  const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  let ipAddress = rawIp.split(',')[0].trim();
  if (ipAddress === '::1') {
    ipAddress = '127.0.0.1';
  }
  const rateLimitResult = await checkRateLimit(ipAddress);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.' }, { status: 429 });
  }

  // 1. Check if user is authenticated (at least at AAL1) using standard client (read-only cookie check)
  const tempSupabase = await createClient();
  const { data: { user }, error: userError } = await tempSupabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { factorId, code, isBackupCode } = await request.json();
    const adminClient = createAdminClient();

    // 2. Handle Backup Code verification (Recovery Flow)
    if (isBackupCode) {
      if (!code || code.trim().length !== 8) {
        return NextResponse.json({ error: 'Invalid backup code format' }, { status: 400 });
      }

      const hashedInput = hashBackupCode(code.trim().toUpperCase());

      // Query database for unused matching backup code
      const { data: backupCodeRecord, error: dbError } = await adminClient
        .from('backup_codes')
        .select('id')
        .eq('user_id', user.id)
        .eq('code_hash', hashedInput)
        .eq('used', false)
        .maybeSingle();

      if (dbError || !backupCodeRecord) {
        return NextResponse.json({ error: 'Invalid or already used backup code' }, { status: 400 });
      }

      // Mark code as used
      await adminClient
        .from('backup_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', backupCodeRecord.id);

      // Disable MFA by deleting all enrolled factors for the user
      // Prepare response to capture cookies
      const response = NextResponse.json({
        success: true,
        bypassed: true,
        message: 'MFA successfully disabled using backup code. Redirecting to dashboard...',
      });
      const supabase = await createClientForResponse(response);

      const { data: factorList, error: listError } = await supabase.auth.mfa.listFactors();
      if (!listError && factorList && factorList.all) {
        for (const factor of factorList.all) {
          await adminClient.auth.admin.mfa.deleteFactor({
            id: factor.id,
            userId: user.id,
          });
        }
      }

      return response;
    }

    // 3. Handle Standard TOTP verification
    if (!factorId || !code) {
      return NextResponse.json({ error: 'Factor ID and TOTP code are required' }, { status: 400 });
    }

    // Prepare response to capture cookies on verify
    const response = NextResponse.json({
      success: true,
    });
    const supabase = await createClientForResponse(response);

    // Challenge the factor
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      return NextResponse.json({ error: challengeError.message }, { status: 400 });
    }

    // Verify the challenge (this modifies session cookies on the response)
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: code.trim(),
    });

    if (verifyError) {
      return NextResponse.json({ error: verifyError.message }, { status: 400 });
    }

    // Update body with verification data
    const finalResponse = NextResponse.json({
      success: true,
      data: verifyData,
    });

    // Copy cookies from response to finalResponse
    response.cookies.getAll().forEach(c => {
      finalResponse.cookies.set(c.name, c.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });

    return finalResponse;
  } catch (error: any) {
    console.error('MFA Verification API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during verification' }, { status: 500 });
  }
}
