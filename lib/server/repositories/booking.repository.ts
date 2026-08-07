import { prisma } from '@/lib/db/server';
import { BaseRepository } from './base.repository';
import type { ConfiguratorSession } from '@/lib/types';

export class BookingRepository extends BaseRepository<ConfiguratorSession> {
  constructor() {
    super(prisma);
  }

  protected get model() {
    return 'configuratorSession' as const;
  }

  async findByIdWithViewers(id: string, tenantId: string) {
    return prisma.configuratorSession.findFirst({
      where: { id, tenantId },
      include: { viewers: true },
    });
  }

  async findByHost(hostId: string, tenantId: string) {
    return prisma.configuratorSession.findMany({
      where: { hostId, tenantId },
      orderBy: { startAt: 'desc' },
    });
  }

  async createBooking(data: {
    projectId: string;
    hostId: string;
    startAt: Date;
    shareToken: string;
    gcalEventId?: string;
  }, tenantId: string) {
    return prisma.configuratorSession.create({
      data: {
        projectId: data.projectId,
        hostId: data.hostId,
        config: '{}',
        shareToken: data.shareToken,
        startAt: data.startAt,
        gcalEventId: data.gcalEventId,
        tenantId,
      },
    });
  }

  async cancel(id: string, _tenantId: string) {
    return prisma.configuratorSession.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
