import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createPortalSession } from '@/lib/stripe/server';
import { SubscriptionRepository } from '@/lib/server/repositories/subscription.repository';

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = dbUser.id;

    const subscriptionRepository = new SubscriptionRepository();
    const subscription = await subscriptionRepository.findByUser(userId);

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const portalSession = await createPortalSession(subscription.stripeCustomerId, `${baseUrl}/dashboard`);

    return NextResponse.json({ url: portalSession.url });
  } catch {
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
