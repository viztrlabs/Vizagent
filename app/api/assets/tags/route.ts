import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { validateBody, validationErrorResponse } from '@/lib/validations/api';
import { createLogger } from '@/lib/server/logger';

const log = createLogger({ module: 'api/assets/tags' });

export async function POST(req: NextRequest) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validation = validateBody(
      z.object({
        assetIds: z.array(z.string()),
        tags: z.array(z.string()),
      }),
      body
    );

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { assetIds, tags } = validation.data;

    // Verify ownership
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        tenantId: dbUser.tenantId,
      },
      select: { id: true, tags: true },
    });

    const existingIds = new Set(assets.map((a) => a.id));
    const missing = assetIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Some assets not found', missing },
        { status: 404 }
      );
    }

    // Add tags to each asset
    const updates = assets.map((a) => {
      const currentTags = a.tags as string[] | undefined;
      const mergedTags = Array.from(
        new Set([...(currentTags ?? []), ...tags])
      );
      return prisma.asset.update({
        where: { id: a.id },
        data: { tags: mergedTags },
      });
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true, updated: assets.length });
  } catch (error) {
    log.error({ error }, 'Failed to add tags');
    return NextResponse.json({ error: 'Failed to add tags' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { dbUser } = await getCurrentAuth();
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validation = validateBody(
      z.object({
        assetId: z.string(),
        tag: z.string(),
      }),
      body
    );

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { assetId, tag } = validation.data;

    const asset = await prisma.asset.findFirst({
      where: { id: assetId, tenantId: dbUser.tenantId },
      select: { id: true, tags: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const currentTags = asset.tags as string[] | undefined;
    const filteredTags = currentTags?.filter((t) => t !== tag) ?? [];

    await prisma.asset.update({
      where: { id: assetId },
      data: { tags: filteredTags },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to remove tag');
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
  }
}
