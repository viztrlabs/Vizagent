# M11: Client Portal & Collaboration — Design Spec

**Date:** 2026-08-15
**Status:** Approved (consolidated design)
**Owner:** VizAgent

## 1. Overview

M11 delivers the client-facing portal and collaboration layer: clients see only their own
projects, leave pinned 3D annotations and threaded comments with @mentions, participate in
approval workflows, and download password-protected deliverables. It builds on the existing
Supabase auth (`lib/auth/session.ts`), tenant isolation, audit logging, R2 presigned uploads
(`lib/server/lib/r2.ts`), and the Babylon tour-viewer stack.

**Sequencing note:** M11 is designed after M9 (Content Engine), which is approved but not yet
implemented. The two milestones share the `Project` model and schema; M11's implementation
plan runs after M9's.

## 2. Approved decisions

1. **Access:** client visibility via existing `Project.clientId` (CLIENT role sees only
   `project.clientId === user.id`). **No `ClientPortal` model** (dropped by design).
2. **Approvals:** new `ApprovalWorkflow` model (distinct from the existing token-gated
   `Approval` used by deployment publishing). Workflow: client requests → staff approves/rejects
   with notes.
3. **Annotations/comments:** new Postgres `Annotation` + `Comment` models as durable source of
   truth; Redis presence/chat (`lib/realtime/presence.ts`) stays ephemeral for live presence only.
4. **Deliverables:** `Deliverable` model; metadata reuses existing R2 presign + deployment
   `previewUrl`/`publicUrl`. No new storage system.
5. **Versions:** `ProjectVersion` model (append-only, `changes` Json).
6. **3D viewer:** reuse Babylon tour-viewer stack (`app/(public)/tour/[id]/TourPageClient.tsx`,
   `useBabylonScene`).
7. **Route naming:** new URL-invisible route group `app/(client-portal)/`; existing
   `app/portal/` (session portal) untouched.
8. **Migration:** apply via Supabase MCP + local migration file (the `prisma migrate dev`
   command does **not** work against the Supabase pooler; the M9 decision applies).

## 3. Data model (already in schema, verify only)

Models in `prisma/schema.prisma` (all with `tenantId` + `@@index([tenantId])` for RLS):

- `Annotation` — id, projectId, authorId, `position` Json ({x,y,z} 3D / {x,y} 2D), content,
  `resolved Boolean @default(false)`, timestamps, tenantId. Indexes: projectId, authorId.
- `Comment` — id, projectId, authorId, `parentId String?` (threading), content,
  `mentions String[]`, timestamps, tenantId. Indexes: projectId, authorId, parentId.
- `ApprovalWorkflow` — id, projectId, requesterId, approverId, `status String @default("pending")`
  (pending|approved|rejected), notes?, timestamps, tenantId. Indexes: projectId, requesterId,
  approverId.
- `Deliverable` — id, projectId, name, type (zip|url|folder), url, `password String?`,
  `expiresAt DateTime?`, timestamps, tenantId. Index: projectId.
- `ProjectVersion` — id, projectId, `version String`, `changes Json`, createdAt, createdBy,
  tenantId. Index: projectId.

No `ClientPortal` model. `prisma validate` must pass; the generated client exposes all five
delegates.

## 4. RBAC (lib/auth/session.ts)

Add to the `Permission` union:

```
'client.portals.read' | 'collab.annotate' | 'collab.comment' | 'approvals.request' | 'approvals.manage'
```

`ROLE_PERMISSIONS`:
- `CLIENT`: `['projects.read', 'client.portals.read', 'collab.annotate', 'collab.comment', 'approvals.request']`
- `USER`: `['projects.read', 'deployments.write', 'collab.annotate', 'collab.comment']`
- `ADMIN`: existing + `client.portals.read`, `collab.annotate`, `collab.comment`,
  `approvals.request`, `approvals.manage`
- `SUPER_ADMIN`: unchanged (passes everything)

`hasPermission`/`requirePermission` semantics unchanged. **Note:** `approvals.manage` is
staff-only (ADMIN/SUPER_ADMIN). CLIENT gets `approvals.request` — the workflow is client requests,
staff decides.

## 5. Service layer (lib/server/client-portal/)

All services: `getCurrentAuth()` → `requirePermission()` → operation → `auditLog` on writes.
Every query scoped by `tenantId`.

- `annotations.ts` — `listAnnotations(projectId)` (default `resolved: false` filter),
  `createAnnotation`, `resolveAnnotation` (`PATCH` sets `resolved: true`). Permission:
  `collab.annotate`. Guards: project exists + caller access (client owns / staff).
