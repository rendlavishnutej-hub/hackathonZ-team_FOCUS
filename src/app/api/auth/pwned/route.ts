import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // 1. Hash the password using SHA-1
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    // 2. Fetch the range of hashes from HaveIBeenPwned API (k-anonymity)
    // We set a short timeout of 3 seconds so we don't block registration if the API is down
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return NextResponse.json({ pwned: false, count: 0, apiError: true });
    }

    const text = await response.text();
    const lines = text.split('\r\n');

    // 3. Search for the suffix in the response list
    let pwned = false;
    let count = 0;
    
    for (const line of lines) {
      const [lineSuffix, lineCount] = line.split(':');
      if (lineSuffix === suffix) {
        pwned = true;
        count = parseInt(lineCount, 10);
        break;
      }
    }

    return NextResponse.json({ pwned, count });
  } catch (error) {
    console.error('HaveIBeenPwned API check error:', error);
    // Silent fail-open for user experience: don't block signups if the external API is unreachable
    return NextResponse.json({ pwned: false, count: 0, error: 'Failed to verify breach status' });
  }
}
