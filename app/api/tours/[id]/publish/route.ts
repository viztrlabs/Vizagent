import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { mapTourConfig } from '@/lib/tour/map-tour-config';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/server/logger';

const log = createLogger({ module: 'api/tours/publish' });

function presignGetObject(storagePath: string): string {
  return supabaseAdmin.storage.from('assets').getPublicUrl(storagePath).data.publicUrl;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: dbUser.tenantId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Build current tour config snapshot
    const assets = await prisma.asset.findMany({
      where: { projectId, status: 'ready' },
      orderBy: { createdAt: 'asc' },
    });

    const tourConfig = mapTourConfig({
      project: {
        id: project.id,
        name: project.name,
        settings: project.settings,
      },
      assets: assets.map((a) => ({
        id: a.id,
        storage_path: a.storagePath ?? '',
        file_type: a.fileType ?? '',
        file_name: a.fileName ?? '',
        metadata: a.metadata ?? undefined,
      })),
      publicUrlFor: presignGetObject,
    });

    if (!tourConfig) {
      return NextResponse.json(
        { error: 'No equirectangular assets found for this tour' },
        { status: 400 }
      );
    }

    // Generate version number
    const versionCount = await prisma.tourVersion.count({ where: { projectId } });
    const version = `v${versionCount + 1}.${Date.now()}`;

    const snapshot = JSON.parse(JSON.stringify(tourConfig));

    const tourVersion = await prisma.tourVersion.create({
      data: {
        projectId,
        version,
        configSnapshot: snapshot as never,
        createdBy: dbUser.id,
      },
    });

    // Mark project as published with timestamp
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'published',
        settings: {
          ...(typeof project.settings === 'object' ? project.settings : {}),
          publishedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: 'Tour published successfully',
      version: tourVersion.version,
      versionId: tourVersion.id,
      publishedAt: tourVersion.createdAt,
    });
  } catch (error) {
    log.error({ error }, 'Failed to publish tour');
    return NextResponse.json({ error: 'Failed to publish tour' }, { status: 500 });
  }
}
