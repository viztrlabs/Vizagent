import { prisma } from '@/lib/db/server';
import { DealStage } from '@prisma/client';

export async function createDeal(data: {
  leadId: string;
  contactId?: string;
  title: string;
  value?: number;
  currency?: string;
  closeDate?: Date;
  tenantId: string;
}) {
  return prisma.deal.create({ data });
}

export async function getDeals(tenantId: string, stage?: DealStage) {
  const where: Record<string, unknown> = { tenantId };
  if (stage) where.stage = stage;
  return prisma.deal.findMany({
    where,
    include: { lead: true, contact: true, tasks: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDealById(id: string, tenantId: string) {
  return prisma.deal.findFirst({
    where: { id, tenantId },
    include: { lead: true, contact: true, tasks: true },
  });
}

export async function updateDealStage(id: string, stage: DealStage) {
  return prisma.deal.update({
    where: { id },
    data: { stage },
  });
}

export async function getPipelineSummary(tenantId: string) {
  const deals = await prisma.deal.groupBy({
    by: ['stage'],
    where: { tenantId },
    _count: { id: true },
    _sum: { value: true },
  });
  return deals.map(d => ({
    stage: d.stage,
    count: d._count.id,
    totalValue: Number(d._sum.value || 0),
  }));
}

export async function deleteDeal(id: string) {
  return prisma.deal.delete({ where: { id } });
}
