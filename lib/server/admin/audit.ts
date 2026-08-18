import { prisma } from '../../../lib/db/server';
import { getCurrentAuth } from '../../../lib/auth/session';

export interface AuditLogInput {
  action: string;
  resource: string;
  resourceId?: string | null;
  changes?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string | null;
  changes: any;
  ip?: string | undefined;
  userAgent?: string | undefined;
  createdAt: Date;
}

export async function auditLog(input: AuditLogInput): Promise<AuditLogEntry> {
  const { dbUser, role } = await getCurrentAuth();
  const actorId = dbUser?.id ?? 'anonymous';
  const actorRole = role;

  const entry = await prisma.auditLog.create({
    data: {
      actorId,
      actorRole,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      // Prisma `Json` fields are typed `any` in the generated client.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      changes: input.changes as any,
      ip: input.ip,
      userAgent: input.userAgent,
    },
  });

  return {
    id: entry.id,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId,
    changes: entry.changes,
    ip: entry.ip ?? undefined,
    userAgent: entry.userAgent ?? undefined,
    createdAt: entry.createdAt,
  };
}

export async function listAuditLogs(
  filter: Partial<{
    actorId: string;
    actorRole: string;
    action: string;
    resource: string;
    resourceId: string | null;
    createdAt: [gte: Date, lte: Date];
  }> = {}
): Promise<AuditLogEntry[]> {
  const where: any = {};

  if (filter.actorId) {
    where.actorId = filter.actorId;
  }

  if (filter.actorRole) {
    where.actorRole = filter.actorRole;
  }

  if (filter.action) {
    where.action = filter.action;
  }

  if (filter.resource) {
    where.resource = filter.resource;
  }

  if (filter.resourceId !== undefined && filter.resourceId !== null) {
    where.resourceId = filter.resourceId;
  }

  if (filter.createdAt) {
    where.createdAt = {
      gte: filter.createdAt[0],
      lte: filter.createdAt[1],
    };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return logs.map((log) => ({
    id: log.id,
    actorId: log.actorId,
    actorRole: log.actorRole,
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    changes: log.changes,
    ip: log.ip ?? undefined,
    userAgent: log.userAgent ?? undefined,
    createdAt: log.createdAt,
  }));
}

export async function getAuditLogCount(filter: Partial<{
  actorId: string;
  action: string;
  resource: string;
}> = {}): Promise<number> {
  const where: any = {};

  if (filter.actorId) {
    where.actorId = filter.actorId;
  }

  if (filter.action) {
    where.action = filter.action;
  }

  if (filter.resource) {
    where.resource = filter.resource;
  }

  return await prisma.auditLog.count({ where });
}