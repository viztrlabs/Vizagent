import { prisma } from '../../db/server';
import { getCurrentAuth } from '../../auth/session';
import type { Prisma } from '@prisma/client';

export interface AuditLogInput {
  action: string;
  resource: string;
  resourceId?: string | null;
  changes?: Prisma.JsonValue;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  actorId?: string;
  actorRole?: string;
  action?: string;
  resource?: string;
  resourceId?: string | null;
  userId?: string;
  createdAt?: [Date, Date];
}

/**
 * P1.2: Append an audit log entry for the current authenticated caller.
 *
 * Failures to write the audit record are swallowed so they never break the
 * primary request path. The `actorRole` is derived server-side from the DB
 * User row (never trusted from the client).
 */
export async function auditLog(input: AuditLogInput): Promise<void> {
  try {
    const { dbUser, role } = await getCurrentAuth();
    const actorId = dbUser?.id ?? 'anonymous';
    const actorRole = role;

    // Convert Date objects in changes to ISO strings for JSON compatibility
    let processedChanges = input.changes;
    if (processedChanges && typeof processedChanges === 'object') {
      processedChanges = JSON.parse(
        JSON.stringify(processedChanges, (key, value) =>
          value instanceof Date ? value.toISOString() : value
        )
      );
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        actorRole,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        changes: processedChanges as Prisma.InputJsonValue,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  } catch {
    // Swallow audit failures — never block the primary request.
  }
}

export async function listAuditLogs(
  filter: Partial<{
    actorId: string;
    actorRole: string;
    action: string;
    resource: string;
    resourceId: string | null;
    userId: string;
    createdAt: [gte: Date, lte: Date];
  }> = {}
): Promise<
  Array<{
    id: string;
    actorId: string;
    actorRole: string;
    action: string;
    resource: string;
    resourceId: string | null;
    changes: Prisma.JsonValue;
    ip?: string | undefined;
    userAgent?: string | undefined;
    createdAt: Date;
  }>
> {
  const where: Record<string, unknown> = {};

  if (filter.actorId) {
    where.actorId = filter.actorId;
  }

  if (filter.userId) {
    where.actorId = filter.userId;
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
  userId: string;
  action: string;
  resource: string;
}> = {}): Promise<number> {
  const where: any = {};

  if (filter.actorId) {
    where.actorId = filter.actorId;
  }

  if (filter.userId) {
    where.actorId = filter.userId;
  }

  if (filter.action) {
    where.action = filter.action;
  }

  if (filter.resource) {
    where.resource = filter.resource;
  }

  return await prisma.auditLog.count({ where });
}