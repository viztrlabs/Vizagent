import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { Prisma } from '@prisma/client';

export interface TenantUsage {
  tenantId: string;
  tenantName: string;
  projectCount: number;
  assetCount: number;
  storageBytes: number;
  gpuMinutes: number;
  apiCalls: number;
}

export interface UsageStats {
  totalTenants: number;
  totalProjects: number;
  totalAssets: number;
  totalStorageBytes: number;
  totalGpuMinutes: number;
  totalApiCalls: number;
  byTenant: TenantUsage[];
}

export async function getUsageStats(tenantId?: string): Promise<UsageStats> {
  const { tenantId: currentTenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.monitoring.read');

  const targetTenantId = role === 'SUPER_ADMIN' ? (tenantId ?? undefined) : currentTenantId;

  const tenantWhere: { id?: string } = {};
  if (targetTenantId) tenantWhere.id = targetTenantId;

  const [tenants, projects, assets, storage, gpuMinutes, apiCalls] = await Promise.all([
    prisma.tenant.findMany({
      where: tenantWhere,
      select: { id: true, name: true },
    }),
    prisma.project.count({
      where: targetTenantId ? { tenantId: targetTenantId } : {},
    }),
    prisma.asset.count({
      where: targetTenantId ? { tenantId: targetTenantId } : {},
    }),
    prisma.asset.aggregate({
      where: targetTenantId ? { tenantId: targetTenantId } : {},
      _sum: { fileSize: true },
    }),
    prisma.processingJob.aggregate({
      where: targetTenantId ? { tenantId: targetTenantId } : {},
      _sum: { gpuMinutes: true },
    }),
    prisma.apiUsage.aggregate({
      where: targetTenantId ? { tenantId: targetTenantId } : {},
      _sum: { calls: true },
    }),
  ]);

  const byTenant: UsageStats['byTenant'] = await Promise.all(
    tenants.map(async (tenant) => {
      const [projectCount, assetCount, storageBytes, gpuMinutes, apiCalls] = await Promise.all([
        prisma.project.count({ where: { tenantId: tenant.id } }),
        prisma.asset.count({ where: { tenantId: tenant.id } }),
        prisma.asset.aggregate({ where: { tenantId: tenant.id }, _sum: { fileSize: true } }),
        prisma.processingJob.aggregate({ where: { tenantId: tenant.id }, _sum: { gpuMinutes: true } }),
        prisma.apiUsage.aggregate({ where: { tenantId: tenant.id }, _sum: { calls: true } }),
      ]);

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        projectCount,
        assetCount,
        storageBytes: storageBytes._sum.fileSize ?? 0,
        gpuMinutes: gpuMinutes._sum.gpuMinutes ?? 0,
        apiCalls: apiCalls._sum.calls ?? 0,
      };
    })
  );

  return {
    totalTenants: tenants.length,
    totalProjects: projects,
    totalAssets: assets,
    totalStorageBytes: storage._sum.fileSize ?? 0,
    totalGpuMinutes: gpuMinutes._sum.gpuMinutes ?? 0,
    totalApiCalls: apiCalls._sum.calls ?? 0,
    byTenant,
  };
}

export interface TenantSummary {
  id: string;
  name: string;
  projectCount: number;
  assetCount: number;
  storageBytes: number;
  gpuMinutes: number;
  apiCalls: number;
}

export async function getTenantSummary(tenantId: string): Promise<TenantSummary | null> {
  const { tenantId: currentTenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.monitoring.read');

  if (role !== 'SUPER_ADMIN' && tenantId !== currentTenantId) {
    throw new Error('Forbidden: cannot view other tenant usage');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });
  if (!tenant) return null;

  const [projectCount, assetCount, storage, gpuMinutes, apiCalls] = await Promise.all([
    prisma.project.count({ where: { tenantId } }),
    prisma.asset.count({ where: { tenantId } }),
    prisma.asset.aggregate({ where: { tenantId }, _sum: { fileSize: true } }),
    prisma.processingJob.aggregate({ where: { tenantId }, _sum: { gpuMinutes: true } }),
    prisma.apiUsage.aggregate({ where: { tenantId }, _sum: { calls: true } }),
  ]);

  return {
    id: tenant.id,
    name: tenant.name,
    projectCount,
    assetCount,
    storageBytes: storage._sum.fileSize ?? 0,
    gpuMinutes: gpuMinutes._sum.gpuMinutes ?? 0,
    apiCalls: apiCalls._sum.calls ?? 0,
  };
}