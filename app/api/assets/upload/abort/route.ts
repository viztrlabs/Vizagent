import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { abortMultipartUpload } from '@/lib/server/lib/r2';
import { assetUploadAbortSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = assetUploadAbortSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { asset_id, upload_id } = validation.data;
    const tenantId = await getTenantId();

    const asset = await withTenant(prisma, tenantId, async () => {
      const asset = await prisma.asset.findUnique({ where: { id: asset_id, tenantId } });

      if (!asset) {
        return null;
      }

      try {
        await abortMultipartUpload(asset.storagePath, upload_id);
      } catch (r2Error) {
        // If R2 already cleaned it up, still proceed to mark the asset failed.
      }

      return prisma.asset.update({
        where: { id: asset_id, tenantId },
        data: { status: 'failed' },
      });
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to abort upload' }, { status: 500 });
  }
}
