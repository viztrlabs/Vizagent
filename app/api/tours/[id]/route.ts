import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createLogger } from '@/lib/server/logger';

const log = createLogger({ module: 'api/tours/[id]' });

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, tenantId: dbUser.tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        settings: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    log.error({ error }, 'Failed to fetch tour');
    return NextResponse.json({ error: 'Failed to fetch tour' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.project.findFirst({
      where: { id, tenantId: dbUser.tenantId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.status) data.status = body.status;
    if (body.settings) data.settings = body.settings;

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json({ project });
  } catch (error) {
    log.error({ error }, 'Failed to update tour');
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, tenantId: dbUser.tenantId },
      select: { id: true, settings: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const body = await req.json();

    let settings: Record<string, unknown> = {};
    if (typeof project.settings === 'string') {
      try {
        settings = JSON.parse(project.settings);
      } catch {
        settings = {};
      }
    } else if (project.settings && typeof project.settings === 'object') {
      settings = project.settings as Record<string, unknown>;
    }

    const updatedSettings = {
      ...settings,
      ...body.settings,
    };

    await prisma.project.update({
      where: { id },
      data: { settings: updatedSettings as never },
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    log.error({ error }, 'Failed to patch tour settings');
    return NextResponse.json({ error: 'Failed to update tour settings' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.project.findFirst({
      where: { id, tenantId: dbUser.tenantId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    await prisma.project.update({
      where: { id },
      data: { status: 'archived' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to archive tour');
    return NextResponse.json({ error: 'Failed to archive tour' }, { status: 500 });
  }
}
