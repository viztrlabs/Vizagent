import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';

export interface AuditLogInput {
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
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

    await prisma.auditLog.create({
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
  } catch {
    // Swallow audit failures — never block the primary request.
  }
}