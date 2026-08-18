import { prisma } from '@/lib/db/server';

export async function createPrompt(data: {
  slug: string;
  name: string;
  description?: string;
  template: string;
  category?: string;
  tenantId: string;
}) {
  return prisma.aiPrompt.create({ data });
}

export async function getPrompts(tenantId: string, category?: string) {
  const where: Record<string, unknown> = { tenantId, isActive: true };
  if (category) where.category = category;
  return prisma.aiPrompt.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function getPromptBySlug(slug: string, tenantId: string) {
  return prisma.aiPrompt.findFirst({ where: { slug, tenantId } });
}

export async function updatePrompt(id: string, data: { name?: string; description?: string; template?: string; isActive?: boolean }) {
  return prisma.aiPrompt.update({ where: { id }, data });
}

export async function logAiUsage(data: {
  promptSlug: string;
  userId?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  success?: boolean;
  error?: string;
  tenantId: string;
}) {
  return prisma.aiUsageLog.create({ data });
}

export async function getAiUsageStats(tenantId: string, options?: { from?: Date; to?: Date }) {
  const where: Record<string, unknown> = { tenantId };
  if (options?.from || options?.to) {
    where.createdAt = {};
    if (options.from) (where.createdAt as Record<string, unknown>).gte = options.from;
    if (options.to) (where.createdAt as Record<string, unknown>).lte = options.to;
  }

  const [totalCalls, successCount, totalTokens] = await Promise.all([
    prisma.aiUsageLog.count({ where }),
    prisma.aiUsageLog.count({ where: { ...where, success: true } }),
    prisma.aiUsageLog.aggregate({
      where,
      _sum: { inputTokens: true, outputTokens: true },
    }),
  ]);

  return {
    totalCalls,
    successRate: totalCalls > 0 ? (successCount / totalCalls) * 100 : 0,
    totalInputTokens: Number(totalTokens._sum.inputTokens || 0),
    totalOutputTokens: Number(totalTokens._sum.outputTokens || 0),
  };
}
