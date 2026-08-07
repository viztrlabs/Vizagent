import { prisma } from '@/lib/db/server';
import { BaseRepository } from './base.repository';
import type { Project } from '@/lib/types';

export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super(prisma);
  }

  protected get model() {
    return 'project' as const;
  }

  async findByClient(clientId: string, tenantId: string) {
    return prisma.project.findMany({
      where: { clientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: string, tenantId: string) {
    return prisma.project.findMany({
      where: { status, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
