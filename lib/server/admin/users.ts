import { prisma } from '../../../lib/db/server';
import { getCurrentAuth } from '../../../lib/auth/session';
import { auditLog } from '../audit/audit-logger';
import { Role } from '@prisma/client';

export interface UserFilter {
  role?: string;
  isSuspended?: boolean;
  createdAt?: [gte: Date, lte: Date];
  search?: string;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isSuspended: boolean;
  suspensionReason: string | null;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export async function listUsers(filters: UserFilter = {}): Promise<UserSummary[]> {
  const { role, isSuspended, createdAt, search, ...filterRest } = filters;

  const where: any = {};

  if (role) {
    where.role = role as Role;
  }

  if (isSuspended !== undefined) {
    where.isSuspended = isSuspended;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (createdAt) {
    where.createdAt = {
      gte: createdAt[0],
      lte: createdAt[1],
    };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isSuspended: true,
      suspensionReason: true,
      suspendedAt: true,
      createdAt: true,
      updatedAt: true,
      tenantId: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
}

export async function suspendUser(userId: string, reason: string): Promise<UserSummary> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isSuspended: true,
      suspensionReason: reason,
      suspendedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isSuspended: true,
      suspensionReason: true,
      suspendedAt: true,
      createdAt: true,
      updatedAt: true,
      tenantId: true,
    },
  });

  // Audit log
  await auditLog({
    action: 'user.suspend',
    resource: 'User',
    resourceId: userId,
    changes: { isSuspended: true, suspensionReason: reason },
  });

  return user;
}

export async function unsuspendUser(userId: string): Promise<UserSummary> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isSuspended: false,
      suspensionReason: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isSuspended: true,
      suspensionReason: true,
      suspendedAt: true,
      createdAt: true,
      updatedAt: true,
      tenantId: true,
    },
  });

  // Audit log
  await auditLog({
    action: 'user.unsuspend',
    resource: 'User',
    resourceId: userId,
    changes: { isSuspended: false, suspensionReason: null },
  });

  return user;
}

export async function updateUserRole(userId: string, role: Role): Promise<UserSummary> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isSuspended: true,
      suspensionReason: true,
      suspendedAt: true,
      createdAt: true,
      updatedAt: true,
      tenantId: true,
    },
  });

  // Audit log
  await auditLog({
    action: 'user.role.update',
    resource: 'User',
    resourceId: userId,
    changes: { role },
  });

  return user;
}

export async function getUserById(userId: string): Promise<UserSummary | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isSuspended: true,
      suspensionReason: true,
      suspendedAt: true,
      createdAt: true,
      updatedAt: true,
      tenantId: true,
    },
  });

  if (!user) return null;

  return user;
}