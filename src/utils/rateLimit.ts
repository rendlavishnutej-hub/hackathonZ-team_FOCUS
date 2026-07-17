import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

// Initialize Upstash Redis safely so the app doesn't crash if environment variables are not yet configured
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Default rate limit: 5 requests per 60 seconds
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    });
  } catch (error) {
    console.error('Failed to initialize Upstash Redis Rate Limiter:', error);
  }
} else {
  console.warn('Upstash Redis environment variables are missing. Rate limiting is currently bypassed.');
}

/**
 * Checks the rate limit for a given identifier (e.g., IP address or username).
 * Returns rate limiting metadata.
 */
export async function checkRateLimit(identifier: string) {
  if (!ratelimit) {
    return {
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limiter check error, bypassing rate limit:', error);
    return {
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 60000,
    };
  }
}
