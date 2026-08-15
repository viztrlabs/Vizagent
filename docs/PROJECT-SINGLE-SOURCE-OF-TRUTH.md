# PROJECT SINGLE SOURCE OF TRUTH

**Project:** VizTR — Architectural Visualization Platform
**Version:** 2.0 (audited + rewritten from code on 2026-08-10)
**Status:** Live working document — update this file as the project evolves
**Source of truth for:** planning, development, architecture, testing, security, and launch

> **⚠️ READ THIS FIRST — Repo state:** The git working tree at `C:\Users\Arch_Viz\Desktop\VizAgent` is **mid-migration and currently broken** (typecheck fails, 16/21 test files fail, build would fail). The coherent baseline is **committed HEAD `344fe13`** (all Phase 2 tasks T-041..T-053 merged). Uncommitted work (95 untracked files + 23 modified files) has downgraded `package.json` (Prisma 7→5.20, removed next-auth/stripe/openai/anthropic/sentry/socket.io/bullmq/ioredis/upstash/aws-sdk, Tailwind 4→3.4, jest→vitest), removed the `Subscription` model, and stripped `vercel.json` security headers — while the source code still imports the removed deps. See §11 and §20 for the recovery plan.

---

## 0. How to Read This Document

| Label | Meaning |
|---|---|
| ✅ Confirmed | Verified from code/docs/files on this date |
| 🔶 Inferred | Reasonable conclusion from evidence, not explicitly confirmed |
| ❌ Missing | Not present / not built / unknown |
| ❓ Needs Stakeholder Confirmation | Requires a decision from the project owner |
| Status: Not Started / Partial / Implemented / Broken / Needs Redesign | Feature state |

---

# Part A — Understanding Summary (from raw context + code)

## A1. Short Summary of Understanding

VizTR is an **architectural visualization platform** for architecture, real-estate, and design studios. **Contrary to the previous SSOT draft (~30%), the committed codebase (HEAD `344fe13`) is far more developed.** The app is a Next.js 16 (App Router) + React 19 + TypeScript app with these implemented/present modules (verified in code):

- **Auth:** Dual system — `lib/auth.ts` (NextAuth v5 beta, Google OAuth + admin Credentials) **and** Supabase auth (`lib/supabase/client.ts`, `app/auth/signin/SignInForm.tsx`, `app/auth/signup/SignUpForm.tsx`, `components/AuthButton.tsx`). No `middleware.ts` — pages guard via server-side redirects.
- **Assets:** Multipart upload pipeline (`/api/assets`, `/api/assets/upload/{init,complete,abort}`, `/api/assets/upload-url`, `/api/assets/[id]`), Cloudflare R2 storage (`lib/server/lib/r2.ts` + tests), 500MB limit.
- **Projects:** CRUD + status lifecycle (draft → uploaded → qa_pending → qa_passed → published) with tenant scoping.
- **QA pipeline:** `lib/qa/run.ts` + `checks.ts` (naming, format, resolution via `sharp`), queue worker (`lib/server/queues/qa.queue.ts`), `/api/qa`.
- **Deployments:** QA-gated publish (`/api/deployments`, `[id]`), `DeploymentRepository`, project status → `published`.
- **Virtual tour viewer (Babylon.js):** `components/viewer/`, `lib/tour/` (map-tour-config, hotspot-position + unit tests), `components/configurator/` (BabylonCanvas, Sidebar, MaterialsPanel, LightingPanel, HotspotsPanel, ExportPanel, ARPanel, VirtualTourView), `/configurator/[projectId]`, `/tour/[id]` public viewer, `/api/public/tour/[id]`.
- **XR/WebXR:** `lib/xr/webxr.ts`, `webxr-session.ts` (hit-test, planes, anchors) + test; ARPanel.
- **Real-time collaboration:** `lib/realtime/presence.ts` (socket.io, presence, cursors), `/api/collab/messages`, configurator sessions (`/api/configurator/sessions`, `[token]`).
- **Bookings + Google Calendar + emails:** `/api/bookings`, `[id]`, `lib/google-calendar.ts`, cron `/api/cron/session-reminders` (Vercel cron), React Email templates (`emails/confirmation.tsx`, `emails/reminder.tsx`), Resend.
- **Payments (Stripe):** `/api/payments/{checkout,portal,webhook}`, `lib/stripe/tiers.ts` + test, `server.ts`, 3 tiers.
- **AI providers:** `lib/ai/` — provider interface, OpenAI, Anthropic, Ollama, config loader, client.generate/streamGenerate + tests. OpenAI/Anthropic SDKs used.
- **Streams (pixel streaming):** `app/(public)/stream/`, `lib/pixel-streaming/`, `/api/streams/{create,join,leave,stats}`, admin panel.
- **Dashboard/analytics:** `app/(dashboard)/dashboard/`, `lib/analytics.ts`, `/api/dashboard`, `StatsCards`, `Charts` (recharts).
- **Marketing site:** `app/(marketing)/` landing + `/pricing` (Stripe checkout links).
- **Admin:** `/admin/env-settings`, `/admin/pixel-streaming`.
- **Portal:** `app/portal/` client session list.
- **Sentry:** `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`, wired in `next.config.ts`.

**Prisma schema (working tree)** has 10 models: `User, Project, Asset, QaReport, Deployment, XrAsset, Configuration, ConfiguratorSession, Viewer, Session`. The **committed** schema has `QAReport` + `Subscription` (added by T-050) instead of the working tree's `QaReport` + `Session` — i.e., working-tree schema edits removed the Subscription model. 4 migrations exist (init, add_tenant_id, enable_rls, add_subscription); the DB itself appears configured (real credentials in `.env.local`) but the schema/migrations are out of sync with the working tree.

