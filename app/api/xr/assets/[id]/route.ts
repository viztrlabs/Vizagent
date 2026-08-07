import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { XrAssetRepository } from '@/lib/server/repositories/xr-asset.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { getCdnUrl } from '@/lib/server/lib/cdn';
import type { XrAsset } from '@/lib/types';

const xrAssetRepository = new XrAssetRepository();

function transformAsset(asset: unknown): XrAsset {
  const a = asset as XrAsset;
  return {
    ...a,
    glbUrl: getCdnUrl(a.glbUrl),
    equirectUrl: getCdnUrl(a.equirectUrl),
    usdzUrl: getCdnUrl(a.usdzUrl),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId();

    const asset = await withTenant(prisma, tenantId, async () =>
      xrAssetRepository.findById(id, tenantId)
    );

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ asset: transformAsset(asset) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}
