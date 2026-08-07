jest.mock('@/lib/db/server', () => {
  const deployments: Record<string, Record<string, unknown>> = {};
  let seq = 0;
  return {
    prisma: {
      deployment: {
        create: jest.fn(({ data }: { data: Record<string, unknown> & { project?: unknown } }) => {
          const id = `d-${++seq}`;
          const row = { id, createdAt: new Date(), deployedAt: null, ...data, project: undefined };
          (deployments[id] = row);
          return Promise.resolve(row);
        }),
        findMany: jest.fn(({ where }: { where: { projectId: string; tenantId: string } }) => {
          return Promise.resolve(
            Object.values(deployments).filter(
              (d) => d.projectId === where.projectId && d.tenantId === where.tenantId
            )
          );
        }),
        findFirst: jest.fn(({ where }: { where: { id?: string; tenantId?: string } }) => {
          const row = deployments[where.id as string];
          if (!row || (where.tenantId && row.tenantId !== where.tenantId)) return Promise.resolve(null);
          return Promise.resolve(row);
        }),
      },
    },
  };
});

import { DeploymentRepository } from './deployment.repository';

describe('DeploymentRepository', () => {
  const repo = new DeploymentRepository();

  it('create returns a deployment with tenantId', async () => {
    const d = await repo.create(
      { projectId: 'p1', environment: 'production', status: 'success' },
      'tenant-1'
    );
    expect(d.id).toBeDefined();
    expect(d.tenantId).toBe('tenant-1');
    expect(d.status).toBe('success');
  });

  it('findByProject orders by createdAt desc', async () => {
    const found = await repo.findByProject('p1', 'tenant-1');
    expect(found.length).toBeGreaterThanOrEqual(1);
    if (found.length >= 2) {
      expect(found[0].createdAt.getTime()).toBeGreaterThanOrEqual(found[1].createdAt.getTime());
    }
  });

  it('tenant isolation', async () => {
    await repo.create({ projectId: 'p-iso', environment: 'production', status: 'success' }, 'tenant-a');
    const result = await repo.findByProject('p-iso', 'tenant-b');
    expect(result.length).toBe(0);
  });

  it('findById returns null for other tenant', async () => {
    const d = await repo.create(
      { projectId: 'p-find', environment: 'production', status: 'success' },
      'tenant-find'
    );
    expect(await repo.findById(d.id, 'tenant-find')).not.toBeNull();
    expect(await repo.findById(d.id, 'other-tenant')).toBeNull();
  });
});
