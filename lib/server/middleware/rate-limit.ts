import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight in-memory fixed-window rate limiter for API routes (M0.5).
 *
 * This is a process-local limiter. It is intentionally dependency-free and
 * requires no DB/Redis round-trip, and is a good first line of defense for a
 * single-instance deployment. For multi-instance / horizontal scale-out it must
 * be swapped for a shared store (e.g. @upstash/ratelimit or a Redis-based
 * counter) — a documented M0.5 follow-on.
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
      return new NextResponse('Too Many Requests', { status: 429 });
    }
    buckets.delete(bucketKey);
  }

  const max = config.limit ?? 60;
  const windowMs = config.windowMs ?? 60_000;

  buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });

  return null;
}