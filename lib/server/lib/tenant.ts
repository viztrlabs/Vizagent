import { auth } from '@/lib/auth';

export async function getTenantId(): Promise<string> {
  const session = await auth();
  const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId;

  if (!tenantId) {
    return '00000000-0000-0000-0000-000000000000';
  }

  return tenantId;
}
