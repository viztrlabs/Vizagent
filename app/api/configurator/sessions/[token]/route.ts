import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { SessionRepository } from '@/lib/server/repositories/session.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';

const sessionRepository = new SessionRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const tenantId = await getTenantId();

    const session = await withTenant(prisma, tenantId, async () =>
      sessionRepository.findByShareToken(token)
    );

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
