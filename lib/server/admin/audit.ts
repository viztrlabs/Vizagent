import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { Prisma } from '@prisma/client';

export interface AuditFilters {
  actorId?: string;
  actorRole?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface AuditLogResult {
  logs: Prisma.AuditLogGetPayload<Record<string, never>>[];
  total: number;
}

export async function queryAuditLogs(filters: AuditFilters): Promise<AuditLogResult> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.audit.read');

  const where: Prisma.AuditLogWhereInput = {};
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.actorRole) where.actorRole = filters.actorRole;
  if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
  if (filters.resource) where.resource = filters.resource;
  if (filters.resourceId) where.resourceId = filters.resourceId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  const skip = (filters.page ?? 1 - 1) * (filters.limit ?? 50);
  const take = filters.limit ?? 50;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export interface AuditStats {
  totalLogs: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byActorRole: Record<string, number>;
}

export async function getAuditStats(dateFrom?: Date, dateTo?: Date): Promise<AuditStats> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.audit.read');

  const where: Prisma.AuditLogWhereInput = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  const [totalLogs, byAction, byResource, byActorRole] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    }),
    prisma.auditLog.groupBy({
      by: ['resource'],
      where,
      _count: { resource: true },
    }),
    prisma.auditLog.groupBy({
      by: ['actorRole'],
      where,
      _count: { actorRole: true },
    }),
  ]);

  return {
    totalLogs,
    byAction: byAction.reduce((acc, item) => ({ ...acc, [item.action]: item._count.action }), {}),
    byResource: byResource.reduce((acc, item) => ({ ...acc, [item.resource]: item._count.resource }), {}),
    byActorRole: byActorRole.reduce((acc, item) => ({ ...acc, [item.actorRole]: item._count.actorRole }), {}),
  };
}