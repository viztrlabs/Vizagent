import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { validateBody, validationErrorResponse } from '@/lib/validations/api';
import { createLogger } from '@/lib/server/logger';
import { z } from 'zod';

const log = createLogger({ module: 'api/tours/walkthrough' });

const createWalkthroughSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  path: z.array(
    z.object({
      sceneId: z.string(),
      targetView: z.object({
        yaw: z.number(),
        pitch: z.number(),
        fov: z.number().optional(),
      }),
      durationMs: z.number().int().positive(),
      transition: z.enum(['auto', 'manual', 'fade', 'slide']).optional(),
    })
  ),
  active: z.boolean().default(true),
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

    const walkthroughs = await prisma.tourWalkthrough.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ walkthroughs });
  } catch (error) {
    log.error({ error }, 'Failed to fetch walkthroughs');
    return NextResponse.json({ error: 'Failed to fetch walkthroughs' }, { status: 500 });
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
    const validation = validateBody(createWalkthroughSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const walkthrough = await prisma.tourWalkthrough.create({
      data: {
        projectId,
        title: validation.data.title,
        path: JSON.parse(JSON.stringify(validation.data.path)),
        active: validation.data.active,
      },
    });

    return NextResponse.json({ walkthrough }, { status: 201 });
  } catch (error) {
    log.error({ error }, 'Failed to create walkthrough');
    return NextResponse.json({ error: 'Failed to create walkthrough' }, { status: 500 });
  }
}
