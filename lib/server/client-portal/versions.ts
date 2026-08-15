import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { Prisma } from '@prisma/client';

type ProjectVersionWhereInput = Prisma.ProjectVersionWhereInput;

export interface VersionFilters {
  projectId: string;
}

export interface CreateVersionInput {
  projectId: string;
  version: string;
  changes: Record<string, unknown>;
}

export async function createVersion(input: CreateVersionInput): Promise<Prisma.ProjectVersionGetPayload<Record<string, never>>> {
  const { dbUser, tenantId, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.manage');

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId },
    select: { clientId: true },
  });
  if (!project) throw new Error('Project not found');

  const version = await prisma.projectVersion.create({
    data: {
      projectId: input.projectId,
      version: input.version,
      changes: input.changes as Prisma.InputJsonValue,
      createdBy: dbUser.id,
      tenantId,
    },
  });

  await auditLog({
    action: 'version.create',
    resource: 'project_version',
    resourceId: version.id,
    changes: { projectId: input.projectId, version: input.version },
  });

  return version;
}

export async function listVersions(projectId: string) {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('client.portals.read');

  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId },
    select: { clientId: true },
  });
  if (!project) throw new Error('Project not found');

  const isClient = role === 'CLIENT';
  if (isClient && project.clientId !== dbUser.id) {
    throw new Error('Forbidden: not your project');
  }

  return prisma.projectVersion.findMany({
    where: { projectId, tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getVersion(id: string): Promise<Prisma.ProjectVersionGetPayload<Record<string, never>> | null> {
  const auth = await getCurrentAuth();
  const { tenantId, dbUser, role } = auth;
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('client.portals.read');

  const version = await prisma.projectVersion.findFirst({
    where: { id, tenantId },
  });
  if (!version) return null;

  const project = await prisma.project.findFirst({
    where: { id: version.projectId, tenantId },
    select: { clientId: true },
  });
  if (!project) return null;

  const isClient = role === 'CLIENT';
  if (isClient && project.clientId !== dbUser?.id) {
    return null;
  }

  return version;
}