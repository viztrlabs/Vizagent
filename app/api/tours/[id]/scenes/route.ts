import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { validateBody, validationErrorResponse } from '@/lib/validations/api';
import { createLogger } from '@/lib/server/logger';
import { z } from 'zod';

const log = createLogger({ module: 'api/tours/scenes' });

const createSceneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  equirectangularUrl: z.string().url('Must be a valid URL'),
  sortOrder: z.number().int().default(0),
  initialView: z
    .object({
      yaw: z.number(),
      pitch: z.number(),
      fov: z.number().optional(),
    })
    .optional(),
});

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

    const scenes = await prisma.tourScene.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    });

    const sceneIds = scenes.map((s) => s.id);
    const hotspots =
      sceneIds.length > 0
        ? await prisma.tourHotspot.findMany({
            where: { sceneId: { in: sceneIds } },
          })
        : [];

    const hotspotsByScene = new Map<string, typeof hotspots>();
    for (const h of hotspots) {
      const list = hotspotsByScene.get(h.sceneId) ?? [];
      list.push(h);
      hotspotsByScene.set(h.sceneId, list);
    }

    const scenesWithHotspots = scenes.map((s) => ({
      ...s,
      hotspots: hotspotsByScene.get(s.id) ?? [],
    }));

    return NextResponse.json({ scenes: scenesWithHotspots });
  } catch (error) {
    log.error({ error }, 'Failed to fetch scenes');
    return NextResponse.json({ error: 'Failed to fetch scenes' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
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

    const body = await req.json();
    const validation = validateBody(createSceneSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const scene = await prisma.tourScene.create({
      data: {
        projectId,
        title: validation.data.title,
        equirectangularUrl: validation.data.equirectangularUrl,
        sortOrder: validation.data.sortOrder,
        initialView: validation.data.initialView as never,
      },
    });

    return NextResponse.json({ scene }, { status: 201 });
  } catch (error) {
    log.error({ error }, 'Failed to create scene');
    return NextResponse.json({ error: 'Failed to create scene' }, { status: 500 });
  }
}
