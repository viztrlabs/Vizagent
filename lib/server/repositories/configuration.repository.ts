import { prisma } from '@/lib/db/server';
import { BaseRepository } from './base.repository';
import type { Configuration } from '@/lib/types';

export class ConfigurationRepository extends BaseRepository<Configuration> {
  constructor() {
    super(prisma);
  }

  protected get model() {
    return 'configuration' as const;
  }

  async findDefault(xrAssetId: string, tenantId: string) {
    return prisma.configuration.findFirst({
      where: { xrAssetId, name: 'default', tenantId },
    });
  }

  async upsert(xrAssetId: string, name: string, data: string, tenantId: string) {
    return prisma.configuration.upsert({
      where: {
        xrAssetId_name: { xrAssetId, name },
      },
      update: { data },
      create: { xrAssetId, name, data, tenantId },
    });
  }
}
