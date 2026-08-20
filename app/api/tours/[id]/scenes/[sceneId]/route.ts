import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { validateBody, validationErrorResponse } from '@/lib/validations/api';
import { createLogger } from '@/lib/server/logger';
import { z } from 'zod';

const log = createLogger({ module: 'api/tours/scenes/[sceneId]' });

const updateSceneSchema = z.object({
  title: z.string().min(1).optional(),
  equirectangularUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
  initialView: z
    .object({
      yaw: z.number(),
      pitch: z.number(),
      fov: z.number().optional(),
    })
    .optional(),
  effects: z.record(z.unknown()).optional(),
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
      where: { id: sceneId, projectId, project: { tenantId: dbUser.tenantId } },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    const hotspots = await prisma.tourHotspot.findMany({
      where: { sceneId },
    });

    return NextResponse.json({ scene: { ...scene, hotspots } });
  } catch (error) {
    log.error({ error }, 'Failed to fetch scene');
    return NextResponse.json({ error: 'Failed to fetch scene' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: projectId, sceneId } = await params;

    const existing = await prisma.tourScene.findFirst({
      where: { id: sceneId, projectId, project: { tenantId: dbUser.tenantId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    const body = await req.json();
    const validation = validateBody(updateSceneSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const data = validation.data;
    const scene = await prisma.tourScene.update({
      where: { id: sceneId },
      data: {
        title: data.title ?? undefined,
        equirectangularUrl: data.equirectangularUrl ?? undefined,
        sortOrder: data.sortOrder ?? undefined,
        initialView: data.initialView ? data.initialView as never : undefined,
        effects: data.effects ? data.effects as never : undefined,
      },
    });

    return NextResponse.json({ scene });
  } catch (error) {
    log.error({ error }, 'Failed to update scene');
    return NextResponse.json({ error: 'Failed to update scene' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: projectId, sceneId } = await params;

    const existing = await prisma.tourScene.findFirst({
      where: { id: sceneId, projectId, project: { tenantId: dbUser.tenantId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM tour_hotspots WHERE scene_id = $1`,
      sceneId
    );
    await prisma.tourScene.delete({ where: { id: sceneId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to delete scene');
    return NextResponse.json({ error: 'Failed to delete scene' }, { status: 500 });
  }
}
