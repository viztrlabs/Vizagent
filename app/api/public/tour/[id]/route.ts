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

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
      },
      assets: assetsWithUrls,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load tour' }, { status: 500 });
  }
}
