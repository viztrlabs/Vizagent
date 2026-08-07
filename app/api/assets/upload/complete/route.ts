import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { completeMultipartUpload } from '@/lib/server/lib/r2';
import { assetUploadCompleteSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = assetUploadCompleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { asset_id, upload_id, parts } = validation.data;
    const tenantId = await getTenantId();

    const asset = await withTenant(prisma, tenantId, async () => {
      const asset = await prisma.asset.findUnique({ where: { id: asset_id, tenantId } });

      if (!asset) {
        return null;
      }

      await completeMultipartUpload(
        asset.storagePath,
        upload_id,
        parts.map((p) => ({ ETag: p.etag, PartNumber: p.part_number }))
      );

      return prisma.asset.update({
        where: { id: asset_id, tenantId },
        data: { status: 'ready' },
      });
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to complete upload' }, { status: 500 });
  }
}
