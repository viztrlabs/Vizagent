# T-043 — QA Checklist Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An automated, queued QA pass (5 checks incl. headless Babylon GLB validation) that gates publishing.

**Architecture:** A `qa` BullMQ queue + worker (mirroring T-036) runs 5 check functions in `lib/server/qa/qa-engine.ts` against a project's `Asset` rows (T-041) + `Project` row, writes a `QAReport`, and flips `project.status` to `qa_passed`/`qa_failed`.

**Tech Stack:** Next.js 16, TypeScript, Prisma + PostgreSQL, BullMQ + Upstash Redis, @babylonjs/core (NullEngine headless), Jest.

## Global Constraints

- Headless rendering uses `BABYLON.NullEngine` + `SceneLoader` (no DOM/canvas needed).
- All worker DB ops wrapped in `withTenant(prisma, tenantId, fn)` for RLS.
- QAReport.qaStatus ∈ pending|running|passed|failed; Project.status ∈ draft|uploaded|qa_pending|qa_passed|published.
- 500 MB max asset size; GLB loadability validated via full NullEngine render.

---

### Task 1: QA engine — pure checks (1–4)

**Files:**
- Create: `lib/server/qa/qa-engine.ts`
- Create: `lib/server/qa/qa-engine.test.ts`

**Interfaces:**
- Consumes: `Asset` (type), `Project` (type), `CompletedPart`-style asset list from `AssetRepository.findByProject`.
- Produces: `runChecks(checks: { projectId, tenantId, assets, project }): QACheckResult[]` where each result `{ name, status: 'pass'|'fail'|'warning', message }`. Exports individual check constants: `REQUIRED_PANORAMA`, `NAMING_CONVENTION`, `SIZE_LIMIT`, `METADATA_COMPLETE`, plus `GLB_LOADABLE` (delegated).

`lib/server/qa/qa-engine.ts` (check 1–4):

```typescript
import type { Asset, Project, QACheck } from '@/lib/types';
import { MAX_FILE_SIZE } from '@/lib/validations';

export const REQUIRED_PANORAMA = 'required-panorama-present';
export const NAMING_CONVENTION = 'naming-convention';
export const SIZE_LIMIT = 'size-under-limit';
export const METADATA_COMPLETE = 'metadata-complete';
export const GLB_LOADABLE = 'glb-loadable';

const NAME_RE = /^[a-z0-9-]+\.(jpg|jpeg|png|glb|gltf|usdz|zip)$/i;
const PANORAMA_RE = /\.(jpg|jpeg|png)$/i;

export function checkRequiredPanorama(assets: Asset[]): QACheck {
  const hasPanorama = assets.some((a) => PANORAMA_RE.test(a.fileName));
  return {
    name: REQUIRED_PANORAMA,
    status: hasPanorama ? 'pass' : 'fail',
    message: hasPanorama
      ? 'At least one 360 panorama (JPG/PNG) is present'
      : 'No panorama asset (JPG/PNG) found',
  };
}

export function checkNaming(assets: Asset[]): QACheck {
  const offenders = assets.filter((a) => !NAME_RE.test(a.fileName)).map((a) => a.fileName);
  return {
    name: NAMING_CONVENTION,
    status: offenders.length ? 'fail' : 'pass',
    message: offenders.length ? `Invalid filenames: ${offenders.join(', ')}` : 'All filenames follow convention',
  };
}

export function checkSizeLimit(assets: Asset[]): QACheck {
  const over = assets.filter((a) => Number(a.fileSize) > MAX_FILE_SIZE).map((a) => a.fileName);
  return {
    name: SIZE_LIMIT,
    status: over.length ? 'fail' : 'pass',
    message: over.length ? `Files over 500 MB: ${over.join(', ')}` : 'All assets within size limit',
  };
}

export function checkMetadata(project: Project): QACheck {
  const missing: string[] = [];
  if (!project.name.trim()) missing.push('name');
  if (!project.description) missing.push('description');
  if (!project.clientId) missing.push('clientId');
  return {
    name: METADATA_COMPLETE,
    status: missing.length ? 'fail' : 'pass',
    message: missing.length ? `Missing: ${missing.join(', ')}` : 'Project metadata complete',
  };
}
```

`lib/server/qa/qa-engine.test.ts`:

