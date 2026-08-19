// M14: Dunning Management — handle failed payments
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';

export interface DunningConfig {
  maxRetries: number;
  retryIntervals: number[]; // days after failure
  finalAction: 'cancel' | 'pause' | 'downgrade';
}

export const DEFAULT_DUNNING_CONFIG: DunningConfig = {
  maxRetries: 3,
  retryIntervals: [1, 3, 7], // retry after 1, 3, 7 days
  finalAction: 'cancel',
};

export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const stripe = getStripe();
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string }).subscription;

  if (!subscriptionId) return;

  // Get subscription details
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const attemptCount = sub.metadata?.dunning_attempts ? parseInt(sub.metadata.dunning_attempts) : 0;

  if (attemptCount >= DEFAULT_DUNNING_CONFIG.maxRetries) {
    // Max retries reached - take final action
    await applyFinalAction(stripe, sub, DEFAULT_DUNNING_CONFIG.finalAction);
    return;
  }

  // Schedule retry
  const nextRetryIndex = Math.min(attemptCount, DEFAULT_DUNNING_CONFIG.retryIntervals.length - 1);
  const retryDays = DEFAULT_DUNNING_CONFIG.retryIntervals[nextRetryIndex];
  const retryAt = new Date(Date.now() + retryDays * 24 * 60 * 60 * 1000);

  await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      ...sub.metadata,
      dunning_attempts: (attemptCount + 1).toString(),
      next_retry_at: retryAt.toISOString(),
    },
  });

  // In production, send notification email here
}

async function applyFinalAction(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  action: DunningConfig['finalAction']
): Promise<void> {
  switch (action) {
    case 'cancel':
      await stripe.subscriptions.cancel(subscription.id);
      break;
    case 'pause':
      await stripe.subscriptions.update(subscription.id, { pause_collection: { behavior: 'void' } });
      break;
    case 'downgrade':
      // Downgrade to free tier - would need price ID for free
      break;
  }
}

export async function getDunningStatus(subscriptionId: string): Promise<{
  inDunning: boolean;
  attemptCount: number;
  nextRetryAt?: string;
  finalAction?: string;
}> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const attemptCount = sub.metadata?.dunning_attempts ? parseInt(sub.metadata.dunning_attempts) : 0;

  return {
    inDunning: attemptCount > 0,
    attemptCount,
    nextRetryAt: sub.metadata?.next_retry_at,
    finalAction: attemptCount >= DEFAULT_DUNNING_CONFIG.maxRetries ? DEFAULT_DUNNING_CONFIG.finalAction : undefined,
  };
}