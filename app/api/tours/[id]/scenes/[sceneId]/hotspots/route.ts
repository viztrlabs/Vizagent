import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { validateBody, validationErrorResponse } from '@/lib/validations/api';
import { createLogger } from '@/lib/server/logger';
import { z } from 'zod';

const log = createLogger({ module: 'api/tours/scenes/[sceneId]/hotspots' });

const createHotspotSchema = z.object({
  hotspotType: z.enum(['info', 'navigation', 'gallery', 'external', 'model3d', 'floor']).default('info'),
  label: z.string().min(1),
  yaw: z.number().min(-Math.PI).max(Math.PI),
  pitch: z.number().min(-Math.PI / 2).max(Math.PI / 2),
  targetSceneId: z.string().uuid().optional(),
  url: z.string().url().optional(),
  galleryId: z.string().uuid().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: projectId, sceneId } = await params;

    const scene = await prisma.tourScene.findFirst({
      where: {
        id: sceneId,
        projectId,
        project: { tenantId: dbUser.tenantId },
      },
      select: { id: true },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    const hotspots = await prisma.tourHotspot.findMany({
      where: { sceneId },
    });

    return NextResponse.json({ hotspots });
  } catch (error) {
    log.error({ error }, 'Failed to fetch hotspots');
    return NextResponse.json({ error: 'Failed to fetch hotspots' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: projectId, sceneId } = await params;

    const scene = await prisma.tourScene.findFirst({
      where: {
        id: sceneId,
        projectId,
        project: { tenantId: dbUser.tenantId },
      },
      select: { id: true },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    const body = await req.json();
    const validation = validateBody(createHotspotSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const data = validation.data;
    const hotspot = await prisma.tourHotspot.create({
      data: {
        sceneId,
        hotspotType: data.hotspotType ?? 'info',
        label: data.label,
        yaw: data.yaw,
        pitch: data.pitch,
        targetSceneId: data.targetSceneId,
        url: data.url,
        galleryId: data.galleryId,
      },
    });

    return NextResponse.json({ hotspot }, { status: 201 });
  } catch (error) {
    log.error({ error }, 'Failed to create hotspot');
    return NextResponse.json({ error: 'Failed to create hotspot' }, { status: 500 });
  }
}