```typescript
import { checkNaming, checkSizeLimit, checkMetadata } from './qa-engine';

describe('qa-engine checks', () => {
  it('checkNaming rejects bad filenames', () => {
    const res = checkNaming([{ fileName: 'My Photo.JPG' }, { fileName: 'ok-1.glb' }]);
    expect(res.status).toBe('fail');
    expect(res.message).toMatch(/My Photo.JPG/);
  });

  it('checkNaming passes valid names', () => {
    expect(checkNaming([{ fileName: 'pano-1.jpg' }, { fileName: 'model.glb' }]).status).toBe('pass');
  });

  it('checkSizeLimit flags over-500MB', () => {
    const over = { fileName: 'big.glb', fileSize: 600 * 1024 * 1024 };
    expect(checkSizeLimit([over]).status).toBe('fail');
    expect(checkSizeLimit([{ fileName: 'ok.glb', fileSize: 10 }]).status).toBe('pass');
  });

  it('checkMetadata flags missing fields', () => {
    const incomplete = { name: '', description: null, clientId: '' } as any;
    expect(checkMetadata(incomplete).status).toBe('fail');
  });
});
```

- [ ] Write qa-engine.ts (checks 1–4)
- [ ] Write qa-engine.test.ts
- [ ] `pnpm test lib/server/qa/qa-engine.test.ts` — PASS
- [ ] Commit: `feat: QA engine pure checks (checks 1-4) + tests (T-043)`

### Task 2: GLB loadable check (Babylon NullEngine)

**Files:**
- Modify: `lib/server/qa/qa-engine.ts` (add `checkGlbLoadable`)
- Modify: `lib/server/qa/qa-engine.test.ts` (mock BABYLON)

Exports an injectable loader so jest can mock it:

```typescript
export type GlbLoader = (url: string, signal?: AbortSignal) => Promise<void>;

export async function checkGlbLoadable(
  assets: Asset[],
  loadGlb: GlbLoader,
  urlFor: (asset: Asset) => string
): Promise<QACheck> {
  const glbs = assets.filter((a) => /\.glb$/i.test(a.fileName));
  if (!glbs.length) return { name: GLB_LOADABLE, status: 'pass', message: 'No GLB assets to validate' };
  const failed: string[] = [];
  for (const glb of glbs) {
    try {
      await loadGlb(urlFor(glb));
    } catch {
      failed.push(glb.fileName);
    }
  }
  return {
    name: GLB_LOADABLE,
    status: failed.length ? 'fail' : 'pass',
    message: failed.length ? `GLB load failed: ${failed.join(', ')}` : `${glbs.length} GLB asset(s) loaded`,
  };
}
```

Concrete loader (in the worker, not tested in jest): `lib/server/qa/glb-loader.server.ts`:

```typescript
import { NullEngine, Scene } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

export async function loadGlbHeadless(glslUrl: string): Promise<void> {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    await SceneLoader.AppendAsync(glslUrl, undefined, scene);
  } finally {
    scene.dispose();
    engine.dispose();
  }
}
```

> NOTE: `SceneLoader.AppendAsync` needs an accessible URL or data URI/ArrayBuffer. Since assets are in a private R2 bucket, the worker uses the signed read URL (1–24h expiry) so BABYLON fetches directly. If signed URL can't be used by the headless loader (CORS / time), fall back to fetching bytes in-node and loading via `SceneLoader.ImportMesh` from an `ArrayBuffer`. Decision deferred to implementation; prefer signed URL, fallback to bytes.

- [ ] Add checkGlbLoadable (injectable loader)
- [ ] Add mock-based test for checkGlbLoadable
- [ ] Create glb-loader.server.ts
- [ ] Commit: `feat: GLB loadable check with NullEngine loader (T-043)`

### Task 3: QA repository + startQA

**Files:**
- Create: `lib/server/repositories/qa.repository.ts`

```typescript
import { prisma } from '@/lib/db/server';
import { QACheck } from '@/lib/types';

export class QARepository {
  async createReport(projectId: string, tenantId: string, checks: QACheck[], issues: string[]) {
    return prisma.qaReport.create({
      data: {
        projectId,
        qaStatus: 'running',
        checks: JSON.stringify(checks),
        issues: JSON.stringify(issues),
        checkedAt: null,
        tenantId,
        project: { connect: { id: projectId } },
      },
    });
  }

  async updateReport(id: string, data: { qaStatus: string; checks: QACheck[]; issues: string[]; checkedAt: Date }) {
    return prisma.qaReport.update({ where: { id }, data });
  }

  async startQA(projectId: string, tenantId: string) {
    const report = await prisma.qaReport.create({
      data: {
        projectId,
        qaStatus: 'running',
        checks: '[]',
        issues: '[]',
        tenantId,
        project: { connect: { id: projectId } },
      },
    });
    await prisma.project.update({ where: { id: projectId, tenantId }, data: { status: 'qa_pending' } });
    return report;
  }

  async setProjectStatus(projectId: string, status: string, tenantId: string) {
    return prisma.project.update({ where: { id: projectId, tenantId }, data: { status } });
  }
}
```

