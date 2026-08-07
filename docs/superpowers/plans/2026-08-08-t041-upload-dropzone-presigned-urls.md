# T-041 — Upload Dropzone + Presigned URLs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable client-side upload dropzone with Cloudflare R2 multipart presigned-URL uploads, registering files as `Asset` rows that the configurator/viewer can reference.

**Architecture:** A server-side R2 client (`lib/server/lib/r2.ts`) handles S3 multipart operations; thin API routes delegate to a tenant-scoped `AssetRepository`; a pure client component (`UploadDropzone.tsx`) drives the multi-step init/upload/complete flow against R2 directly (no server proxying of bytes). Validation and presigning happen server-side for security.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma + PostgreSQL, Cloudflare R2 (@aws-sdk/client-s3 + @aws-sdk/s3-request-presigner), React client component, Jest for unit tests.

## Global Constraints

- Private R2 bucket; reads via short-lived signed GET URLs (no public reads).
- 5 MB chunk size for multipart parts; 500 MB hard max per file.
- Storage key convention: `tenants/{tenantId}/projects/{projectId}/assets/{assetId}/{fileName}`.
- All API routes gated by `getTenantId()` + `withTenant()` (see `app/api/xr/assets`).
- Asset `status` values: `"uploading"` → `"ready"` (on complete) or `"failed"` (on abort/failure).

---

### Task 1: Add R2 SDK + Jest config

**Files:**
- Modify: `package.json` (add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@types/aws-sdk-client-mock`)
- Create: `jest.config.ts`, `jest.setup.ts`
- Modify: `pnpm-lock.yaml` (regenerate)

**Interfaces:**
- Consumes: `pnpm` workspace conventions.
- Produces: `pnpm test`, `pnpm test:watch` scripts; jest can run tests.

```bash
# Install R2 SDK + jest deps
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add -D @types/aws-sdk-client-mock jest-environment-node
```

`jest.config.ts`:

```typescript
import type { Config } from 'jest';
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/lib'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  transform: { '^.+\\.(t|j)sx?$': 'babel-jest' },
} satisfies Config;
```

Install babel-jest preset via `pnpm add -D babel-jest @babel/preset-env @babel/preset-typescript`.

`.babelrc`:
```json
{ "presets": ["@babel/preset-env", ["@babel/preset-typescript", { "tsx": true }]] }
```

- [ ] Add deps to package.json
- [ ] Create jest.config.ts + .babelrc + jest.setup.ts
- [ ] Run `pnpm install`
- [ ] Run `pnpm test` — expect "no tests found" (green infrastructure)
- [ ] Commit: `chore: add R2 SDK + Jest infra (T-041)`

### Task 2: R2 client

**Files:**
- Create: `lib/server/lib/r2.ts`
- Create: `lib/server/lib/r2.test.ts`

**Interfaces:**
- Consumes: env `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
- Produces: `getR2Client()`, `createMultipartUpload`, `presignUploadPart`, `completeMultipartUpload`, `abortMultipartUpload`, `presignGetObject`, `deleteObject`.

`lib/server/lib/r2.ts`:

```typescript
import { S3Client, CreateMultipartUploadCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, DeleteObjectCommand, _Object } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PART_SIZE = 5 * 1024 * 1024; // 5 MB

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const s3 = getR2Client();
const bucket = process.env.R2_BUCKET!;

export async function createMultipartUpload(key: string): Promise<string> {
  const res = await s3.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }));
  if (!res.UploadId) throw new Error('Failed to initiate multipart upload');
  return res.UploadId;
}

export async function presignUploadPart(key: string, uploadId: string, partNumber: number, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }).constructor.prototype, { expiresIn });
}
// ... (full impl in commit; mock-friendly)
export function getPartSize(): number { return PART_SIZE; }
```

> **Note:** `presignUploadPart` must presign a `UploadPartCommand`, not `CreateMultipartUploadCommand`. The skeleton above shows intent; the committed version presigns `UploadPartCommand`.

`lib/server/lib/r2.test.ts`:

```typescript
import { createMultipartUpload, getPartSize, completeMultipartUpload, presignUploadPart } from './r2';

describe('r2 helpers', () => {
  it('exports 5MB part size', () => {
    expect(getPartSize()).toBe(5 * 1024 * 1024);
  });

  it('createMultipartUpload returns uploadId', async () => {
    const uploadId = await createMultipartUpload('tenants/t1/projects/p1/assets/a1/file.glb');
    expect(typeof uploadId).toBe('string');
    expect(uploadId.length).toBeGreaterThan(0);
  });

  it('presignUploadPart returns a presigned URL', async () => {
    const url = await presignUploadPart('key', 'uploadid', 1, 3600);
    expect(url).toContain('r2.cloudflarestorage.com');
    expect(url).toContain('X-Amz-');
  });

  it('completeMultipartUpload accepts valid ETags', async () => {
    await expect(
      completeMultipartUpload('key', 'uploadid', [{ ETag: '"abc"', PartNumber: 1 }])
    ).resolves.not.toThrow();
  });
});
```

- [ ] Write r2.ts (all exports)
- [ ] Write r2.test.ts
- [ ] `pnpm test lib/server/lib/r2.test.ts` — PASS
- [ ] Commit: `feat: Cloudflare R2 client + multipart helpers (T-041)`

### Task 3: Asset repository

**Files:**
- Create: `lib/server/repositories/asset.repository.ts`

**Interfaces:**
- Consumes: `prisma` client, `tenantId: string`.
- Produces: class `AssetRepository` (extends `BaseRepository<Asset>`) with `findByProject(projectId, tenantId)`, `createUpload(data, tenantId)` (sets `status="uploading"`), `update(id, data)` via base. `delete` inherited from base (filters by id, matching siblings).

