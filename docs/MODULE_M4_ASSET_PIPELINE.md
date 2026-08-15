# M4 Asset Pipeline — Module Work Prompt

## Module Scope
Implement the asset upload, optimization, and tiling pipeline with RBAC guards.

## Files to Create/Modify

### API Routes
- `app/api/assets/route.ts` — list assets with tenant filter
- `app/api/assets/upload-url/route.ts` — presigned upload URL
- `app/api/assets/upload/init/route.ts` — multipart upload init
- `app/api/assets/upload/complete/route.ts` — multipart complete
- `app/api/assets/upload/abort/route.ts` — multipart abort
- `app/api/assets/[id]/route.ts` — asset CRUD

### Server Utilities
- `lib/server/optimization/optimizer.ts` — image optimization (sharp, glTF pipeline)
- `lib/server/tiling/tiler.ts` — 3D model tiling (draco, meshopt)
- `lib/server/queue/asset.queue.ts` — BullMQ job definitions
- `lib/server/workers/asset.worker.ts` — worker implementation

### Client Components
- `components/upload/UploadDropzone.tsx` — drag-and-drop with progress
- `components/upload/UploadProgress.tsx` — progress bar
- `components/upload/AssetList.tsx` — asset table with status

### Validations
- `lib/validations.ts` — add `assetUploadInitSchema`, `assetUploadCompleteSchema`, `assetUploadAbortSchema`, `streamCreateSchema`

### Prisma
- `prisma/schema.prisma` — extend Asset model with optimization fields

## RBAC Permissions Required
- `assets.read` (USER, ADMIN, SUPER_ADMIN)
- `assets.write` (ADMIN, SUPER_ADMIN)
- `assets.delete` (SUPER_ADMIN)

## Verification Gates
```bash
cd C:\Users\Arch_Viz\Desktop\VizAgent
pnpm lint
pnpm tsc
```
Expected: lint 0/0/0, tsc 11/0/11 ACCEPTED (no NEW/REAL from M4).

## Acceptance Criteria
- [ ] Asset upload with presigned URLs
- [ ] Multipart upload for large files
- [ ] Background optimization queue
- [ ] Web-optimized GLB/GLTF output
- [ ] Asset listing with status filtering
- [ ] RBAC guards on all endpoints
- [ ] Audit logging on all mutations
- [ ] lint 0/0/0, tsc 11/0/11 ACCEPTED