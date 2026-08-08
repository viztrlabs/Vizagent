import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe/server';
import { SubscriptionRepository } from '@/lib/server/repositories/subscription.repository';

export const dynamic = 'force-dynamic';

const subscriptionRepository = new SubscriptionRepository();

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string | undefined;
  if (!subscriptionId || typeof subscriptionId !== 'string') return;
  const userId = session.metadata?.userId;
  const tenantId = session.metadata?.tenantId;
  if (!userId || !tenantId) return;
  await subscriptionRepository.upsert({
    userId,
    tenantId,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: 'unknown',
    tier: 'unknown',
    status: 'active',
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const s = sub as unknown as {
    metadata?: { userId?: string; tenantId?: string };
    items: { data: Array<{ price: { id: string } }> };
    customer: string | { id: string };
    id: string;
    status: string;
    current_period_start?: number;
    current_period_end?: number;
  };
  const userId = s.metadata?.userId;
  const tenantId = s.metadata?.tenantId;
  if (!userId || !tenantId) return;
  const priceId = s.items?.data?.[0]?.price?.id ?? 'unknown';
  const customerId = typeof s.customer === 'string' ? s.customer : s.customer?.id;
  const currentPeriodEnd = s.current_period_end
    ? new Date(s.current_period_end * 1000)
    : undefined;
  await subscriptionRepository.upsert({
    userId,
    tenantId,
    stripeCustomerId: customerId ?? 'unknown',
    stripeSubscriptionId: s.id,
    stripePriceId: priceId,
    tier: 'unknown',
    status: s.status,
    currentPeriodStart: s.current_period_start
      ? new Date(s.current_period_start * 1000)
      : undefined,
    currentPeriodEnd,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await subscriptionRepository.updateStatus(subscription.id, 'canceled');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }
    const event = constructWebhookEvent(body, signature);
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}