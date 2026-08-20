import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createLogger } from '@/lib/server/logger';

const log = createLogger({ module: 'api/tours/versions/restore' });

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: projectId, versionId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: dbUser.tenantId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const version = await prisma.tourVersion.findFirst({
      where: { id: versionId, projectId },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Restore: update project settings with the snapshot
    await prisma.project.update({
      where: { id: projectId },
      data: {
        settings: version.configSnapshot as never,
      },
    });

    // Create a new version entry for the restore action
    const versionCount = await prisma.tourVersion.count({ where: { projectId } });
    await prisma.tourVersion.create({
      data: {
        projectId,
        version: `restore-${version.version}-${Date.now()}`,
        configSnapshot: version.configSnapshot as never,
        createdBy: dbUser.id,
      },
    });

    return NextResponse.json({
      message: 'Tour restored to version',
      restoredFrom: version.version,
      restoredAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error({ error }, 'Failed to restore tour version');
    return NextResponse.json(
      { error: 'Failed to restore tour version' },
      { status: 500 }
    );
  }
}