- [ ] Write qa.repository.ts
- [ ] Commit: `feat: QARepository + startQA (T-043)`

### Task 4: QA queue + worker

**Files:**
- Create: `lib/server/queues/qa.queue.ts` (mirrors session-reminder.queue.ts)
- Create: `lib/server/workers/qa.worker.ts`

Worker job (`qa-run`): load Project + Assets (tenant-scoped via withTenant), run checks, write QAReport, flip project status. Imports `loadGlbHeadless` from `glb-loader.server.ts`.

- [ ] qa.queue.ts
- [ ] qa.worker.ts (orchestrates checks 1–5 + status flip)
- [ ] Typecheck passes
- [ ] Commit: `feat: QA queue + worker (runs 5 checks, flips status) (T-043)`

### Task 5: QA API route

**Files:**
- Create: `app/api/qa/route.ts`

POST `/api/qa/run` body `{ projectId }` → `getTenantId()`, `QARepository.startQA(projectId, tenantId)`, enqueue `qa-run` job, return report id + status `running`.
GET `/api/qa?project_id=` → return the latest QAReport for the project.

Uses `getTenantId()` + `withTenant()` + existing `getSessionReminderQueue`-style queue getter (`getQaQueue`).

- [ ] Write app/api/qa/route.ts
- [ ] Typecheck passes
- [ ] Commit: `feat: POST/GET /api/qa routes (T-043)`

### Task 6: Smoke build + TODO + push

- [ ] `pnpm build` ✓
- [ ] `pnpm typecheck` ✓
- [ ] `pnpm test` ✓
- [ ] Update TODO.md T-043 → done, commit
- [ ] Push

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-08-t043-qa-checklist.md`.

Two execution options:
1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute in this session using executing-plans, batch with checkpoints

(Continuing inline in this session.)</think><tool_call>write<arg_key>content</arg_key><arg_value># T-043 — QA Checklist Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An automated, queued QA pass (5 checks incl. headless Babylon GLB validation) that gates publishing.

**Architecture:** A `qa` BullMQ queue + worker (mirroring T-036) runs 5 check functions in `lib/server/qa/qa-engine.ts` against a project's `Asset` rows (T-041) + `Project` row, writes a `QAReport`, and flips `project.status` to `qa_passed`/`qa_failed`.

**Tech Stack:** Next.js 16, TypeScript, Prisma + PostgreSQL, BullMQ + Upstash Redis, @babylonjs/core (NullEngine headless), Jest.

## Global Constraints

- Headless rendering uses `BABYLON.NullEngine` + `SceneLoader` (no DOM/canvas needed).
- All worker DB ops wrapped in `withTenant(prisma, tenantId, fn)` for RLS.
- QAReport.qaStatus ∈ pending|running|passed|failed; Project.status ∈ draft|uploaded|qa_pending|qa_passed|published.
- 500 MB max asset size; GLB loadability validated via full NullEngine render.

---

### Task 1: QA engine — pure checks (1–4)

**Files:**
- Create: `lib/server/qa/qa-engine.ts`
- Create: `lib/server/qa/qa-engine.test.ts`

**Interfaces:**
- Consumes: `Asset`, `Project`, `QACheck` (types from `lib/types`); `MAX_FILE_SIZE` from `lib/validations`.
- Produces: `checkRequiredPanorama`, `checkNaming`, `checkSizeLimit`, `checkMetadata` (each `-> QACheck`), plus exported check-name constants.

```typescript
import type { Asset, Project, QACheck } from '@/lib/types';
import { MAX_FILE_SIZE } from '@/lib/validations';

export const REQUIRED_PANORAMA = 'required-panorama-present';
export const NAMING_CONVENTION = 'naming-convention';
export const SIZE_LIMIT = 'size-under-limit';
export const METADATA_COMPLETE = 'metadata-complete';
export const GLB_LOADABLE = 'glb-loadable';

const NAME_RE = /^[a-z0-9-]+\.(jpg|jpeg|png|glb|gltf|usdz|zip)$/i;
const PANORAMA_RE = /\.(jpg|jpeg|png)$/i;

