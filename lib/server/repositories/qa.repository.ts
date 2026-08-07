import { prisma } from '@/lib/db/server';
import type { QACheck } from '@/lib/types';

export class QARepository {
  async startQA(projectId: string, tenantId: string) {
    const report = await prisma.qAReport.create({
      data: {
        projectId,
        qaStatus: 'running',
        checks: [],
        issues: [],
        tenantId,
      },
    });
    await prisma.project.update({
      where: { id: projectId, tenantId },
      data: { status: 'qa_pending' },
    });
    return report;
  }

  async setReport(
    id: string,
    qaStatus: string,
    checks: QACheck[],
    issues: string[],
    checkedAt: Date,
    tenantId: string
  ) {
    return prisma.qAReport.update({
      where: { id, tenantId },
      data: { qaStatus, checks: checks as unknown as object[], issues: issues as unknown as string[], checkedAt },
    });
  }

  async setProjectStatus(projectId: string, status: string, tenantId: string) {
    return prisma.project.update({
      where: { id: projectId, tenantId },
      data: { status },
    });
  }

  async findByProject(projectId: string, tenantId: string) {
    return prisma.qAReport.findFirst({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
