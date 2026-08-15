import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { Prisma } from '@prisma/client';

export interface SubscriptionFilters {
  tenantId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SubscriptionListResult {
  subscriptions: Prisma.SubscriptionGetPayload<Record<string, never>>[];
  total: number;
}

export async function listSubscriptions(filters: SubscriptionFilters): Promise<SubscriptionListResult> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.billing.read');

  const where: Prisma.SubscriptionWhereInput = {};
  if (filters.tenantId) {
    if (role === 'SUPER_ADMIN') where.tenantId = filters.tenantId;
    else if (filters.tenantId !== (await getCurrentAuth()).tenantId) {
      throw new Error('Forbidden: cannot view other tenant subscriptions');
    } else where.tenantId = filters.tenantId;
  } else if (role !== 'SUPER_ADMIN') {
    where.tenantId = (await getCurrentAuth()).tenantId;
  }
  if (filters.status) where.status = filters.status;

  const skip = (filters.page ?? 1 - 1) * (filters.limit ?? 20);
  const take = filters.limit ?? 20;

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  return { subscriptions, total };
}

export interface InvoiceFilters {
  tenantId?: string;
  subscriptionId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceListResult {
  invoices: Prisma.InvoiceGetPayload<Record<string, never>>[];
  total: number;
}

export async function listInvoices(filters: InvoiceFilters): Promise<InvoiceListResult> {
  const { dbUser, role, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.billing.read');

  const where: Prisma.InvoiceWhereInput = {};
  if (filters.tenantId) {
    if (role === 'SUPER_ADMIN') where.tenantId = filters.tenantId;
    else if (filters.tenantId !== (await getCurrentAuth()).tenantId) {
      throw new Error('Forbidden: cannot view other tenant invoices');
    } else where.tenantId = filters.tenantId;
  } else if (role !== 'SUPER_ADMIN') {
    where.tenantId = (await getCurrentAuth()).tenantId;
  }
  if (filters.subscriptionId) where.subscriptionId = filters.subscriptionId;
  if (filters.status) where.status = filters.status;

  const skip = (filters.page ?? 1 - 1) * (filters.limit ?? 20);
  const take = filters.limit ?? 20;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { include: { tenant: { select: { id: true, name: true } } } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total };
}

export interface ChangePlanInput {
  subscriptionId: string;
  newPriceId: string;
}

export async function changeSubscriptionPlan(input: ChangePlanInput): Promise<Prisma.SubscriptionGetPayload<Record<string, never>> | null> {
  const { dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.billing.write');

  if (role !== 'SUPER_ADMIN') {
    throw new Error('Only SUPER_ADMIN can change subscription plans');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: input.subscriptionId },
    include: { tenant: true },
  });
  if (!subscription) throw new Error('Subscription not found');

  const oldPriceId = subscription.priceId;

  const updated = await prisma.subscription.update({
    where: { id: input.subscriptionId },
    data: { priceId: input.newPriceId },
  });

  await auditLog({
    action: 'admin.billing.plan.change',
    resource: 'subscription',
    resourceId: input.subscriptionId,
    changes: { oldPriceId, newPriceId: input.newPriceId },
  });

  return updated;
}

export async function getSubscription(id: string): Promise<Prisma.SubscriptionGetPayload<Record<string, never>> | null> {
  const { dbUser, role, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.billing.read');

  const where: Prisma.SubscriptionWhereUniqueInput = { id };
  if (role !== 'SUPER_ADMIN') {
    where.tenantId = tenantId;
  }

  return prisma.subscription.findUnique({
    where,
    include: {
      user: { select: { id: true, email: true, name: true } },
      tenant: { select: { id: true, name: true } },
    },
  });
}