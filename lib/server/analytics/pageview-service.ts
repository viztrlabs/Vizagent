import { prisma } from '@/lib/db/server';

export async function recordPageView(data: {
  path: string;
  projectId?: string;
  visitorId?: string;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
  device?: string;
  browser?: string;
  tenantId: string;
}) {
  return prisma.pageView.create({ data });
}

export async function getPageViews(tenantId: string, options?: { projectId?: string; from?: Date; to?: Date }) {
  const where: Record<string, unknown> = { tenantId };
  if (options?.projectId) where.projectId = options.projectId;
  if (options?.from || options?.to) {
    where.createdAt = {};
    if (options.from) (where.createdAt as Record<string, unknown>).gte = options.from;
    if (options.to) (where.createdAt as Record<string, unknown>).lte = options.to;
  }
  return prisma.pageView.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function getViewStats(tenantId: string, options?: { projectId?: string; from?: Date; to?: Date }) {
  const where: Record<string, unknown> = { tenantId };
  if (options?.projectId) where.projectId = options.projectId;
  if (options?.from || options?.to) {
    where.createdAt = {};
    if (options.from) (where.createdAt as Record<string, unknown>).gte = options.from;
    if (options.to) (where.createdAt as Record<string, unknown>).lte = options.to;
  }

  const [totalViews, uniqueVisitors, avgDuration] = await Promise.all([
    prisma.pageView.count({ where }),
    prisma.pageView.findMany({
      where,
      select: { visitorId: true },
      distinct: ['visitorId'],
    }).then(r => r.length),
    prisma.pageView.aggregate({
      where: { ...where, durationMs: { not: null } },
      _avg: { durationMs: true },
    }),
  ]);

  return {
    totalViews,
    uniqueVisitors,
    avgDurationMs: avgDuration._avg.durationMs || 0,
  };
}

export async function getViewsByPath(tenantId: string, limit = 10) {
  const results = await prisma.pageView.groupBy({
    by: ['path'],
    where: { tenantId },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });
  return results.map(r => ({ path: r.path, views: r._count.id }));
}
