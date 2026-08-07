import { prisma } from '@/lib/db/server';
import { BaseRepository } from './base.repository';
import type { XrAsset } from '@/lib/types';

export class XrAssetRepository extends BaseRepository<XrAsset> {
  constructor() {
    super(prisma);
  }

  protected get model() {
    return 'xrAsset' as const;
  }

  async findByProject(projectId: string, tenantId: string) {
    return prisma.xrAsset.findMany({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
