import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getTourAnalytics } from '@/lib/server/tour/analytics';
import { createLogger } from '@/lib/server/logger';

const log = createLogger({ module: 'api/tours/stats' });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: dbUser.tenantId },
      select: { id: true, viewCount: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const [sceneCount, hotspotCount, floorCount, walkthroughCount] = await Promise.all([
      prisma.tourScene.count({ where: { projectId } }),
      prisma.tourHotspot.count({ where: { scene: { projectId } } }),
      prisma.tourFloor.count({ where: { projectId } }),
      prisma.tourWalkthrough.count({ where: { projectId, active: true } }),
    ]);

    const { searchParams } = new URL(req.url);
    const detailed = searchParams.get('detailed') === 'true';

    if (detailed) {
      const fromParam = searchParams.get('from');
      const toParam = searchParams.get('to');
      const analytics = await getTourAnalytics(projectId, {
        from: fromParam ? new Date(fromParam) : undefined,
        to: toParam ? new Date(toParam) : undefined,
      });

      return NextResponse.json({
        totalViews: project.viewCount,
        sceneCount,
        hotspotCount,
        floorCount,
        walkthroughCount,
        analytics,
      });
    }

    return NextResponse.json({
      totalViews: project.viewCount,
      sceneCount,
      hotspotCount,
      floorCount,
      walkthroughCount,
    });
  } catch (error) {
    log.error({ error }, 'Failed to fetch tour stats');
    return NextResponse.json({ error: 'Failed to fetch tour stats' }, { status: 500 });
  }
}
