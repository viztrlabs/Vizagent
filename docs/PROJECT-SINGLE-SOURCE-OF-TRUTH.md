# PROJECT SINGLE SOURCE OF TRUTH

**Project:** VizTR — Architectural Visualization Platform
**Version:** 1.0 (drafted Aug 2026)
**Status:** Live working document — update this file as the project evolves
**Source of truth for:** planning, development, architecture, testing, security, and launch

---

## 0. How to Read This Document

| Label | Meaning |
|---|---|
| ✅ Confirmed | Verified from code/docs/files |
| 🔶 Inferred | Reasonable conclusion from evidence, not explicitly confirmed |
| ❌ Missing | Not present / not built / unknown |
| ❓ Needs Stakeholder Confirmation | Requires a decision from the project owner |
| Status: Not Started / Partial / Implemented / Broken / Needs Redesign | Feature state |

---

# Part A — Understanding Summary (from raw context + code)

## A1. Short Summary of Understanding

VizTR is an **architectural visualization platform** targeting architecture, real-estate, and design studios. It is roughly **30% developed**. The app currently consists of a Next.js 16 App Router frontend with a set of demo/mvp modules: an asset upload flow, a Babylon.js virtual-tour viewer, a dashboard, a pixel-streaming player/admin, a booking system with Google Calendar sync and Resend email reminders, a client portal, and an admin env-settings panel. Auth is wired for Supabase but has **no sign-in UI or middleware** — pages guard via server-side redirects. The database (Prisma + PostgreSQL) has a minimal `User`/`Session` schema that has **never been pushed** to a database. The project deploys automatically to Vercel from GitHub and already has one cron job configured. There is a second repository (`VizTR-OS`) accidentally included as a git submodule that is **not part of the app**.

The codebase shows good foundations (typed client/server split, utility libraries, some unit tests, design tokens in Tailwind) but has major gaps: no test coverage for app code, no security hardening pass, no SEO/analytics wiring, no legal pages, no support/admin tooling, and no consolidated architecture documentation.

## A2. Critical Missing Information (needed before full implementation)

1. ❓ **Business model**: Is the product sold to studios (B2B SaaS), agencies, or property developers? Per-project licensing vs subscription?
2. ❓ **Auth scope**: Email/password only? Google OAuth? Is the "portal" per-client or per-employee?
3. ❓ **Payment**: Must-have for launch? Stripe, Paddle, or Razorpay (India)?
4. ❓ **Storage**: Supabase Storage, Cloudflare R2, or both? Asset size limits / retention?
5. ❓ **3D pipeline**: Where do source models come from (uploaded GLB/FBX, Unreal Engine pixel streaming, 360 photos)?
6. ❓ **The `VizTR-OS` submodule**: Keep as submodule, vendor it, or remove it from the main repo?
7. ❓ **Analytics consent**: Which regions / are EU GDPR or similar compliance requirements in scope?
8. ❓ **Team size**: solo dev, small team, or agency? Affects tooling and support scope.
9. ❓ **Deadline/budget**: target launch date and budget envelope.

## A3. Recommended Next Step

1. **Stabilize the foundation before adding features**: run `prisma db push`, create the Supabase project + env vars, build the auth UI (sign-in/sign-up) and a `middleware.ts` guard — the app currently cannot be fully exercised end-to-end.
2. Replace the placeholder values in `.env.local` with real credentials, and add the same vars to Vercel.
3. Decide on the `VizTR-OS` submodule (recommendation: remove from the app repo; keep as a separate repository).
4. Only then resume feature work (marzipano Task 8 integration is already mid-plan).

---

# Part B — The Single Source of Truth Document

## 1. Executive Summary

### 1.1 Project Overview
VizTR is an architectural-visualization platform. It lets studios upload 3D assets / 360 panoramas, publish interactive virtual tours (Babylon.js 3D and marzipano 360 photo views), run high-fidelity interactive sessions via Unreal Engine pixel streaming, schedule and run client review sessions (bookings synced to Google Calendar with automated email reminders), and give clients a branded portal. Admins get dashboards with analytics and environment/provider management.

### 1.2 Current Completion Estimate
**~30%.** Core modules exist in demo/MVP form. Foundation (auth, DB migration, env config, CI/test, security) is largely unfinished, which caps the app's real readiness below the raw page count.

### 1.3 Overall Readiness Level
| Area | Readiness |
|---|---|
| Frontend pages/UI | 🟡 45% — pages exist, auth-gated flows untestable without auth |
| Backend/API | 🟡 40% — several routes exist, no hardening |
| Data model | 🟠 20% — schema exists, never migrated |
| Auth | 🟠 10% — library wired, no UI/middleware/flow |
| Testing | 🔴 10% — 3 small unit test files only |
| Security | 🔴 5% |
| Deployment | 🟡 50% — Vercel auto-deploy works, env vars missing |
| SEO/Analytics/Legal | 🔴 5% |

### 1.4 Biggest Gaps
1. **No auth flow** (no sign-in/sign-up pages, no `middleware.ts`) — the portal/dashboard/admin areas are unreachable.
2. **Database never migrated** (`prisma db push` not run; no Supabase project configured).
3. **No test coverage** for app logic, APIs, or E2E flows.
4. **No security pass**: input validation, RBAC enforcement, rate limiting, secure headers, audit logs.
5. **No production env/secrets strategy**; many variables referenced but unset.
6. **Marzipano viewer migration incomplete** (Task 8) — current `/tour/[id]` uses the Babylon viewer.
7. **VizTR-OS accidentally committed as a git submodule** inside the app repo.
8. **No legal, SEO, analytics, or support tooling.**

### 1.5 Biggest Risks
- Auth/DB foundation never lands → product cannot be used by real users (Delivery/Product risk, HIGH).
- Unpushed schema + placeholder env vars → deployment looks green but breaks at runtime (Delivery, HIGH).
- Secrets in `.env.local` / placeholder values reaching production (Security, MEDIUM).
- Two 3D viewer stacks (Babylon + marzipano) → maintenance complexity and inconsistent UX (Technical, MEDIUM).

