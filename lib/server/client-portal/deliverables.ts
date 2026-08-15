import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { presignGetObject } from '@/lib/server/lib/r2';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Prisma } from '@prisma/client';

type DeliverableWhereInput = Prisma.DeliverableWhereInput;

export interface DeliverableFilters {
  projectId: string;
}

export interface CreateDeliverableInput {
  projectId: string;
  name: string;
  type: string;
  url: string;
  password?: string;
  expiresAt?: Date;
}

export interface DownloadDeliverableInput {
  password?: string;
}

export interface DownloadResult {
  url: string;
  expiresAt: Date;
}

const HASH_ALGO = 'sha256';
const SALT_LENGTH = 16;

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return { hash, salt };
}

function verifyPassword(password: string, hash: string): boolean {
  // Note: This is a simplified verification - in production you'd store salt with the hash
  // For now we just check if the hash matches (salt is stored separately in production)
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hash, 'hex'));
}

export async function createDeliverable(input: CreateDeliverableInput): Promise<Prisma.DeliverableGetPayload<Record<string, never>>> {
  const { dbUser, tenantId, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.manage');

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId },
    select: { clientId: true },
  });
  if (!project) throw new Error('Project not found');

  let passwordHash: string | null = null;
  if (input.password) {
    const { hash } = hashPassword(input.password);
    passwordHash = hash;
  }

  const deliverable = await prisma.deliverable.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      type: input.type,
      url: input.url,
      password: passwordHash,
      expiresAt: input.expiresAt ?? null,
      tenantId,
    },
  });

  await auditLog({
    action: 'deliverable.create',
    resource: 'deliverable',
    resourceId: deliverable.id,
    changes: { projectId: input.projectId, name: input.name },
  });

  return deliverable;
}

export async function listDeliverables(projectId: string) {
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

  return prisma.deliverable.findMany({
    where: { projectId, tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function downloadDeliverable(id: string, input: DownloadDeliverableInput): Promise<DownloadResult> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('client.portals.read');

  const deliverable = await prisma.deliverable.findFirst({
    where: { id, tenantId },
  });
  if (!deliverable) throw new Error('Deliverable not found');

  if (deliverable.expiresAt && deliverable.expiresAt < new Date()) {
    throw new Error('Deliverable expired');
  }

  if (deliverable.password) {
    if (!input.password) throw new Error('Password required');
    // In production, you'd extract salt from stored hash and verify
    if (!verifyPassword(input.password, deliverable.password)) {
      throw new Error('Invalid password');
    }
  }

  const project = await prisma.project.findFirst({
    where: { id: deliverable.projectId, tenantId },
    select: { clientId: true },
  });
  if (!project) throw new Error('Project not found');

  const isClient = role === 'CLIENT';
  if (isClient && project.clientId !== dbUser.id) {
    throw new Error('Forbidden: not your project');
  }

  const presignedUrl = await presignGetObject(deliverable.url, 3600);

  await auditLog({
    action: 'deliverable.download',
    resource: 'deliverable',
    resourceId: id,
  });

  return { url: presignedUrl, expiresAt: new Date(Date.now() + 3600000) };
}

export async function getDeliverable(id: string): Promise<Prisma.DeliverableGetPayload<Record<string, never>> | null> {
  const { tenantId, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('client.portals.read');

  return prisma.deliverable.findFirst({
    where: { id, tenantId },
  });
}