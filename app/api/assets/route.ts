import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { AssetRepository } from '@/lib/server/repositories/asset.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { presignGetObject } from '@/lib/server/lib/r2';
import type { Asset } from '@/lib/types';

const assetRepository = new AssetRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }

    const tenantId = await getTenantId();

    const assets = await withTenant(prisma, tenantId, async () =>
      assetRepository.findByProject(projectId, tenantId)
    );

    const withUrls = await Promise.all(
      assets.map(async (asset) => {
        const readUrl = asset.status === 'ready' ? await presignGetObject(asset.storagePath) : null;
        return {
          id: asset.id,
          fileName: asset.fileName,
          fileType: asset.fileType,
          fileSize: Number(asset.fileSize),
          status: asset.status,
          createdAt: asset.createdAt,
          readUrl,
        } as Asset & { readUrl: string | null };
      })
    );

    return NextResponse.json({ assets: withUrls });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}
