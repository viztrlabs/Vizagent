import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { AssetRepository } from '@/lib/server/repositories/asset.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { createMultipartUpload, getPartSize, presignUploadPart } from '@/lib/server/lib/r2';
import { assetUploadInitSchema } from '@/lib/validations';
import { nanoid } from 'nanoid';

const assetRepository = new AssetRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = assetUploadInitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { project_id, file_name, file_type, file_size } = validation.data;
    const tenantId = await getTenantId();

    const assetId = nanoid(12);
    const key = `tenants/${tenantId}/projects/${project_id}/assets/${assetId}/${file_name}`;
    const partSize = getPartSize();
    const partCount = Math.max(1, Math.ceil(file_size / partSize));

    let uploadId: string | undefined;
    try {
      uploadId = await createMultipartUpload(key);

      const result = await withTenant(prisma, tenantId, async () => {
        await assetRepository.createUpload(
          {
            projectId: project_id,
            fileName: file_name,
            fileType: file_type,
            fileSize: file_size,
            storagePath: key,
          },
          tenantId
        );

        const parts: { partNumber: number; url: string }[] = [];
        for (let i = 1; i <= partCount; i++) {
          const url = await presignUploadPart(key, uploadId!, i);
          parts.push({ partNumber: i, url });
        }
        return { assetId, uploadId, storagePath: key, partSize, parts };
      });

      return NextResponse.json(result, { status: 201 });
    } catch (inner) {
      // Roll back the Asset row if the multipart upload or presigning failed.
      try {
        await withTenant(prisma, tenantId, async () => {
          await prisma.asset.deleteMany({ where: { id: assetId, tenantId } });
        });
      } catch {}
      if (uploadId) {
        try {
          const { abortMultipartUpload } = await import('@/lib/server/lib/r2');
          await abortMultipartUpload(key, uploadId);
        } catch {}
      }
      throw inner;
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initiate upload' }, { status: 500 });
  }
}
