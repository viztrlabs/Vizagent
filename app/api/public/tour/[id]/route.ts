import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { withTenant } from '@/lib/server/middleware/tenant';
import { presignGetObject } from '@/lib/server/lib/r2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (project.status !== 'published') {
      return NextResponse.json({ error: 'Project is not published' }, { status: 403 });
    }

    // Increment view count
    await prisma.project.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const assets = await withTenant(prisma, project.tenantId, async () =>
      prisma.asset.findMany({
        where: { projectId: id, tenantId: project.tenantId, status: 'ready' },
        orderBy: { createdAt: 'asc' },
      })
    );

    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => ({
        id: asset.id,
        fileName: asset.fileName,
        fileType: asset.fileType,
        size: Number(asset.fileSize),
        url: await presignGetObject(asset.storagePath),
      }))
    );

    // Fetch relational tour data
    const [tourScenes, tourFloors, tourWalkthroughs] = await Promise.all([
      prisma.tourScene.findMany({
        where: { projectId: id },
        include: { hotspots: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.tourFloor.findMany({
        where: { projectId: id },
        orderBy: { level: 'asc' },
      }),
      prisma.tourWalkthrough.findMany({
        where: { projectId: id, active: true },
      }),
    ]);

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        settings: project.settings,
        viewCount: project.viewCount,
      },
      assets: assetsWithUrls,
      tourScenes,
      tourFloors,
      tourWalkthroughs,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load tour' }, { status: 500 });
  }
}