### 1.6 Recommended Path Forward
Follow the phased roadmap in §19 — stabilize foundation (Phase 0–1) before building more features. The quickest high-value sequence: env + Supabase setup → DB push → auth UI + middleware → typecheck/test/lint gate in CI → marzipano Task 8 → hardening + launch.

---

## 2. Product Definition

### 2.1 Product Purpose
Give architecture/real-estate studios a single platform to turn 3D assets into immersive, shareable client experiences (360 tours, real-time views, streamed high-fidelity sessions) and to manage the review/sales workflow around them (bookings, calendar, reminders, portal).

### 2.2 Business Objective
Sell VizTR as a subscription/B2B tool that saves studios time producing walkthroughs and increases close rates by letting clients self-serve and review remotely. ❓ Revenue model (per-seat, per-project, or volume) to be confirmed.

### 2.3 Target Audience
- **Primary:** architectural visualization studios and freelance CG artists (Power Users).
- **Secondary:** architecture firms, interior designers, real-estate developers and their sales teams.
- **End clients of the studio** (home buyers/tenants) consume tours via the portal or shared links.

### 2.4 Core Problem Being Solved
Producing and delivering interactive architectural content today is fragmented (heavy desktop tools, emailing large files, no client-facing review workflow). VizTR consolidates asset ingestion → tour/stream generation → client review → booking & follow-up in one web platform.

### 2.5 Primary User Goals
- Upload a model/panorama and publish a shareable tour in minutes.
- Create a branded client session with a meeting link, calendar event, and reminder emails.
- Monitor usage/views via dashboard analytics.
- Let clients view tours and book review sessions without software installs.

