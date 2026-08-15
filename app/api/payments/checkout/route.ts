import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createCheckoutSession } from '@/lib/stripe/server';
import { getPriceId } from '@/lib/stripe/tiers';
import { rateLimit, clientIp } from '@/lib/server/middleware/rate-limit';
import { auditLog } from '@/lib/server/audit/audit-logger';

// M0.5: bound checkout attempts to mitigate automated abuse / Stripe spam.
const CHECKOUT_LIMIT = { limit: 5, windowMs: 60_000, prefix: 'checkout' };

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Per-user rate limit (falls back to IP when user info isn't yet resolved).
    const limited = rateLimit(request, {
      ...CHECKOUT_LIMIT,
      key: dbUser.id ?? clientIp(request),
    });
    if (limited) return limited;

    const body = await request.json();
    const { tier } = body as { tier?: string };
    if (!tier) {
      return NextResponse.json({ error: 'tier required' }, { status: 400 });
    }

    const priceId = getPriceId(tier);
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const userId = dbUser.id;
    const tenantId = dbUser.tenantId;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const checkoutSession = await createCheckoutSession({
      priceId,
      userId,
      tenantId,
      successUrl: `${baseUrl}/dashboard?subscription=success`,
      cancelUrl: `${baseUrl}/pricing?subscription=canceled`,
    });

    // P1.2: audit successful checkout creation
    await auditLog({
      action: 'checkout.create',
      resource: 'payment',
      resourceId: checkoutSession.id,
      changes: { tier, priceId },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}