**The critical problem right now:** the working tree does **not** build or pass tests (verified 2026-08-10): `tsc --noEmit` → 1 error (missing `sharp`); `vitest run` → 16/21 files fail (missing deps `openai`/`@anthropic-ai/sdk`/`@prisma/adapter-pg`/`pg`/`sharp`; vitest globals not enabled; e2e Playwright specs picked up by vitest). This is because `package.json` in the working tree was downgraded/rewritten without updating the code that depends on the removed packages.

## A2. Critical Missing Information (needed before full implementation)

1. ❓ **Auth decision:** Which auth is canonical — NextAuth (Google + credentials) or Supabase Auth? Both exist in code and UI, which is confusing and doubles maintenance. The commit history added NextAuth (`lib/auth.ts`) while Supabase auth UI (sign-in/up forms, AuthButton) is newer and untracked.
2. ❓ **Dependency baseline:** Should `package.json` be restored to the committed HEAD set (Prisma 7, next-auth 5, stripe, openai, anthropic, sentry, socket.io, bullmq, ioredis, upstash, aws-sdk, Tailwind 4, jest) or is the downgrade (Prisma 5.20, Tailwind 3.4, vitest, no next-auth/stripe/ai SDKs) intentional?
3. ❓ **Test framework:** jest (committed scripts: `test: jest`, `ts-jest`) vs vitest (working tree script: `test: vitest run`, `vitest.config.ts` untracked). `jest.config.ts` still exists. Both cannot be the canonical runner.
4. ❓ **Business model:** B2B SaaS for studios — per-seat, per-project, or subscription? `lib/stripe/tiers.ts` defines 3 tiers (❓ names/prices) — confirm.
5. ❓ **Storage backend:** R2 confirmed in code (`lib/server/lib/r2.ts`, R2 env vars set). Supabase Storage vars also present. Which is production?
6. ❓ **Realtime stack:** socket.io (committed) vs Supabase Realtime vs custom `/api/collab` — which is the production path for presence/cursors?
7. ❓ **`marzipano` 360 viewer:** only specs/plans exist (docs/); no marzipano code in the main tree. Is it still desired, or is Babylon the sole viewer?
8. ❓ **Second repo / folders:** `babylon_XR_World/`, `VizAgents(Opencode-Hermes-Gravity-)/`, and `C:\Users\Arch_Viz\Desktop\VizTR\VizAgent\Vizagent` (contains `viztr-site/`, `agy-dev/`, `Skills/`, `babylon_XR_World.zip`) — are these part of the project? They are excluded from tsconfig/build.
9. ❓ **Two next.config files:** both `next.config.ts` (committed, Sentry + bundle analyzer + image opts) and `next.config.js` (untracked, older CommonJS) exist. Only one should ship.
10. ❓ **Compliance/analytics:** PostHog env vars set but no wiring found; consent/GDPR scope.
11. ❓ **Launch date / budget / team size.**

## A3. Recommended Next Step (immediate)

1. **Stop and decide the dependency baseline (§A2.2)** — this blocks everything.
   - *Option A (recommended):* restore committed HEAD `package.json` deps (`git restore package.json` then `pnpm install`), keep the newer untracked source files, and reconcile the two auth stacks.
   - *Option B:* finish the downgrade by stripping imports of removed deps (`lib/auth.ts`, `lib/ai/*`, `lib/db/server.ts` adapter-pg, `lib/qa/checks.ts` sharp, `next.config.ts` sentry).
