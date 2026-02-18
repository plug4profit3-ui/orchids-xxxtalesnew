// Simple in-memory rate limiter for Vercel serverless functions
// Note: Each cold-start gets a fresh map - this is per-instance rate limiting.
// For production, use @upstash/ratelimit with Redis for distributed limiting.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Returns true if the request is within limits, false if rate-limited.
 * @param key    Unique identifier (e.g. userId or IP)
 * @param limit  Max requests per window
 * @param windowMs  Window size in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

// Preset limiters
export const LIMITS = {
  // Chat: max 60 messages per minute per user
  chat: (userId: string) => checkRateLimit(`chat:${userId}`, 60, 60_000),
  // Image: max 20 images per minute per user
  image: (userId: string) => checkRateLimit(`img:${userId}`, 20, 60_000),
  // TTS: max 100 per minute per user
  tts: (userId: string) => checkRateLimit(`tts:${userId}`, 100, 60_000),
  // Auth endpoints: max 10 per minute per IP
  auth: (ip: string) => checkRateLimit(`auth:${ip}`, 10, 60_000),
};
