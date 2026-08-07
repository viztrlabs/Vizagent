import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { XrAssetRepository } from '@/lib/server/repositories/xr-asset.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { xrAssetSchema } from '@/lib/validations';
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }

    const tenantId = await getTenantId();
    const assets = await withTenant(prisma, tenantId, async () =>
      xrAssetRepository.findByProject(projectId, tenantId)
    );

    return NextResponse.json({ assets: assets.map(transformAsset) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = xrAssetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { project_id, glb_url, equirect_url, usdz_url, ...rest } = validation.data;
    const tenantId = await getTenantId();
    const asset = await withTenant(prisma, tenantId, async () =>
      xrAssetRepository.create(
        {
          ...rest,
          projectId: project_id,
          glbUrl: glb_url,
          equirectUrl: equirect_url,
          usdzUrl: usdz_url,
        },
        tenantId
      )
    );

    return NextResponse.json({ asset: transformAsset(asset) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
