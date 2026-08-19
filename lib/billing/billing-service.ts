// M14: Billing Service — upgrade/downgrade, proration, dunning, refunds, invoices
import Stripe from 'stripe';
import { prisma } from '@/lib/db/server';
import { getStripe } from '@/lib/stripe/server';
import { Tier, getTierConfig, getPriceId, BillingInterval } from '@/lib/stripe/tiers';

export interface UpgradeOptions {
  tier: Tier;
  interval: BillingInterval;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface BillingResult {
  success: boolean;
  subscription?: Stripe.Subscription;
  invoice?: Stripe.Invoice;
  error?: string;
}

export async function upgradeSubscription(
  userId: string,
  options: UpgradeOptions
): Promise<BillingResult> {
  try {
    // Get current subscription
    const subscription = await prisma.subscription.findFirst({ where: { userId } });
    if (!subscription) {
      return { success: false, error: 'No active subscription found' };
    }

    const stripe = getStripe();
    const priceId = getPriceId(options.tier, options.interval);
    if (!priceId) {
      return { success: false, error: `Price ID not configured for ${options.tier} (${options.interval})` };
    }

    // Get the subscription item to update
    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) {
      return { success: false, error: 'No subscription item found' };
    }

    // Update subscription with new price
    const updatedSub = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: options.prorationBehavior || 'create_prorations',
      metadata: { tier: options.tier, interval: options.interval },
    });

    // Update local DB
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripePriceId: priceId,
        tier: options.tier,
        status: updatedSub.status,
        currentPeriodStart: new Date((updatedSub as unknown as { current_period_start: number }).current_period_start * 1000),
        currentPeriodEnd: new Date((updatedSub as unknown as { current_period_end: number }).current_period_end * 1000),
      },
    });

    return { success: true, subscription: updatedSub };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Upgrade failed' };
  }
}

export async function cancelSubscription(userId: string, atPeriodEnd = true): Promise<BillingResult> {
  try {
    const subscription = await prisma.subscription.findFirst({ where: { userId } });
    if (!subscription) {
      return { success: false, error: 'No active subscription found' };
    }

    const stripe = getStripe();
    const canceled = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: atPeriodEnd,
    });

    if (!atPeriodEnd) {
      // Immediately cancel
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'canceled' },
      });
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: canceled.status },
      });
    }

    return { success: true, subscription: canceled };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Cancellation failed' };
  }
}

export async function createRefund(paymentIntentId: string, amount?: number): Promise<BillingResult> {
  try {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason: 'requested_by_customer',
    });
    return { success: true, invoice: refund as unknown as Stripe.Invoice };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Refund failed' };
  }
}

export async function retryFailedPayment(invoiceId: string): Promise<BillingResult> {
  try {
    const stripe = getStripe();
    const invoice = await stripe.invoices.pay(invoiceId);
    return { success: true, invoice };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Payment retry failed' };
  }
}

export async function getInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
  const stripe = getStripe();
  const invoices = await stripe.invoices.list({ customer: customerId, limit });
  return invoices.data;
}

export async function getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
  const stripe = getStripe();
  try {
    // @ts-expect-error - retrieveUpcoming not in types but exists in SDK
    return await stripe.invoices.retrieveUpcoming({ customer: customerId });
  } catch {
    return null;
  }
}

export function calculateProration(
  currentTier: Tier,
  newTier: Tier,
  currentInterval: BillingInterval,
  newInterval: BillingInterval,
  currentPeriodEnd: Date
): { amount: number; description: string } {
  const currentConfig = getTierConfig(currentTier);
  const newConfig = getTierConfig(newTier);
  if (!currentConfig || !newConfig) return { amount: 0, description: 'Invalid tier' };

  const currentPrice = currentInterval === 'annually' ? currentConfig.annuallyPrice : currentConfig.monthlyPrice;
  const newPrice = newInterval === 'annually' ? newConfig.annuallyPrice : newConfig.monthlyPrice;

  const daysRemaining = Math.max(0, (currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysInPeriod = currentInterval === 'annually' ? 365 : 30;

  const unusedValue = (currentPrice * daysRemaining) / daysInPeriod;
  const newValue = (newPrice * daysRemaining) / daysInPeriod;
  const prorationAmount = Math.round(newValue - unusedValue);

  return {
    amount: prorationAmount,
    description: `Proration: ${currentConfig.name} (${currentInterval}) → ${newConfig.name} (${newInterval})`,
  };
}