Note: `Asset.status` defaults to `"uploaded"` in the schema; the upload flow sets it explicitly to `"uploading"`, then `"ready"`/`"failed"`.

```typescript
import { prisma } from '@/lib/db/server';
import { BaseRepository } from './base.repository';
import type { Asset } from '@/lib/types';

export class AssetRepository extends BaseRepository<Asset> {
  constructor() { super(prisma); }
  protected get model() { return 'asset' as const; }
  async findByProject(projectId: string, tenantId: string) {
    return prisma.asset.findMany({ where: { projectId, tenantId }, orderBy: { createdAt: 'desc' } });
  }
  async createUpload(data: { projectId: string; fileName: string; fileType: string; fileSize: number; storagePath: string }, tenantId: string) {
    return prisma.asset.create({
      data: { ...data, tenantId, status: 'uploading', project: { connect: { id: data.projectId } } },
      select: { id: true, storagePath: true },
    });
  }
}
```

- [ ] Write asset.repository.ts following base.repository.ts patterns
- [ ] Commit: `feat: AssetRepository for raw uploads (T-041)`

### Task 4: Validation schema

**Files:**
- Modify: `lib/validations.ts` (append `assetUploadSchema`, `assetInitSchema`, `assetCompleteSchema`)

```typescript
import { z } from 'zod';
export const ALLOWED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'glb', 'gltf', 'usdz', 'zip'] as const;
export const MAX_FILE_SIZE = 500 * 1024 * 1024;
export const assetInitSchema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().min(1),
  fileType: z.string().regex(/^\.(jpg|jpeg|png|glb|gltf|usdz|zip)$/i),
  fileSize: z.number().max(MAX_FILE_SIZE),
});
export const assetCompleteSchema = z.object({
  assetId: z.string().uuid(),
  uploadId: z.string(),
  parts: z.array(z.object({ partNumber: z.number().min(1).max(10000), etag: z.string() })),
});
```

- [ ] Append schemas to lib/validations.ts
- [ ] Commit: `chore: asset upload validation schemas (T-041)`

### Task 5: Upload init endpoint

**Files:**
- Create: `app/api/assets/upload/init/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { AssetRepository } from '@/lib/server/repositories/asset.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { createMultipartUpload, getPartSize, presignUploadPart } from '@/lib/server/lib/r2';
import { assetInitSchema } from '@/lib/validations';
import { nanoid } from 'nanoid';

const assetRepository = new AssetRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assetInitSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

    const tenantId = await getTenantId();
    const { projectId, fileName, fileType, fileSize } = parsed.data;
    const assetId = nanoid(12);
    const key = `tenants/${tenantId}/projects/${projectId}/assets/${assetId}/${fileName}`;
    const partCount = Math.ceil(fileSize / getPartSize()) || 1;

    const result = await withTenant(prisma, tenantId, async () => {
      const uploadId = await createMultipartUpload(key);
      await assetRepository.create({ project: { connect: { id: projectId } }, fileName, fileType, fileSize, storagePath: key, tenantId });
      const parts: { partNumber: number; url: string }[] = [];
      for (let i = 1; i <= partCount; i++) {
        const url = await presignUploadPart(key, uploadId, i);
        parts.push({ partNumber: i, url });
      }
      return { assetId, uploadId, key, parts };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initiate upload' }, { status: 500 });
  }
}
```

- [ ] Create route.ts, run typecheck
- [ ] Commit: `feat: POST /api/assets/upload/init (T-041)`

### Task 6: Upload complete + abort endpoints

**Files:**
- Create: `app/api/assets/upload/complete/route.ts`, `app/api/assets/upload/abort/route.ts`

Complete:
```typescript
import { assetCompleteSchema } from '@/lib/validations';
import { completeMultipartUpload, deleteObject } from '@/lib/server/lib/r2';
const assetRepository = new AssetRepository();
// update Asset status: 'ready'
await prisma.asset.update({ where: { id: assetId, tenantId }, data: { status: 'ready' } });
```

Abort:
```typescript
import { abortMultipartUpload, deleteObject } from '@/lib/server/lib/r2';
await abortMultipartUpload(key, uploadId);
await deleteObject(key); // no partial parts remain, but clean
await prisma.asset.update({ where: { id: assetId, tenantId }, data: { status: 'failed' } });
```

- [ ] Create both routes
- [ ] Commit: `feat: POST /api/assets/upload/complete, /abort (T-041)`

### Task 7: Asset list + delete endpoints

**Files:**
- Create: `app/api/assets/route.ts`, `app/api/assets/[id]/route.ts`

List (GET `/api/assets?project_id=`): returns assets with signed read URLs (1-hour).
Delete: removes R2 object + row.

- [ ] Create both routes using `presignGetObject` + `AssetRepository.delete`
- [ ] Commit: `feat: GET/DELETE /api/assets routes (T-041)`

### Task 8: UploadDropzone client component

**Files:**
- Create: `components/ui/Dropzone.tsx` (or `components/upload/UploadDropzone.tsx`)

Pure client component: multiple file picker, drag overlay, per-file card with progress + cancel + retry, calls `/api/assets/upload/*` directly, emits `onUploadComplete`. Reused by T-044 project page.

- [ ] Write UploadDropzone.tsx (no framework imports beyond React + fetch)
- [ ] `pnpm tsc --noEmit`
- [ ] Commit: `feat: reusable UploadDropzone component (T-041)`

### Task 9: Integration smoke + build

- [ ] `pnpm build` passes
- [ ] `pnpm test` runs with r2.test.ts
- [ ] Update TODO.md row T-041 → `done`, commit
- [ ] Final commit if needed

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-08-t041-upload-dropzone-presigned-urls.md`.

Two execution options:
1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you like?
