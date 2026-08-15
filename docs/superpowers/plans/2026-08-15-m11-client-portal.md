# M11: Client Portal & Collaboration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give CLIENT-role users a portal showing only their projects, with 3D pinned annotations, threaded comments + @mentions, approval workflows, password-protected deliverables, and version history.

**Architecture:** The 5 Prisma models (`Annotation`, `Comment`, `ApprovalWorkflow`, `Deliverable`, `ProjectVersion`) already exist in `prisma/schema.prisma` (with `tenantId` + tenant index). This plan (1) verifies the schema, authors + applies the `m11_client_portal` migration + RLS via Supabase MCP, (2) extends RBAC in `lib/auth/session.ts`, (3) builds the typed service layer under `lib/server/client-portal/` with Vitest coverage, (4) adds the API routes, and (5) builds the `app/(client-portal)/` UI reusing the Babylon viewer stack. No `ClientPortal` model — access is via `Project.clientId === user.id`.

**Tech Stack:** Prisma 5.22, Next.js 16 (App Router), Supabase auth, R2 presigned URLs, BabylonJS, Vitest.

## Global Constraints

- Migration: DB is Supabase pooler (no `DIRECT_URL`). `prisma migrate dev` will NOT work. Author SQL with `prisma migrate diff`, write a local migration file, apply via the Supabase MCP `apply_migration` tool.
- RLS house pattern: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` + `CREATE POLICY "tenant_isolation" ON ... USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);` (uses `::TEXT`).
- All service queries scope by `tenantId`. CLIENT role sees only projects where `project.clientId === user.id`.
- `approvals.manage` is staff-only (ADMIN/SUPER_ADMIN). CLIENT gets `approvals.request`.
- No `ClientPortal` model — do not add it. `prisma validate` must pass.
- No comments unless requested. TypeScript strict. House naming: snake_case `@map`, UUID ids, `tenantId` + index.
- Verify after each task: `npx tsc --noEmit` (0 errors), `pnpm lint` (0 errors), `npx vitest run` (new tests pass), `pnpm build` (success).

---

## File Structure

```
prisma/migrations/<ts>_m11_client_portal/migration.sql    # NEW (5 tables + RLS)
lib/auth/session.ts                                       # MODIFY: Permission union + ROLE_PERMISSIONS
lib/server/client-portal/annotations.ts                   # NEW service
lib/server/client-portal/comments.ts                      # NEW service
lib/server/client-portal/approvals.ts                     # NEW service
lib/server/client-portal/deliverables.ts                  # NEW service
lib/server/client-portal/versions.ts                      # NEW service
lib/server/client-portal/annotations.test.ts              # NEW tests
lib/server/client-portal/comments.test.ts                 # NEW tests
lib/server/client-portal/approvals.test.ts                # NEW tests
lib/server/client-portal/deliverables.test.ts             # NEW tests
lib/server/client-portal/versions.test.ts                 # NEW tests
app/api/client/portals/route.ts                           # NEW
app/api/annotations/route.ts                              # NEW
app/api/annotations/[id]/route.ts                         # NEW
app/api/projects/[id]/comments/route.ts                   # NEW
app/api/comments/route.ts                                 # NEW
app/api/approvals/route.ts                                # NEW
app/api/approvals/[id]/route.ts                           # NEW
app/api/deliverables/route.ts                             # NEW
app/api/projects/[id]/deliverables/route.ts               # NEW
app/api/deliverables/[id]/download/route.ts               # NEW
app/api/projects/[id]/versions/route.ts                   # NEW
app/(client-portal)/layout.tsx                            # NEW (guard)
app/(client-portal)/client/page.tsx                       # NEW dashboard
app/(client-portal)/client/projects/[id]/page.tsx         # NEW detail + viewer
app/(client-portal)/client/projects/[id]/annotations/page.tsx   # NEW
app/(client-portal)/client/projects/[id]/comments/page.tsx      # NEW
app/(client-portal)/client/projects/[id]/approvals/page.tsx     # NEW
app/(client-portal)/client/projects/[id]/deliverables/page.tsx  # NEW
app/(client-portal)/client/projects/[id]/versions/page.tsx      # NEW
components/client-portal/ClientPortalLayout.tsx           # NEW
components/client-portal/ProjectViewer.tsx                # NEW
components/client-portal/AnnotationPin.tsx                # NEW
components/client-portal/AnnotationThread.tsx             # NEW
components/client-portal/AnnotationForm.tsx               # NEW
components/client-portal/CommentThread.tsx                # NEW
components/client-portal/ApprovalWorkflow.tsx             # NEW
components/client-portal/DeliverableDownloader.tsx        # NEW
components/client-portal/VersionHistory.tsx               # NEW
```

---

### Task 1: Verify schema + author/apply migration with RLS

**Files:**
- Create: `prisma/migrations/<ts>_m11_client_portal/migration.sql` (use `20260815` prefix)

**Interfaces:**
- Consumes: existing models `Annotation`, `Comment`, `ApprovalWorkflow`, `Deliverable`, `ProjectVersion` (schema.prisma lines 300-382)
- Produces: live tables `annotations`, `comments`, `approval_workflows`, `deliverables`, `project_versions` in Supabase with RLS; `prisma` delegates typed

- [ ] **Step 1: Validate + generate**

Run: `npx prisma validate`
Expected: exit 0 (models already present; no `ClientPortal`).

Run: `npx prisma generate`
Expected: regenerates client with the 5 delegates.

- [ ] **Step 2: Author the migration SQL**

Run: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
Expected: SQL for all tables. Copy only `CREATE TABLE "annotations"`, `"comments"`, `"approval_workflows"`, `"deliverables"`, `"project_versions"` into `prisma/migrations/20260815000001_m11_client_portal/migration.sql`, plus the index statements for those tables, plus:

```sql
ALTER TABLE "annotations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "annotations" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "comments" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "approval_workflows" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "approval_workflows" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "deliverables" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "deliverables" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "project_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "project_versions" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);
```

- [ ] **Step 3: Apply to Supabase via MCP**

Call the Supabase `apply_migration` MCP tool with `name: "m11_client_portal"` and `query: <the full SQL>`.
Expected: success. Verify via MCP `execute_sql`:
```sql
SELECT tablename FROM pg_tables WHERE tablename IN ('annotations','comments','approval_workflows','deliverables','project_versions');
```
returns 5 rows.

- [ ] **Step 4: Commit**

```bash
git add prisma/migrations/20260815000001_m11_client_portal/migration.sql
git commit -m "feat(portal): add m11_client_portal migration with RLS"
```

---

### Task 2: Extend RBAC in session.ts

**Files:**
- Modify: `lib/auth/session.ts`

**Interfaces:**
- Consumes: existing `Permission` union (lines 24-33), `ROLE_PERMISSIONS` (lines 35-58)
- Produces: new permissions `client.portals.read`, `collab.annotate`, `collab.comment`, `approvals.request`, `approvals.manage` with correct role mapping

- [ ] **Step 1: Write the failing test**

Create `lib/auth/session.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hasPermission } from './session';

