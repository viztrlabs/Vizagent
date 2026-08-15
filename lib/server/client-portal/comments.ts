import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { Prisma } from '@prisma/client';

type CommentWhereInput = Prisma.CommentWhereInput;

export interface CommentFilters {
  projectId: string;
  parentId?: string | null;
}

export interface CreateCommentInput {
  projectId: string;
  content: string;
  parentId?: string;
  mentions?: string[];
}

export interface CreateCommentResult {
  id: string;
  projectId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

async function resolveMentions(mentions: string[], tenantId: string): Promise<string[]> {
  if (!mentions || mentions.length === 0) return [];

  const users = await prisma.user.findMany({
    where: {
      tenantId,
      name: { in: mentions.map(m => m.replace('@', '')) },
    },
    select: { id: true },
  });
  return users.map(u => u.id);
}

export async function listComments(projectId: string, parentId?: string | null): Promise<Prisma.CommentGetPayload<Record<string, never>>[]> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.comment');

  const where: CommentWhereInput = {
    projectId,
    tenantId,
    parentId: parentId ?? null,
  };

  return prisma.comment.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(input: CreateCommentInput): Promise<CreateCommentResult> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.comment');

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId },
    select: { clientId: true },
  });
  if (!project) throw new Error('Project not found');

  const mentions = await resolveMentions(input.mentions ?? [], tenantId);

  const comment = await prisma.comment.create({
    data: {
      projectId: input.projectId,
      authorId: dbUser.id,
      parentId: input.parentId ?? null,
      content: input.content,
      mentions,
      tenantId,
    },
  });

  await auditLog({
    action: 'comment.create',
    resource: 'comment',
    resourceId: comment.id,
    changes: { projectId: input.projectId, parentId: input.parentId ?? null },
  });

  return comment;
}

export async function deleteComment(id: string): Promise<void> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.comment');

  const existing = await prisma.comment.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error('Comment not found');

  const isOwner = existing.authorId === dbUser.id;
  const isStaff = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'USER';
  if (!isOwner && !isStaff) throw new Error('Forbidden: not owner or staff');

  await prisma.comment.delete({ where: { id } });

  await auditLog({
    action: 'comment.delete',
    resource: 'comment',
    resourceId: id,
  });
}

export async function getThreadedComments(projectId: string): Promise<Prisma.CommentGetPayload<{
  include: { replies: { orderBy: { createdAt: 'asc' } } };
}>[]> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.comment');

  const topLevel = await prisma.comment.findMany({
    where: { projectId, tenantId, parentId: null },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return topLevel;
}