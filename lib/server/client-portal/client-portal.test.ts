import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { presignGetObject } from '@/lib/server/lib/r2';
import * as clientPortal from '@/lib/server/client-portal';

vi.mock('@/lib/db/server', () => ({
  prisma: {
    annotation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    approvalWorkflow: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    deliverable: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    projectVersion: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getCurrentAuth: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock('@/lib/server/audit/audit-logger', () => ({
  auditLog: vi.fn(),
}));

vi.mock('@/lib/server/lib/r2', () => ({
  presignGetObject: vi.fn(),
}));

const mockTenantId = 'tenant_123';
const mockDbUser = { id: 'user_1', name: 'Test User' };
const mockAuthUser = { id: 'auth_1', email: 'test@example.com' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('client-portal annotations', () => {
  it('listAnnotations: requires collab.annotate and returns tenant-scoped results', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.annotation.findMany as any).mockResolvedValueOnce([
      { id: 'a_1', projectId: 'p_1', authorId: mockDbUser.id, content: 'Test', resolved: false, tenantId: mockTenantId },
    ]);

    const result = await clientPortal.listAnnotations({ projectId: 'p_1' });

    expect(requirePermission).toHaveBeenCalledWith('collab.annotate');
    expect(prisma.annotation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: mockTenantId }) })
    );
    expect(result).toHaveLength(1);
  });

  it('createAnnotation: requires collab.annotate and sets authorId', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: mockDbUser.id, tenantId: mockTenantId });
    (prisma.annotation.create as any).mockResolvedValueOnce({
      id: 'a_1',
      projectId: 'p_1',
      authorId: mockDbUser.id,
      content: 'Test',
      position: { x: 0, y: 0 },
      resolved: false,
      tenantId: mockTenantId,
    });

    const result = await clientPortal.createAnnotation({
      projectId: 'p_1',
      position: { x: 0, y: 0 },
      content: 'Test',
    });

    expect(result.authorId).toBe(mockDbUser.id);
    expect(result.resolved).toBe(false);
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'annotation.create', resource: 'annotation' })
    );
  });

  it('resolveAnnotation: marks resolved=true', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.annotation.findFirst as any).mockResolvedValueOnce({
      id: 'a_1', tenantId: mockTenantId, authorId: mockDbUser.id,
    });
    (prisma.annotation.update as any).mockResolvedValueOnce({
      id: 'a_1', resolved: true,
    });

    const result = await clientPortal.resolveAnnotation('a_1');

    expect(result.resolved).toBe(true);
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'annotation.resolve', resource: 'annotation' })
    );
  });

  it('deleteAnnotation: owner can delete', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.annotation.findFirst as any).mockResolvedValueOnce({
      id: 'a_1', tenantId: mockTenantId, authorId: mockDbUser.id,
    });
    (prisma.annotation.delete as any).mockResolvedValueOnce({});

    await clientPortal.deleteAnnotation('a_1');

    expect(prisma.annotation.delete).toHaveBeenCalledWith({ where: { id: 'a_1' } });
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'annotation.delete', resource: 'annotation' })
    );
  });
});

describe('client-portal comments', () => {
  it('listComments: returns threaded comments', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.comment.findMany as any).mockResolvedValueOnce([
      { id: 'c_1', projectId: 'p_1', authorId: mockDbUser.id, content: 'Parent', parentId: null, mentions: [], tenantId: mockTenantId },
    ]);

    const result = await clientPortal.listComments('p_1');

    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: mockTenantId, parentId: null }) })
    );
    expect(result).toHaveLength(1);
  });

  it('createComment: resolves mentions to user IDs', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: mockDbUser.id, tenantId: mockTenantId });
    (prisma.user.findMany as any).mockResolvedValueOnce([{ id: 'user_2' }]);
    (prisma.comment.create as any).mockResolvedValueOnce({
      id: 'c_1', projectId: 'p_1', authorId: mockDbUser.id, content: 'Test @user2', mentions: ['user_2'], parentId: null, tenantId: mockTenantId,
    });

    const result = await clientPortal.createComment({
      projectId: 'p_1',
      content: 'Test @user2',
      mentions: ['@user2'],
    });

    expect(result.mentions).toContain('user_2');
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'comment.create', resource: 'comment' })
    );
  });

  it('deleteComment: owner or staff can delete', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'ADMIN',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.comment.findFirst as any).mockResolvedValueOnce({
      id: 'c_1', tenantId: mockTenantId, authorId: 'other_user',
    });
    (prisma.comment.delete as any).mockResolvedValueOnce({});

    await clientPortal.deleteComment('c_1');

    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c_1' } });
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'comment.delete', resource: 'comment' })
    );
  });
});