describe('M11 RBAC', () => {
  it('CLIENT can read portals, annotate, comment, request approvals', () => {
    expect(hasPermission('CLIENT', 'client.portals.read')).toBe(true);
    expect(hasPermission('CLIENT', 'collab.annotate')).toBe(true);
    expect(hasPermission('CLIENT', 'collab.comment')).toBe(true);
    expect(hasPermission('CLIENT', 'approvals.request')).toBe(true);
  });

  it('CLIENT cannot manage approvals', () => {
    expect(hasPermission('CLIENT', 'approvals.manage')).toBe(false);
  });

  it('ADMIN can manage approvals', () => {
    expect(hasPermission('ADMIN', 'approvals.manage')).toBe(true);
  });

  it('USER can annotate and comment but not manage approvals', () => {
    expect(hasPermission('USER', 'collab.annotate')).toBe(true);
    expect(hasPermission('USER', 'collab.comment')).toBe(true);
    expect(hasPermission('USER', 'approvals.manage')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/auth/session.test.ts`
Expected: FAIL (`hasPermission('CLIENT', 'client.portals.read')` false — union doesn't accept the string yet, TypeScript error at runtime).

- [ ] **Step 3: Extend the Permission union**

Replace the union (lines 24-33):

```ts
export type Permission =
  | 'users.read'
  | 'users.write'
  | 'projects.read'
  | 'projects.write'
  | 'deployments.write'
  | 'billing.read'
  | 'settings.write'
  | 'audit.read'
  | 'content.write'
  | 'client.portals.read'
  | 'collab.annotate'
  | 'collab.comment'
  | 'approvals.request'
  | 'approvals.manage';
```

- [ ] **Step 4: Extend ROLE_PERMISSIONS**

Replace `ROLE_PERMISSIONS` (lines 35-58):

```ts
const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: [
    'users.read',
    'users.write',
    'projects.read',
    'projects.write',
    'deployments.write',
    'billing.read',
    'settings.write',
    'audit.read',
    'content.write',
    'client.portals.read',
    'collab.annotate',
    'collab.comment',
    'approvals.request',
    'approvals.manage',
  ],
  ADMIN: [
    'users.read',
    'projects.read',
    'projects.write',
    'deployments.write',
    'billing.read',
    'settings.write',
    'audit.read',
    'content.write',
    'client.portals.read',
    'collab.annotate',
    'collab.comment',
    'approvals.request',
    'approvals.manage',
  ],
  USER: ['projects.read', 'deployments.write', 'collab.annotate', 'collab.comment'],
  CLIENT: ['projects.read', 'client.portals.read', 'collab.annotate', 'collab.comment', 'approvals.request'],
};
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run lib/auth/session.test.ts`
Expected: PASS (4 tests).

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/session.ts lib/auth/session.test.ts
git commit -m "feat(portal): add client portal and collaboration permissions"
```

---

### Task 3: Annotations service + tests

**Files:**
- Create: `lib/server/client-portal/annotations.ts`
- Create: `lib/server/client-portal/annotations.test.ts`

**Interfaces:**
- Consumes: `prisma`, `getCurrentAuth`, `requirePermission`, `auditLog`
- Produces:
  - `listAnnotations(projectId, opts?: { resolved?: boolean }): Promise<Annotation[]>`
  - `createAnnotation(projectId, input: { position: { x: number; y: number; z?: number }; content: string }): Promise<Annotation>`
  - `resolveAnnotation(id): Promise<Annotation>`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const annotations: Record<string, Record<string, unknown>> = {};
let seq = 0;

vi.mock('@/lib/db/server', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
        where.id === 'p1' && where.tenantId === 'tenant-1' ? { id: 'p1', clientId: 'u1' } : null
      ),
    },
    annotation: {
      findMany: vi.fn(async () => Object.values(annotations).sort((a, b) => (a.createdAt as Date) < (b.createdAt as Date) ? 1 : -1)),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const id = `a-${++seq}`;
        const row = { id, resolved: false, createdAt: new Date(), updatedAt: new Date(), ...data };
        annotations[id] = row;
        return row;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = annotations[where.id];
        if (!row) throw new Error('Not found');
        return Object.assign(row, data);
      }),
    },
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getCurrentAuth: vi.fn(async () => ({
    authUser: { id: 'u1', email: 'a@b.c' },
    dbUser: { id: 'u1', role: 'CLIENT', tenantId: 'tenant-1' },
    role: 'CLIENT',
    tenantId: 'tenant-1',
  })),
  requirePermission: vi.fn(async () => 'CLIENT'),
}));

vi.mock('@/lib/server/audit/audit-logger', () => ({
  auditLog: vi.fn(async () => {}),
}));

import { listAnnotations, createAnnotation, resolveAnnotation } from './annotations';

describe('annotations service', () => {
  beforeEach(() => {
    Object.keys(annotations).forEach((k) => delete annotations[k]);
    seq = 0;
  });

  it('createAnnotation persists position and content', async () => {
    const a = await createAnnotation('p1', { position: { x: 1, y: 2, z: 3 }, content: 'Move the light' });
    expect(a.resolved).toBe(false);
    expect(a.authorId).toBe('u1');
  });

  it('resolveAnnotation sets resolved=true', async () => {
    const a = await createAnnotation('p1', { position: { x: 0, y: 0 }, content: 'ok' });
    const resolved = await resolveAnnotation(a.id);
    expect(resolved.resolved).toBe(true);
  });

  it('listAnnotations returns created annotations', async () => {
    await createAnnotation('p1', { position: { x: 1, y: 1 }, content: 'one' });
    const all = await listAnnotations('p1');
    expect(all.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/server/client-portal/annotations.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the service**

```ts
import { prisma } from '@/lib/db/server';
import { getCurrentAuth, requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';

export interface Annotation {
  id: string;
  projectId: string;
  authorId: string;
  position: { x: number; y: number; z?: number };
  content: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function mapAnnotation(row: {
  id: string; projectId: string; authorId: string;
  position: unknown; content: string; resolved: boolean;
  createdAt: Date; updatedAt: Date;
}): Annotation {
  return {
    id: row.id,
    projectId: row.projectId,
    authorId: row.authorId,
    position: row.position as Annotation['position'],
    content: row.content,
    resolved: row.resolved,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function assertProjectAccess(projectId: string, tenantId: string, userId: string, role: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) throw new Error('Project not found');
  if (role === 'CLIENT' && project.clientId !== userId) throw new Error('Forbidden: not your project');
}

export async function listAnnotations(projectId: string, opts: { resolved?: boolean } = {}): Promise<Annotation[]> {
  const { tenantId } = await getCurrentAuth();
  await requirePermission('collab.annotate');
  const rows = await prisma.annotation.findMany({
    where: {
      projectId,
      tenantId,
      ...(opts.resolved === undefined ? {} : { resolved: opts.resolved }),
    },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(mapAnnotation);
}

export async function createAnnotation(
  projectId: string,
  input: { position: { x: number; y: number; z?: number }; content: string }
): Promise<Annotation> {
  const { dbUser, tenantId, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.annotate');
  await assertProjectAccess(projectId, tenantId, dbUser.id, role);

  const row = await prisma.annotation.create({
    data: {
      projectId,
      authorId: dbUser.id,
      position: JSON.parse(JSON.stringify(input.position)),
      content: input.content,
      tenantId,
    },
  });

  await auditLog({ action: 'annotation.create', resource: 'annotation', resourceId: row.id, changes: { projectId } });
  return mapAnnotation(row);
}

export async function resolveAnnotation(id: string): Promise<Annotation> {
  const { tenantId } = await getCurrentAuth();
  await requirePermission('collab.annotate');

  const row = await prisma.annotation.update({
    where: { id },
    data: { resolved: true },
  });
  if (row.tenantId !== tenantId) throw new Error('Forbidden');

  await auditLog({ action: 'annotation.resolve', resource: 'annotation', resourceId: id });
  return mapAnnotation(row);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/server/client-portal/annotations.test.ts`
Expected: PASS (3 tests).

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add lib/server/client-portal/annotations.ts lib/server/client-portal/annotations.test.ts
git commit -m "feat(portal): annotations service"
```

---

### Task 4: Comments service + tests

**Files:**
- Create: `lib/server/client-portal/comments.ts`
- Create: `lib/server/client-portal/comments.test.ts`

**Interfaces:**
- Consumes: `prisma`, auth, audit
- Produces:
  - `listComments(projectId): Promise<CommentTreeItem[]>` — top-level (`parentId: null`) each with nested `replies`
  - `createComment(projectId, input: { content: string; parentId?: string | null }): Promise<Comment>`
  - `parseMentions(content: string): string[]` (exported helper) — extracts `@name` tokens

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const comments: Record<string, Record<string, unknown>> = {};
let seq = 0;

vi.mock('@/lib/db/server', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
        where.id === 'p1' && where.tenantId === 'tenant-1' ? { id: 'p1', clientId: 'u1' } : null
      ),
    },
    comment: {
      findMany: vi.fn(async () => Object.values(comments)),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const id = `c-${++seq}`;
        const row = { id, mentions: [], createdAt: new Date(), updatedAt: new Date(), ...data };
        comments[id] = row;
        return row;
      }),
    },
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getCurrentAuth: vi.fn(async () => ({
    authUser: { id: 'u1', email: 'a@b.c' },
    dbUser: { id: 'u1', role: 'CLIENT', tenantId: 'tenant-1' },
    role: 'CLIENT',
    tenantId: 'tenant-1',
  })),
  requirePermission: vi.fn(async () => 'CLIENT'),
}));

vi.mock('@/lib/server/audit/audit-logger', () => ({
  auditLog: vi.fn(async () => {}),
}));

import { listComments, createComment, parseMentions } from './comments';

describe('comments service', () => {
  beforeEach(() => {
    Object.keys(comments).forEach((k) => delete comments[k]);
    seq = 0;
  });

  it('parseMentions extracts @name tokens', () => {
    expect(parseMentions('Hey @alice please review @bob')).toEqual(['alice', 'bob']);
  });

  it('createComment stores mentions array', async () => {
    const c = await createComment('p1', { content: 'cc @alice' });
    expect(c.mentions).toContain('alice');
  });

  it('createComment stores parentId for replies', async () => {
    const c = await createComment('p1', { content: 'reply', parentId: 'c-1' });
    expect(c.parentId).toBe('c-1');
  });

  it('listComments returns top-level with replies nested', async () => {
    await createComment('p1', { content: 'top' });
    await createComment('p1', { content: 'reply', parentId: 'c-1' });
    const tree = await listComments('p1');
    expect(tree.length).toBe(1);
    expect(tree[0].replies.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/server/client-portal/comments.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the service**

```ts
import { prisma } from '@/lib/db/server';
import { getCurrentAuth, requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';

export interface Comment {
  id: string;
  projectId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentTreeItem extends Comment {
  replies: Comment[];
}

export function parseMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_.-]+)/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1))));
}

