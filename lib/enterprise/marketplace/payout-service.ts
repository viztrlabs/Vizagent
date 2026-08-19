// M17: Creator Payout Service
import { prisma } from '@/lib/db/server';

export interface CreatorPayout {
  id: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  createdAt: string;
}

export async function calculatePayouts(tenantId: string, periodStart: Date, periodEnd: Date): Promise<{ sellerId: string; amount: number }[]> {
  const purchases = await prisma.marketplacePurchase.findMany({
    where: {
      item: { tenantId },
      status: 'completed',
      purchasedAt: { gte: periodStart, lte: periodEnd },
    },
    select: { sellerId: true, netAmount: true },
  });
  
  const totals = new Map<string, number>();
  for (const p of purchases) {
    totals.set(p.sellerId, (totals.get(p.sellerId) || 0) + p.netAmount);
  }
  
  return Array.from(totals.entries()).map(([sellerId, amount]) => ({ sellerId, amount }));
}

export async function createPayouts(tenantId: string, periodStart: Date, periodEnd: Date): Promise<any[]> {
  const payouts = await calculatePayouts(tenantId, periodStart, periodEnd);
  const results = [];
  
  for (const { sellerId, amount } of payouts) {
    if (amount <= 0) continue;
    
    const payout = await prisma.creatorPayout.create({
      data: {
        sellerId,
        amount,
        currency: 'USD',
        status: 'pending',
        periodStart,
        periodEnd,
      },
    });
    results.push(payout);
  }
  
  return results;
}

export async function markPayoutPaid(payoutId: string): Promise<void> {
  await prisma.creatorPayout.update({
    where: { id: payoutId },
    data: { status: 'paid', paidAt: new Date() },
  });
}

export async function getSellerPayouts(sellerId: string, tenantId: string): Promise<any[]> {
  return prisma.creatorPayout.findMany({
    where: { sellerId },
    orderBy: { createdAt: 'desc' },
  });
}