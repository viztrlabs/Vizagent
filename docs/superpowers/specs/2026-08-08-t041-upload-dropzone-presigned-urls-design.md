# T-041 — Upload Dropzone + Presigned URLs (Cloudflare R2)

**Date:** 2026-08-08
**Status:** Approved design (brainstorming complete)
**Task:** T-041 (Upload dropzone + presigned URLs)

## Overview

Add a reusable client-side upload dropzone backed by Cloudflare R2 multipart
uploads with presigned URLs. Files are registered as `Asset` rows (the raw-file
registry) so the configurator/viewer can reference them via `XrAsset`.

## Decisions

| Decision | Choice |
|----------|--------|
| Storage backend | Cloudflare R2 (S3-compatible) |
| Upload UX | Both — project detail page (T-044) AND a configurator "Assets" panel, sharing one upload API |
| File types | JPG/PNG, GLB/GLTF, USDZ, ZIP (bundles) |
| Max file size | 500 MB |
| Access control | Private bucket; signed GET URLs for reads |
| Data model | Uploads create `Asset` rows; processed assets live in `XrAsset` referencing stored paths |
| Upload mechanics | Multipart presigned upload (5 MB parts) |

## Architecture

### New files

```
lib/server/lib/r2.ts                                       # R2 client + multipart helpers
lib/server/repositories/asset.repository.ts                # Asset CRUD (tenant-scoped)
components/upload/UploadDropzone.tsx                       # shared dropzone component
app/api/assets/route.ts                                    # GET list (signed URLs) · DELETE remove
app/api/assets/upload/init/route.ts                        # POST: create Asset + presign parts
app/api/assets/upload/complete/route.ts                    # POST: complete multipart → ready
app/api/assets/upload/abort/route.ts                       # POST: abort multipart → failed
jest.config.ts                                             # minimal jest setup (none exists today)
lib/server/lib/r2.test.ts                                  # unit tests (presign URLs, validation)
```

### R2 client (`lib/server/lib/r2.ts`)

Uses `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, configured from env:

```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
```

Exported helpers:
- `createMultipartUpload({ key })` → `{ uploadId }`
- `presignUploadPart({ key, uploadId, partNumber, expiresIn })` → presigned PUT URL
- `completeMultipartUpload({ key, uploadId, parts })` — validates part count/ETags
- `abortMultipartUpload({ key, uploadId })`
- `presignGetObject({ key, expiresIn = 3600 })` → signed GET URL
- `deleteObject({ key })`

### Storage key convention

```
tenants/{tenantId}/projects/{projectId}/assets/{assetId}/{fileName}
```

Tenant isolation is encoded in the object key, consistent with the RLS work.

### API routes

All use `getTenantId()` + `withTenant()` + `AssetRepository` (same pattern as
`app/api/xr/assets`).

- **`POST /api/assets/upload/init`** — body `{ projectId, fileName, fileType, fileSize }`.
  Server validates extension allowlist + 500 MB cap, creates `Asset` row
  (`status = "uploading"`, `storagePath = key`), initiates multipart, returns
  `{ assetId, uploadId, key, parts: [{ partNumber, url }] }`.
  On failure the Asset row is rolled back.
- **`POST /api/assets/upload/complete`** — body `{ assetId, uploadId, parts: [{ partNumber, etag }] }`.
  Verifies part count matches the expected size, calls R2 complete, sets
  `status = "ready"`. Returns the Asset.
- **`POST /api/assets/upload/abort`** — body `{ assetId, uploadId }`.
  Aborts multipart, deletes object, sets `status = "failed"`.
- **`GET /api/assets?project_id=`** — lists `Asset` rows for a project with
  short-lived signed GET URLs (1 h). Returns `{ assets }`.
- **`DELETE /api/assets/[id]`** — deletes the object from R2 and the row.

Validation lives in `lib/validations.ts` (extension allowlist, size cap,
part-count sanity). Client performs the same checks for fast feedback; the
server re-validates authoritatively.

### Dropzone component (`components/upload/UploadDropzone.tsx`)

Reusable client component used on the project detail page (T-044) and inside a
new configurator "Assets" panel. The dropzone component itself is built in this
task; wiring it into the configurator Sidebar lands with T-044.

- Drag & drop + file picker; multiple files; each file gets a card (name, size,
  type icon, progress bar, cancel button).
- Per file: `POST /init` → upload 5 MB parts in parallel (3 retries per part) →
  `POST /complete` → card success state.
- Failed cards show Retry; cancel calls `abort`.
- `onUploadComplete(assets)` callback refreshes the parent's asset list.

## Error handling

- Routes return structured `{ error }` JSON with appropriate 4xx/5xx statuses.
- Init failure → roll back Asset row.
- Part-upload failure → card failure state; Retry re-runs parts.
- Abort → removes partial object so no orphan storage.
- Unauthenticated / wrong tenant → 401/403 via `getTenantId()`.

## Testing

- `lib/server/lib/r2.test.ts`:
  - presignUploadPart generates an HTTPS URL containing the key/part params.
  - completeMultipartUpload rejects mismatched part count.
  - validation rejects bad extensions and > 500 MB files.
- `jest.config.ts` added (project currently has no jest config or tests).
- No new Playwright specs in this task; E2E coverage comes from T-051.

## Out of scope

- Public-read/publish flow (T-044/T-045 — private-by-default stays; publish
  opens objects to the CDN later).
- Processed-asset generation (thumbnail/GLB processing) — separate task.
- Configurator Assets panel UI details (built alongside T-041 dropzone; panel
  wiring lands with T-044 project page).
