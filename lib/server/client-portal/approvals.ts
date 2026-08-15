import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { Prisma } from '@prisma/client';

export interface ApprovalFilters {
  projectId: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface CreateApprovalInput {
  projectId: string;
  notes?: string;
}

export interface DecideApprovalInput {
  status: 'approved' | 'rejected';
  notes?: string;
}

export async function requestApproval(input: CreateApprovalInput): Promise<Prisma.ApprovalWorkflowGetPayload<Record<string, never>>> {
  const { dbUser, tenantId, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.request');

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId },
    select: { clientId: true, tenantId: true },
  });
  if (!project) throw new Error('Project not found');

  const approver = await prisma.user.findFirst({
    where: { tenantId: project.tenantId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!approver) throw new Error('No approver available');

  const existing = await prisma.approvalWorkflow.findFirst({
    where: { projectId: input.projectId, status: 'pending', tenantId },
  });
  if (existing) throw new Error('Approval already pending');

  const approval = await prisma.approvalWorkflow.create({
    data: {
      projectId: input.projectId,
      requesterId: dbUser.id,
      approverId: approver.id,
      status: 'pending',
      notes: input.notes ?? null,
      tenantId,
    },
  });

  await auditLog({
    action: 'approval.request',
    resource: 'approval_workflow',
    resourceId: approval.id,
    changes: { projectId: input.projectId, requesterId: dbUser.id, approverId: approver.id },
  });

  return approval;
}

export async function listApprovals(filters: ApprovalFilters): Promise<Prisma.ApprovalWorkflowGetPayload<Record<string, never>>[]> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');

  const where: Prisma.ApprovalWorkflowWhereInput = {
    projectId: filters.projectId,
    tenantId,
  };
  if (filters.status) {
    where.status = filters.status;
  }

  if (role === 'CLIENT') {
    where.requesterId = dbUser.id;
  } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    where.approverId = dbUser.id;
  }

  return prisma.approvalWorkflow.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function decideApproval(id: string, input: DecideApprovalInput): Promise<Prisma.ApprovalWorkflowGetPayload<Record<string, never>>> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.manage');

  const existing = await prisma.approvalWorkflow.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error('Approval not found');

  if (existing.status !== 'pending') throw new Error('Approval already decided');

  const approval = await prisma.approvalWorkflow.update({
    where: { id },
    data: {
      status: input.status,
      notes: input.notes ?? existing.notes,
    },
  });

  await auditLog({
    action: 'approval.decide',
    resource: 'approval_workflow',
    resourceId: id,
    changes: { status: input.status, notes: input.notes },
  });

  return approval;
}

export async function getApproval(id: string): Promise<Prisma.ApprovalWorkflowGetPayload<Record<string, never>> | null> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.request');

  return prisma.approvalWorkflow.findFirst({
    where: { id, tenantId },
  });
}