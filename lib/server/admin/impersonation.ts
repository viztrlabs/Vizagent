import { prisma } from '../../../lib/db/server';
import { getCurrentAuth } from '../../../lib/auth/session';
import { auditLog } from '../audit/audit-logger';

export interface ImpersonationFilter {
  status?: 'active' | 'revoked' | 'expired';
  adminUserId?: string;
  targetUserId?: string;
  createdAt?: [gte: Date, lte: Date];
}

export interface ImpersonationLog {
  id: string;
  adminUserId: string;
  targetUserId: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ImpersonationLogWithDetails extends ImpersonationLog {
  adminUserEmail?: string;
  adminUserRole?: string;
  targetUserEmail?: string;
  targetUserRole?: string;
}

export async function listImpersonationLogs(filter: ImpersonationFilter = {}): Promise<ImpersonationLogWithDetails[]> {
  const { status, adminUserId, targetUserId, ...filterRest } = filter;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (adminUserId) {
    where.adminUserId = adminUserId;
  }

  if (targetUserId) {
    where.targetUserId = targetUserId;
  }

  if (filterRest.createdAt) {
    where.createdAt = {
      gte: filterRest.createdAt[0],
      lte: filterRest.createdAt[1],
    };
  }

  const impersonations = await prisma.impersonationLog.findMany({
    where,
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return impersonations.map((imp) => ({
    id: imp.id,
    adminUserId: imp.adminUserId,
    targetUserId: imp.targetUserId,
    status: imp.status,
    expiresAt: imp.expiresAt,
    createdAt: imp.createdAt,
    adminUserEmail: imp.adminUser.email,
    adminUserRole: imp.adminUser.role,
    targetUserEmail: imp.targetUser.email,
    targetUserRole: imp.targetUser.role,
  }));
}

export async function createImpersonationLog(
  adminUserId: string,
  targetUserId: string,
  expiresAt: Date
): Promise<ImpersonationLogWithDetails> {
  const { dbUser } = await getCurrentAuth();
  const tenantId = dbUser?.tenantId ?? '';

  const impersonation = await prisma.impersonationLog.create({
    data: {
      adminUserId,
      targetUserId,
      status: 'active',
      expiresAt,
      tenantId,
    },
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Audit log
  await auditLog({
    action: 'impersonation.create',
    resource: 'ImpersonationLog',
    resourceId: impersonation.id,
    changes: { adminUserId, targetUserId, expiresAt, status: 'active' },
  });

  return {
    id: impersonation.id,
    adminUserId: impersonation.adminUserId,
    targetUserId: impersonation.targetUserId,
    status: impersonation.status,
    expiresAt: impersonation.expiresAt,
    createdAt: impersonation.createdAt,
    adminUserEmail: impersonation.adminUser.email,
    adminUserRole: impersonation.adminUser.role,
    targetUserEmail: impersonation.targetUser.email,
    targetUserRole: impersonation.targetUser.role,
  };
}

export async function revokeImpersonationLog(
  impersonationId: string,
  reason: string
): Promise<ImpersonationLogWithDetails> {
  const impersonation = await prisma.impersonationLog.update({
    where: { id: impersonationId },
    data: {
      status: 'revoked',
    },
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Audit log
  await auditLog({
    action: 'impersonation.revoke',
    resource: 'ImpersonationLog',
    resourceId: impersonationId,
    changes: { status: 'revoked', reason },
  });

  return {
    id: impersonation.id,
    adminUserId: impersonation.adminUserId,
    targetUserId: impersonation.targetUserId,
    status: impersonation.status,
    expiresAt: impersonation.expiresAt,
    createdAt: impersonation.createdAt,
    adminUserEmail: impersonation.adminUser.email,
    adminUserRole: impersonation.adminUser.role,
    targetUserEmail: impersonation.targetUser.email,
    targetUserRole: impersonation.targetUser.role,
  };
}

export async function cleanupExpiredImpersonations(): Promise<number> {
  const now = new Date();

  const result = await prisma.impersonationLog.updateMany({
    where: {
      status: 'active',
      expiresAt: { lte: now },
    },
    data: {
      status: 'expired',
    },
  });

  if (result.count > 0) {
    // Audit log for cleanup
    await auditLog({
      action: 'impersonation.cleanup',
      resource: 'ImpersonationLog',
      resourceId: 'batch',
      changes: { count: result.count, status: 'expired' },
    });
  }

  return result.count;
}

export async function getImpersonationLogById(impersonationId: string): Promise<ImpersonationLogWithDetails | null> {
  const impersonation = await prisma.impersonationLog.findUnique({
    where: { id: impersonationId },
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!impersonation) {
    return null;
  }

  return {
    id: impersonation.id,
    adminUserId: impersonation.adminUserId,
    targetUserId: impersonation.targetUserId,
    status: impersonation.status,
    expiresAt: impersonation.expiresAt,
    createdAt: impersonation.createdAt,
    adminUserEmail: impersonation.adminUser.email,
    adminUserRole: impersonation.adminUser.role,
    targetUserEmail: impersonation.targetUser.email,
    targetUserRole: impersonation.targetUser.role,
  };
}