- `comments.ts` — `listComments(projectId)` (`parentId: null` top-level + nested replies),
  `createComment` (parses `@name` mentions → resolves to user ids → stores in `mentions`).
  Permission: `collab.comment`.
- `approvals.ts` — `requestApproval` (status `pending`, CLIENT), `updateApprovalStatus`
  (approve/reject + notes, staff `approvals.manage`), `listApprovals` (filter
  `status: 'pending'` for the approver queue).
- `deliverables.ts` — `createDeliverable` (staff), `listDeliverables` (client), `downloadDeliverable`
  (password verify via constant-time compare, `expiresAt` expiry check, returns presigned URL via
  `lib/server/lib/r2.ts`).
- `versions.ts` — `listVersions(projectId)`, `createVersionSnapshot` (append-only `changes` Json).

## 6. API routes

| Route | Method | Action | Permission |
|---|---|---|---|
| `/api/client/portals` | GET | list client's projects w/ status | `client.portals.read` |
| `/api/annotations?projectId=` | GET/POST | list/create annotations | `collab.annotate` |
| `/api/annotations/[id]` | PATCH | resolve annotation | `collab.annotate` |
| `/api/projects/[id]/comments` | GET | list threaded comments | `collab.comment` |
| `/api/comments` | POST | create comment (@mention parse) | `collab.comment` |
| `/api/approvals` | POST | request approval | `approvals.request` |
| `/api/approvals/[id]` | PUT | approve/reject + notes | `approvals.manage` |
| `/api/deliverables` | POST | create deliverable | `approvals.manage` |
| `/api/projects/[id]/deliverables` | GET | list deliverables | `client.portals.read` |
| `/api/deliverables/[id]/download` | POST | password-gated download | `client.portals.read` |
| `/api/projects/[id]/versions` | GET/POST | list/create version snapshot | `client.portals.read` / `approvals.manage` |

All routes: `getCurrentAuth` → `requirePermission` → service → `auditLog`; errors return
`{ error }` with proper status.

## 7. Client portal UI

**Route group** `app/(client-portal)/` (URL-invisible):

| Route | Page |
|---|---|
| `/client` | Dashboard — projects where `project.clientId === user.id`, status, public links |
| `/client/projects/[id]` | Project detail + `ProjectViewer` (Babylon) |
| `/client/projects/[id]/annotations` | Annotation panel |
| `/client/projects/[id]/comments` | Threaded comments |
| `/client/projects/[id]/approvals` | Approval workflow UI |
| `/client/projects/[id]/deliverables` | Deliverable download manager |
| `/client/projects/[id]/versions` | Version history |

**Components** `components/client-portal/`:
- `ClientPortalLayout.tsx` — sidebar nav (mirrors `AdminSidebar` + `app/(admin)/layout.tsx` guard)
- `ProjectViewer.tsx` — Babylon viewer reusing `useBabylonScene` + tour-viewer patterns
- `AnnotationPin.tsx` — 3D-pinned marker (`Annotation.position` Json)
- `AnnotationThread.tsx` / `AnnotationForm.tsx` — create/resolve annotations
- `CommentThread.tsx` — threaded comment UI with @mentions
- `ApprovalWorkflow.tsx` — request (client) / approve-reject w/ notes (staff)
- `DeliverableDownloader.tsx` — password prompt → `POST /download` → redirect to presigned URL
- `VersionHistory.tsx` — append-only list, `changes` Json summary

**Route guard**: portal pages call `getCurrentAuth`; require `CLIENT`/`USER`/`ADMIN`; project
pages filter `project.clientId === user.id` (clients) or staff access; public/anon →
`redirect('/auth/signin')`.

## 8. Query filters (invariants)

- `project.clientId === user.id` — CLIENT scope
- `tenantId` scoping — all queries
- `mentions` array — comment @mention parse
- `status: 'pending'` — approval queue
- `expiresAt` — deliverable download expiry
- `resolved: false` — open annotations default
- `parentId: null` — top-level comments

## 9. RLS

All five tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` +
`CREATE POLICY "tenant_isolation" ON ... USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);`
in the migration file, matching house pattern.

## 10. Migration

- Local file `prisma/migrations/<ts>_m11_client_portal/migration.sql` authored from the schema
  (`prisma migrate diff`), applied to Supabase now via MCP `apply_migration`.

## 11. Verification

- `prisma validate` / `prisma generate` clean.
- `pnpm lint` 0 errors; `npx tsc --noEmit` 0 errors; `pnpm build` success.
- Runtime smoke (`pnpm dev`): client logs in → sees own project → adds annotation → requests
  approval → staff approves → downloads password-gated deliverable.