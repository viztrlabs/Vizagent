import { cache } from 'react';
import { prisma } from '@/lib/db/server';
import { getSessionUser } from '@/lib/supabase/server-client';

/**
 * Application roles. Stored on the DB `User.role`. `SUPER_ADMIN` overrides all
 * checks. Derive roles server-side only — never trust client values (RULES §3).
 */
export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'CLIENT';

/** Tenant/workspace fallback used before a User row exists (public/anon). */
export const NULL_TENANT = '00000000-0000-0000-0000-000000000000';

/** Coerce a stored role string into a safe AppRole. Unknown values become CLIENT. */
export function normalizeRole(role?: string | null): AppRole {
  const r = (role ?? '').trim().toUpperCase();
  if (r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'USER' || r === 'CLIENT') {
    return r as AppRole;
  }
  return 'CLIENT';
}

/** M2: coarse action-level permissions. SUPER_ADMIN always passes. */
export type Permission =
  | 'users.read'
  | 'users.write'
  | 'projects.read'
  | 'projects.write'
  | 'deployments.write'
  | 'billing.read'
  | 'settings.write'
  | 'audit.read'
  | 'content.write';

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: [
    'users.read',
    'users.write',
    'projects.read',
    'projects.write',
    'deployments.write',
    'billing.read',
    'settings.write',
    'audit.read',
  ],
  ADMIN: [
    'users.read',
    'projects.read',
    'projects.write',
    'deployments.write',
    'billing.read',
    'settings.write',
    'audit.read',
    'content.write',
  ],
  USER: ['projects.read', 'deployments.write'],
  CLIENT: ['projects.read'],
};

export function hasPermission(role: AppRole, permission: Permission | Permission[]): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const allowed = ROLE_PERMISSIONS[role] ?? [];
  const required = Array.isArray(permission) ? permission : [permission];
  return required.some((p) => allowed.includes(p));
}

export interface CurrentAuth {
  /** Supabase-auth user (id + email). Null when no session. */
  authUser: { id: string; email: string } | null;
  /** Matching application User row, keyed by email. Null when unlinked. */
  dbUser: { id: string; role: string; tenantId: string } | null;
  role: AppRole;
  tenantId: string;
}

/**
 * Authenticated caller = Supabase session bundled with the matching DB User
 * (keyed by email). Cached once per request via React `cache()`.
 *
 * Unauthenticated / unlinked callers return `tenantId = NULL_TENANT`, mirroring
 * the previous NextAuth fallback so existing route consumers stay stable.
 */
export const getCurrentAuth = cache(async (): Promise<CurrentAuth> => {
  const authUser = await getSessionUser();

  if (!authUser?.email) {
    return { authUser: null, dbUser: null, role: 'CLIENT', tenantId: NULL_TENANT };
  }

  let dbUser: { id: string; role: string; tenantId: string } | null = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id: true, role: true, tenantId: true },
    });
  } catch {
    // DB unavailable or lookup failed — treat as unlinked, never crash the request.
    dbUser = null;
  }

  return {
    authUser: { id: authUser.id, email: authUser.email },
    dbUser,
    role: normalizeRole(dbUser?.role),
    tenantId: dbUser?.tenantId ?? NULL_TENANT,
  };
});

/**
 * True when the caller holds at least one of `required` roles.
 * `SUPER_ADMIN` always passes.
 */
export async function requireRole(required: AppRole | AppRole[]): Promise<boolean> {
  const { role } = await getCurrentAuth();
  if (role === 'SUPER_ADMIN') return true;
  const allowed = Array.isArray(required) ? required : [required];
  return allowed.includes(role);
}

/**
 * M2: granular permission guard. Returns the caller role on success, throws
 * on failure so server components can redirect/notFound() early.
 */
export async function requirePermission(permission: Permission | Permission[]): Promise<AppRole> {
  const { role } = await getCurrentAuth();
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: missing permission ${Array.isArray(permission) ? permission.join('|') : permission}`);
  }
  return role;
}