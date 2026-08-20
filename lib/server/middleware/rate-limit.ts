import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight in-memory fixed-window rate limiter for API routes.
 *
 * This is a process-local limiter. It is intentionally dependency-free and
 * requires no DB/Redis round-trip, and is a good first line of defense for a
 * single-instance deployment. For multi-instance / horizontal scale-out it must
 * be swapped for a shared store (e.g. @upstash/ratelimit or a Redis-based
 * counter).
 *
 * Usage:
 *   const limited = rateLimit(request, { limit: 60, windowMs: 60_000 });
 *   if (limited) return limited; // already a 429 NextResponse
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed within `windowMs`. */
  limit: number;
  /** Fixed window duration in milliseconds. */
  windowMs: number;
  /** Extra namespace to keep separate routes from sharing a bucket. */
  prefix?: string;
  /** Explicit bucket key; defaults to the client IP. */
  key?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

// process-local buckets: {prefix:key => {count, resetAt}}
const buckets = new Map<string, Bucket>();

// Hard cap to keep memory bounded even under heavy abusive traffic.
const MAX_BUCKETS = 10_000;

/** Resolve the client IP from forwarded headers, falling back to unknown. */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Snapshot of limiter state for tests / observability. */
export function getRateLimitState(): { size: number } {
  return { size: buckets.size };
}

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const now = Date.now();
  const bucketKey = `${config.prefix ?? ''}:${config.key ?? clientIp(request)}`;
  const bucket = buckets.get(bucketKey);

  if (bucket) {
    if (now < bucket.resetAt) {
      bucket.count++;
      if (bucket.count > config.limit) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000)),
              'X-RateLimit-Limit': String(config.limit),
              'X-RateLimit-Remaining': String(Math.max(0, config.limit - bucket.count)),
            },
          }
        );
      }
      return null;
    }
    buckets.delete(bucketKey);
  }

  if (buckets.size >= MAX_BUCKETS) {
    buckets.clear();
  }

  buckets.set(bucketKey, { count: 1, resetAt: now + config.windowMs });
  return null;
}
