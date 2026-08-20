import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { validateBody, validationErrorResponse } from '@/lib/validations/api';
import { createLogger } from '@/lib/server/logger';
import { z } from 'zod';

const log = createLogger({ module: 'api/tours/floors' });

const createFloorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.number().int(),
  sortOrder: z.number().int().default(0),
  svgPath: z.string().optional(),
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

    const floors = await prisma.tourFloor.findMany({
      where: { projectId },
      orderBy: { level: 'asc' },
    });

    return NextResponse.json({ floors });
  } catch (error) {
    log.error({ error }, 'Failed to fetch floors');
    return NextResponse.json({ error: 'Failed to fetch floors' }, { status: 500 });
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
    const validation = validateBody(createFloorSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const floor = await prisma.tourFloor.create({
      data: {
        projectId,
        name: validation.data.name,
        level: validation.data.level,
        sortOrder: validation.data.sortOrder,
        svgPath: validation.data.svgPath,
      },
    });

    return NextResponse.json({ floor }, { status: 201 });
  } catch (error) {
    log.error({ error }, 'Failed to create floor');
    return NextResponse.json({ error: 'Failed to create floor' }, { status: 500 });
  }
}
