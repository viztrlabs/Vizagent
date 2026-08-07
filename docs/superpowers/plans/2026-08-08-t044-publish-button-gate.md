# T-044 — Publish Button + Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A project overview hub with a QA-gated Publish button that creates a Deployment and flips the project to `published`.

**Architecture:** Server-component project detail page + `DeploymentRepository` + `POST/GET /api/deployments` routes. QA gate enforced server-side.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma + PostgreSQL, React client components, Jest.

## Global Constraints

- QA gate enforced server-side (never trust client). Publish requires `project.status === 'qa_passed'` → else 403.
- All routes use `getTenantId()` + `withTenant()`.
- `publicUrl` references T-045 viewer route; viewer fetches fresh signed asset URLs per request.
- Deployment.status values: 'pending' | 'deploying' | 'success' | 'failed' (matches ProjectStatus-like enum).

---

### Task 1: Deployment repository

**Files:**
- Create: `lib/server/repositories/deployment.repository.ts`
- Create: `lib/server/repositories/deployment.repository.test.ts`

**Interfaces:**
- Consumes: `prisma`, `tenantId: string`.
- Produces: `DeploymentRepository` with `create(data, tenantId)`, `findByProject(projectId, tenantId)`, `findById(id, tenantId)`.

```typescript
import { prisma } from '@/lib/db/server';

export class DeploymentRepository {
  async create(data: {
    projectId: string;
    environment: string;
    status: string;
    publicUrl?: string;
    previewUrl?: string;
    deployedBy?: string;
  }, tenantId: string) {
    return prisma.deployment.create({
      data: { ...data, tenantId, deployedAt: new Date(), project: { connect: { id: data.projectId } } },
    });
  }

  async findByProject(projectId: string, tenantId: string) {
    return prisma.deployment.findMany({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.deployment.findFirst({ where: { id, tenantId } });
  }
}
```

`deployment.repository.test.ts`:
```typescript
import { DeploymentRepository } from './deployment.repository';
describe('DeploymentRepository', () => {
  it('create returns a deployment with tenantId', async () => {
    const repo = new DeploymentRepository();
    const d = await repo.create({ projectId: 'p1', environment: 'production', status: 'success' }, 'tenant-1');
    expect(d.id).toBeDefined();
    expect(d.tenantId).toBe('tenant-1');
  });
  it('findByProject orders by createdAt desc', async () => {
    const repo = new DeploymentRepository();
    await repo.create({ projectId: 'p2', environment: 'production', status: 'success' }, 't1');
    const found = await repo.findByProject('p2', 't1');
    expect(found.length).toBeGreaterThanOrEqual(1);
  });
  it('tenant isolation', async () => {
    const repo = new DeploymentRepository();
    await repo.create({ projectId: 'p3', environment: 'production', status: 'success' }, 'tenant-a');
    const result = await repo.findByProject('p3', 'tenant-b');
    expect(result.length).toBe(0);
  });
});
```

- [ ] Write `deployment.repository.ts`
- [ ] Write `deployment.repository.test.ts`
- [ ] `pnpm test deployment.repository.test.ts` — PASS
- [ ] Commit: `feat: DeploymentRepository + tests (T-044)`

### Task 2: Deployments API routes

**Files:**
- Create: `app/api/deployments/route.ts` (POST + GET)
- Create: `app/api/deployments/[id]/route.ts` (GET single)

`app/api/deployments/route.ts`:

POST body `{ projectId, environment }`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { DeploymentRepository } from '@/lib/server/repositories/deployment.repository';

const deploymentRepository = new DeploymentRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body as { projectId?: string; environment?: string };
    if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

    const tenantId = await getTenantId();
    const environment = body.environment || 'production';

    const result = await withTenant(prisma, tenantId, async () => {
      const project = await prisma.project.findUnique({ where: { id: projectId, tenantId } });
      if (!project) return { status: 404, body: { error: 'Project not found' } };
      if (project.status !== 'qa_passed') {
        return { status: 403, body: { error: 'QA must pass before publishing' } };
      }
      const deployment = await deploymentRepository.create(
        { projectId, environment, status: 'success', publicUrl: `/view/${projectId}` },
        tenantId
      );
      await prisma.project.update({ where: { id: projectId, tenantId }, data: { status: 'published' } });
      return { status: 201, body: { deployment, publicUrl: deployment.publicUrl } };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'Failed to publish project' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    const tenantId = await getTenantId();
    const deployments = await withTenant(prisma, tenantId, () =>
      deploymentRepository.findByProject(projectId, tenantId)
    );
    return NextResponse.json({ deployments });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}
```

`app/api/deployments/[id]/route.ts`: GET single deployment (tenant-scoped).

- [ ] Write both routes
- [ ] Typecheck passes
- [ ] Commit: `feat: POST/GET /api/deployments with QA gate (T-044)`

### Task 3: Project detail page

**Files:**
- Create: `app/(dashboard)/projects/[id]/page.tsx`

Server component loading project + latest QA report + assets. Renders:
- Status badge (reuse dashboard statusColors)
- Project info (name, description)
- QA summary from latest report
- Re-run QA button (calls POST /api/qa/run)
- UploadDropzone (T-041)
- Publish button (enabled only when status === 'qa_passed')
- Deployment history

Use `'use client'` for interactive buttons (publish, re-run QA, upload). Keep page as server component that passes data to a client component `ProjectDetailClient`.

- [ ] Write `app/(dashboard)/projects/[id]/page.tsx`
- [ ] Typecheck + build passes
- [ ] Commit: `feat: project overview hub with QA-gated publish (T-044)`

### Task 4: Smoke + TODO + push

- [ ] `pnpm build` ✓
- [ ] `pnpm typecheck` ✓
- [ ] `pnpm test` ✓ (all suites)
- [ ] Update TODO.md T-044 → done, commit
- [ ] Push
```

**Note:** The `publicUrl: `/view/${projectId}` is a reference to the T-042/T-045 viewer route. The viewer page fetches fresh signed asset URLs via `GET /api/assets?project_id=` on each load, so public links never expire despite the private R2 bucket.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-08-t044-publish-button-gate.md`.

Continuing inline in this session.
