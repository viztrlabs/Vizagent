import { prisma } from '@/lib/db/server';
import { BaseRepository } from './base.repository';
import type { ConfiguratorSession } from '@/lib/types';

export class SessionRepository extends BaseRepository<ConfiguratorSession> {
  constructor() {
    super(prisma);
  }

  protected get model() {
    return 'configuratorSession' as const;
  }

  async findByShareToken(token: string) {
    return prisma.configuratorSession.findUnique({
      where: { shareToken: token },
      include: { viewers: true },
    });
  }

  async findByHost(hostId: string, tenantId: string) {
    return prisma.configuratorSession.findMany({
      where: { hostId, tenantId },
      orderBy: { startAt: 'desc' },
    });
  }
}
