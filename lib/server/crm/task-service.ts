import { prisma } from '@/lib/db/server';

export async function createTask(data: {
  title: string;
  description?: string;
  dueDate?: Date;
  leadId?: string;
  dealId?: string;
  tenantId: string;
}) {
  return prisma.task.create({ data });
}

export async function getTasks(tenantId: string, options?: { leadId?: string; dealId?: string; completed?: boolean }) {
  const where: Record<string, unknown> = { tenantId };
  if (options?.leadId) where.leadId = options.leadId;
  if (options?.dealId) where.dealId = options.dealId;
  if (options?.completed !== undefined) where.completed = options.completed;
  return prisma.task.findMany({
    where,
    include: { lead: true, deal: true },
    orderBy: { dueDate: 'asc' },
  });
}

export async function completeTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { completed: true },
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}
