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

    // Fetch relational tour data (raw queries due to Prisma WASM limitation)
    const [tourScenesRaw, tourFloorsRaw, tourWalkthroughsRaw] = await Promise.all([
      prisma.$queryRaw<[{id: string, project_id: string, title: string, equirectangular_url: string, sort_order: number, initial_view: unknown, floor_plan_position: unknown, effects: unknown}]>`
        SELECT * FROM tour_scenes WHERE project_id = ${id} ORDER BY sort_order ASC
      `,
      prisma.$queryRaw<[{id: string, project_id: string, name: string, level: number, sort_order: number, svg_path: string | null}]>`
        SELECT * FROM tour_floors WHERE project_id = ${id} ORDER BY level ASC
      `,
      prisma.$queryRaw<[{id: string, project_id: string, title: string, path: unknown, active: boolean}]>`
        SELECT * FROM tour_walkthroughs WHERE project_id = ${id} AND active = true
      `,
    ]);

    // Fetch hotspots for all scenes
    const sceneIds = tourScenesRaw.map(s => s.id);
    const hotspotsRaw = sceneIds.length > 0
      ? await prisma.$queryRaw<[{id: string, scene_id: string, type: string, label: string | null, yaw: number, pitch: number, target_scene_id: string | null, url: string | null, gallery_id: string | null}]>`
          SELECT * FROM tour_hotspots WHERE scene_id IN (${sceneIds.join(',')})
        `
      : [];

    // Group hotspots by scene
    const hotspotsByScene = new Map<string, typeof hotspotsRaw>();
    for (const h of hotspotsRaw) {
      const list = hotspotsByScene.get(h.scene_id) ?? [];
      list.push(h);
      hotspotsByScene.set(h.scene_id, list);
    }

    const tourScenes = tourScenesRaw.map(s => ({
      ...s,
      hotspots: hotspotsByScene.get(s.id) ?? [],
    }));

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
      tourFloors: tourFloorsRaw,
      tourWalkthroughs: tourWalkthroughsRaw,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load tour' }, { status: 500 });
  }
}
