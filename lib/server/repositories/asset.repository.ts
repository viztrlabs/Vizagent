import { prisma } from '@/lib/db/server';
import { BaseRepository } from './base.repository';
import type { Asset } from '@/lib/types';

export class AssetRepository extends BaseRepository<Asset> {
  constructor() {
    super(prisma);
  }

  protected get model() {
    return 'asset' as const;
  }

  async findByProject(projectId: string, tenantId: string) {
    return prisma.asset.findMany({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUpload(
    data: {
      projectId: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      storagePath: string;
    },
    tenantId: string
  ) {
    return prisma.asset.create({
      data: {
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        storagePath: data.storagePath,
        status: 'uploading',
        tenantId,
        project: { connect: { id: data.projectId } },
      },
      select: { id: true, storagePath: true },
    });
  }

  async setStatus(id: string, status: Asset['status'], tenantId: string) {
    return prisma.asset.update({
      where: { id, tenantId },
      data: { status },
    });
  }
}