function mapComment(row: {
  id: string; projectId: string; authorId: string; parentId: string | null;
  content: string; mentions: string[]; createdAt: Date; updatedAt: Date;
}): Comment {
  return {
    id: row.id,
    projectId: row.projectId,
    authorId: row.authorId,
    parentId: row.parentId,
    content: row.content,
    mentions: row.mentions,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listComments(projectId: string): Promise<CommentTreeItem[]> {
  const { tenantId } = await getCurrentAuth();
  await requirePermission('collab.comment');

  const rows = await prisma.comment.findMany({
    where: { projectId, tenantId },
    orderBy: { createdAt: 'asc' },
  });

  const mapped = rows.map(mapComment);
  const topLevel = mapped.filter((c) => c.parentId === null);
  return topLevel.map((c) => ({
    ...c,
    replies: mapped.filter((r) => r.parentId === c.id),
  }));
}

export async function createComment(
  projectId: string,
  input: { content: string; parentId?: string | null }
): Promise<Comment> {
  const { dbUser, tenantId, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('collab.comment');

  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) throw new Error('Project not found');
  if (role === 'CLIENT' && project.clientId !== dbUser.id) throw new Error('Forbidden: not your project');

  const row = await prisma.comment.create({
    data: {
      projectId,
      authorId: dbUser.id,
      parentId: input.parentId ?? null,
      content: input.content,
      mentions: parseMentions(input.content),
      tenantId,
    },
  });

  await auditLog({ action: 'comment.create', resource: 'comment', resourceId: row.id, changes: { projectId } });
  return mapComment(row);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/server/client-portal/comments.test.ts`
Expected: PASS (4 tests).

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add lib/server/client-portal/comments.ts lib/server/client-portal/comments.test.ts
git commit -m "feat(portal): comments service with mentions"
```

---

### Task 5: Approvals service + tests

**Files:**
- Create: `lib/server/client-portal/approvals.ts`
- Create: `lib/server/client-portal/approvals.test.ts`

**Interfaces:**
- Consumes: `prisma`, auth, audit
- Produces:
  - `requestApproval(projectId, notes?): Promise<ApprovalWorkflow>` — CLIENT (`approvals.request`)
  - `listApprovals(opts?: { status?: 'pending' | 'approved' | 'rejected'; projectId?: string }): Promise<ApprovalWorkflow[]>`
  - `updateApprovalStatus(id, status: 'approved' | 'rejected', notes?): Promise<ApprovalWorkflow>` — staff (`approvals.manage`)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const approvals: Record<string, Record<string, unknown>> = {};
let seq = 0;

vi.mock('@/lib/db/server', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
        where.id === 'p1' && where.tenantId === 'tenant-1' ? { id: 'p1', clientId: 'u1' } : null
      ),
    },
    approvalWorkflow: {
      findMany: vi.fn(async () => Object.values(approvals)),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const id = `aw-${++seq}`;
        const row = { id, status: 'pending', createdAt: new Date(), updatedAt: new Date(), ...data };
        approvals[id] = row;
        return row;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = approvals[where.id];
        if (!row) throw new Error('Not found');
        return Object.assign(row, data);
      }),
    },
  },
}));

const authState = {
  dbUser: { id: 'u1', role: 'CLIENT', tenantId: 'tenant-1' },
  role: 'CLIENT' as string,
  permission: 'approvals.request',
};

vi.mock('@/lib/auth/session', () => ({
  getCurrentAuth: vi.fn(async () => ({
    authUser: { id: 'u1', email: 'a@b.c' },
    dbUser: authState.dbUser,
    role: authState.role,
    tenantId: 'tenant-1',
  })),
  requirePermission: vi.fn(async () => authState.role),
}));

vi.mock('@/lib/server/audit/audit-logger', () => ({
  auditLog: vi.fn(async () => {}),
}));

import { requestApproval, listApprovals, updateApprovalStatus } from './approvals';

