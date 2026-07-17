import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error('Failed to initialize Upstash Redis for Lockouts:', error);
  }
}

/**
 * Checks if an email account is currently locked out due to repeated login failures.
 */
export async function checkLockout(email: string): Promise<{ locked: boolean; remaining: number }> {
  if (!redisClient) return { locked: false, remaining: 0 };

  const key = `lockout:${email.toLowerCase()}`;
  try {
    const attempts = await redisClient.get<number>(key);
    if (attempts && attempts >= 5) {
      const ttl = await redisClient.ttl(key);
      return { locked: true, remaining: ttl > 0 ? ttl : 900 };
    }
  } catch (error) {
    console.error('Lockout check error:', error);
  }
  return { locked: false, remaining: 0 };
}

/**
 * Increments the count of failed login attempts for an email and locks it out if it reaches the limit.
 */
export async function incrementFailedAttempts(email: string): Promise<number> {
  if (!redisClient) return 1;

  const key = `lockout:${email.toLowerCase()}`;
  try {
    const attempts = await redisClient.incr(key);
    if (attempts === 1) {
      // First failed attempt, set expiration window (15 minutes)
      await redisClient.expire(key, 900);
    } else if (attempts >= 5) {
      // If locked out, refresh/ensure expiration is 15 minutes
      await redisClient.expire(key, 900);
    }
    return attempts;
  } catch (error) {
    console.error('Lockout increment error:', error);
    return 1;
  }
}

/**
 * Resets the failed attempts counter for an email upon successful login.
 */
export async function resetFailedAttempts(email: string): Promise<void> {
  if (!redisClient) return;

  const key = `lockout:${email.toLowerCase()}`;
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Lockout reset error:', error);
  }
}