export function checkRequiredPanorama(assets: { fileName: string }[]): QACheck {
  const hasPanorama = assets.some((a) => PANORAMA_RE.test(a.fileName));
  return {
    name: REQUIRED_PANORAMA,
    status: hasPanorama ? 'pass' : 'fail',
    message: hasPanorama
      ? 'At least one 360 panorama (JPG/PNG) is present'
      : 'No panorama asset (JPG/PNG) found',
  };
}

export function checkNaming(assets: { fileName: string }[]): QACheck {
  const offenders = assets.filter((a) => !NAME_RE.test(a.fileName)).map((a) => a.fileName);
  return {
    name: NAMING_CONVENTION,
    status: offenders.length ? 'fail' : 'pass',
    message: offenders.length ? `Invalid filenames: ${offenders.join(', ')}` : 'All filenames follow convention',
  };
}

export function checkSizeLimit(assets: { fileName: string; fileSize: number | bigint }[]): QACheck {
  const over = assets
    .filter((a) => Number(a.fileSize) > MAX_FILE_SIZE)
    .map((a) => a.fileName);
  return {
    name: SIZE_LIMIT,
    status: over.length ? 'fail' : 'pass',
    message: over.length ? `Files over 500 MB: ${over.join(', ')}` : 'All assets within size limit',
  };
}

export function checkMetadata(project: { name: string; description: string | null; clientId: string }): QACheck {
  const missing: string[] = [];
  if (!project.name || !project.name.trim()) missing.push('name');
  if (!project.description) missing.push('description');
  if (!project.clientId) missing.push('clientId');
  return {
    name: METADATA_COMPLETE,
    status: missing.length ? 'fail' : 'pass',
    message: missing.length ? `Missing: ${missing.join(', ')}` : 'Project metadata complete',
  };
}
```

Test (`lib/server/qa/qa-engine.test.ts`):

```typescript
import { checkNaming, checkSizeLimit, checkMetadata } from './qa-engine';

describe('qa-engine checks', () => {
  it('checkNaming rejects bad filenames', () => {
    const res = checkNaming([{ fileName: 'My Photo.JPG' }, { fileName: 'ok-1.glb' }]);
    expect(res.status).toBe('fail');
    expect(res.message).toMatch(/My Photo.JPG/);
  });
  it('checkNaming passes valid names', () => {
    expect(checkNaming([{ fileName: 'pano-1.jpg' }, { fileName: 'model.glb' }]).status).toBe('pass');
  });
  it('checkSizeLimit flags over-500MB', () => {
    expect(checkSizeLimit([{ fileName: 'big.glb', fileSize: 600n * 1024n * 1024n }]).status).toBe('fail');
    expect(checkSizeLimit([{ fileName: 'ok.glb', fileSize: 10 }]).status).toBe('pass');
  });
  it('checkMetadata flags missing fields', () => {
    expect(checkMetadata({ name: '', description: null, clientId: '' }).status).toBe('fail');
    expect(checkMetadata({ name: 'P1', description: 'd', clientId: 'c1' }).status).toBe('pass');
  });
});
```

- [ ] Write qa-engine.ts (checks 1–4)
- [ ] Write qa-engine.test.ts
- [ ] `pnpm test lib/server/qa/qa-engine.test.ts` — PASS
- [ ] Commit: `feat: QA engine pure checks (1-4) + tests (T-043)`

### Task 2: GLB loadable check (Babylon NullEngine)

**Files:**
- Modify: `lib/server/qa/qa-engine.ts` (add `checkGlbLoadable`)
- Modify: `lib/server/qa/qa-engine.test.ts`
- Create: `lib/server/qa/glb-loader.server.ts`

Exports an injectable loader so jest can mock it:

```typescript
export type GlbLoader = (url: string) => Promise<void>;

export async function checkGlbLoadable(
  assets: { fileName: string }[],
  urlFor: (a: { fileName: string }) => string,
  loadGlb: GlbLoader
): Promise<QACheck> {
  const glbs = assets.filter((a) => /\.glb$/i.test(a.fileName));
  if (!glbs.length) {
    return { name: GLB_LOADABLE, status: 'pass', message: 'No GLB assets to validate' };
  }
  const failed: string[] = [];
  for (const glb of glbs) {
    try { await loadGlb(urlFor(glb)); } catch { failed.push(glb.fileName); }
  }
  return {
    name: GLB_LOADABLE,
    status: failed.length ? 'fail' : 'pass',
    message: failed.length ? `GLB load failed: ${failed.join(', ')}` : `${glbs.length} GLB asset(s) loaded`,
  };
}
```

`glb-loader.server.ts` (headless render, Node-only):

```typescript
import { NullEngine, Scene } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