describe('approvals service', () => {
  beforeEach(() => {
    Object.keys(approvals).forEach((k) => delete approvals[k]);
    seq = 0;
    authState.role = 'CLIENT';
  });

  it('requestApproval creates a pending workflow', async () => {
    const a = await requestApproval('p1', 'Please approve v2');
    expect(a.status).toBe('pending');
    expect(a.requesterId).toBe('u1');
  });

  it('listApprovals filters by pending status', async () => {
    await requestApproval('p1', 'one');
    const pending = await listApprovals({ status: 'pending' });
    expect(pending.length).toBe(1);
  });

  it('updateApprovalStatus approves with notes (staff)', async () => {
    authState.role = 'ADMIN';
    const a = await requestApproval('p1', 'please');
    const updated = await updateApprovalStatus(a.id, 'approved', 'Looks good');
    expect(updated.status).toBe('approved');
    expect(updated.notes).toBe('Looks good');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/server/client-portal/approvals.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the service**

```ts
import { prisma } from '@/lib/db/server';
import { getCurrentAuth, requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalWorkflow {
  id: string;
  projectId: string;
  requesterId: string;
  approverId: string | null;
  status: ApprovalStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapApproval(row: {
  id: string; projectId: string; requesterId: string; approverId: string | null;
  status: string; notes: string | null; createdAt: Date; updatedAt: Date;
}): ApprovalWorkflow {
  return {
    id: row.id,
    projectId: row.projectId,
    requesterId: row.requesterId,
    approverId: row.approverId,
    status: row.status as ApprovalStatus,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function requestApproval(projectId: string, notes?: string): Promise<ApprovalWorkflow> {
  const { dbUser, tenantId, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.request');

  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) throw new Error('Project not found');
  if (role === 'CLIENT' && project.clientId !== dbUser.id) throw new Error('Forbidden: not your project');

  const row = await prisma.approvalWorkflow.create({
    data: {
      projectId,
      requesterId: dbUser.id,
      status: 'pending',
      notes: notes ?? null,
      tenantId,
    },
  });

  await auditLog({ action: 'approval.request', resource: 'approval_workflow', resourceId: row.id, changes: { projectId } });
  return mapApproval(row);
}

export async function listApprovals(opts: { status?: ApprovalStatus; projectId?: string } = {}): Promise<ApprovalWorkflow[]> {
  const { tenantId } = await getCurrentAuth();
  await requirePermission('approvals.request');

  const rows = await prisma.approvalWorkflow.findMany({
    where: {
      tenantId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapApproval);
}

export async function updateApprovalStatus(id: string, status: 'approved' | 'rejected', notes?: string): Promise<ApprovalWorkflow> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.manage');

  const existing = await prisma.approvalWorkflow.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Approval not found');

  const row = await prisma.approvalWorkflow.update({
    where: { id },
    data: { status, notes: notes ?? existing.notes, approverId: dbUser.id },
  });

  await auditLog({ action: `approval.${status}`, resource: 'approval_workflow', resourceId: id, changes: { projectId: existing.projectId } });
  return mapApproval(row);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/server/client-portal/approvals.test.ts`
Expected: PASS (3 tests).

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add lib/server/client-portal/approvals.ts lib/server/client-portal/approvals.test.ts
git commit -m "feat(portal): approval workflow service"
```

---

### Task 6: Deliverables service + tests

**Files:**
- Create: `lib/server/client-portal/deliverables.ts`
- Create: `lib/server/client-portal/deliverables.test.ts`

**Interfaces:**
- Consumes: `prisma`, auth, audit, `presignGetObject` from `@/lib/server/lib/r2`
- Produces:
  - `createDeliverable(projectId, input: { name: string; type: 'zip' | 'url' | 'folder'; url: string; password?: string; expiresAt?: string }): Promise<Deliverable>` — staff
  - `listDeliverables(projectId): Promise<Deliverable[]>` — client
  - `downloadDeliverable(id, password?): Promise<{ url: string }>` — client, password + expiry gate

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const deliverables: Record<string, Record<string, unknown>> = {};
let seq = 0;

vi.mock('@/lib/db/server', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
        where.id === 'p1' && where.tenantId === 'tenant-1' ? { id: 'p1', clientId: 'u1' } : null
      ),
    },
    deliverable: {
      findMany: vi.fn(async () => Object.values(deliverables)),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const id = `d-${++seq}`;
        const row = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        deliverables[id] = row;
        return row;
      }),
      findFirst: vi.fn(async ({ where }: { where: { id?: string } }) => deliverables[where.id as string] ?? null),
    },
  },
}));

const authState = { role: 'ADMIN' as string };

vi.mock('@/lib/auth/session', () => ({
  getCurrentAuth: vi.fn(async () => ({
    authUser: { id: 'u1', email: 'a@b.c' },
    dbUser: { id: 'u1', role: authState.role, tenantId: 'tenant-1' },
    role: authState.role,
    tenantId: 'tenant-1',
  })),
  requirePermission: vi.fn(async () => authState.role),
}));

vi.mock('@/lib/server/audit/audit-logger', () => ({
  auditLog: vi.fn(async () => {}),
}));

vi.mock('@/lib/server/lib/r2', () => ({
  presignGetObject: vi.fn(async (key: string) => `https://presigned/${key}`),
}));

import { createDeliverable, listDeliverables, downloadDeliverable } from './deliverables';

describe('deliverables service', () => {
  beforeEach(() => {
    Object.keys(deliverables).forEach((k) => delete deliverables[k]);
    seq = 0;
    authState.role = 'ADMIN';
  });

  it('createDeliverable stores the URL', async () => {
    const d = await createDeliverable('p1', { name: 'Final ZIP', type: 'zip', url: 's3://x/final.zip' });
    expect(d.url).toBe('s3://x/final.zip');
  });

  it('downloadDeliverable returns a presigned URL when no password and not expired', async () => {
    await createDeliverable('p1', { name: 'Final ZIP', type: 'zip', url: 's3://x/final.zip' });
    const { url } = await downloadDeliverable('d-1');
    expect(url).toContain('https://presigned/');
  });

  it('downloadDeliverable rejects wrong password', async () => {
    await createDeliverable('p1', { name: 'Protected', type: 'zip', url: 's3://x/p.zip', password: 'secret' });
    await expect(downloadDeliverable('d-1', 'wrong')).rejects.toThrow('Invalid password');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/server/client-portal/deliverables.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the service**

```ts
import { prisma } from '@/lib/db/server';
import { getCurrentAuth, requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import { presignGetObject } from '@/lib/server/lib/r2';

export interface Deliverable {
  id: string;
  projectId: string;
  name: string;
  type: 'zip' | 'url' | 'folder';
  url: string;
  password: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapDeliverable(row: {
  id: string; projectId: string; name: string; type: string; url: string;
  password: string | null; expiresAt: Date | null; createdAt: Date; updatedAt: Date;
}): Deliverable {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    type: row.type as Deliverable['type'],
    url: row.url,
    password: row.password,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createDeliverable(
  projectId: string,
  input: { name: string; type: 'zip' | 'url' | 'folder'; url: string; password?: string; expiresAt?: string }
): Promise<Deliverable> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.manage');

  const row = await prisma.deliverable.create({
    data: {
      projectId,
      name: input.name,
      type: input.type,
      url: input.url,
      password: input.password ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      tenantId,
    },
  });

  await auditLog({ action: 'deliverable.create', resource: 'deliverable', resourceId: row.id, changes: { projectId } });
  return mapDeliverable(row);
}

export async function listDeliverables(projectId: string): Promise<Deliverable[]> {
  const { tenantId } = await getCurrentAuth();
  await requirePermission('client.portals.read');

  const rows = await prisma.deliverable.findMany({
    where: { projectId, tenantId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => ({ ...mapDeliverable(r), password: null }));
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export async function downloadDeliverable(id: string, password?: string): Promise<{ url: string }> {
  const { tenantId, role, dbUser } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('client.portals.read');

  const row = await prisma.deliverable.findFirst({ where: { id, tenantId } });
  if (!row) throw new Error('Deliverable not found');

  const project = await prisma.project.findFirst({ where: { id: row.projectId, tenantId } });
  if (!project) throw new Error('Project not found');
  if (role === 'CLIENT' && project.clientId !== dbUser.id) throw new Error('Forbidden: not your project');

  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) throw new Error('Deliverable expired');

  if (row.password && !safeEqual(password ?? '', row.password)) {
    throw new Error('Invalid password');
  }

  const key = row.url.replace(/^s3:\/\//, '');
  const url = await presignGetObject(key, 900);

  await auditLog({ action: 'deliverable.download', resource: 'deliverable', resourceId: id });
  return { url };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/server/client-portal/deliverables.test.ts`
Expected: PASS (3 tests).

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add lib/server/client-portal/deliverables.ts lib/server/client-portal/deliverables.test.ts
git commit -m "feat(portal): deliverables service with password and expiry"
```

---

### Task 7: Versions service + tests

**Files:**
- Create: `lib/server/client-portal/versions.ts`
- Create: `lib/server/client-portal/versions.test.ts`

**Interfaces:**
- Consumes: `prisma`, auth, audit
- Produces:
  - `listVersions(projectId): Promise<ProjectVersion[]>`
  - `createVersionSnapshot(projectId, input: { version: string; changes: Record<string, unknown> }): Promise<ProjectVersion>` — staff

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const versions: Record<string, Record<string, unknown>> = {};
let seq = 0;

vi.mock('@/lib/db/server', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
        where.id === 'p1' && where.tenantId === 'tenant-1' ? { id: 'p1', clientId: 'u1' } : null
      ),
    },
    projectVersion: {
      findMany: vi.fn(async () => Object.values(versions)),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const id = `pv-${++seq}`;
        const row = { id, createdAt: new Date(), ...data };
        versions[id] = row;
        return row;
      }),
    },
  },
}));

const authState = { role: 'ADMIN' as string };

vi.mock('@/lib/auth/session', () => ({
  getCurrentAuth: vi.fn(async () => ({
    authUser: { id: 'u1', email: 'a@b.c' },
    dbUser: { id: 'u1', role: authState.role, tenantId: 'tenant-1' },
    role: authState.role,
    tenantId: 'tenant-1',
  })),
  requirePermission: vi.fn(async () => authState.role),
}));

vi.mock('@/lib/server/audit/audit-logger', () => ({
  auditLog: vi.fn(async () => {}),
}));

import { listVersions, createVersionSnapshot } from './versions';

describe('versions service', () => {
  beforeEach(() => {
    Object.keys(versions).forEach((k) => delete versions[k]);
    seq = 0;
  });

  it('createVersionSnapshot is append-only', async () => {
    await createVersionSnapshot('p1', { version: 'v1', changes: { sections: 2 } });
    await createVersionSnapshot('p1', { version: 'v2', changes: { sections: 3 } });
    const all = await listVersions('p1');
    expect(all.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/server/client-portal/versions.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the service**

```ts
import { prisma } from '@/lib/db/server';
import { getCurrentAuth, requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';

export interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;
  changes: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
}

function mapVersion(row: {
  id: string; projectId: string; version: string; changes: unknown;
  createdBy: string; createdAt: Date;
}): ProjectVersion {
  return {
    id: row.id,
    projectId: row.projectId,
    version: row.version,
    changes: row.changes as Record<string, unknown>,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

export async function listVersions(projectId: string): Promise<ProjectVersion[]> {
  const { tenantId } = await getCurrentAuth();
  await requirePermission('client.portals.read');

  const rows = await prisma.projectVersion.findMany({
    where: { projectId, tenantId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapVersion);
}

export async function createVersionSnapshot(
  projectId: string,
  input: { version: string; changes: Record<string, unknown> }
): Promise<ProjectVersion> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('approvals.manage');

  const row = await prisma.projectVersion.create({
    data: {
      projectId,
      version: input.version,
      changes: JSON.parse(JSON.stringify(input.changes)),
      createdBy: dbUser.id,
      tenantId,
    },
  });

  await auditLog({ action: 'project_version.create', resource: 'project_version', resourceId: row.id, changes: { projectId } });
  return mapVersion(row);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/server/client-portal/versions.test.ts`
Expected: PASS (1 test).

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add lib/server/client-portal/versions.ts lib/server/client-portal/versions.test.ts
git commit -m "feat(portal): project version snapshot service"
```

---

### Task 8: Portal API routes (services wired)

**Files:**
- Create: `app/api/client/portals/route.ts`
- Create: `app/api/annotations/route.ts`
- Create: `app/api/annotations/[id]/route.ts`
- Create: `app/api/projects/[id]/comments/route.ts`
- Create: `app/api/comments/route.ts`
- Create: `app/api/approvals/route.ts`
- Create: `app/api/approvals/[id]/route.ts`
- Create: `app/api/deliverables/route.ts`
- Create: `app/api/projects/[id]/deliverables/route.ts`
- Create: `app/api/deliverables/[id]/download/route.ts`
- Create: `app/api/projects/[id]/versions/route.ts`

**Interfaces:**
- Consumes: services from Tasks 3-7
- Produces: all 11 routes from the M11 spec §6

- [ ] **Step 1: Client portals list**

`app/api/client/portals/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth, requirePermission } from '@/lib/auth/session';

export async function GET() {
  try {
    const { dbUser, tenantId, role } = await getCurrentAuth();
    if (!dbUser) throw new Error('Unauthorized');
    await requirePermission('client.portals.read');

    const projects = await prisma.project.findMany({
      where: { tenantId, clientId: dbUser.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        publishedUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ projects, role });
  } catch (error) {
    console.error('List client portals error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Annotations routes**

`app/api/annotations/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { listAnnotations, createAnnotation } from '@/lib/server/client-portal/annotations';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    const resolvedParam = request.nextUrl.searchParams.get('resolved');
    const resolved = resolvedParam === null ? undefined : resolvedParam === 'true';
    const annotations = await listAnnotations(projectId, { resolved });
    return NextResponse.json({ annotations });
  } catch (error) {
    console.error('List annotations error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, position, content } = body;
    if (!projectId || !position || typeof content !== 'string') {
      return NextResponse.json({ error: 'projectId, position, content required' }, { status: 400 });
    }
    const annotation = await createAnnotation(projectId, { position, content });
    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error('Create annotation error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

`app/api/annotations/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { resolveAnnotation } from '@/lib/server/client-portal/annotations';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const annotation = await resolveAnnotation(id);
    return NextResponse.json(annotation);
  } catch (error) {
    console.error('Resolve annotation error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Comments routes**

`app/api/projects/[id]/comments/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { listComments } from '@/lib/server/client-portal/comments';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const comments = await listComments(id);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('List comments error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

`app/api/comments/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createComment } from '@/lib/server/client-portal/comments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, content, parentId } = body;
    if (!projectId || typeof content !== 'string') {
      return NextResponse.json({ error: 'projectId and content required' }, { status: 400 });
    }
    const comment = await createComment(projectId, { content, parentId: parentId ?? null });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Approvals routes**

`app/api/approvals/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requestApproval, listApprovals } from '@/lib/server/client-portal/approvals';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const projectId = request.nextUrl.searchParams.get('projectId');
    const approvals = await listApprovals({ status: status ?? undefined, projectId: projectId ?? undefined });
    return NextResponse.json({ approvals });
  } catch (error) {
    console.error('List approvals error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, notes } = body;
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const approval = await requestApproval(projectId, notes);
    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error('Request approval error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

`app/api/approvals/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { updateApprovalStatus } from '@/lib/server/client-portal/approvals';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;
    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 });
    }
    const approval = await updateApprovalStatus(id, status, notes);
    return NextResponse.json(approval);
  } catch (error) {
    console.error('Update approval error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Deliverables routes**

`app/api/deliverables/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createDeliverable } from '@/lib/server/client-portal/deliverables';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, type, url, password, expiresAt } = body;
    if (!projectId || !name || !type || !url) {
      return NextResponse.json({ error: 'projectId, name, type, url required' }, { status: 400 });
    }
    const deliverable = await createDeliverable(projectId, { name, type, url, password, expiresAt });
    return NextResponse.json(deliverable, { status: 201 });
  } catch (error) {
    console.error('Create deliverable error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

`app/api/projects/[id]/deliverables/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { listDeliverables } from '@/lib/server/client-portal/deliverables';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deliverables = await listDeliverables(id);
    return NextResponse.json({ deliverables });
  } catch (error) {
    console.error('List deliverables error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

`app/api/deliverables/[id]/download/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { downloadDeliverable } from '@/lib/server/client-portal/deliverables';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { url } = await downloadDeliverable(id, body.password);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Download deliverable error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 6: Versions route**

`app/api/projects/[id]/versions/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { listVersions, createVersionSnapshot } from '@/lib/server/client-portal/versions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const versions = await listVersions(id);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('List versions error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { version, changes } = body;
    if (!version || !changes) return NextResponse.json({ error: 'version and changes required' }, { status: 400 });
    const created = await createVersionSnapshot(id, { version, changes });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create version error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `npx vitest run lib/server/client-portal`
Expected: all service tests pass.

- [ ] **Step 8: Commit**

```bash
git add app/api/client/portals/route.ts app/api/annotations app/api/comments/route.ts "app/api/projects/[id]/comments/route.ts" app/api/approvals app/api/deliverables "app/api/projects/[id]/deliverables/route.ts" "app/api/deliverables/[id]/download/route.ts" "app/api/projects/[id]/versions/route.ts"
git commit -m "feat(portal): client portal API routes"
```

---

### Task 9: Client portal layout + route guard + dashboard

**Files:**
- Create: `app/(client-portal)/layout.tsx`
- Create: `components/client-portal/ClientPortalLayout.tsx`
- Create: `app/(client-portal)/client/page.tsx`

**Interfaces:**
- Consumes: `getCurrentAuth`, `requireRole`
- Produces: guarded portal shell; `/client` dashboard listing `clientId === user.id` projects

- [ ] **Step 1: Route-group layout with guard**

`app/(client-portal)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCurrentAuth, requireRole } from '@/lib/auth/session';
import { ClientPortalLayout } from '@/components/client-portal/ClientPortalLayout';

export const metadata = {
  title: { default: 'Client Portal', template: 'Client Portal | %s' },
  description: 'VizTR client portal',
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getCurrentAuth();
  const isAllowed = await requireRole(['CLIENT', 'USER', 'ADMIN']);
  if (!isAllowed) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-bg">
      <ClientPortalLayout role={role} />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: ClientPortalLayout sidebar**

`components/client-portal/ClientPortalLayout.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, Pin, MessageSquare, CheckSquare, Download, History, LogOut } from 'lucide-react';
import type { AppRole } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

interface ClientPortalLayoutProps {
  role: AppRole;
}

export function ClientPortalLayout({ role }: ClientPortalLayoutProps) {
  const pathname = usePathname();

  const nav = [
    { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client/projects', label: 'Projects', icon: Box },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-gray-800 bg-surface flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="font-display text-lg text-white">Client Portal</h1>
        <p className="text-xs text-gray-500 mt-1">{role}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href || pathname.startsWith(`${href}/`)
                ? 'bg-cyan/10 text-cyan'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800">
        <Link href="/auth/signout" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800">
          <LogOut className="w-4 h-4" /> Sign out
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Dashboard page**

`app/(client-portal)/client/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/server';
import { ExternalLink } from 'lucide-react';

export const metadata = { title: 'Dashboard', description: 'Your projects' };

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  review: 'In Review',
  published: 'Published',
  archived: 'Archived',
};

export default async function ClientDashboardPage() {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) notFound();

  const projects = await prisma.project.findMany({
    where: { tenantId, clientId: dbUser.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, description: true, status: true, publishedUrl: true, updatedAt: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-white">My Projects</h1>
      {projects.length === 0 ? (
        <p className="text-gray-500">No projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/client/projects/${p.id}`}
              className="rounded-xl border border-gray-800 bg-surface p-5 hover:border-cyan/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-white">{p.name}</h2>
                <span className="px-2 py-1 text-xs rounded bg-cyan/10 text-cyan">
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
              {p.description && <p className="mt-2 text-sm text-gray-400 line-clamp-2">{p.description}</p>}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Updated {p.updatedAt.toLocaleDateString()}</span>
                {p.publishedUrl && (
                  <span className="inline-flex items-center gap-1 text-cyan">
                    <ExternalLink className="w-3 h-3" /> Live
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add "app/(client-portal)/layout.tsx" "app/(client-portal)/client/page.tsx" components/client-portal/ClientPortalLayout.tsx
git commit -m "feat(portal): client portal shell and dashboard"
```

---

### Task 10: Project viewer (Babylon) + project detail page

**Files:**
- Create: `components/client-portal/ProjectViewer.tsx`
- Create: `app/(client-portal)/client/projects/[id]/page.tsx`

**Interfaces:**
- Consumes: `useBabylonScene`, `@babylonjs/core`, `@babylonjs/loaders`
- Produces: `<ProjectViewer glbUrl />` 3D viewer; project detail page with viewer + tab links

- [ ] **Step 1: ProjectViewer**

`components/client-portal/ProjectViewer.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/loaders';
import { useBabylonScene } from '@/components/xr/useBabylonScene';

interface ProjectViewerProps {
  glbUrl?: string | null;
  className?: string;
}

export function ProjectViewer({ glbUrl, className }: ProjectViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sceneRef } = useBabylonScene();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    sceneRef.current = scene;

    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 6, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    new HemisphericLight('light', new Vector3(1, 1, 0), scene);

    if (glbUrl) {
      SceneLoader.ImportMeshAsync('', glbUrl, '', scene)
        .then(() => {
          engine.runRenderLoop(() => scene.render());
        })
        .catch((err) => {
          console.error('Failed to load GLB:', err);
          engine.runRenderLoop(() => scene.render());
        });
    } else {
      engine.runRenderLoop(() => scene.render());
    }

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [glbUrl, sceneRef]);

  return <canvas ref={canvasRef} className={className ?? 'w-full h-[60vh]'} />;
}
```

- [ ] **Step 2: Project detail page**

`app/(client-portal)/client/projects/[id]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/server';
import { ProjectViewer } from '@/components/client-portal/ProjectViewer';
import { Pin, MessageSquare, CheckSquare, Download, History, ExternalLink } from 'lucide-react';

export const metadata = { title: 'Project', description: 'Project detail' };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { dbUser, tenantId, role } = await getCurrentAuth();
  if (!dbUser) notFound();

  const project = await prisma.project.findFirst({
    where: { id, tenantId },
    include: { xrAssets: true },
  });
  if (!project) notFound();
  if (role === 'CLIENT' && project.clientId !== dbUser.id) notFound();

  const glbUrl = project.xrAssets.find((a) => a.type === 'model3d')?.glbUrl ?? null;

  const tabs = [
    { href: `/client/projects/${id}/annotations`, label: 'Annotations', icon: Pin },
    { href: `/client/projects/${id}/comments`, label: 'Comments', icon: MessageSquare },
    { href: `/client/projects/${id}/approvals`, label: 'Approvals', icon: CheckSquare },
    { href: `/client/projects/${id}/deliverables`, label: 'Deliverables', icon: Download },
    { href: `/client/projects/${id}/versions`, label: 'Versions', icon: History },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">{project.name}</h1>
          {project.description && <p className="text-sm text-gray-400 mt-1">{project.description}</p>}
        </div>
        {project.publishedUrl && (
          <a href={project.publishedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan text-sm font-medium hover:bg-cyan/20">
            <ExternalLink className="w-4 h-4" /> View live
          </a>
        )}
      </div>

      <ProjectViewer glbUrl={glbUrl} />

      <nav className="flex flex-wrap gap-2">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-800 bg-surface text-sm text-gray-300 hover:border-cyan/50 hover:text-white transition-colors">
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/client-portal/ProjectViewer.tsx "app/(client-portal)/client/projects/[id]/page.tsx"
git commit -m "feat(portal): project detail page with Babylon viewer"
```

---

### Task 11: Annotation UI (pin + thread + form)

**Files:**
- Create: `components/client-portal/AnnotationPin.tsx`
- Create: `components/client-portal/AnnotationThread.tsx`
- Create: `components/client-portal/AnnotationForm.tsx`
- Create: `app/(client-portal)/client/projects/[id]/annotations/page.tsx`

**Interfaces:**
- Consumes: `/api/annotations` GET/POST, `/api/annotations/[id]` PATCH
- Produces: create/resolve annotation UI with list + form

- [ ] **Step 1: AnnotationPin**

`components/client-portal/AnnotationPin.tsx`:

```tsx
'use client';

import { cn } from '@/lib/utils';

interface AnnotationPinProps {
  resolved: boolean;
  onToggle?: () => void;
  active?: boolean;
}

export function AnnotationPin({ resolved, onToggle, active }: AnnotationPinProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 shadow-lg transition-transform',
        resolved ? 'bg-green-500 border-green-300' : 'bg-cyan border-cyan/50',
        active ? 'scale-125' : 'hover:scale-110'
      )}
      aria-label={resolved ? 'Resolved annotation' : 'Open annotation'}
    >
      {resolved ? '✓' : '!'}
    </button>
  );
}
```

- [ ] **Step 2: AnnotationForm**

`components/client-portal/AnnotationForm.tsx`:

```tsx
'use client';

import { useState } from 'react';

interface AnnotationFormProps {
  projectId: string;
  onCreated: () => void;
}

export function AnnotationForm({ projectId, onCreated }: AnnotationFormProps) {
  const [content, setContent] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, position, content }),
      });
      if (res.ok) {
        setContent('');
        onCreated();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl border border-gray-800 bg-surface">
      <h3 className="text-sm font-medium text-white">Add annotation</h3>
      <div className="flex gap-2">
        <label className="flex-1 text-xs text-gray-400">
          X
          <input type="number" value={position.x} onChange={(e) => setPosition({ ...position, x: Number(e.target.value) })} className="w-full mt-1 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white" />
        </label>
        <label className="flex-1 text-xs text-gray-400">
          Y
          <input type="number" value={position.y} onChange={(e) => setPosition({ ...position, y: Number(e.target.value) })} className="w-full mt-1 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white" />
        </label>
        <label className="flex-1 text-xs text-gray-400">
          Z
          <input type="number" value={position.z} onChange={(e) => setPosition({ ...position, z: Number(e.target.value) })} className="w-full mt-1 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white" />
        </label>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Describe the issue…"
        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
        rows={3}
      />
      <button
        onClick={submit}
        disabled={saving || !content.trim()}
        className="px-4 py-2 bg-cyan text-bg rounded-lg font-semibold text-sm hover:bg-cyan/90 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Add annotation'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: AnnotationThread**

`components/client-portal/AnnotationThread.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { AnnotationPin } from './AnnotationPin';

export interface AnnotationRow {
  id: string;
  content: string;
  position: { x: number; y: number; z?: number };
  resolved: boolean;
  createdAt: string;
}

interface AnnotationThreadProps {
  annotations: AnnotationRow[];
  onResolve: (id: string) => Promise<void>;
}

export function AnnotationThread({ annotations, onResolve }: AnnotationThreadProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <ul className="space-y-2">
      {annotations.map((a) => (
        <li key={a.id} className={`p-4 rounded-xl border bg-surface ${activeId === a.id ? 'border-cyan' : 'border-gray-800'}`}>
          <div className="flex items-center gap-3">
            <AnnotationPin resolved={a.resolved} active={activeId === a.id} onToggle={() => setActiveId(activeId === a.id ? null : a.id)} />
            <div className="flex-1">
              <p className="text-sm text-white">{a.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                Position ({a.position.x}, {a.position.y}{a.position.z != null ? `, ${a.position.z}` : ''}) · {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
            {!a.resolved && (
              <button
                onClick={() => onResolve(a.id)}
                className="px-3 py-1.5 text-xs text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10"
              >
                Resolve
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Annotations page**

`app/(client-portal)/client/projects/[id]/annotations/page.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AnnotationForm } from '@/components/client-portal/AnnotationForm';
import { AnnotationThread, type AnnotationRow } from '@/components/client-portal/AnnotationThread';

export default function AnnotationsPage() {
  const params = useParams<{ id: string }>();
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/annotations?projectId=${params.id}`);
    const body = await res.json();
    setAnnotations(body.annotations ?? []);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = useCallback(
    async (id: string) => {
      await fetch(`/api/annotations/${id}`, { method: 'PATCH' });
      load();
    },
    [load]
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-white">Annotations</h1>
      <AnnotationForm projectId={params.id} onCreated={load} />
      <AnnotationThread annotations={annotations} onResolve={resolve} />
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add components/client-portal/AnnotationPin.tsx components/client-portal/AnnotationThread.tsx components/client-portal/AnnotationForm.tsx "app/(client-portal)/client/projects/[id]/annotations/page.tsx"
git commit -m "feat(portal): annotation UI"
```

---

### Task 12: Comments UI

**Files:**
- Create: `components/client-portal/CommentThread.tsx`
- Create: `app/(client-portal)/client/projects/[id]/comments/page.tsx`

**Interfaces:**
- Consumes: `/api/projects/[id]/comments` GET, `/api/comments` POST
- Produces: threaded comment list with @mention composer

- [ ] **Step 1: CommentThread**

`components/client-portal/CommentThread.tsx`:

```tsx
'use client';

import { useState } from 'react';

export interface CommentRow {
  id: string;
  content: string;
  parentId: string | null;
  mentions: string[];
  createdAt: string;
  replies: CommentRow[];
}

interface CommentThreadProps {
  comments: CommentRow[];
  onReply: (parentId: string, content: string) => Promise<void>;
}

export function CommentThread({ comments, onReply }: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const renderComment = (c: CommentRow, depth: number) => (
    <li key={c.id} className={depth > 0 ? 'ml-8 mt-3' : ''}>
      <div className="p-4 rounded-xl border border-gray-800 bg-surface">
        <p className="text-sm text-white">{c.content}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
          {c.mentions.length > 0 && (
            <span className="text-xs text-cyan">{c.mentions.map((m) => `@${m}`).join(' ')}</span>
          )}
          <button onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setDraft(''); }} className="text-xs text-gray-400 hover:text-white">
            Reply
          </button>
        </div>
        {replyingTo === c.id && (
          <div className="mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a reply… (use @name to mention)"
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
            />
            <button
              onClick={async () => {
                await onReply(c.id, draft);
                setReplyingTo(null);
                setDraft('');
              }}
              disabled={!draft.trim()}
              className="px-3 py-2 bg-cyan text-bg rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        )}
      </div>
      {c.replies.length > 0 && <ul className="space-y-3">{c.replies.map((r) => renderComment(r, depth + 1))}</ul>}
    </li>
  );

  return <ul className="space-y-3">{comments.map((c) => renderComment(c, 0))}</ul>;
}
```

- [ ] **Step 2: Comments page**

`app/(client-portal)/client/projects/[id]/comments/page.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CommentThread, type CommentRow } from '@/components/client-portal/CommentThread';

export default function CommentsPage() {
  const params = useParams<{ id: string }>();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${params.id}/comments`);
    const body = await res.json();
    setComments(body.comments ?? []);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: params.id, content: draft }),
      });
      if (res.ok) {
        setDraft('');
        load();
      }
    } finally {
      setSending(false);
    }
  };

  const reply = useCallback(
    async (parentId: string, content: string) => {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: params.id, content, parentId }),
      });
      load();
    },
    [params.id, load]
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-white">Comments</h1>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Leave a comment… (use @name to mention)"
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
        />
        <button
          onClick={create}
          disabled={sending || !draft.trim()}
          className="px-4 py-2 bg-cyan text-bg rounded-lg font-semibold text-sm disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Comment'}
        </button>
      </div>
      <CommentThread comments={comments} onReply={reply} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/client-portal/CommentThread.tsx "app/(client-portal)/client/projects/[id]/comments/page.tsx"
git commit -m "feat(portal): threaded comments UI"
```

---

### Task 13: Approvals UI

**Files:**
- Create: `components/client-portal/ApprovalWorkflow.tsx`
- Create: `app/(client-portal)/client/projects/[id]/approvals/page.tsx`

**Interfaces:**
- Consumes: `/api/approvals` GET/POST, `/api/approvals/[id]` PUT
- Produces: request (client) + approve/reject with notes (staff) UI

- [ ] **Step 1: ApprovalWorkflow**

`components/client-portal/ApprovalWorkflow.tsx`:

```tsx
'use client';

import { useState } from 'react';

export interface ApprovalRow {
  id: string;
  projectId: string;
  requesterId: string;
  approverId: string | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  createdAt: string;
}

interface ApprovalWorkflowProps {
  approvals: ApprovalRow[];
  canManage: boolean;
  onRequest: (notes: string) => Promise<void>;
  onUpdate: (id: string, status: 'approved' | 'rejected', notes: string) => Promise<void>;
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-400/10 text-amber-400',
  approved: 'bg-green-400/10 text-green-400',
  rejected: 'bg-red-400/10 text-red-400',
};

export function ApprovalWorkflow({ approvals, canManage, onRequest, onUpdate }: ApprovalWorkflowProps) {
  const [notes, setNotes] = useState('');
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-gray-800 bg-surface space-y-3">
        <h3 className="text-sm font-medium text-white">Request approval</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What needs approval?"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
          rows={3}
        />
        <button
          onClick={() => { onRequest(notes); setNotes(''); }}
          disabled={!notes.trim()}
          className="px-4 py-2 bg-cyan text-bg rounded-lg font-semibold text-sm disabled:opacity-50"
        >
          Submit request
        </button>
      </div>

      <ul className="space-y-2">
        {approvals.map((a) => (
          <li key={a.id} className="p-4 rounded-xl border border-gray-800 bg-surface">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 text-xs rounded ${STATUS_STYLE[a.status]}`}>{a.status}</span>
              <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
            {a.notes && <p className="mt-2 text-sm text-gray-300">{a.notes}</p>}
            {canManage && a.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <input
                  value={decisionNotes[a.id] ?? ''}
                  onChange={(e) => setDecisionNotes({ ...decisionNotes, [a.id]: e.target.value })}
                  placeholder="Decision notes…"
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                />
                <button
                  onClick={() => onUpdate(a.id, 'approved', decisionNotes[a.id] ?? '')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"
                >
                  Approve
                </button>
                <button
                  onClick={() => onUpdate(a.id, 'rejected', decisionNotes[a.id] ?? '')}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
                >
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Approvals page**

`app/(client-portal)/client/projects/[id]/approvals/page.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ApprovalWorkflow, type ApprovalRow } from '@/components/client-portal/ApprovalWorkflow';

export default function ApprovalsPage() {
  const params = useParams<{ id: string }>();
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/approvals?projectId=${params.id}`);
    const body = await res.json();
    setApprovals(body.approvals ?? []);
    const me = await fetch('/api/client/portals').then((r) => r.json()).catch(() => ({ role: 'CLIENT' }));
    setCanManage((me.role as string) === 'ADMIN' || (me.role as string) === 'SUPER_ADMIN');
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const request = useCallback(
    async (notes: string) => {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: params.id, notes }),
      });
      load();
    },
    [params.id, load]
  );

  const update = useCallback(
    async (id: string, status: 'approved' | 'rejected', notes: string) => {
      await fetch(`/api/approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      load();
    },
    [load]
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-white">Approvals</h1>
      <ApprovalWorkflow approvals={approvals} canManage={canManage} onRequest={request} onUpdate={update} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/client-portal/ApprovalWorkflow.tsx "app/(client-portal)/client/projects/[id]/approvals/page.tsx"
git commit -m "feat(portal): approval workflow UI"
```

---

### Task 14: Deliverables UI

**Files:**
- Create: `components/client-portal/DeliverableDownloader.tsx`
- Create: `app/(client-portal)/client/projects/[id]/deliverables/page.tsx`

**Interfaces:**
- Consumes: `/api/projects/[id]/deliverables` GET, `/api/deliverables/[id]/download` POST
- Produces: download manager with password prompt + expiry-aware list

- [ ] **Step 1: DeliverableDownloader**

`components/client-portal/DeliverableDownloader.tsx`:

```tsx
'use client';

import { useState } from 'react';

export interface DeliverableRow {
  id: string;
  name: string;
  type: string;
  password: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface DeliverableDownloaderProps {
  deliverables: DeliverableRow[];
  onDownload: (id: string, password?: string) => Promise<{ url: string } | { error: string }>;
}

export function DeliverableDownloader({ deliverables, onDownload }: DeliverableDownloaderProps) {
  const [password, setPassword] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});

  const download = async (d: DeliverableRow) => {
    const result = await onDownload(d.id, password[d.id]);
    if ('error' in result) {
      setError({ ...error, [d.id]: result.error });
      return;
    }
    window.open(result.url, '_blank');
  };

  return (
    <ul className="space-y-2">
      {deliverables.map((d) => {
        const expired = d.expiresAt ? new Date(d.expiresAt).getTime() < Date.now() : false;
        return (
          <li key={d.id} className="p-4 rounded-xl border border-gray-800 bg-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{d.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {d.type}
                  {d.expiresAt && !expired && ` · expires ${new Date(d.expiresAt).toLocaleDateString()}`}
                  {expired && ' · expired'}
                </p>
              </div>
              {!expired && (
                <div className="flex gap-2">
                  {d.password && (
                    <input
                      type="password"
                      value={password[d.id] ?? ''}
                      onChange={(e) => setPassword({ ...password, [d.id]: e.target.value })}
                      placeholder="Password"
                      className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                    />
                  )}
                  <button
                    onClick={() => download(d)}
                    className="px-4 py-1.5 bg-cyan text-bg rounded-lg text-sm font-semibold hover:bg-cyan/90"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>
            {error[d.id] && <p className="mt-2 text-xs text-red-400">{error[d.id]}</p>}
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 2: Deliverables page**

`app/(client-portal)/client/projects/[id]/deliverables/page.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DeliverableDownloader, type DeliverableRow } from '@/components/client-portal/DeliverableDownloader';

export default function DeliverablesPage() {
  const params = useParams<{ id: string }>();
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${params.id}/deliverables`);
    const body = await res.json();
    setDeliverables(body.deliverables ?? []);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const download = useCallback(
    async (id: string, password?: string) => {
      const res = await fetch(`/api/deliverables/${id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (!res.ok) return { error: body.error ?? 'Download failed' };
      return { url: body.url as string };
    },
    []
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-white">Deliverables</h1>
      <DeliverableDownloader deliverables={deliverables} onDownload={download} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/client-portal/DeliverableDownloader.tsx "app/(client-portal)/client/projects/[id]/deliverables/page.tsx"
git commit -m "feat(portal): deliverables download UI"
```

---

### Task 15: Versions UI

**Files:**
- Create: `components/client-portal/VersionHistory.tsx`
- Create: `app/(client-portal)/client/projects/[id]/versions/page.tsx`

**Interfaces:**
- Consumes: `/api/projects/[id]/versions` GET
- Produces: append-only version list with `changes` summary

- [ ] **Step 1: VersionHistory**

`components/client-portal/VersionHistory.tsx`:

```tsx
'use client';

export interface VersionRow {
  id: string;
  version: string;
  changes: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}

interface VersionHistoryProps {
  versions: VersionRow[];
}

export function VersionHistory({ versions }: VersionHistoryProps) {
  return (
    <ol className="relative border-l border-gray-800 ml-3 space-y-6">
      {versions.map((v) => (
        <li key={v.id} className="ml-6">
          <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-cyan" />
          <div className="p-4 rounded-xl border border-gray-800 bg-surface">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">{v.version}</h3>
              <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</span>
            </div>
            <pre className="mt-2 text-xs text-gray-400 bg-gray-900 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(v.changes, null, 2)}
            </pre>
          </div>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 2: Versions page**

`app/(client-portal)/client/projects/[id]/versions/page.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { VersionHistory, type VersionRow } from '@/components/client-portal/VersionHistory';

export default function VersionsPage() {
  const params = useParams<{ id: string }>();
  const [versions, setVersions] = useState<VersionRow[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${params.id}/versions`);
    const body = await res.json();
    setVersions(body.versions ?? []);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-white">Version History</h1>
      <VersionHistory versions={versions} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/client-portal/VersionHistory.tsx "app/(client-portal)/client/projects/[id]/versions/page.tsx"
git commit -m "feat(portal): version history UI"
```

---

### Task 16: End-to-end verification

- [ ] **Step 1: Full static checks**

Run: `npx prisma validate`, `npx tsc --noEmit --incremental false`, `pnpm lint`, `npx vitest run lib/server/client-portal lib/auth/session.test.ts`
Expected: all pass.

Run: `pnpm build`
Expected: success.

- [ ] **Step 2: Runtime smoke via `pnpm dev`**

With a seeded CLIENT user whose `tenantId` matches a project whose `clientId = <that user id>`:
1. `GET /client` → dashboard shows only that project.
2. `POST /api/annotations` `{ projectId, position: {x:0,y:0,z:0}, content: "check lighting" }` → 201.
3. `POST /api/comments` `{ projectId, content: "@alice please review" }` → 201 with `mentions: ["alice"]`.
4. `POST /api/approvals` `{ projectId, notes: "approve v2" }` → 201 `status: pending`.
5. As ADMIN: `PUT /api/approvals/<id>` `{ status: "approved", notes: "ok" }` → 200.
6. `POST /api/deliverables` (ADMIN) → 201.
7. `GET /api/projects/<id>/deliverables` → lists it.
8. `POST /api/deliverables/<id>/download` `{}` → `{ url }` presigned.

Confirm rows in Supabase: `SELECT count(*) FROM annotations; SELECT count(*) FROM comments; SELECT count(*) FROM approval_workflows; SELECT count(*) FROM deliverables; SELECT count(*) FROM project_versions;`

- [ ] **Step 3: Final commit of verification fixes**

If any task surfaced fixes, commit them:
```bash
git add -A
git commit -m "fix(portal): verification fixes"
```

---

## Self-Review

- **Spec coverage:** RBAC (§4) → Task 2; services (§5) → Tasks 3-7; routes (§6) → Task 8; portal shell + dashboard → Task 9; viewer + detail → Task 10; annotation UI → Task 11; comments UI → Task 12; approvals UI → Task 13; deliverables UI → Task 14; versions UI → Task 15; migration + RLS (§§9-10) → Task 1; verification (§11) → Task 16.
- **Placeholder scan:** no TBD/TODO; every code step has full implementations.
- **Type consistency:** `createAnnotation(projectId, { position, content })`, `createComment(projectId, { content, parentId })`, `requestApproval(projectId, notes)`, `updateApprovalStatus(id, status, notes)`, `createDeliverable(projectId, input)`, `createVersionSnapshot(projectId, input)` — names/signatures match between service tasks and API route tasks. `mapAnnotation`/`mapComment`/`mapApproval`/`mapDeliverable`/`mapVersion` used consistently. Permission strings (`client.portals.read`, `collab.annotate`, `collab.comment`, `approvals.request`, `approvals.manage`) match the Task 2 union exactly.
- **RBAC correctness:** `approvals.manage` used only by `createDeliverable` + `updateApprovalStatus` (both staff); CLIENT paths use `client.portals.read` / `collab.*` / `approvals.request`. The approvals page (Task 13) reads `role` from the `/api/client/portals` response, which Task 8 returns — wired consistently.