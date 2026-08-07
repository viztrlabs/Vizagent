import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { withTenant } from './tenant';
import { getTenantId } from '@/lib/server/lib/tenant';

export async function tenantMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const tenantId = await getTenantId();
    return withTenant(prisma, tenantId, async () => handler(req));
  };
}
