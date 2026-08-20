import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createLogger } from '@/lib/server/logger';

const log = createLogger({ module: 'api/tours/versions' });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: dbUser.tenantId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const versions = await prisma.tourVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        version: true,
        createdAt: true,
        createdBy: true,
        configSnapshot: true,
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    log.error({ error }, 'Failed to fetch versions');
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}
