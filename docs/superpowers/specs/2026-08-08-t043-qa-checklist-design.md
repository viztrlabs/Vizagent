# T-043 — QA Checklist Logic (5 Automated Checks)

**Date:** 2026-08-08
**Status:** Approved design (brainstorming complete)
**Task:** T-043 (QA checklist logic: 5 automated checks)

## Overview

An automated QA pass that runs when a project is moved to `qa_pending`. It
validates asset completeness, naming, size, metadata, and (via a headless
Babylon.js `NullEngine`) that every GLB actually loads. The result gates
publishing (T-044).

## Decisions

| Decision | Choice |
|----------|--------|
| Trigger | BullMQ `qa` queue + worker (reuse T-036 patterns); `QARepository.startQA()` enqueues a job when status → `qa_pending` |
| Checks | 5 automated checks (see below) |
| GLB validation | Full headless render via `NullEngine` + `SceneLoader` (verified it works in pure Node) |
| Storage | Reads assets through T-041 `Asset.storagePath` + signed R2 read URLs (private bucket) |

## Architecture

### New files

```
lib/server/qa/qa-engine.ts                 # check functions (pure + Babylon render)
lib/server/qa/qa-engine.test.ts            # unit tests (BABYLON mocked)
lib/server/repositories/qa.repository.ts    # QAReport CRUD + startQA/status flip
lib/server/queues/qa.queue.ts             # BullMQ qa queue (mirrors session-reminder.queue.ts)
lib/server/workers/qa.worker.ts           # Worker that runs the 5 checks
app/api/qa/route.ts                       # POST /api/qa/run (start QA) + GET /api/qa/:project (report)
app/api/qa/[id]/route.ts                  # (unused) reserved
```

### The 5 checks (in `lib/server/qa/qa-engine.ts`)

1. **`required-panorama-present`** — at least one Asset for the project with
   extension `.jpg/.jpeg/.png` (a 360 panorama). `fail` if none.
2. **`naming-convention`** — every Asset filename matches
   `^[a-z0-9-]+\.(jpg|jpeg|png|glb|gltf|usdz|zip)$`. Lists offenders in the message.
3. **`size-under-limit`** — every Asset `fileSize <= 500 MB`.
4. **`metadata-complete`** — `Project.name` non-empty, `Project.description`
   present, `Project.clientId` set.
5. **`glb-loadable`** — for every `.glb` Asset: fetch the file bytes (via the
   signed read URL) and load with `SceneLoader.ImportMesh` on a fresh
   `NullEngine` scene; `pass` if no error. Babylon import is isolated behind a
   wrapper function so jest can mock it.

Checks 1–4 are synchronous; check 5 is the async Babylon render loop.

### Trigger & status flow

```
project.status = 'qa_pending'        (set by QARepository.startQA)
   → enqueue 'qa-run' job { projectId, tenantId }
worker:
   qaStatus = 'running'
   run 1..5 → QACheck[] + issues[]
   qaStatus = passed ? 'passed' : 'failed'
   project.status = passed ? 'qa_passed' : 'qa_failed'   # gate for T-044
```

All DB calls inside the worker use `withTenant(prisma, tenantId, ...)` for RLS
isolation, mirroring `session-reminder.worker.ts`.

### Error handling

- A failing check sets that check to `fail` and appends to `issues[]` but does
  **not** stop the remaining checks.
- A thrown check error (e.g. R2 fetch) → that check = `fail` with the error
  message; others continue.
- Babylon load error → check 5 `fail` with the GLB that failed.
- Final `qaStatus` = `passed` iff every check `pass`.

### Testing

- `lib/server/qa/qa-engine.test.ts`:
  - naming convention accepts/rejects filenames.
  - size-under-limit flags > 500 MB.
  - metadata-complete flags missing fields.
  - `glb-loadable` delegates to an injectable Babylon loader that the test
    mocks (so tests stay fast and offline).
- Follow-on integration of the full Babylon path verified via build only.

## Out of scope

- The T-044 "Run QA" button UI and project detail page (built with T-044).
- Retry/requeue UI for a failed QA run.
- Parallel GLB loads are bounded; no distributed render farm.

## Depends on

- T-041 (Asset table + signed read URLs)
- T-036 (BullMQ queue/worker + Upstash Redis patterns)
- T-032 (tenant_id RLS)
