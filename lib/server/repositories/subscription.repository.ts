import { prisma } from '@/lib/db/server';

export interface SubscriptionData {
  userId: string;
  tenantId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  tier: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

export class SubscriptionRepository {
  async upsert(data: SubscriptionData) {
    return prisma.subscription.upsert({
      where: { stripeSubscriptionId: data.stripeSubscriptionId },
      create: { ...data },
      update: {
        status: data.status,
        stripePriceId: data.stripePriceId,
        tier: data.tier,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      },
    });
  }

  async findByTenant(tenantId: string) {
    return prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(stripeSubscriptionId: string, status: string, currentPeriodEnd?: Date) {
    return prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: { status, currentPeriodEnd },
    });
  }
}
