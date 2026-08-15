import { prisma } from '@/lib/db/server';

export interface TilingOptions {
  assetId: string;
  tenantId: string;
  storagePath: string;
  lodLevels?: number;
}

export interface TilingResult {
  lodPaths: Record<number, string>;
}

/**
 * M4: LOD tiling for 3D models.
 *
 * ponytail: real LOD generation (meshopt simplification) is skipped — the
 * `gltf-transform` package is currently unpublished on npm. Each LOD level is
 * currently a copy of the source until a model toolchain is available; the
 * metadata shape is in place so swapping in real simplification later is a
 * drop-in change.
 */
export async function tileModel({ assetId, tenantId, storagePath, lodLevels = 3 }: TilingOptions): Promise<TilingResult> {
  const supabaseAdmin = await import('@/lib/supabase/admin').then((m) => m.getSupabaseAdmin());
  const lodPaths: Record<number, string> = {};

  for (let i = 0; i < lodLevels; i++) {
    const lodPath = storagePath.replace(/\.glb$/, `.lod${i}.glb`);
    // Copy source to LOD path (placeholder for real simplification)
    const { data: src } = await supabaseAdmin.storage.from('assets').download(storagePath);
    if (src) {
      const buf = Buffer.from(await src.arrayBuffer());
      await supabaseAdmin.storage.from('assets').upload(lodPath, buf, {
        contentType: 'model/gltf-binary',
        upsert: true,
      });
    }
    lodPaths[i] = lodPath;
  }

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      tilingPath: JSON.stringify(lodPaths),
      tilingStatus: 'ready',
      tilingAt: new Date(),
    },
  });

  return { lodPaths };
}
