# T-044 — Publish Button + Gate Implementation Plan

**Date:** 2026-08-08
**Status:** Approved design
**Task:** T-044 (Publish button + gate, blocked unless QA passed)

## Overview

A project overview hub (`app/(dashboard)/projects/[id]/`) that surfaces project
status, QA results, and a Publish button gated on `project.status === 'qa_passed'`.
Publishing creates a `Deployment` record and flips the project to `published`.
The QA gate is enforced server-side on every publish attempt.

## Decisions

| Decision | Choice |
|----------|--------|
| Publish output | Deployment record + public viewer route (`/view/[configId]`); viewer fetches fresh signed asset URLs per request |
| Page scope | Project overview + Publish + QA hub (status, QA summary, assets, upload dropzone, publish + re-run QA buttons) |
| Publish execution | Synchronous in POST /api/deployments |
| QA rerun | Shown on project page (latest QA report + Re-run QA button calling POST /api/qa/run) |
| Public viewer route | `/view/[configId]` (T-042/T-045) fetches signed URLs via GET /api/assets |

## Architecture

### New files

```
app/(dashboard)/projects/[id]/page.tsx        # project overview hub (server component)
lib/server/repositories/deployment.repository.ts  # Deployment CRUD (tenant-scoped)
app/api/deployments/route.ts                 # POST (publish) + GET (list by project)
app/api/deployments/[id]/route.ts            # GET single deployment
lib/server/repositories/deployment.repository.test.ts  # jest
```

### Project detail page (`app/(dashboard)/projects/[id]/page.tsx`)

Server component that loads (tenant-scoped):
- `Project` row (name, description, status, clientId)
- Latest `QAReport` (via `QARepository.findByProject`)
- Asset count (via `AssetRepository.findByProject`)

Renders:
- Project name, description, status badge (colors from existing dashboard)
- QA summary: overall status + per-check pass/fail from latest report
- "Re-run QA" button → `POST /api/qa/run` (T-043)
- Asset count + T-041 `UploadDropzone`
- **Publish button**: visually enabled only when `status === 'qa_passed'`; calls `POST /api/deployments`
- Deployment history (list of past deployments)

### Publish flow (server-side gate)

```
POST /api/deployments { projectId, environment }
  → getTenantId() + withTenant()
  → re-check: project.status === 'qa_passed'
     └─ not passed → 403 { error: "QA must pass before publishing" }
  → create Deployment {
      projectId, environment,
      status: 'success',
      publicUrl: `/view/${configId}`,
      deployedBy: userId,
      deployedAt: now,
      tenantId
    }
  → project.status → 'published'
  → return { deployment, publicUrl }
```

`publicUrl` points at the T-045 viewer route, which fetches fresh signed
asset URLs per request via `GET /api/assets` — links never expire.

### Error handling

- QA gate enforced server-side (never trust the client-side enabled/disabled hint).
- Missing project / wrong tenant → 404 via `withTenant` RLS.
- All endpoints return structured `{ error }` JSON with appropriate status codes.

### Testing

- `deployment.repository.test.ts` (jest, reuses T-041/T-043 jest setup):
  - create deployment
  - findByProject returns deployments ordered by createdAt desc
  - tenant isolation (tenant A can't see tenant B's deployments)

## Out of scope

- The actual public viewer page (T-042/T-045) — only the route reference.
- CDN / public bucket copy — viewer uses signed URLs on each request.
- Preview deployments (environment='preview') supported by schema but not surfaced in v1 UI.
- Deployment rollback / delete.

## Depends on

- T-043 (QA gate: project.status='qa_passed')
- T-041 (AssetRepository, signed read URLs)
- T-032 (tenant_id RLS)
