import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { Prisma } from '@prisma/client';
import { Permission, ROLE_PERMISSIONS, AppRole } from '@/lib/auth/session';

export interface RolePermissions {
  role: AppRole;
  permissions: Permission[];
}

export async function getRolePermissions(): Promise<RolePermissions[]> {
  const { dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.rbac.read');

  return Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
    role: role as AppRole,
    permissions,
  }));
}

export interface GrantRoleInput {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'CLIENT';
  permission: string;
}

export async function grantRolePermission(input: GrantRoleInput): Promise<RolePermissions> {
  const { dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.rbac.write');

  if (role !== 'SUPER_ADMIN') {
    throw new Error('Only SUPER_ADMIN can modify role permissions');
  }

  const roleKey = input.role as keyof typeof ROLE_PERMISSIONS;
  if (!ROLE_PERMISSIONS[roleKey]) {
    throw new Error('Invalid role');
  }

  const permission = input.permission as any;
  if (!ROLE_PERMISSIONS[roleKey].includes(permission)) {
    ROLE_PERMISSIONS[roleKey].push(permission);
  }

  await auditLog({
    action: 'admin.rbac.grant',
    resource: 'rbac',
    changes: { role: input.role, permission: input.permission },
  });

  return { role: input.role, permissions: ROLE_PERMISSIONS[roleKey] };
}

export interface RevokeRoleInput {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'CLIENT';
  permission: string;
}

export async function revokeRolePermission(input: RevokeRoleInput): Promise<RolePermissions> {
  const { dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.rbac.write');

  if (role !== 'SUPER_ADMIN') {
    throw new Error('Only SUPER_ADMIN can modify role permissions');
  }

  const roleKey = input.role as keyof typeof ROLE_PERMISSIONS;
  if (!ROLE_PERMISSIONS[roleKey]) {
    throw new Error('Invalid role');
  }

  const permission = input.permission as any;
  const index = ROLE_PERMISSIONS[roleKey].indexOf(permission);
  if (index > -1) {
    ROLE_PERMISSIONS[roleKey].splice(index, 1);
  }

  await auditLog({
    action: 'admin.rbac.revoke',
    resource: 'rbac',
    changes: { role: input.role, permission: input.permission },
  });

  return { role: input.role, permissions: ROLE_PERMISSIONS[roleKey] };
}

export async function getAvailablePermissions(): Promise<string[]> {
  const { dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.rbac.read');

  // Return all defined permissions from the type
  return [
    'users.read',
    'users.write',
    'projects.read',
    'projects.write',
    'deployments.write',
    'billing.read',
    'settings.write',
    'audit.read',
    'content.write',
    'client.portals.read',
    'collab.annotate',
    'collab.comment',
    'approvals.request',
    'approvals.manage',
    'admin.users.read',
    'admin.users.write',
    'admin.rbac.read',
    'admin.rbac.write',
    'admin.audit.read',
    'admin.monitoring.read',
    'admin.billing.read',
    'admin.billing.write',
    'admin.agents.read',
    'admin.agents.control',
  ];
}