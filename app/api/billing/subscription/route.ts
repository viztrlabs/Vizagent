import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { upgradeSubscription, cancelSubscription, calculateProration, createRefund, retryFailedPayment, getInvoices, getUpcomingInvoice } from '@/lib/billing/billing-service';
import { BillingInterval, Tier } from '@/lib/stripe/tiers';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'invoices') {
    const subscription = await import('@/lib/db/server').then(m => m.prisma.subscription.findFirst({ where: { userId: auth.authUser!.id } }));
    if (!subscription) return NextResponse.json({ error: 'No subscription' }, { status: 404 });
    const invoices = await getInvoices(subscription.stripeCustomerId);
    return NextResponse.json({ invoices });
  }

  if (action === 'upcoming') {
    const subscription = await import('@/lib/db/server').then(m => m.prisma.subscription.findFirst({ where: { userId: auth.authUser!.id } }));
    if (!subscription) return NextResponse.json({ error: 'No subscription' }, { status: 404 });
    const upcoming = await getUpcomingInvoice(subscription.stripeCustomerId);
    return NextResponse.json({ upcoming });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (body.action === 'upgrade') {
    const result = await upgradeSubscription(auth.authUser.id, {
      tier: body.tier as Tier,
      interval: body.interval as BillingInterval,
      prorationBehavior: body.prorationBehavior,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (body.action === 'cancel') {
    const result = await cancelSubscription(auth.authUser.id, body.atPeriodEnd !== false);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (body.action === 'proration') {
    const subscription = await import('@/lib/db/server').then(m => m.prisma.subscription.findFirst({ where: { userId: auth.authUser!.id } }));
    if (!subscription) return NextResponse.json({ error: 'No subscription' }, { status: 404 });

    const proration = calculateProration(
      subscription.tier as Tier,
      body.newTier as Tier,
      subscription.stripePriceId.includes('annually') ? 'annually' : 'monthly',
      body.newInterval as BillingInterval,
      subscription.currentPeriodEnd || new Date()
    );
    return NextResponse.json({ proration });
  }

  if (body.action === 'refund') {
    const result = await createRefund(body.paymentIntentId, body.amount);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (body.action === 'retry_payment') {
    const result = await retryFailedPayment(body.invoiceId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}