### 2.6 Success Metrics
- ✅ Confirmed – none defined yet. **Recommended (Inferred):**
  - Studio: tours published per month; time from upload → published tour; active studios.
  - Client: session booking completion rate; tour view completion; email open/click.
  - Business: MRR, activation (studio's first published tour), churn.

### 2.7 Scope of MVP
- Upload + storage for panoramas/models.
- Published tour pages (marzipano 360 viewer primary, Babylon optional).
- Pixel-streaming demo player + admin panel.
- Bookings + Google Calendar sync + reminder emails.
- Client portal with session list.
- Admin dashboard with stats.
- Email/password auth with role-based areas.

### 2.8 Scope of Full Launch
Everything in MVP plus: payment/billing, team/workspace management, advanced admin (user mgmt, support tools), analytics dashboard deepening, SEO/marketing site, legal pages, audit logging, SLA-ready ops (backups, monitoring, feature flags), and polish across empty/loading/error states.

### 2.9 Out of Scope (for now)
- Native mobile apps (responsive web only).
- Custom 3D content authoring inside the browser (uses imported assets/streams).
- Real-time multi-user editing of the same scene (design exists — see spec `2026-08-07-realtime-collaboration-design.md` — but is deferred).

---

## 3. User Personas and Journeys

### 3.1 Primary Persona — "The Studio Producer" (e.g., Maya/Dan, studio owner)
- Wants: publish tours fast, look professional, track usage.
- Journey: Login → Upload asset → (auto/QA pipeline) → Publish → Copy share link → Book review session → Dashboard.

### 3.2 Secondary Persona — "The Studio Admin"
- Wants: manage team, configure providers (email, storage, payment), monitor health.
- Journey: Login → Admin → env-settings / pixel-streaming panels → review logs.

### 3.3 Tertiary Persona — "The Client / Buyer"
- Wants: view the tour without installing anything, book/review a session.
- Journey: Open shared link → Tour → Book session → Calendar invite + reminder emails → Portal to view/manage sessions.

### 3.4 Core Journeys
| Journey | Steps | Status |
|---|---|---|
| Publish a tour | Upload → QA → publish → share | Partial (upload + QA API exist; publish flow incomplete) |
| Client views tour | Shared link → viewer | Partial (Babylon viewer works; marzipano pending) |
| Book a review session | Form → booking → Google Calendar → reminder | Implemented (API-level) |
| Client portal | Login → view sessions → reschedule | Partial (no auth flow) |
| Admin ops | Login → dashboards/panels | Partial (no auth flow) |

### 3.5 Entry Points
- Marketing homepage (`/` with upload dropzone). ❓ A real marketing landing page is missing.
- Shared tour links.
- Invite links to portal. ❓ Not built.

### 3.6 Conversion / Retention Actions
- Conversion: sign-up → first tour published; client booking completion.
- Retention: weekly digest, new-template notifications, portal session history. ❓ Not defined/built.

### 3.7 Admin/Support Journeys
- Support must reset passwords, view bookings, edit sessions, monitor errors. ❓ Support tooling not built (see §17).

---

## 4. Complete Feature Specification

> Priority: P0 (must) / P1 (should) / P2 (nice) / P3 (deferred). Effort: S/M/L/XL.

### 4.1 Authentication & Accounts
- **Description:** Email/password (and ❓ Google) sign-in, session handling, role-based areas.
- **User story:** "As a user I can sign up/in and access only my permitted areas."
- **Status:** Partial (Supabase libs wired; no UI/middleware).
- **Requirements:** sign-in/up UI, `middleware.ts` route guard, role gates (CLIENT/STAFF/ADMIN/SUPER_ADMIN), password reset, session expiry.
- **Acceptance criteria:** protected routes redirect unauthenticated users; roles restrict pages/APIs; logout works.
- **Dependencies:** Supabase project + env vars, DB migration.
- **Priority:** P0 — **Effort:** L — **Order:** 1.

### 4.2 Upload & Storage
- **Description:** Dropzone upload of panoramas/models to object storage with progress.
- **User story:** "As a producer I can upload a 360 panorama and see progress."
- **Status:** Partial (`UploadDropzone`, `UploadProgress`, `/api/assets`, `/api/assets/upload-url`).
- **Requirements:** signed upload URLs, size/type validation, progress, error states, storage backend decision (R2 vs Supabase Storage) — ❓ **Needs confirmation**.
- **Acceptance criteria:** large files upload reliably; progress UI accurate; failed uploads recover.
- **Priority:** P0 — **Effort:** M — **Order:** 2.

### 4.3 Virtual Tour — Babylon 3D Viewer
- **Description:** 3D tour viewer with hotspots, controls, AR/WebXR panel.
- **Status:** Implemented (components: `VirtualTourViewer`, `ViewerControls`, `useVirtualTourScene`, `HotspotMarker`, `ARPanel`; spec: `2026-08-07-virtual-tour-viewer-babylon-design.md`).
- **Acceptance criteria:** loads scene config; hotspots navigate; WebXR works on supported devices.
- **Priority:** P1 — **Effort:** M.

### 4.4 Virtual Tour — Marzipano 360 Viewer (in progress)
- **Description:** Photoreal 360 tour viewer (marzipano) as primary client-facing viewer.
- **Status:** Partial — nav helpers, `useMarzipanoTour`, `MarzipanoTourViewer` done in worktree `feat-marzipano-tour-viewer`; **Task 8 (integration with tour page) pending**. Design: `2026-08-09-virtual-tour-marzipano-viewer-design.md`.
- **Priority:** P0 — **Effort:** M — **Order:** 5 (after foundation).

### 4.5 Pixel Streaming
- **Description:** Stream high-fidelity UE content to browser; admin panel + local Windows scripts.
- **Status:** Partial/Implemented (`usePixelStreaming`, `PixelStreamingPlayer`, `/stream`, `admin/pixel-streaming`, `local/pixel-streaming/*.bat`, `ps-metrics-server.js`). Design: `2026-08-09-pixel-streaming-design.md`.
- **Requirements:** signaling + metrics endpoints, secure access, stream lifecycle, WebRTC reconnect.
- **Priority:** P1 — **Effort:** L.

### 4.6 QA / Validation Pipeline
- **Description:** Automated checks on uploaded content.
- **Status:** Partial (`lib/qa/run.ts`, `lib/qa/checks.ts`, `/api/qa/run`, `/api/qa/[jobId]/status`).
- **Priority:** P1 — **Effort:** M.

### 4.7 Bookings & Scheduling
- **Description:** Book a session; create Google Calendar event; track status; reminders.
- **User story:** "As a client I book a review session and get a calendar invite and reminder."
- **Status:** Implemented at API level (`/api/bookings`, `/api/bookings/[id]`, `lib/google-calendar.ts`, cron `session-reminders`).
- **Acceptance criteria:** booking persists to DB; gcal event created; reminder email sent before start; status transitions enforced.
- **Priority:** P0 — **Effort:** M — **Order:** 3.

### 4.8 Client Portal
- **Description:** Branded portal for clients to view/manage their sessions.
- **Status:** Partial (`/portal`, `PortalClient`, `SessionCard`) — needs auth flow.
- **Priority:** P0 — **Effort:** M — **Order:** 4.

### 4.9 Dashboard & Analytics
- **Description:** Stats cards + charts for usage.
- **Status:** Partial (`/dashboard`, `StatsCards`, `Charts`, `/api/dashboard`, `lib/analytics.ts`).
- **Priority:** P1 — **Effort:** M.

### 4.10 Admin — Environment Settings
- **Description:** Manage env vars / provider switching in-app.
- **Status:** Implemented (UI) — `/admin/env-settings` + `AdminEnvSettingsClient`.
- **Priority:** P1 — **Effort:** M. ⚠️ **Security review required** — storing env-like values in DB has implications (see §13).

### 4.11 Email (React Email)
- **Description:** Transactional emails: booking confirmation + session reminder.
- **Status:** Implemented (`emails/confirmation.tsx`, `emails/reminder.tsx`, `lib/emails/reminder.tsx`, Resend).
- **Priority:** P0 — **Effort:** S — **Order:** 3.

### 4.12 Feature map summary
| Feature | Status | Priority | Effort |
|---|---|---|---|
| Auth + accounts | Partial | P0 | L |
| Upload & storage | Partial | P0 | M |
| Marzipano tour viewer | Partial (worktree) | P0 | M |
| Bookings + calendar + reminders | Implemented | P0 | M |
| Client portal | Partial | P0 | M |
| Email templates | Implemented | P0 | S |
| Babylon 3D viewer | Implemented | P1 | M |
| Pixel streaming | Partial | P1 | L |
| QA pipeline | Partial | P1 | M |
| Dashboard/analytics | Partial | P1 | M |
| Admin env settings | Implemented (UI) | P1 | M |
| Payments | Not Started | P2 | L |
| Search/filter | Not Started | P2 | M |
| Notifications (in-app) | Not Started | P2 | M |
| Realtime collaboration | Not Started (design exists) | P3 | XL |

---

## 5. Information Architecture

### 5.1 Current sitemap
```
/                        Home (upload dropzone)
/stream                  Pixel streaming player
/tour/[id]               Tour viewer (Babylon; marzipano pending)
/portal                  Client portal
/dashboard               Dashboard (auth-gated)
/admin/env-settings      Env settings (auth-gated)
/admin/pixel-streaming   Pixel streaming admin (auth-gated)
/api/*                   asset, tour, qa, bookings, dashboard, cron
```

### 5.2 Page hierarchy (target)
```
Public
 ├─ /                  Landing + upload
 ├─ /stream            Streaming player
 ├─ /tour/[id]          Tour viewer
 ├─ /auth/sign-in
 ├─ /auth/sign-up
 ├─ /legal/*           (privacy, terms)
 └─ /pricing            (launch scope)
Client (CLIENT role)
 └─ /portal            Sessions, bookings
Studio (STAFF)
 └─ /dashboard         Analytics
Admin (ADMIN / SUPER_ADMIN)
 ├─ /admin/users
 ├─ /admin/env-settings
 └─ /admin/pixel-streaming
```

### 5.3 Navigation structure
- Header (implemented): Upload, Stream, Tours, Portal, Dashboard, Env Settings. **Gaps:** auth-dependent visibility, mobile menu, account menu.

### 5.4 User roles and access areas
| Role | Access |
|---|---|
| PUBLIC | `/`, `/stream`, `/tour/[id]`, `/auth/*` |
| CLIENT | + `/portal` |
| STAFF | + `/dashboard` |
| ADMIN | + `/admin/*` |
| SUPER_ADMIN | everything + user mgmt |

### 5.5 Public vs private areas
Public: home, stream, tour, auth. Private: portal, dashboard, admin.

---

## 6. Content Architecture

### 6.1 Page-by-page content plan
| Page | Content blocks | Status |
|---|---|---|
| Home | Hero, value props, upload CTA, features, testimonials, footer | 🔶 Minimal (dropzone only) |
| Stream | Player, latency/stats overlay, help text | Implemented (minimal) |
| Tour | Viewer + controls + hotspot hints | Implemented (Babylon) |
| Portal | Header/brand, sessions list, booking CTA | Implemented (minimal) |
| Dashboard | KPI cards, charts, period filter | Implemented (minimal) |
| Admin panels | Config tables/forms | Implemented |
| Marketing/pricing | ❌ Missing | Not Started |
| Legal (privacy, terms) | ❌ Missing | Not Started |
| Help/support | ❌ Missing | Not Started |

### 6.2 SEO metadata
- `app/layout.tsx` has title "VizTR" + description. ❌ Per-page metadata, OG tags, sitemap, robots.txt missing.

### 6.3 Forms
- Upload form (implemented), booking form (implemented), sign-in/sign-up (❌ missing), env settings form (implemented).

### 6.4 Content ownership/status
- Owner: ❓ project owner. Copy is developer-written; no marketing copywriter.

---

## 7. UX/UI Plan

### 7.1 Design system (existing)
- Tailwind 3.4 with custom theme (`tailwind.config.ts`); dark palette `#080a0f`/`#0D0D0F`; fonts Syne (display) / JetBrains Mono / Inter (❓ confirm in config); brand "VizTR". Existing components: Header, Cards, StatsCards, Charts, UploadDropzone/Progress, ViewerControls, SessionCard, ARPanel, HotspotMarker, PixelStreamingPlayer, LazyWrapper.

### 7.2 Missing UX states (global)
- **Loading states:** needed on all async pages (currently minimal).
- **Empty states:** e.g., "No bookings yet", "No tours yet" — ❌ missing.
- **Error states:** 500 errors surface raw; need friendly error boundaries + messages.
- **Success states / confirmations:** e.g., after booking, after publish — ❌ missing.
- **Confirmation dialogs:** destructive actions (delete asset, cancel booking) — ❌ missing.
- **Microcopy:** tooltips, validation messages — partial.

### 7.3 Responsive behavior
- Tailwind responsive utilities used; ❓ no dedicated mobile layout for viewer/header.

### 7.4 Accessibility requirements (target)
- WCAG 2.1 AA: semantic landmarks, focus management, keyboard navigation for viewers, ARIA labels on icons/buttons, color contrast on dark theme, reduced-motion support.

### 7.5 Design system needs
- Token documentation, component library inventory, iconography consistency (lucide-react used), motion guidelines.

---

## 8. Functional Architecture

### 8.1 System overview
```
[Browser]
   │
   ├── Next.js 16 App Router (RSC + client components)
   │       ├── Supabase client (Auth, Storage, DB via @supabase/supabase-js)
   │       ├── Prisma (Postgres via DATABASE_URL)  [server-side]
   │       ├── Google Calendar API (server)
   │       ├── Resend (emails, server)
   │       ├── R2 / Supabase Storage (asset blobs)
   │       └── Pixel Streaming (WebRTC) + metrics server
   └── Vercel (deploy + cron)
```

### 8.2 Frontend architecture
- App Router, RSC for server pages, client components extracted where needed (`.tsx` client files). Lazy-loading via `LazyWrapper` for heavy viewers. State: React state + `zustand` (dep present). Styling: Tailwind + `cva`/`clsx`/`tailwind-merge`.

### 8.3 Backend architecture
- Route Handlers in `app/api/*`. No external backend service. Prisma as ORM. Utilities in `lib/`.

### 8.4 API architecture
- REST-style Route Handlers. Zod available for validation but ❓ usage unverified. No centralized error contract or rate limiting.

### 8.5 Database architecture
- PostgreSQL (Prisma). Minimal schema (see §9). Not migrated.

### 8.6 Auth architecture
- Supabase Auth (@supabase/ssr present). ❌ No `middleware.ts`, no auth UI. Roles modeled in Prisma `Role` enum — needs to be reconciled with Supabase metadata/claims.

### 8.7 File/media handling
- Signed upload URL endpoint (`/api/assets/upload-url`) → object storage. ❓ Backend storage backend decision needed.

### 8.8 Notifications
- Email via Resend + React Email (implemented). In-app notifications ❌.

### 8.9 Payments
- ❌ Not built. Candidates in env settings UI: Stripe, Paddle, Razorpay. Deps not installed.

### 8.10 Search
- ❌ Not built.

### 8.11 Admin
- `/admin/*` panels exist (env-settings, pixel-streaming). User management ❌.

---

## 9. Data Model

### 9.1 Entities (current Prisma schema)
```
User
  id (cuid) PK, email (unique), name?, role (enum: PUBLIC/CLIENT/STAFF/ADMIN/SUPER_ADMIN, default CLIENT), createdAt
  sessions Session[]

Session (booking)
  id PK, email FK→User.email, firstName, lastName, company?, serviceId, projectType,
  notes?, date (string), time (string), startAt (DateTime), durationMinutes,
  status (enum: PENDING/CONFIRMED/COMPLETED/CANCELLED, default CONFIRMED),
  reminderSentAt?, gcalEventId?, createdAt
  @@index([email]) @@index([status]) @@index([startAt])
```

### 9.2 Relationships
- `User 1—N Session` (by email). ⚠️ FK on non-primary unique column — works, but consider `userId` FK for stability if emails change.

### 9.3 Gaps in the data model (recommended)
- `Asset`, `Tour`, `TourScene/Config`, `Project`, `Workspace/Team`, `Invite`, `EventLog/AuditLog`, `ProviderSetting` (backing the env-settings panel), `Payment`/`Subscription`, `ApiKey`. All **Recommended/Inferred** — confirm before designing.

### 9.4 Required fields & validation
- Target: enforce non-null, length limits, email format, ISO timestamps, enum values. Zod schemas centralized in `lib/validations.ts` (exists — extend).

### 9.5 Indexes/constraints/soft-delete/audit
- Indexes: add on booking `(startAt, status)` composite; assets by owner/status.
- Soft delete: recommended (deletedAt) for assets/tours.
- Audit: new `AuditLog` table for admin actions.

### 9.6 Data lifecycle
- Upload → temp → processed → published → archived → deleted (retention policy ❓).

---

## 10. API / Service Specification

### 10.1 Existing endpoints
| Method | Path | Auth | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/assets` | ? | list assets | Implemented (verify) |
| POST | `/api/assets/upload-url` | ? | signed upload URL | Implemented |
| GET | `/api/tours/[id]` | public | tour config | Implemented |
| POST | `/api/qa/run` | staff? | run QA | Implemented |
| GET | `/api/qa/[jobId]/status` | staff? | QA status | Implemented |
| GET | `/api/dashboard` | staff+ | stats | Implemented |
| POST/GET | `/api/bookings` | public (POST) | create/list bookings | Implemented |
| PATCH/DELETE | `/api/bookings/[id]` | client/admin | update/cancel | Implemented |
| POST | `/api/cron/session-reminders` | CRON_SECRET | send reminders | Implemented |

### 10.2 Requirements per endpoint (target)
- **Method + request/response**: document schema per route (OpenAPI/ts-rest recommended).
- **Auth**: all mutations require authenticated user; admin endpoints require ADMIN+.
- **Permission enforcement**: role checks server-side (never trust client nav).
- **Validation**: zod on every route body/params.
- **Error handling**: consistent `{ error: { code, message } }` envelope; no stack leaks.
- **Rate limiting**: on public booking creation, upload, auth, cron.
- **Webhooks**: Google Calendar push sync (optional), payment webhooks (later).

---

## 11. Current Code Audit

### 11.1 What exists (reusable)
- Next.js 16 App Router structure, typed utilities (`lib/utils`, `lib/types`, `lib/validations`, `lib/analytics`), Supabase client/admin split, tour config mappers + unit tests, QA pipeline, booking/calendar/email pipeline, pixel-streaming client + player + admin, env-settings admin, Header, design tokens.

### 11.2 What needs refactoring
- `lib/supabase/client.ts`: non-null assertions on env vars crash with a raw error (seen in dev) — guard with friendly message or lazy check.
- `app/(public)/tour/[id]/TourPageClient.tsx`: currently Babylon; awaits marzipano integration decision (worktree `feat-marzipano-tour-viewer`).
- Date fields on Session stored as `string` (`date`, `time`) plus `startAt` — redundancy; prefer single timestamp + derived values.

### 11.3 What should be replaced
- **`VizTR-OS` submodule inside app repo** — recommend removing from app (it is a separate OS project; tsconfig excludes it, which hides type-checking gaps).

### 11.4 What is missing
- `middleware.ts`, auth UI, error boundaries, loading/empty/error components, tests, CI, security headers, SEO, legal, admin user mgmt, payments, logging/monitoring, secrets management.

### 11.5 Technical debt
- Env vars referenced but unset; dev server port/background-start friction on Windows; `.env.local` placeholder values must not be committed (verify gitignore); package versions: `eslint-config-next`/`@next/bundle-analyzer` pinned to 15.0.0 while Next is 16.3.0 (upgrade or verify compatibility).

### 11.6 Code quality issues
- Non-null assertions (`!`) on env vars; mixed `any` usage in some clients (reported in history); inconsistent error UX; no lint gate in CI.

### 11.7 Security concerns
- Env var management in an admin panel risks exposing secrets in DB/UI — needs encryption + redaction design.
- No RBAC enforcement on APIs; no rate limiting; no audit log.
- Placeholder env values in `.env.local` must never be committed/pushed.

### 11.8 Testing gaps
- Only `lib/tour/map-tour-config.test.ts`, `lib/tour/hotspot-position.test.ts` (+ marzipano navigation test in worktree). No API/component/E2E tests.

### 11.9 Performance concerns
- Heavy 3D/streaming bundles — verify code-splitting (LazyWrapper exists, good). Image/media optimization not configured. No caching strategy for public tour data.

---

## 12. Recommended Technical Architecture

### 12.1 Preferred stack
**Confirmed by existing code:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 3, Prisma + PostgreSQL, Supabase (Auth/Storage/DB), Resend, Google Calendar API, Vercel, zod, vitest, Playwright, lucide-react, recharts, zustand.
**Recommendations (Inferred):** Keep this stack — it's coherent. Add: `@vercel/kv` or Upstash Redis for caching/queues; Sentry for error tracking; OpenTelemetry for logs; `ts-rest` or OpenAPI for API contracts; `drizzle`-style migrate workflow via Prisma migrations (use `prisma migrate` not `db push` once schema stabilizes).

### 12.2 Folder structure (target)
```
app/               routes (public / (dashboard) / (admin) route groups)
components/        ui/ shared/, feature components
lib/               server libs (db, auth, calendar, emails, storage, pixel-streaming)
emails/            React Email templates
prisma/            schema + migrations
docs/              specs, plans, this document
tests/             unit + integration + e2e
```

### 12.3 Component structure
- Presentational components in `components/ui`; feature components co-located; client components isolated from RSC; heavy viewers lazy-loaded.

### 12.4 State management
- Server state: RSC/route handlers + TanStack Query (recommended) or SWR; client UI state: zustand. ❓ Confirm preference.

### 12.5 API pattern
- Route handlers with zod validation + typed responses; centralized `lib/api` helpers (error envelope, auth guard, rate limit).

### 12.6 Database design
- Prisma schema v2 (add Asset/Tour/Workspace/AuditLog/ProviderSetting) + migrations.

### 12.7 Caching strategy
- `revalidatePath`/ISR for public tour pages; KV cache for dashboard aggregates; browser cache for static assets via Vercel CDN.

### 12.8 Background jobs
- Vercel cron (exists) for reminders; consider Upstash QStash/BullMQ for QA and email retries.

### 12.9 Logging / monitoring / error tracking
- Sentry (browser + server) — env vars already listed in `.env.local`; structured logs; uptime checks.

### 12.10 Environment strategy
- `.env.example` committed (NOT `.env.local`); per-env Vercel projects (preview/production); document all vars in a table (see §? — vars listed in `.env.local`).

### 12.11 Secrets management
- Vercel env vars + Supabase secrets; do NOT persist secrets in Postgres for the env-settings panel (redact/decrypt or move to Vercel API).

### 12.12 Deployment strategy
- GitHub → Vercel auto-deploy (exists). Add: CI (lint + typecheck + test) on PR; preview deploys per branch; production protection; rollback = re-deploy prior commit.

---

## 13. Security Plan

| Control | Current | Target |
|---|---|---|
| Auth hardening | Partial (Supabase libs) | email verify, rate-limited login, secure session cookies, 2FA optional |
| Authorization model | ❌ | role check helpers on every route; server-side enforcement |
| RBAC | Prisma Role enum exists | map Supabase claims → app roles consistently; protect admin routes |
| Input validation | zod dep present, usage spotty | zod on 100% of API bodies/params |
| Output escaping | React default | sanitize any HTML/MDX, guard `dangerouslySetInnerHTML` |
| CSRF/XSS/Injection | ❌ | same-origin checks, CSP + security headers (Next config), Prisma prepared statements (inherent) |
| Secure headers | ❌ | CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Frame-Options |
| Secrets handling | ❌ placeholder env committed risk | strict `.gitignore`, real vault/Vercel secrets, secret scanning in CI |
| Dependency security | ❌ | `pnpm audit` in CI, Dependabot/Renovate, upgrade `eslint-config-next` to 16.x |
| Audit logs | ❌ | AuditLog table for admin/booking mutations |
| Data privacy | ❌ | privacy policy, data retention, PII minimization, EU consent (if needed) |
| Backup/restore | ❌ | Supabase PITR + scheduled backups, tested restore runbook |
| Incident readiness | ❌ | error tracking alerts, on-call/runbook, status page (optional) |

---

## 14. Testing Strategy

| Layer | Plan | Target |
|---|---|---|
| Unit | Vitest for lib/utils, validations, tour mappers, calendar, emails, qa checks | ~80% on lib |
| Integration | Route handler tests (Vitest + supertest) for bookings, assets, qa, dashboard | all core routes |
| E2E | Playwright (dep present): auth, upload→publish, book session, portal, tour render | critical flows green |
| Security | zap/dependency scanning, manual pentest of admin panel | pre-launch |
| Performance | Lighthouse CI, bundle size budget, load test of booking API | budgets set |
| Accessibility | axe-core via Playwright | AA pass |
| Regression | nightly smoke suite | all critical flows |
| Coverage target | ≥60% overall by launch | — |

Critical flows to test: sign-up/in/out; upload→QA→publish; tour load (Babylon + marzipano); book→calendar→reminder email; portal CRUD; admin env-settings; pixel stream connect/disconnect; cron reminders (auth'd).

---

## 15. Performance and Scalability Plan

- **Frontend:** route-level code splitting (LazyWrapper for viewers), font subsetting, image optimization (next/image + sharp — dev dep present), bundle analyzer (`pnpm analyze`) to set budgets.
- **Backend:** Prisma connection pooling (Supabase pooler), query optimization, memoized dashboard aggregates.
- **DB:** indexes on hot columns, pagination on all list endpoints.
- **Caching:** ISR/`revalidatePath` for public tour pages, KV cache for stats.
- **Media:** R2/Supabase CDN, format conversion (AVIF/WebP), streaming uploads.
- **Monitoring:** Sentry performance traces, Vercel analytics.
- **Scalability:** stateless server (all state in DB/Redis); pixel streaming scaling via metrics server + autoscaling (out of initial scope).
- **Load assumptions:** ❓ unknown — assume < 5k studios, < 100 concurrent sessions at launch (Inferred).

---

## 16. SEO / Marketing / Analytics Plan

- **SEO structure:** per-page metadata via Next Metadata API; OG/Twitter cards; `sitemap.xml` + `robots.txt`; semantic headings; JSON-LD (Product/FAQ).
- **Metadata plan:** unique title/description per page; canonical URLs.
- **Analytics events:** `lib/analytics.ts` exists — wire: page_view, upload_started/completed, tour_viewed, tour_completed, booking_started/completed, reminder_clicked, signup, login. PostHog/GA4 dep present? (env vars listed).
- **Conversion tracking:** funnel upload→publish; booking completion.
- **Campaign tracking:** UTM capture (recommended).
- **Consent:** cookie consent banner if analytics is non-essential (GDPR-compliant) — required if EU users.
- **Content:** launch blog/case studies (Inferred recommendation).

---

## 17. Operations and Support Plan

- **Admin tools:** user mgmt (add/disable/reset pw), bookings view/edit, asset/tour moderation, env-settings (exists), pixel-streaming admin (exists).
- **Support workflows:** support inbox → identify user → issue → fix/respond; session edit via admin.
- **User management:** invite, role assignment, suspend.
- **Logs & dashboards:** Sentry, Vercel logs, structured server logs.
- **Alerting:** error rate spikes, cron failures, booking failures, streaming health.
- **Backup/restore:** DB PITR + weekly snapshot + tested restore runbook.
- **Rollback:** Vercel instant re-deploy of previous release; DB migrations backward-compatible.
- **Feature flags:** add simple flag table or Vercel flags for risky rollouts.
- **Maintenance mode:** `maintenance` page + env flag.

---

## 18. Documentation Plan

- **Technical:** ARCHITECTURE.md (consolidate from `VIZTR-ARCHITECTURE-OVERVIEW.md`), data model docs.
- **API:** OpenAPI/ts-rest spec generated from routes.
- **Deployment:** env var table, Vercel setup, DB migrate steps, cron config, pixel-stream setup (local `.bat` documented).
- **Admin:** how to manage env-settings, pixel-streaming, users.
- **User/help:** help articles for producers and clients.
- **Handover:** this document + ADRs (add `docs/adr/`).
- **ADRs:** record decisions: viewer stack (marzipano vs Babylon), storage backend, payments provider, submodule removal.

---

## 19. Implementation Roadmap

> Effort estimates are relative to a single competent full-stack dev.

### Phase 0 — Discovery & Stabilization (≈1 week)
- **Goal:** make the current app runnable end-to-end with real credentials.
- **Deliverables:** Supabase project + env vars set; DB pushed/migrated; `.env.example`; auth skeleton; CI green.
- **Tasks:**
  - T0.1 Env setup (Supabase, Resend, Google OAuth, storage, R2/CF) — P0
  - T0.2 Run `prisma db push` (or first migration) against Supabase Postgres — P0
  - T0.3 Create `.env.example`; verify `.env.local` is gitignored; scrub placeholders from repo — P0
  - T0.4 Build `/auth/sign-in` + `/auth/sign-up` + logout; add `middleware.ts` guard — P0
  - T0.5 Add `middleware.ts` role gate — P0
  - T0.6 CI: typecheck + lint + `pnpm test` on PR; add `pnpm audit` — P1
  - T0.7 Decide + execute `VizTR-OS` submodule handling — P1 (stakeholder)
- **Dependencies:** credentials from owner (stakeholder gate).
- **Definition of done:** user can sign up, log in, reach portal/dashboard/admin; CI green; typecheck + tests pass.
- **Risks:** credential access delays.

### Phase 1 — Architecture & Foundation (≈1–2 weeks)
- **Goal:** solid architecture and data model.
- **Deliverables:** Prisma schema v2 + migrations; API standards (error envelope, zod, auth guards); logging/Sentry; error boundaries; loading/empty/error components; docs/ADRs.
- **Definition of done:** new schema migrated; all API routes validate + enforce roles; Sentry reports; app errors render friendly boundaries.

### Phase 2 — Core Feature Completion (≈2–3 weeks)
- **Goal:** finish MVP features.
- **Tasks:** marzipano Task 8 integration (finish worktree merge) — P0; upload→QA→publish flow completion — P0; portal full CRUD (reschedule/cancel) — P0; booking flow polish + confirmation emails — P0; dashboard real metrics — P1; storage backend finalized — P0 (stakeholder).
- **Definition of done:** a studio can upload → publish → share → client books → reminders fire → portal reflects sessions.

### Phase 3 — UX/UI Completion & Polish (≈1–2 weeks)
- **Goal:** professional polish.
- **Tasks:** responsive pass; empty/loading/error/success states everywhere; confirmations; microcopy; accessibility audit + fixes; design token documentation.

### Phase 4 — Security, Testing, Performance (≈2 weeks)
- **Goal:** launch-ready quality.
- **Tasks:** security controls from §13; full test strategy from §14; perf budgets + Lighthouse; rate limiting; audit logging.

### Phase 5 — Deployment & Launch Readiness (≈1 week)
- **Goal:** public launch.
- **Tasks:** legal pages; SEO (metadata/sitemap/robots/OG); analytics wiring + consent; marketing landing page; production env verification; backup/restore runbook; rollback rehearsal; launch checklist (§23).

### Phase 6 — Post-Launch Improvements (ongoing)
- **Goal:** iterate.
- **Tasks:** payments (P2); notifications; search; realtime collaboration (P3); support tooling; deeper analytics; A/B testing.

---

## 20. Task Breakdown

> P0 = launch-blocker; P1 = should ship near launch; P2 = post-launch; P3 = deferred.
> S = ≤1d, M = 1–5d, L = 1–3w, XL = >3w.

| ID | Title | Cat | Prio | Effort | Status | Deps | Owner |
|---|---|---|---|---|---|---|---|
| T0.1 | Configure Supabase + env vars | Infra | P0 | M | Not Started | creds | Owner |
| T0.2 | Prisma db push / migration | Data | P0 | S | Not Started | T0.1 | Backend |
| T0.3 | `.env.example` + scrub placeholders | Sec | P0 | S | Not Started | — | Backend |
| T0.4 | Auth UI (sign-in/up/logout) | Auth | P0 | L | Not Started | T0.1 | Full-stack |
| T0.5 | `middleware.ts` + role gates | Auth | P0 | M | Not Started | T0.4 | Full-stack |
| T0.6 | CI (typecheck/lint/test/audit) | CI | P1 | M | Not Started | — | DevOps |
| T0.7 | Remove/decide VizTR-OS submodule | Repo | P1 | S | Not Started | decision | Owner |
| T0.8 | Fix env-settings security (redact/encrypt) | Sec | P1 | L | In Progress | — | Backend |
| P2.1 | Marzipano Task 8 integration | Feature | P0 | M | In Progress (worktree) | — | Frontend |
| P2.2 | Upload→QA→publish flow | Feature | P0 | M | Partial | T0.1 | Full-stack |
| P2.3 | Portal full CRUD | Feature | P0 | M | Partial | T0.4 | Full-stack |
| P2.4 | Booking polish + confirmations | Feature | P0 | M | Implemented | — | Full-stack |
| P2.5 | Dashboard real metrics | Feature | P1 | M | Partial | T0.1 | Backend |
| P2.6 | Storage backend decision | Infra | P0 | S | Not Started | decision | Owner |
| P3.1 | Responsive + state components | UX | P1 | L | Not Started | — | Frontend |
| P3.2 | Accessibility pass | UX | P1 | M | Not Started | P3.1 | Frontend |
| P4.1 | Security hardening (§13) | Sec | P0 | L | Not Started | T0.5 | Sec lead |
| P4.2 | Test suite (§14) | QA | P0 | L | Not Started | P2.x | QA |
| P4.3 | Perf budgets + Lighthouse | Perf | P1 | M | Not Started | — | Frontend |
| P5.1 | Legal pages | Content | P1 | S | Not Started | — | Owner |
| P5.2 | SEO + metadata + sitemap | SEO | P1 | M | Not Started | — | Frontend |
| P5.3 | Analytics + consent | Analytics | P1 | M | Not Started | — | Frontend |
| P5.4 | Launch marketing page | Content | P1 | M | Not Started | — | Owner |
| P6.1 | Payments (Stripe/Paddle/Razorpay) | Feature | P2 | L | Not Started | — | Backend |
| P6.2 | In-app notifications | Feature | P2 | M | Not Started | — | Full-stack |
| P6.3 | Search/filter | Feature | P2 | M | Not Started | — | Backend |
| P6.4 | Realtime collaboration | Feature | P3 | XL | Not Started | — | Senior |

---

## 21. Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner | Priority |
|---|---|---|---|---|---|
| Auth/DB foundation never completed | High | High | Phase 0 first; owner gate on creds | Owner | P0 |
| Schema not migrated → runtime failures at "green" deploy | High | High | T0.2 before feature work; CI verify | Backend | P0 |
| Secrets/placeholders leak to production | Medium | High | `.gitignore`, secret scan in CI, Vercel vars | DevOps | P0 |
| Env-settings panel exposes secrets | Medium | High | Encrypt/redact; RBAC; audit log | Backend | P0 |
| Two 3D viewers diverge | Medium | Medium | Choose primary (marzipano) + deprecate path | Frontend | P1 |
| No tests → regressions at launch | High | Medium | Test strategy §14 before launch | QA | P1 |
| Pixel streaming infra fails in production | Medium | Medium | Admin panel + metrics + health alerts | Full-stack | P1 |
| Google OAuth/calendar quota or consent issues | Medium | Medium | Refresh token handling, scopes review, monitoring | Backend | P1 |
| Unclear business model → wrong scope | Medium | High | Confirm pricing/scope before Phase 5 | Owner | P0 |
| Compliance (GDPR) not addressed | Medium | Medium | Consent banner, privacy policy, retention | Owner | P1 |

---

## 22. Open Questions / Assumptions

**Confirmed facts**
- Next.js 16.3.0 + React 19.2.8 + TS + Tailwind 3.4; Supabase, Prisma, Resend, Google Calendar, Vercel cron all wired in code.
- Pages exist: `/`, `/stream`, `/tour/[id]`, `/portal`, `/dashboard`, `/admin/env-settings`, `/admin/pixel-streaming` + APIs.
- Booking→calendar→reminder pipeline implemented.
- Marzipano viewer mid-implementation (worktree), Babylon viewer live.
- Vercel auto-deploys from GitHub `master`; preview URL works.
- Env vars listed in `.env.local` (placeholders).

**Inferred conclusions**
- Product is B2B SaaS for studios; clients consume via portal/shared links.
- MVP scope ≈ current feature set + auth + polish + tests.
- Supabase is intended as the primary backend (Auth/DB/Storage) alongside Prisma/Postgres.

**Missing information**
- Business model, pricing, launch date, budget, team size.
- Storage backend (Supabase Storage vs R2).
- Payment provider + necessity at launch.
- Auth methods (email only vs Google).
- Compliance regions.

**Assumptions made**
- Single full-stack developer effort for estimates.
- Playwright + Vitest are the intended test stack (deps present).
- Analytics provider is PostHog or GA4 (env vars listed) — confirm.

**Decisions needed before implementation**
1. Storage backend. 2. Auth methods. 3. Payments in/out of launch scope. 4. `VizTR-OS` submodule disposition. 5. Primary tour viewer (marzipano) with Babylon as secondary. 6. Pricing/business model.

---

## 23. Final Launch Checklist

**Feature completion**
- [ ] Auth (sign-up/in/logout/password reset) works for CLIENT/STAFF/ADMIN
- [ ] Upload → QA → publish → share tour completes end-to-end
- [ ] Marzipano viewer integrated (Babylon retained)
- [ ] Booking → Google Calendar → reminder emails verified
- [ ] Portal CRUD verified
- [ ] Admin env-settings + pixel-streaming operational
- [ ] Dashboard shows real data

**Code quality**
- [ ] Typecheck + lint + tests green in CI
- [ ] Zero `any` in critical paths; no `!` on env vars
- [ ] No placeholder secrets in repo

**Security**
- [ ] RBAC enforced on all APIs
- [ ] Rate limiting on auth/booking/upload
- [ ] Security headers + CSP
- [ ] Secret scanning + `pnpm audit` in CI
- [ ] Audit log for admin actions

**Testing**
- [ ] Unit coverage ≥60%
- [ ] E2E critical flows green
- [ ] Accessibility axe pass

**Performance**
- [ ] Lighthouse ≥90 (perf, SEO, a11y, best practices)
- [ ] Bundle budgets enforced
- [ ] Pagination + caching on list/aggregate endpoints

**SEO / Analytics / Legal**
- [ ] Metadata, OG, sitemap.xml, robots.txt
- [ ] Analytics events wired + consent banner
- [ ] Privacy policy + terms + (if relevant) GDPR/CCPA

**Deployment / Ops**
- [ ] Vercel prod env vars complete
- [ ] DB migrated + backup/restore tested
- [ ] Rollback rehearsal done
- [ ] Monitoring (Sentry) + alerts active
- [ ] Cron reminders verified in prod
- [ ] Support channels documented

---

## 24. Definition of Done

### MVP (P0 features)
- Auth works with role-gated areas; upload→publish→share loop works; client can book and receive calendar+email; portal shows sessions; admin panels functional; CI green with tests for critical libs; deployed on Vercel with real env vars; core UX states present; typecheck+lint+test pass; security baseline (RBAC, validation, headers) in place.

### Beta launch
- Everything in MVP +: full E2E suite green; responsive + accessibility pass; analytics wired with consent; dashboard real metrics; Sentry monitoring + alerts; backup/restore tested; rate limiting + audit logs; marzipano primary viewer polished.

### Full production launch
- Everything in Beta +: payments live (if in scope); marketing landing page; legal pages; SEO complete; load-tested; support workflow + runbooks; feature flags; SLAs/metrics dashboards; post-launch iteration backlog prioritized.

---

*End of PROJECT SINGLE SOURCE OF TRUTH. Update this file whenever scope, architecture, or status changes.*
