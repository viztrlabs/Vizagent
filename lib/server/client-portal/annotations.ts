import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { Prisma } from '@prisma/client';

type AnnotationWhereInput = Prisma.AnnotationWhereInput;

export interface AnnotationFilters {
  projectId: string;
  resolved?: boolean;
}

export interface CreateAnnotationInput {
  projectId: string;
  position: Record<string, unknown>;
  content: string;
}

export interface UpdateAnnotationInput {
  resolved?: boolean;
  content?: string;
  position?: Record<string, unknown>;
}

function cleanJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function listAnnotations(filters: AnnotationFilters): Promise<Prisma.AnnotationGetPayload<Record<string, never>>[]> {
  const { tenantId, role, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.annotate');

  const where: AnnotationWhereInput = {
    projectId: filters.projectId,
    tenantId,
  };
  if (filters.resolved !== undefined) {
    where.resolved = filters.resolved;
  } else {
    where.resolved = false;
  }

  return prisma.annotation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createAnnotation(input: CreateAnnotationInput): Promise<Prisma.AnnotationGetPayload<Record<string, never>>> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.annotate');

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId },
    select: { clientId: true },
  });
  if (!project) throw new Error('Project not found');

  const annotation = await prisma.annotation.create({
    data: {
      projectId: input.projectId,
      authorId: dbUser.id,
      position: cleanJson(input.position),
      content: input.content,
      resolved: false,
      tenantId,
    },
  });

  await auditLog({
    action: 'annotation.create',
    resource: 'annotation',
    resourceId: annotation.id,
    changes: { projectId: input.projectId },
  });

  return annotation;
}

export async function resolveAnnotation(id: string): Promise<Prisma.AnnotationGetPayload<Record<string, never>>> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.annotate');

  const existing = await prisma.annotation.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error('Annotation not found');

  const annotation = await prisma.annotation.update({
    where: { id },
    data: { resolved: true },
  });

  await auditLog({
    action: 'annotation.resolve',
    resource: 'annotation',
    resourceId: id,
  });

  return annotation;
}

export async function updateAnnotation(id: string, input: UpdateAnnotationInput): Promise<Prisma.AnnotationGetPayload<Record<string, never>>> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.annotate');

  const existing = await prisma.annotation.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error('Annotation not found');

  const annotation = await prisma.annotation.update({
    where: { id },
    data: {
      ...input,
      position: input.position ? cleanJson(input.position) : undefined,
    },
  });

  await auditLog({
    action: 'annotation.update',
    resource: 'annotation',
    resourceId: id,
    changes: input,
  });

  return annotation;
}

export async function deleteAnnotation(id: string): Promise<void> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.annotate');

  const existing = await prisma.annotation.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error('Annotation not found');

  const isOwner = existing.authorId === dbUser.id;
  const isStaff = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'USER';
  if (!isOwner && !isStaff) throw new Error('Forbidden: not owner or staff');

  await prisma.annotation.delete({ where: { id } });

  await auditLog({
    action: 'annotation.delete',
    resource: 'annotation',
    resourceId: id,
  });
}