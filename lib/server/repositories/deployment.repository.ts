import { prisma } from '@/lib/db/server';

export class DeploymentRepository {
  async create(
    data: {
      projectId: string;
      environment: string;
      status: string;
      publicUrl?: string;
      previewUrl?: string;
      deployedBy?: string;
      commitSha?: string;
    },
    tenantId: string
  ) {
    return prisma.deployment.create({
      data: {
        ...data,
        tenantId,
        deployedAt: new Date(),
        project: { connect: { id: data.projectId } },
      },
    });
  }

  async findByProject(projectId: string, tenantId: string) {
    return prisma.deployment.findMany({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.deployment.findFirst({ where: { id, tenantId } });
  }
}
