import { createClient, createAdminClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to hash backup codes
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Helper to generate a random 8-character alphanumeric code
function generateBackupCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
}

export async function POST() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Clean up any stale unverified factors from previous failed attempts
    const { data: factorList, error: listError } = await supabase.auth.mfa.listFactors();
    if (!listError && factorList && factorList.all) {
      for (const factor of factorList.all) {
        if (factor.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
    }

    // 2. Call Supabase Auth MFA Enroll
    const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 400 });
    }

    // 3. Generate 8 recovery backup codes
    const plainBackupCodes: string[] = [];
    const backupCodesPayload: any[] = [];

    for (let i = 0; i < 8; i++) {
      const code = generateBackupCode();
      plainBackupCodes.push(code);
      backupCodesPayload.push({
        user_id: user.id,
        code_hash: hashBackupCode(code),
        used: false,
      });
    }

    // 4. Save the hashed backup codes in database using adminClient
    const adminClient = createAdminClient();
    
    // First clear any existing backup codes for the user if they are re-enrolling
    await adminClient
      .from('backup_codes')
      .delete()
      .eq('user_id', user.id);

    const { error: dbError } = await adminClient
      .from('backup_codes')
      .insert(backupCodesPayload);

    if (dbError) {
      return NextResponse.json({ error: 'Failed to generate recovery backup codes' }, { status: 500 });
    }

    // 5. Return details to client (plain codes are sent ONCE here)
    return NextResponse.json({
      factorId: enrollData.id,
      qrCode: enrollData.totp.qr_code,
      secret: enrollData.totp.secret,
      backupCodes: plainBackupCodes,
    });
  } catch (error: any) {
    console.error('MFA Enrollment API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during enrollment' }, { status: 500 });
  }
}