export async function loadGlbHeadless(glbUrl: string): Promise<void> {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    await SceneLoader.AppendAsync(glbUrl, undefined, scene);
  } finally {
    scene.dispose();
    engine.dispose();
  }
}
```

> If the private signed read URL can't be fetched by BABYLON (CORS), fall back to fetching bytes in-node then `SceneLoader.ImportMesh(nil, scene, [data])`. Use signed URL first (simple); bytes fallback if needed.

Test (mock BABYLON via jest.mock on `@babylonjs/core` path only for check function): test checkGlbLoadable passes on a mocked loader.

- [ ] Add checkGlbLoadable + mock test
- [ ] Create glb-loader.server.ts
- [ ] Commit: `feat: GLB loadable check + NullEngine loader (T-043)`

### Task 3: QA repository + startQA

**Files:**
- Create: `lib/server/repositories/qa.repository.ts`

```typescript
import { prisma } from '@/lib/db/server';
import type { QACheck } from '@/lib/types';

export class QARepository {
  async startQA(projectId: string, tenantId: string) {
    const report = await prisma.qaReport.create({
      data: {
        projectId,
        qaStatus: 'running',
        checks: [],
        issues: [],
        tenantId,
        project: { connect: { id: projectId } },
      },
    });
    await prisma.project.update({
      where: { id: projectId, tenantId },
      data: { status: 'qa_pending' },
    });
    return report;
  }

  async setReport(id: string, qaStatus: string, checks: QACheck[], issues: string[], checkedAt: Date) {
    return prisma.qaReport.update({
      where: { id },
      data: { qaStatus, checks, issues, checkedAt },
    });
  }

  async setProjectStatus(projectId: string, status: string, tenantId: string) {
    return prisma.project.update({ where: { id: projectId, tenantId }, data: { status } });
  }

  async findByProject(projectId: string, tenantId: string) {
    return prisma.qaReport.findFirst({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

- [ ] Write qa.repository.ts
- [ ] Commit: `feat: QARepository + startQA (T-043)`

### Task 4: QA queue + worker

**Files:**
- Create: `lib/server/queues/qa.queue.ts` (mirrors session-reminder.queue.ts)
- Create: `lib/server/workers/qa.worker.ts`

Worker `qa-run` job `{ projectId, tenantId }`:
1. `withTenant(prisma, tenantId, async () => { ... })`
2. Load `Project` + `AssetRepository.findByProject(projectId, tenantId)`
3. Run checks 1–4 (pure), check 5 via `loadGlbHeadless` (signed read URL per GLB asset)
4. `issues = checks.filter(fail).map(c => c.message)`
5. `qaStatus = all pass ? 'passed' : 'failed'`
6. `QARepository.setReport(reportId, qaStatus, checks, issues, now)`
7. `QARepository.setProjectStatus(projectId, qaStatus === 'passed' ? 'qa_passed' : 'qa_failed', tenantId)`

- [ ] qa.queue.ts
- [ ] qa.worker.ts
- [ ] Typecheck passes
- [ ] Commit: `feat: QA queue + worker (runs 5 checks, flips status) (T-043)`

### Task 5: QA API route

**Files:**
- Create: `app/api/qa/route.ts`

POST `/api/qa/run` body `{ projectId }`:
- `getTenantId()` → `qaRepository.startQA(projectId, tenantId)` → `getQaQueue().add('qa-run', { projectId, tenantId, reportId })` → `{ reportId, status: 'running' }`.

GET `/api/qa?project_id=` → latest `qaRepository.findByProject(projectId, tenantId)`.

- [ ] Write app/api/qa/route.ts
- [ ] Typecheck passes
- [ ] Commit: `feat: POST/GET /api/qa routes (T-043)`

### Task 6: Smoke build + TODO + push

- [ ] `pnpm build` ✓
- [ ] `pnpm typecheck` ✓
- [ ] `pnpm test` ✓
- [ ] Update TODO.md T-043 → done, commit
- [ ] Push

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-08-t043-qa-checklist.md`.

Proceeding with **Inline Execution** in this session: implement tasks 1–6 one-by-one with checkpoints (typecheck/test/build after each).
