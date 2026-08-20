import { Metadata } from 'next';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { MediaLibraryClient } from './MediaLibraryClient';
import { withTenant } from '@/lib/server/middleware/tenant';

export const metadata: Metadata = {
  title: 'Media Library | VizTR',
  description: 'Browse and manage your assets',
};

export default async function AssetsPage() {
  const auth = await getCurrentAuth();
  const tenantId = auth.dbUser?.tenantId ?? '00000000-0000-0000-0000-000000000000';

  const assets = await withTenant(prisma, tenantId, async () =>
    prisma.asset.findMany({
      where: {
        tenantId,
        status: 'ready',
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        storagePath: true,
        thumbnailPath: true,
        tags: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  );

  const initialAssets = assets.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    fileType: a.fileType,
    storagePath: a.storagePath,
    thumbnailPath: a.thumbnailPath ?? undefined,
    tags: a.tags as string[],
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Media Library</h1>
        <p className="text-gray-400 mt-1">
          Browse, tag, and manage your uploaded assets
        </p>
      </div>

      <MediaLibraryClient initialAssets={initialAssets} />
    </div>
  );
}
