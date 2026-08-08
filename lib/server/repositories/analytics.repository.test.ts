jest.mock('@/lib/db/server', () => {
  const projects: Record<string, { id: string; status: string; tenantId: string }[]> = {};
  const assets: { tenantId: string }[] = [];
  let pseq = 0;
  return {
    prisma: {
      project: {
        groupBy: jest.fn(({ where }: { where: { tenantId: string } }) => {
          const rows: Record<string, number> = {};
          (projects[where.tenantId] || []).forEach((p) => {
            rows[p.status] = (rows[p.status] || 0) + 1;
          });
          return Promise.resolve(
            Object.entries(rows).map(([status, count]) => ({ status, _count: { _all: count } }))
          );
        }),
        create: jest.fn(({ data }: { data: { status: string; tenantId: string } }) => {
          const id = `proj-${++pseq}`;
          (projects[data.tenantId] = projects[data.tenantId] || []).push({ id, ...data });
          return Promise.resolve({ id, ...data });
        }),
      },
      asset: {
        count: jest.fn(({ where }: { where: { tenantId: string } }) =>
          Promise.resolve(assets.filter((a) => a.tenantId === where.tenantId).length)
        ),
        create: jest.fn(({ data }: { data: { tenantId: string } }) => {
          assets.push(data);
          return Promise.resolve({ id: `asset-${assets.length}`, ...data });
        }),
      },
    },
  };
});

import { AnalyticsRepository } from './analytics.repository';

describe('AnalyticsRepository', () => {
  const repo = new AnalyticsRepository();

  it('getStatusBreakdown groups projects by status', async () => {
    const breakdown = await repo.getStatusBreakdown('t1');
    expect(Array.isArray(breakdown)).toBe(true);
    expect(breakdown.length).toBe(0);
  });

  it('getTotalAssets counts assets for tenant', async () => {
    const total = await repo.getTotalAssets('t1');
    expect(total).toBe(0);
  });
});
