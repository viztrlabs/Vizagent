import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { Prisma } from '@prisma/client';

export interface UserFilters {
  role?: string;
  tenantId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserListResult {
  users: Prisma.UserGetPayload<Record<string, never>>[];
  total: number;
}

export async function listUsers(filters: UserFilters): Promise<UserListResult> {
  const { tenantId, role, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.users.read');

  const where: Prisma.UserWhereInput = {};
  if (filters.role) where.role = filters.role;
  if (filters.tenantId) where.tenantId = filters.tenantId;
  else where.tenantId = tenantId;
  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const skip = (filters.page ?? 1 - 1) * (filters.limit ?? 20);
  const take = filters.limit ?? 20;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function getUser(id: string): Promise<Prisma.UserGetPayload<Record<string, never>> | null> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.users.read');

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export interface UpdateUserRoleInput {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'CLIENT';
}

export async function updateUserRole(id: string, input: UpdateUserRoleInput): Promise<{ id: string; role: string } | null> {
  const { tenantId, dbUser, role: currentRole } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.users.write');

  if (currentRole !== 'SUPER_ADMIN' && input.role === 'SUPER_ADMIN') {
    throw new Error('Only SUPER_ADMIN can assign SUPER_ADMIN role');
  }

  const existing = await prisma.user.findFirst({
    where: { id, tenantId },
    select: { id: true, role: true },
  });
  if (!existing) throw new Error('User not found');

  if (existing.id === dbUser.id && input.role !== existing.role) {
    throw new Error('Cannot change your own role');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: input.role },
    select: { id: true, role: true },
  });

  await auditLog({
    action: 'admin.user.role.update',
    resource: 'user',
    resourceId: id,
    changes: { oldRole: existing.role, newRole: input.role },
  });

  return user;
}

export async function suspendUser(id: string, suspended: boolean): Promise<{ id: string; suspended: boolean } | null> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.users.write');

  const existing = await prisma.user.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) throw new Error('User not found');

  if (existing.id === dbUser.id) {
    throw new Error('Cannot suspend yourself');
  }

  await auditLog({
    action: suspended ? 'admin.user.suspend' : 'admin.user.activate',
    resource: 'user',
    resourceId: id,
  });

  return { id, suspended };
}