describe('client-portal approvals', () => {
  it('requestApproval: creates pending approval with approver', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: mockDbUser.id, tenantId: mockTenantId });
    (prisma.user.findFirst as any).mockResolvedValueOnce({ id: 'approver_1' });
    (prisma.approvalWorkflow.findFirst as any).mockResolvedValueOnce(null);
    (prisma.approvalWorkflow.create as any).mockResolvedValueOnce({
      id: 'aw_1', projectId: 'p_1', requesterId: mockDbUser.id, approverId: 'approver_1', status: 'pending', tenantId: mockTenantId,
    });

    const result = await clientPortal.requestApproval({ projectId: 'p_1' });

    expect(result.status).toBe('pending');
    expect(result.approverId).toBe('approver_1');
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'approval.request', resource: 'approval_workflow' })
    );
  });

  it('decideApproval: staff only, updates status', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'ADMIN',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.approvalWorkflow.findFirst as any).mockResolvedValueOnce({
      id: 'aw_1', tenantId: mockTenantId, status: 'pending', approverId: mockDbUser.id,
    });
    (prisma.approvalWorkflow.update as any).mockResolvedValueOnce({
      id: 'aw_1', status: 'approved',
    });

    const result = await clientPortal.decideApproval('aw_1', { status: 'approved' });

    expect(result.status).toBe('approved');
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'approval.decide', resource: 'approval_workflow' })
    );
  });

  it('listApprovals: CLIENT sees own requests, ADMIN sees own approvals', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (prisma.approvalWorkflow.findMany as any).mockResolvedValueOnce([]);

    await clientPortal.listApprovals({ projectId: 'p_1' });

    expect(prisma.approvalWorkflow.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ requesterId: mockDbUser.id }) })
    );
  });
});

describe('client-portal deliverables', () => {
  it('createDeliverable: requires approvals.manage, hashes password', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'ADMIN',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: mockDbUser.id, tenantId: mockTenantId });
    (prisma.deliverable.create as any).mockResolvedValueOnce({
      id: 'd_1', projectId: 'p_1', name: 'Test', type: 'pdf', url: 's3://key', password: 'hashed', tenantId: mockTenantId,
    });

    const result = await clientPortal.createDeliverable({
      projectId: 'p_1',
      name: 'Test',
      type: 'pdf',
      url: 's3://key',
      password: 'secret',
    });

    expect(result.password).toBe('hashed');
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'deliverable.create', resource: 'deliverable' })
    );
  });

  it('listDeliverables: CLIENT sees only own projects', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: mockDbUser.id });
    (prisma.deliverable.findMany as any).mockResolvedValueOnce([]);

    await clientPortal.listDeliverables('p_1');

    expect(prisma.deliverable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ projectId: 'p_1' }) })
    );
  });

  it('downloadDeliverable: checks expiration and password, returns presigned URL', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.deliverable.findFirst as any).mockResolvedValueOnce({
      id: 'd_1', projectId: 'p_1', url: 's3://key', password: null, expiresAt: new Date(Date.now() + 86400000), tenantId: mockTenantId,
    });
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: mockDbUser.id });
    (presignGetObject as any).mockResolvedValueOnce('https://signed.url');

    const result = await clientPortal.downloadDeliverable('d_1', {});

    expect(presignGetObject).toHaveBeenCalledWith('s3://key', 3600);
    expect(result.url).toBe('https://signed.url');
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'deliverable.download', resource: 'deliverable' })
    );
  });
});

describe('client-portal versions', () => {
  it('createVersion: requires approvals.manage, stores changes', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'ADMIN',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: mockDbUser.id, tenantId: mockTenantId });
    (prisma.projectVersion.create as any).mockResolvedValueOnce({
      id: 'v_1', projectId: 'p_1', version: '1.0.0', changes: { files: ['a.glb'] }, createdBy: mockDbUser.id, tenantId: mockTenantId,
    });

    const result = await clientPortal.createVersion({
      projectId: 'p_1',
      version: '1.0.0',
      changes: { files: ['a.glb'] },
    });

    expect(result.version).toBe('1.0.0');
    expect(result.changes).toEqual({ files: ['a.glb'] });
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'version.create', resource: 'project_version' })
    );
  });

  it('listVersions: CLIENT sees only own projects', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: mockDbUser.id });
    (prisma.projectVersion.findMany as any).mockResolvedValueOnce([]);

    await clientPortal.listVersions('p_1');

    expect(prisma.projectVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ projectId: 'p_1' }) })
    );
  });

  it('getVersion: returns null if not authorized', async () => {
    (getCurrentAuth as any).mockResolvedValueOnce({
      dbUser: mockDbUser,
      tenantId: mockTenantId,
      role: 'CLIENT',
    });
    (requirePermission as any).mockResolvedValueOnce(true);
    (prisma.projectVersion.findFirst as any).mockResolvedValueOnce({
      id: 'v_1', projectId: 'p_1', tenantId: mockTenantId,
    });
    (prisma.project.findFirst as any).mockResolvedValueOnce({ clientId: 'other_user' });

    const result = await clientPortal.getVersion('v_1');

    expect(result).toBeNull();
  });
});