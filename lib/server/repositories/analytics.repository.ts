import { prisma } from '@/lib/db/server';

export interface StatusCount {
  status: string;
  count: number;
}

export class AnalyticsRepository {
  async getStatusBreakdown(tenantId: string): Promise<StatusCount[]> {
    const grouped = await prisma.project.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    });

    return grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));
  }

  async getTotalAssets(tenantId: string): Promise<number> {
    return prisma.asset.count({ where: { tenantId } });
  }
}
