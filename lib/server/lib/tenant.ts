import { getCurrentAuth, NULL_TENANT } from '@/lib/auth/session';

/**
 * Resolve the current caller's tenant id from the Supabase session + DB User.
 *
 * Signature unchanged (returns `Promise<string>`) and unauthenticated callers
 * keep the same zero-tenant fallback, so the ~18 API routes and repositories
 * that rely on this stay stable during the auth cutover.
 */
export async function getTenantId(): Promise<string> {
  const { tenantId } = await getCurrentAuth();
  return tenantId ?? NULL_TENANT;
}