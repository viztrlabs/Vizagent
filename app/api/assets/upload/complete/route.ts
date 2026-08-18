import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { completeMultipartUpload } from '@/lib/server/lib/r2';
import { assetUploadCompleteSchema } from '@/lib/validations';
import { trackEvent } from '@/lib/analytics/server';
import { getCurrentAuth } from '@/lib/auth/session';

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

    const { authUser, dbUser, tenantId: authTenantId } = await getCurrentAuth();
    if (authUser) {
      const sessionId = request.cookies.get('viztr-session-id')?.value ?? crypto.randomUUID();
      await trackEvent({
        event: 'asset_uploaded',
        properties: {
          asset_id: asset.id,
          asset_type: (asset.fileType as 'model' | 'texture' | 'scene' | 'environment' | 'other') ?? 'other',
          file_size_mb: Math.round((Number(asset.fileSize) || 0) / (1024 * 1024) * 10) / 10,
        },
        userId: dbUser?.id ?? authUser.id,
        tenantId: authTenantId,
        sessionId,
      });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to complete upload' }, { status: 500 });
  }
}
