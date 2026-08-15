import sharp from 'sharp';
import { prisma } from '@/lib/db/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface OptimizeInput {
  assetId: string;
  tenantId: string;
  storagePath: string;
}

/**
 * M4: Optimize image assets using Sharp (WebP/AVIF, resize to 2048px max).
 *
 * ponytail: glTF optimization (Draco/meshopt via gltf-transform) is skipped —
 * the `gltf-transform` package is currently unpublished on npm. Model assets
 * pass through unchanged. Add real model compression when the package (or an
 * equivalent toolchain) is available.
 */
export async function optimizeImage({ assetId, tenantId, storagePath }: OptimizeInput) {
  const supabase = getSupabaseAdmin();
  const { data: file } = await supabase.storage.from('assets').download(storagePath);
  if (!file) throw new Error('File not found in storage');

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalMeta = await sharp(buffer).metadata();

  const optimized = await sharp(buffer)
    .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 })
    .toBuffer();

  const optimizedMeta = await sharp(optimized).metadata();
  const compressionRatio = optimized.length / buffer.length;

  const optimizedPath = storagePath.replace(/\.[^.]+$/, '.webp');
  await supabase.storage.from('assets').upload(optimizedPath, optimized, {
    contentType: 'image/webp',
    upsert: true,
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      optimizedPath,
      optimizedStatus: 'ready',
      optimizedAt: new Date(),
      originalWidth: originalMeta.width ?? null,
      originalHeight: originalMeta.height ?? null,
      optimizedWidth: optimizedMeta.width ?? null,
      optimizedHeight: optimizedMeta.height ?? null,
      compressionRatio,
    },
  });
}

/**
 * M4: Model optimization — currently a pass-through (see ponytail note above).
 * Marks the asset optimized so the pipeline state machine stays consistent.
 */
export async function optimizeModel({ assetId, tenantId, storagePath }: OptimizeInput) {
  const supabase = getSupabaseAdmin();
  const { data: file } = await supabase.storage.from('assets').download(storagePath);
  if (!file) throw new Error('File not found in storage');

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      optimizedStatus: 'ready',
      optimizedAt: new Date(),
      optimizedPath: storagePath,
    },
  });
}