2. **Pick one auth system** and delete the other (recommend Supabase given the newer UI + env vars; or NextAuth given it's committed + works with Google Calendar).
3. **Pick one test runner** (recommend vitest — already configured, 41 passing tests across 5 files) and set `globals: true` + exclude `e2e/` from vitest.
4. **Get CI green** (`.github/workflows/ci.yml` already runs typecheck/lint/build/test-e2e): restore `sharp` (or drop its use), run `pnpm install`, `pnpm prisma generate`, verify `tsc`, `vitest`, `playwright`.
5. **Decide the 7 open questions** in §22 before further feature work.

---

# Part B — The Single Source of Truth Document

## 1. Executive Summary

### 1.1 Project Overview
VizTR lets studios upload 3D assets / 360 panoramas, publish interactive virtual tours (Babylon.js 3D), run WebXR/AR experiences, stream high-fidelity sessions (pixel streaming), schedule and run client review sessions (Google Calendar + email reminders), give clients a branded portal, collect payments (Stripe), and monitor usage (dashboard analytics). AI scene generation (OpenAI/Anthropic/Ollama) is scaffolded.

### 1.2 Current Completion Estimate
**~60% of committed-scope features exist in code** (Phase 1–2 tasks T-001..T-053 are logged done in `TODO.md`; git history confirms). **However, the repo is currently not buildable** due to working-tree dependency regression (§11). True "done" is blocked on stabilizing deps + auth.

### 1.3 Overall Readiness Level (as committed baseline; working tree = 🔴 Broken)
| Area | Readiness |
|---|---|
| Frontend pages/UI | 🟢 70% — marketing, dashboard, admin, portal, configurator, tour, stream, auth pages exist |
| Backend/API | 🟢 70% — 30+ route handlers across assets/projects/qa/deployments/bookings/payments/xr/streams/collab |
| Data model | 🟡 50% — 10 models, 4 migrations, schema/db out of sync |
| Auth | 🟡 50% — dual (NextAuth + Supabase), no middleware, no role gates on APIs |
| Testing | 🟠 25% — 21 vitest files (41 tests pass when deps resolve), 4 e2e specs, jest config stale |
| Security | 🟠 20% — headers in committed vercel.json, RLS migration, but no RBAC/rate-limit/audit |
| Deployment | 🟡 50% — Vercel auto-deploy, cron daily (committed) vs `*/15` (working), env vars set |
| SEO/Analytics/Legal | 🔴 10% — metadata partial, no sitemap/robots/legal/analytics wiring |

### 1.4 Biggest Gaps
1. 🔴 **Working tree does not build/test** — dependency regression is the #1 blocker.
2. **Dual auth systems** with no middleware or API role enforcement.
3. **Schema/db/migration drift** — working schema ≠ committed schema ≠ migrations ≠ live DB.
4. **Test runner conflict** (jest vs vitest) and vitest config gaps (globals, e2e exclusion).
5. No `middleware.ts`, no RBAC on APIs, no rate limiting, no audit log.
6. marzipano viewer planned but not built; two next.config files conflict.
7. No legal pages, sitemap/robots, analytics wiring, or support tooling.

### 1.5 Biggest Risks
- **Repo is currently broken** → any deploy fails or ships broken (Delivery, HIGH). Must fix baseline first.
- Two auth systems → security confusion + maintenance burden (Security, MEDIUM/HIGH).
- Schema drift → runtime errors in bookings/payments/projects (Delivery, HIGH).
- Secrets live in `.env.local` (gitignored ✅) but must never reach a commit (Security, MEDIUM).
- AI SDK deps removed but code imports them → typecheck/runtime failures (Delivery, HIGH).

### 1.6 Recommended Path Forward
Stabilize the baseline first (§A3), then: pick auth → align schema+migrations → unify tests → RBAC+security → launch checklist (§23). Roadmap details in §19.

---

## 2. Product Definition

### 2.1 Product Purpose
Turn 3D/360 assets into immersive, shareable client experiences (tours, WebXR, streams) and manage the studio's review/sales workflow (bookings, calendar, reminders, portal, payments).

### 2.2 Business Objective
Subscription/B2B tool for studios. ❓ Pricing model to confirm (3 Stripe tiers exist in code).

### 2.3 Target Audience
- **Primary:** architectural visualization studios, freelance CG artists.
- **Secondary:** architecture firms, interior designers, real-estate developers.
- **End clients:** home buyers/tenants viewing tours via portal/shared links.

### 2.4 Core Problem Being Solved
Fragmented production/delivery of interactive architectural content (heavy desktop tools, large file emailing, no client review workflow) — VizTR consolidates ingest → tour/stream → review → booking → billing.

### 2.5 Primary User Goals
- Upload → publish a shareable tour in minutes.
- Run branded client review sessions with calendar + reminders.
- Monetize via Stripe.
- Monitor usage via dashboard.
- Let clients self-serve via portal.

### 2.6 Success Metrics
- ❌ None defined. **Recommended (Inferred):** tours published/mo, upload→publish time, booking completion, MRR/activation/churn.

### 2.7 Scope of MVP
Upload+storage (R2) · Babylon tour viewer · WebXR · bookings+calendar+emails · portal · Stripe payments · admin dashboards · AI scene generation scaffold · marketing/pricing pages.

### 2.8 Scope of Full Launch
MVP + single coherent auth + RBAC + full test suite + security hardening + SEO/legal/analytics + support tooling + marzipano (if confirmed).

### 2.9 Out of Scope (for now)
- Native mobile apps (responsive web only).
- In-browser 3D authoring (uses imported assets/streams).
- Multi-user live editing (realtime presence/cursors exist; full co-editing deferred).

---

## 3. User Personas and Journeys

### 3.1 "The Studio Producer"
Journey: Login → Upload asset → QA (auto) → Publish → Copy share link → Book review session → Dashboard.

### 3.2 "The Studio Admin"
Journey: Login → Admin env-settings / pixel-streaming → manage providers → monitor health.

### 3.3 "The Client / Buyer"
Journey: Open shared tour link → View → Book session → Calendar invite + reminder → Portal to manage sessions.

### 3.4 Core Journeys & Status
| Journey | Status |
|---|---|
| Publish a tour (upload→QA→publish) | Implemented (code+API) |
| Client views tour | Implemented (Babylon + WebXR) |
| Book a session → Calendar → reminder | Implemented (API + cron + emails) |
| Client portal | Partial (no auth flow resolution) |
| Admin ops | Partial (no RBAC) |

### 3.5 Entry Points
Marketing homepage (`/`), `/pricing`, shared tour links, portal invite links (❓ not built).

### 3.6 Conversion/Retention
Conversion: signup → first published tour. Retention: ❓ not defined.

### 3.7 Admin/Support Journeys
Support tooling not built (see §17).

---

## 4. Complete Feature Specification

> Priority P0 (must) / P1 (should) / P2 (nice) / P3 (deferred). Effort S/M/L/XL.

| # | Feature | Status | Priority | Effort | Notes |
|---|---|---|---|---|---|
| 4.1 | Auth & accounts | 🟡 Partial — dual (NextAuth + Supabase); no middleware | P0 | L | Choose one; add middleware + role gates |
| 4.2 | Upload & storage (R2) | 🟢 Implemented (multipart + signed URLs) | P0 | M | |
| 4.3 | Projects + lifecycle | 🟢 Implemented (tenant-scoped, status flow) | P0 | M | |
| 4.4 | QA pipeline | 🟢 Implemented (checks + queue + API) | P1 | M | `sharp` dep missing from working package.json |
| 4.5 | Deployments (publish) | 🟢 Implemented (QA-gated) | P1 | M | |
| 4.6 | Babylon 3D tour viewer | 🟢 Implemented | P1 | M | `components/viewer`, `lib/tour` |
| 4.7 | WebXR / AR (hit-test, planes, anchors) | 🟢 Implemented | P1 | L | `lib/xr` |
| 4.8 | Configurator | 🟢 Implemented (materials/lighting/hotspots/export/AR) | P1 | L | excluded from tsconfig (working tree) |
| 4.9 | Real-time collaboration | 🟡 Partial (presence/cursors/messages; socket.io dep missing in working tree) | P3 | XL | |
| 4.10 | Bookings + Google Calendar + reminders | 🟢 Implemented (API + cron + Resend emails) | P0 | M | |
| 4.11 | Stripe payments (3 tiers) | 🟢 Implemented (checkout/portal/webhook) | P1 | L | `stripe` dep missing in working tree |
| 4.12 | Pixel streaming | 🟡 Partial (player + admin + local scripts) | P1 | L | infra not deployed |
| 4.13 | Dashboard & analytics | 🟢 Implemented (recharts) | P1 | M | |
| 4.14 | AI scene generation | 🟡 Scaffolded (OpenAI/Anthropic/Ollama providers + tests) | P2 | L | SDK deps missing in working tree |
| 4.15 | Client portal | 🟡 Partial (list only; needs auth + CRUD) | P0 | M | |
| 4.16 | Admin env-settings | 🟢 Implemented (UI) | P1 | M | ⚠️ security review (env in DB) |
| 4.17 | Email templates | 🟢 Implemented (React Email + Resend) | P0 | S | |
| 4.18 | marzipano 360 viewer | ❌ Not built (specs/plans only) | P0? | M | ❓ confirm still wanted |
| 4.19 | Marketing site + pricing | 🟢 Implemented | P1 | M | |

---

## 5. Information Architecture

### 5.1 Current sitemap (working tree)
```
/                           Marketing landing (app/(marketing))
/pricing                    Stripe pricing page
/auth/signin  /auth/signup  Supabase auth forms (newer, untracked)
/auth/error  /api/auth/callback  (NextAuth callback route)
/portal                     Client portal
/configurator/[projectId]   Tour configurator (Babylon)
/tour/[id]                  Public tour viewer (Babylon)
/(public)/stream            Pixel streaming player
/dashboard                  Dashboard (analytics)
/(dashboard)/analytics      Analytics
/(dashboard)/projects/[id]  Project overview hub
/(dashboard)/admin/env-settings   Env settings
/(dashboard)/admin/pixel-streaming Streaming admin
/book                       Booking page (❓ verify)
/view/[configId]            View config (❓ verify)
/api/*                      ~30 route handlers
```

### 5.2 Page hierarchy (target)
```
Public:  /  /pricing  /stream  /tour/[id]  /auth/*  /book  /view/[configId]
Client:  /portal
Studio:  /dashboard  /projects/*  /configurator/*
Admin:   /admin/env-settings  /admin/pixel-streaming  (+ users ❌)
```

### 5.3 Navigation structure
`components/Header.tsx` (untracked, newer). ❓ Auth-dependent visibility not confirmed.

### 5.4 User roles and access areas
| Role | Access | Enforced? |
|---|---|---|
| PUBLIC | `/`, `/pricing`, `/stream`, `/tour/[id]`, `/auth/*` | ✅ by route existence |
| CLIENT | + `/portal` | ❌ server-side redirect only, no middleware |
| STAFF/ADMIN | + `/dashboard`, `/admin/*`, `/configurator/*` | ❌ |

### 5.5 Public vs private
Public: home, pricing, stream, tour, auth. Private: portal, dashboard, admin, configurator.

---

## 6. Content Architecture

### 6.1 Page content plan
| Page | Content | Status |
|---|---|---|
| Home | Hero, value props, CTA | Implemented (marketing layout) |
| Pricing | Tier cards + Stripe | Implemented |
| Stream/Tour | Player/viewer + controls | Implemented |
| Portal | Session list | Minimal |
| Dashboard | KPI + charts | Implemented |
| Admin | Config forms | Implemented |
| Legal (privacy/terms) | ❌ Missing | Not Started |

### 6.2 SEO metadata
`app/layout.tsx` has title/description. ❌ Per-page metadata, OG, sitemap, robots missing.

### 6.3 Forms
Upload, booking, sign-in/sign-up (Supabase), env-settings — all implemented.

### 6.4 Content ownership
❓ project owner. Copy is developer-written.

---

## 7. UX/UI Plan

### 7.1 Design system
Tailwind 3.4 (working) / 4 (committed) — **conflict to resolve**. Dark palette (per `tailwind.config.ts`); fonts Syne/JetBrains Mono/Inter; brand "VizTR"; lucide-react icons; cva/clsx/tailwind-merge. Blueprint (`implementation-plans/VIZTR-SAAS-PLATFORM-BLUEPRINT.md`): dark luxury, glassmorphism, cyan `#00e5ff` + violet `#7c3aed`.

### 7.2 Missing UX states
Loading (async pages), empty states, error boundaries, success confirmations, destructive-action dialogs — largely ❌.

### 7.3 Responsive
Tailwind utilities used. Feature branches `feature/responsive-*` exist (23–27) but are prunable/unmerged.

### 7.4 Accessibility (target)
WCAG 2.1 AA: landmarks, focus mgmt, keyboard nav for viewers, ARIA, contrast, reduced motion. Not audited.

### 7.5 Design system needs
Token docs, component inventory, motion guidelines.

---

## 8. Functional Architecture

### 8.1 System overview
```
[Browser]
   ├── Next.js 16 App Router (RSC + client components)
   │     ├── Auth: NextAuth v5 (committed) OR Supabase (working) — DUAL
   │     ├── Prisma + PostgreSQL (Supabase-hosted), adapter-pg (committed)
   │     ├── Cloudflare R2 (uploads)
   │     ├── Google Calendar API + Resend (bookings/emails)
   │     ├── Stripe (checkout/portal/webhook)
   │     ├── AI SDKs (OpenAI, Anthropic, Ollama)
   │     ├── socket.io presence/collab (committed)
   │     └── Pixel streaming (WebRTC) + metrics
   └── Vercel (deploy + cron session-reminders)
```

### 8.2 Frontend
App Router, RSC + client components, zustand (`lib/store/configurator-store.ts`), Tailwind, lucide-react, recharts. Heavy viewers lazy-loaded (`LazyWrapper`).

### 8.3 Backend
Route handlers in `app/api/*` (~30 files). Prisma as ORM. Repos/queues/workers/services under `lib/server/` (repositories, queues, workers, events, services, middleware).

### 8.4 API architecture
REST-style Route Handlers. Zod available (`lib/validations.ts`) but usage spotty. No centralized error envelope or rate limiting.

### 8.5 Database
PostgreSQL via Supabase. 10 models, 4 migrations. Working schema ≠ committed schema (Subscription removed, QAReport→QaReport, Session added). **Needs reconciliation.**

### 8.6 Auth
Dual. NextAuth v5 beta (`lib/auth.ts`, Google + Credentials, `calendar.events` scope for Google Calendar) + Supabase (`lib/supabase/{client,server,admin}.ts`). No middleware. Roles are plain strings on `User.role` (not an enum in the DB).

### 8.7 File/media
Multipart upload pipeline → R2 (signed/`upload-init/complete/abort`). `lib/server/lib/r2.ts` + `cdn.ts` + tests.

### 8.8 Notifications
Email via Resend + React Email. In-app ❌.

### 8.9 Payments
Stripe: checkout/portal/webhook routes, 3-tier config in `lib/stripe/tiers.ts`.

### 8.10 Search ❌ · 8.11 Admin: env-settings + pixel-streaming exist; user mgmt ❌

---

## 9. Data Model

### 9.1 Entities (working-tree Prisma schema — 10 models)
```
User, Project, Asset, QaReport, Deployment, XrAsset, Configuration,
ConfiguratorSession, Viewer, Session
```
### 9.1b Entities (committed schema differs)
Committed adds `Subscription` (Stripe, T-050) and names the QA model `QAReport`; working tree replaced those with `QaReport` + `Session`. **Reconcile to committed + merge.**

### 9.2 Relationships
- `Project 1—N {Asset, QaReport, Deployment, XrAsset}` · `XrAsset 1—N Configuration` · `ConfiguratorSession 1—N Viewer` · `User (client) 1—N Project` · `User (deployedBy) 1—N Deployment`.
- All tables carry `tenant_id` (multi-tenant; default tenant `00000000-0000-0000-0000-000000000000` from `lib/server/lib/tenant.ts`).

### 9.3 Gaps (recommended)
`Workspace/Team`, `Invite`, `AuditLog`, `ApiKey`, `ProviderSetting` (env-settings backing), `Payment` history. Confirm before designing.

### 9.4 Required fields/validation
Non-null, length limits, ISO timestamps, enums as strings. `lib/validations.ts` (zod) exists — extend to 100% of routes.

### 9.5 Indexes/constraints/soft-delete/audit
Add composite indexes (sessions `(startAt,status)`), soft-delete `deletedAt` on assets, `AuditLog` table.

### 9.6 Data lifecycle
Upload → temp → processed → published → archived → deleted (retention ❓).

---

## 10. API / Service Specification

### 10.1 Existing endpoints (working tree — verified)
| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/assets`, `/api/assets/[id]` | list/create/get asset |
| POST | `/api/assets/upload-url` | signed upload URL |
| POST | `/api/assets/upload/init`, `/complete`, `/abort` | multipart upload |
| POST/GET | `/api/projects` | project CRUD |
| POST/GET | `/api/qa` | start/list QA |
| POST/GET | `/api/deployments`, `/api/deployments/[id]` | publish (QA-gated) |
| GET | `/api/public/tour/[id]` | public tour config |
| POST/GET | `/api/bookings`, `/api/bookings/[id]` | bookings |
| POST | `/api/cron/session-reminders` | reminders (cron) |
| POST/GET | `/api/payments/checkout`, `/portal`, `/webhook` | Stripe |
| GET | `/api/dashboard` | analytics |
| POST/GET | `/api/xr/assets`, `[id]`, `[id]/config`, `[id]/config/[configId]` | XR assets/configs |
| POST/GET | `/api/collab/messages` | collab chat |
| POST/GET | `/api/configurator/sessions`, `[token]` | configurator sessions |
| POST/GET | `/api/streams/{create,join,leave,stats}` | pixel streaming |
| GET | `/api/auth/[...nextauth]` | NextAuth |

### 10.2 Requirements per endpoint (target)
Zod validation · role checks server-side · consistent `{error:{code,message}}` · rate limiting (booking/upload/auth/cron) · OpenAPI/ts-rest.

---

## 11. Current Code Audit (verified 2026-08-10)

### 11.1 🔴 BLOCKING: Repo does not currently build/test
- `tsc --noEmit` → 1 error: `TS2688 Cannot find type definition file for 'sharp'` (`lib/qa/checks.ts:1` imports `sharp`; not in working `package.json`).
- `vitest run` → **16/21 files fail**, 41 tests pass (5 files). Root causes:
  - Missing deps (working `package.json` removed): `openai`, `@anthropic-ai/sdk`, `@prisma/adapter-pg`, `pg`, `sharp` → module-not-found in `lib/ai/*`, `lib/db/server.ts`, `lib/qa/checks.ts`.
  - `vitest.config.ts` has no `globals: true` → `describe is not defined` in tests using globals.
  - Vitest picks up `e2e/*.spec.ts` (Playwright files) → "Playwright Test did not expect test.describe() to be called here."
  - `@prisma/client` was not generated until I ran `pnpm exec prisma generate` (working `package.json` has no `postinstall: prisma generate`; committed one did).
- `next build` would fail on `next.config.ts` importing `@sentry/nextjs` (not installed) and on type errors.

### 11.2 Dependency regression (working tree vs committed HEAD)
| Package | Committed HEAD | Working tree | Impact |
|---|---|---|---|
| Prisma | 7.9.1 (`@prisma/adapter-pg`, `postinstall`) | 5.20 (client only) | schema/client mismatch, adapter removed |
| next-auth | 5.0.0-beta.32 | ❌ removed | `lib/auth.ts` breaks |
| stripe | 22.4.0 | ❌ removed | payments break |
| openai / @anthropic-ai/sdk | 7.4.0 / 0.116.0 | ❌ removed | AI breaks |
| @sentry/nextjs | 10.69.0 | ❌ removed | `next.config.ts` breaks |
| socket.io(+client) | 4.8.3 | ❌ removed | collab breaks |
| bullmq / ioredis / @upstash/redis | 6.x / 6.x / 1.38 | ❌ removed | queues break |
| @aws-sdk/client-s3 + presigner | 3.1106 | ❌ removed | R2 breaks |
| @supabase/ssr | 0.12.4 | 0.5.0 | API drift risk |
| zod | 4.4.3 | 3.23 | minor API drift |
| tailwind | 4 | 3.4 | config/design-system mismatch |
| jest (+ts-jest, @types/jest) | 30.4 | ❌ removed (vitest instead) | test runner conflict |
| vercel.json | daily cron + security headers | `*/15` cron, headers removed | security regression |

### 11.3 What exists & is reusable
Route handlers, repositories/queues/workers/services, R2 lib, tour mappers + tests, Stripe tiers, AI provider layer, Babylon viewer, WebXR lib, presence lib, React Email templates, analytics lib, seed script (`prisma/seed.ts`).

### 11.4 What needs refactoring
- `lib/supabase/client.ts` uses `!` on env vars (raw crash).
- `lib/server/repositories/*.ts` import type names (`ConfiguratorSession`, `Configuration`, `XrAsset`, `MAX_FILE_SIZE`) that don't exist in `lib/types.ts` / `lib/validations.ts` (source of earlier type errors) — the type layer must be reconciled.
- `lib/store/configurator-store.ts` imports `ConfigData/MaterialData/LightData` not present in `lib/types.ts`.
- Date fields on bookings: redundant `date`/`time` strings + `startAt`.

### 11.5 What should be replaced/removed
- Decide between `next.config.ts` (committed) and `next.config.js` (untracked).
- Remove `babylon_XR_World/`, `VizAgents(Opencode-Hermes-Gravity-)/` if not part of the project (they're excluded from tsconfig, hiding type gaps).
- Reconcile the second repo `C:\Users\Arch_Viz\Desktop\VizTR\VizAgent\Vizagent` (separate git repo with `viztr-site/`, `agy-dev/`, `Skills/`) — confirm relation.

### 11.6 Code quality
- ESLint flat config (`eslint.config.mjs`, `eslint-config-next` 16.3.0) present; CI runs typecheck/lint/build/test-e2e.
- Remaining type debt: missing type exports (see 11.4), `!` assertions on env vars, excluded dirs hiding errors.

### 11.7 Security concerns
- No RBAC enforcement on APIs (tenant guard exists via `withTenant`, role guard ❌).
- Env-settings panel storing secrets in DB — needs encryption/redaction.
- Rate limiting ❌ · audit log ❌ · security headers removed in working `vercel.json`.
- `.env.local` gitignored ✅ (verified), real credentials present — do not commit.

### 11.8 Testing gaps
Vitest: 41 passing tests (lib/tour, lib/ai, lib/stripe, lib/xr, lib/server/qa, r2, presence). Playwright: 4 e2e specs exist but not runnable until app builds. No API route integration tests.

### 11.9 Performance
Code-splitting via LazyWrapper; `optimizePackageImports` in next.config.ts. Image optimization not configured (needs `sharp`). No caching strategy for public tours.

---

## 12. Recommended Technical Architecture

### 12.1 Preferred stack (confirmed by committed code)
Next.js 16 App Router · React 19 · TypeScript · Tailwind · Prisma + PostgreSQL (Supabase) · Supabase Auth OR NextAuth (pick one) · Cloudflare R2 · Google Calendar API · Resend · Stripe · OpenAI/Anthropic/Ollama · socket.io (collab) · Sentry · zod · vitest + Playwright · lucide-react · recharts · zustand.

### 12.2 Folder structure (target)
```
app/  components/  lib/  emails/  prisma/  docs/  tests/  local/
```

### 12.3 Component structure
Presentational in `components/ui`, feature co-located, client components isolated, heavy viewers lazy-loaded.

### 12.4 State management
RSC/route handlers for server state; zustand for client UI state.

### 12.5 API pattern
Route handlers + zod + typed responses + `lib/api` helpers (error envelope, auth guard, rate limit).

### 12.6 Database design
Reconcile schema (restore `Subscription`, keep `QaReport`/`Session` merged), generate migration, keep migrations in sync.

### 12.7 Caching
ISR/revalidatePath for public tours; KV cache (upstash) for aggregates; Vercel CDN for static.

### 12.8 Background jobs
Vercel cron (exists) + BullMQ/Upstash queues (code exists) for QA/email retries.

### 12.9 Logging/monitoring
Sentry (code exists, dep missing) · structured logs · uptime checks.

### 12.10 Environment strategy
`.env.example` committed ✅ (untracked, new); `.env.local` gitignored ✅; per-env Vercel projects.

### 12.11 Secrets management
Vercel env vars; do not persist secrets in Postgres for env-settings.

### 12.12 Deployment strategy
GitHub → Vercel auto-deploy ✅; CI on PR (typecheck/lint/build/e2e) ✅; preview deploys; production protection; rollback = re-deploy prior commit.

---

## 13. Security Plan

| Control | Current | Target |
|---|---|---|
| Auth hardening | Partial (dual) | single system, email verify, rate-limited login, secure cookies |
| Authorization/RBAC | ❌ (tenant guard only) | role checks on every route + admin gates |
| Input validation | zod present, spotty | zod on 100% of routes |
| Output escaping | React default | sanitize HTML/MDX |
| CSRF/XSS/Injection | ❌ | CSP + security headers (restore vercel.json headers), prepared statements |
| Secure headers | ✅ committed / 🔴 removed in working tree | restore + extend (CSP, HSTS) |
| Secrets | ✅ gitignored | secret scanning in CI, Vercel vault |
| Dependency security | ❌ | `pnpm audit` in CI, Dependabot |
| Audit logs | ❌ | AuditLog table |
| Data privacy | ❌ | privacy policy, retention |
| Backup/restore | ❌ | Supabase PITR + tested restore |

---

## 14. Testing Strategy

| Layer | Plan | Status |
|---|---|---|
| Unit | Vitest for lib (41 tests passing) | 🟡 working, needs globals fix |
| E2E | Playwright: auth, configurator, dashboard, portal | 🔴 blocked (app doesn't build) |
| Integration | Route handler tests (supertest) | ❌ |
| Security | zap/scanning | ❌ |
| Performance | Lighthouse, bundle budgets | ❌ |
| Accessibility | axe-core via Playwright | ❌ |

Fix vitest config (`globals: true`, exclude `e2e/`), restore deps, then grow coverage ≥60%.

---

## 15. Performance and Scalability Plan

Route-level code-splitting · next/image (+sharp) · bundle analyzer · Prisma pooling (Supabase) · indexes + pagination · ISR for tours · KV cache for aggregates · R2 CDN + AVIF/WebP · Sentry traces · stateless server · load assumptions ❓ (<5k studios, <100 concurrent sessions inferred).

---

## 16. SEO / Marketing / Analytics Plan

Per-page Metadata API · OG/Twitter · sitemap + robots · JSON-LD · `lib/analytics.ts` (exists) wired to PostHog (env set, ❓ no wiring found) · conversion funnel · consent banner (if EU).

---

## 17. Operations and Support Plan

Admin user mgmt ❌ · bookings view/edit (admin) partial · env-settings (exists) · pixel-streaming admin (exists) · Sentry alerts (code, dep missing) · backup/restore ❌ · rollback (Vercel) · feature flags ❌ · maintenance mode ❌.

---

## 18. Documentation Plan

Consolidate `docs/VIZTR-ARCHITECTURE-OVERVIEW.md` → ARCHITECTURE.md · OpenAPI/ts-rest from routes · env var table · deploy/migrate runbook · admin guide · help articles · ADRs (`docs/adr/`) for: auth choice, viewer (Babylon vs marzipano), storage, payments, test runner, dependency baseline.

---

## 19. Implementation Roadmap

> Estimates relative to a single competent full-stack dev.

### Phase 0 — Stabilize baseline (≈2–4 days) — 🔴 URGENT
- P0.1 Decide dependency baseline (§A2.2): restore committed `package.json` (recommended) and `pnpm install`.
- P0.2 Reconcile/restore `prisma/schema.prisma` (merge `Subscription` + `QaReport`/`Session`), run `prisma migrate` against live DB.
- P0.3 Fix vitest config (`globals:true`, exclude `e2e/`); add `postinstall: prisma generate`.
- P0.4 Make `tsc --noEmit` + `vitest run` green; restore `sharp` or drop its use in `lib/qa/checks.ts`.
- P0.5 Pick auth (recommend Supabase); add `middleware.ts` + role gates.
- P0.6 Delete `next.config.js` (keep `.ts`) or vice-versa.
- P0.7 CI green (typecheck/lint/test) on PR.

### Phase 1 — Foundation (≈1–2 weeks)
Single auth + middleware · RBAC on all APIs · error envelope + zod everywhere · rate limiting · Sentry + dep restore · error boundaries + loading/empty states.

### Phase 2 — Feature completion (≈2–3 weeks)
Portal full CRUD · booking polish + confirmations · dashboard real metrics · marzipano (if confirmed) · env-settings security (redact/encrypt).

### Phase 3 — UX/UI polish (≈1–2 weeks)
Responsive pass · states everywhere · a11y audit · design tokens.

### Phase 4 — Security/testing/perf (≈2 weeks)
Controls from §13 · test suite §14 · perf budgets · audit logs.

### Phase 5 — Launch readiness (≈1 week)
Legal pages · SEO · analytics + consent · marketing landing polish · backup/restore runbook · rollback rehearsal · launch checklist §23.

### Phase 6 — Post-launch (ongoing)
Realtime collab completion · notifications · search · support tooling · deeper analytics.

---

## 20. Task Breakdown

> P0 = launch-blocker · P1 = near-launch · P2 = post-launch · P3 = deferred. S ≤1d, M 1–5d, L 1–3w, XL >3w.

| ID | Title | Prio | Effort | Status |
|---|---|---|---|---|
| T0.1 | Decide + restore dependency baseline | P0 | M | 🔴 In Progress |
| T0.2 | Reconcile Prisma schema + migrate | P0 | M | Not Started |
| T0.3 | Fix vitest config + postinstall | P0 | S | Not Started |
| T0.4 | Green typecheck + unit tests | P0 | M | Not Started |
| T0.5 | Single auth + middleware + RBAC | P0 | L | Not Started |
| T0.6 | Resolve next.config duplicate | P0 | S | Not Started |
| T0.7 | CI green | P1 | M | Not Started |
| P2.1 | Portal CRUD | P0 | M | Partial |
| P2.2 | Env-settings security | P1 | L | Not Started |
| P2.3 | marzipano (❓) | P0 | M | Not Started |
| P3.1 | Responsive + states + a11y | P1 | L | Not Started |
| P4.1 | Security hardening | P0 | L | Not Started |
| P4.2 | Test suite expansion | P0 | L | Not Started |
| P4.3 | Perf budgets | P1 | M | Not Started |
| P5.1 | Legal + SEO + analytics | P1 | M | Not Started |
| P5.2 | Launch marketing | P1 | M | Partial |

**Historical note:** `TODO.md` logs T-001..T-053 (mostly ✅ done) — Phase 1 (foundation), Phase 2 (features incl. T-042 tour viewer, T-044 publish gate, T-045 public tour, T-046 analytics, T-047 collab, T-049 WebXR, T-050 Stripe), Phase 3 AI (T-052/T-053). Those map to committed HEAD.

---

## 21. Risk Register

| Risk | Likelihood | Impact | Mitigation | Prio |
|---|---|---|---|---|
| Working tree broken (deps) blocks all work | High | High | Phase 0 first (restore package.json) | P0 |
| Dual auth → security confusion | High | Medium | Pick one, add middleware/RBAC | P0 |
| Schema drift → runtime errors | High | High | Reconcile + migrate before deploy | P0 |
| Secrets leak to production | Medium | High | gitignore ✅, CI secret scan | P0 |
| Test runner/config instability | High | Medium | Unify on vitest, fix config | P0 |
| Two 3D viewers diverge (Babylon + marzipano) | Medium | Medium | Decide primary | P1 |
| Payments bugs at launch | Medium | High | Stripe webhook tests | P1 |
| Google OAuth/calendar quota | Medium | Medium | Scope review, refresh tokens | P1 |
| Compliance (GDPR) | Medium | Medium | Consent + privacy policy | P1 |

---

## 22. Open Questions / Assumptions

**Confirmed**
- Committed HEAD `344fe13` contains T-001..T-053 work (verified in git history).
- 30+ API routes, 10-model schema, dual auth, R2, Stripe, AI providers, Babylon viewer, WebXR, collab, pixel-streaming, marketing/pricing, Sentry all present in code.
- `.env.local` has real credentials (Supabase, R2, Redis, OpenAI, OpenRouter, Groq, Resend, Twilio, Stripe, Sentry, PostHog, Vercel, Cloudflare, GitHub, Google, signaling, metrics, cron); gitignored ✅.
- Working tree currently fails typecheck (1 err) and 16/21 vitest files.

**Inferred**
- Product is B2B SaaS for studios; clients consume via portal/shared links.
- Supabase is the hosted Postgres + intended auth; R2 is object storage.
- Single full-stack dev effort for estimates.

**Missing / Needs decision**
1. Auth system (NextAuth vs Supabase).
2. Dependency baseline (committed HEAD vs downgraded working tree).
3. Test runner (vitest vs jest).
4. Storage backend (R2 vs Supabase Storage).
5. Realtime stack (socket.io vs Supabase Realtime).
6. marzipano still wanted?
7. Relation of `babylon_XR_World/`, `VizAgents(...)/`, second repo `Vizagent`.
8. `next.config.ts` vs `next.config.js`.
9. Business model/pricing; launch date; budget; team size.
10. Compliance regions; analytics (PostHog) consent.

**Assumptions**
- Playwright + Vitest are the intended test stack.
- Stripe tiers in `lib/stripe/tiers.ts` reflect intended pricing (❓ verify values).

---

## 23. Final Launch Checklist

**Stability (first)**
- [ ] `pnpm install` clean from committed baseline; typecheck + lint + tests green
- [ ] Schema reconciled + migrated; DB matches migrations
- [ ] Single auth; middleware + RBAC on all protected routes/APIs

**Features**
- [ ] Upload → QA → publish → share tour end-to-end
- [ ] Client books → Google Calendar → reminder email → portal reflects it
- [ ] Stripe checkout/portal/webhook verified
- [ ] WebXR/AR tour works on supported devices
- [ ] Admin env-settings + pixel-streaming operational
- [ ] Dashboard shows real data

**Quality/Security**
- [ ] 0 type errors; no `!` on env vars; no excluded dirs hiding errors
- [ ] No placeholder/real secrets in repo; CI secret scan + `pnpm audit`
- [ ] Security headers + CSP; RBAC; rate limiting; audit log

**Testing**
- [ ] Vitest unit ≥60%; Playwright critical flows green

**Performance/SEO/Legal/Deploy**
- [ ] Lighthouse ≥90 · bundle budgets · pagination/caching
- [ ] Metadata, OG, sitemap, robots; analytics + consent; privacy/terms
- [ ] Vercel env vars complete; DB backup/restore tested; Sentry + alerts live; cron verified; rollback rehearsed

---

## 24. Definition of Done

### Stabilize (this week)
Repo builds (`next build`), typecheck + lint + tests green in CI, schema migrated, single auth, RBAC on protected areas.

### MVP
Upload→publish loop · client books + calendar + email · portal · Stripe payments · admin panels · dashboard real metrics · core UX states · security baseline (validation, RBAC, headers).

### Beta launch
Full E2E green · responsive + a11y · analytics + consent · Sentry alerts · backup/restore tested · rate limiting + audit logs · viewer choice finalized.

### Full production launch
Payments live · legal pages · SEO complete · load-tested · support runbooks · feature flags · post-launch backlog prioritized.

---
