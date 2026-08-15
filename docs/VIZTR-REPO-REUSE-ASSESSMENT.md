# VizTR Existing Repo — Reuse Assessment
**Verdict: REUSE the engineering backbone → RESOLVE the conflicts → REBUILD the surface layer.**

> **Scope:** `C:\Users\Arch_Viz\Desktop\VizAgent` (Next.js 16 monorepo, ~30–40% built) reviewed against the locked technical decisions, design system (`VIZTR-UXUI-DESIGN-SYSTEM.md`), and the complete-build master plan (`VIZTR-MASTER-PLAN.md`).
>
> **Bottom line:** roughly **50–60% of the codebase is reusable without compromise** (Babylon.js viewers, upload, QA, bookings/calendar/email, pixel streaming, R2, Stripe, clean repository/queue/worker layering, Prisma schema). The rest either **conflicts with locked decisions** (auth architecture, design system, tour viewer) or **is missing** (content engine, XR World Console, agent orchestration, WebAR/VR, CRM, admin user mgmt). None of it is junk — every part either gets reused, adapted, or informs the rebuild.

---

## 1. Verdict at a Glance

| Category | Share | What it means |
|---|---|---|
| **Reuse as-is** | ~40% | Babylon viewers + configurator, upload, QA, deploy, bookings/calendar/email, pixel streaming, R2, Stripe, repositories/queues/workers, Prisma schema, tests |
| **Reuse after adaptation** | ~20% | Design tokens (colors OK, fonts/theme/glass must change), auth plumbing (Supabase kept, NextAuth removed), projects/portal/dashboard pages (restyle to design system), AI provider libs (no orchestration yet) |
| **Rebuild / build new** | ~40% | Content engine (non-coding website), XR World Console, WebAR + native VR, 13-agent orchestration, CRM, admin user mgmt + audit, marketing site as cinematic 3D, security hardening |

**Key good news:** the repo already uses **Babylon.js as the core 3D engine** and **Cloudflare R2 via S3-compatible client** — both match our locked decisions. It also already has `tenantId` on every table, a clean `lib/server/repositories|queues|workers` layering, and green lint/typecheck.

---

## 2. Reuse As-Is (matches locked decisions)

| Area | Evidence in repo | Why it's safe |
|---|---|---|
| **Babylon.js viewer + XR configurator** | `components/viewer/*` (VirtualTourViewer, useVirtualTourScene, HotspotMarker, ARPanel), `components/configurator/*` (BabylonCanvas, Sidebar, Toolbar, HotspotsPanel, LightingPanel, MaterialsPanel, ExportPanel), `lib/xr/*` (webxr, input-handler, scene-understanding), `lib/tour/*` (map-tour-config, hotspot-position) | Core engine = Babylon.js per ADR 6.1 Revised. Configurator covers hotspots/lighting/materials/AR/export — a strong base for the Interaction Editor (M6) |
| **Upload pipeline** | `components/upload/*`, `app/api/assets/*` (upload-url, upload/init, upload/complete, upload/abort), validation in `lib/validations.ts` | Matches M4 ingest spec: presigned/chunked/resumable upload, size/type validation, progress |
| **QA engine** | `lib/qa/*` (checks, run), `lib/server/qa/*` (qa-engine, glb-loader), `app/api/qa/*` | Matches M7: automated checks + per-project report + status. Extend to triangle/texture budgets |
| **Publish/deploy** | `app/api/deployments/*`, `lib/server/repositories/deployment*` | Matches M8 baseline (preview/production, rollback). Add QA-gate + approval token wiring |
| **Bookings + calendar + email** | `lib/google-calendar.ts`, `lib/emails/*` (React Email), `lib/server/queues|workers/*` (calendar-sync, session-reminder), `app/api/bookings/*`, `app/api/cron/session-reminders` | Matches M16/M11: booking → calendar event → reminder email pipeline, fully implemented |
| **Pixel streaming** | `lib/pixel-streaming/*`, `components/pixel-streaming/*`, `components/stream/*`, `app/(public)/stream/*`, `app/(dashboard)/admin/pixel-streaming/*`, `local/*` (.bat scripts), `ps-metrics-server.js` | Matches M5.5: player, metrics overlay, admin panel, local GPU orchestration |
| **R2 storage** | `lib/server/lib/r2.ts` + `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | Matches locked R2 decision |
| **Billing** | `lib/stripe/*` (server, tiers), `app/api/payments/*` (checkout, portal, webhook), `Subscription` + `tier` in Prisma | Matches M14 foundation |
| **Data model** | Prisma schema: User, Project, Asset, QAReport, Deployment, XrAsset, Configuration, ConfiguratorSession, Viewer, Subscription (+ Session bookings), all with `tenantId` | Strong overlap with master-plan §4 table groups; extend, don't replace |
| **Architecture layering** | `lib/server/repositories/*` (base + per-entity), `lib/server/services/*`, `lib/server/queues/*`, `lib/server/workers/*`, tenant middleware, events publisher | Clean repository/service/queue pattern — exactly what the platform needs as it grows to 13 agents |
| **Testing + tooling** | Vitest config + existing suites (qa-engine, analytics, deployment, webxr, ai providers, tour mappers, r2, presence), Playwright, Sentry config, bundle analyzer, `optimizePackageImports` | Matches testing/observability decisions |

---

## 3. Must Change (discrepancies against locked decisions)

| # | Conflict | Current state in repo | Required change |
|---|---|---|---|
| 1 | **Auth architecture (HIGH)** | **Dual auth:** NextAuth 5 beta (`lib/auth.ts`, `app/api/auth/[...nextauth]`) with Google + a hardcoded `ADMIN_EMAIL/ADMIN_PASSWORD` Credentials provider, **and** Supabase Auth (`lib/supabase/*`, signin/signup pages). NextAuth token carries `role` client-side. | **Locked decision: Supabase Auth.** Remove NextAuth (or park it), standardize on Supabase client/server/admin, add `middleware.ts` route guard + role claims → app roles. Kill the hardcoded admin credential path. |
| 2 | **Design system — fonts (HIGH)** | `tailwind.config.ts` + `globals.css`: Bebas Neue (display), Syne (heading), DM Sans (body). No mono font. | **Locked:** Space Grotesk (display) + Inter (body/UI) + JetBrains Mono (technical). Update Tailwind font families + Google Fonts import. |
| 3 | **Design system — dual theme (HIGH)** | Dark-only: `darkMode: 'class'`, `<html className="dark">`, only dark palette. No light theme, no auto, no theme provider/toggle. | **Locked:** dark/light/auto system-follow + persisted override; semantic tokens (bg-base, bg-surface, text-primary/secondary, accent-cyan/violet with light-mode deepens, glass-bg/glass-border). Build the theme provider + token file. |
| 4 | **Design system — glass + geometry** | No glass tokens; radius `sm 4 / md 8 / lg 12 / xl 16`. | **Locked:** glass surfaces (`blur(16px) saturate(140%)`, border, top highlight, fallback), radius `8 / 12 / 16 / 24`. |
| 5 | **Tour viewer (MEDIUM)** | `/tour/[id]` renders the **Babylon** viewer; **no marzipano anywhere in main** (grep confirmed). Marzipano work exists in an unmerged worktree. | **Locked (ADR 6.1.1):** Marzipano is the primary 360° tour viewer. Merge the worktree, wire `/tour/[id]` to Marzipano for 360 tours; keep Babylon for 3D/WebXR/VR scenes. |
| 6 | **Role model (MEDIUM)** | Prisma default `client`; docs reference CLIENT/STAFF/ADMIN/SUPER_ADMIN. | **Locked:** `super_admin / admin / user(studio) / client` + public. Align enum/strings + map Supabase claims. |
| 7 | **Cache-control (MEDIUM — perf/correctness)** | `next.config.ts` sets `Cache-Control: public, max-age=31536000, immutable` on `source: '/:path*'` — **every route**, including HTML pages and APIs. | Scope immutable caching to `/_next/static`, `/fonts`, and image paths only. As-is, published tours, auth state, and dashboards can be served stale/immutable to visitors. |
| 8 | **Marketing site (MEDIUM)** | `(marketing)/page.tsx` is a minimal static hero + CTAs; `/demo` link has no page. | Rebuild per design system: cinematic 3D hero (dark in both themes), glass nav, deep-breathing motion, scroll-driven camera, staggered reveals, `is_placeholder` content. |

---

## 4. Missing Entirely (must be built)

| Feature | Module (master plan) | Notes |
|---|---|---|
| **Content engine — non-coding website** | M9 | Page → Section → Block model, admin page builder, draft/publish/versioning/rollback, `is_placeholder`, SEO per page. **Nothing exists.** |
| **XR World Console** | M10 | Single dashboard launching all 5 XR services. The Babylon configurator + projects pages are components *inside* it, not the console. |
| **WebAR mode + native VR builds** | M5.3 / M5.4 | WebXR lib partial; no marker/markerless AR flow, no Quest/Pico/Vision Pro builds. |
| **13-agent orchestration** | M15 | `lib/ai/*` has provider libs (OpenAI/Anthropic/Ollama) + config + guardrail specs, but **no LangGraph/CEO/Hermes orchestration, no MCP connector, no agent runtime**. |
| **CRM** | M13 | Nothing. |
| **Admin user management + audit + monitoring** | M12 | env-settings + pixel-streaming panels exist; user directory, login history, API keys, audit log viewer, live task board do not. |
| **Client portal full (approvals/annotations/versions)** | M11 | Basic portal + sessions exist; approvals, pinned 3D annotations, threaded comments, version history missing. |
| **Security hardening** | M18/M2 | No middleware guard, no rate limiting, no security headers/CSP, no audit logging, no RLS policies in SQL, no secret scanning in CI. |
| **SEO / legal / analytics consent** | — | Minimal metadata; no sitemap/robots/OG per page, no legal pages, no consent banner. |

---

## 5. Performance Findings

**Already strong:** `optimizePackageImports` for Babylon/recharts/lucide, `LazyWrapper` + `dynamic(ssr:false)` for heavy viewers, `next/image` AVIF/WebP, explicit `deviceSizes`, bundle analyzer, Sentry perf traces, ISR on the tour page (`revalidate: 60`).

**Must fix:** the global `Cache-Control: immutable` on `/:path*` (see §3 #7) — this actively hurts correctness and can make pages appear "stuck."

**Watch during build:** marzipano + Babylon both in one bundle → keep route-level splitting; configure image optimization for R2/Supabase CDN; add caching for dashboard aggregates (Upstash/KV is already a dependency).

---

## 6. Security Findings

- `.env` / `.env.local` are **gitignored** (good) but exist locally with real-looking values — do not push; add secret scanning to CI.
- **No `middleware.ts`** — route protection is per-page and incomplete; the app is effectively open today.
- **NextAuth Credentials provider = single hardcoded admin** (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) — not a real user system; must be replaced by Supabase Auth + role gates.
- **`role` placed in the NextAuth JWT** — client-readable; roles must come from Supabase claims/DB on the server.
- **Admin env-settings panel** stores env-like values in the DB (their own doc flags this as T0.8) — needs encryption/redaction + RBAC + audit before launch.
- No rate limiting, no CSP/security headers, no audit log, no RLS policies yet.

---

## 7. Disposition by Module (M1–M18)

| Module | Disposition |
|---|---|
| M1 Foundation | **Reuse** types/UI kit/utils; replace tokens with locked dual-theme token set; add mono font. |
| M2 Identity & Access | **Rebuild** — keep Supabase plumbing, remove NextAuth, add `middleware.ts` + role gates + RLS + audit. |
| M3 Projects | **Reuse** — projects CRUD + repositories already solid. |
| M4 Asset pipeline | **Reuse** ingest + validation; **extend** optimization/LOD/generation/tiling. |
| M5 XR engines | **Reuse** Babylon tour + configurator + pixel streaming; **complete** marzipano (merge worktree); **build** WebAR + VR. |
| M6 Interaction editor | **Reuse** configurator panels as the editor core; add animation timeline + branching. |
| M7 QA engine | **Reuse**; extend checks + integrate gate. |
| M8 Publish engine | **Reuse**; wire QA-gate + approval token. |
| M9 Content engine | **Build new.** |
| M10 XR World Console | **Build new** around existing configurator/projects components. |
| M11 Client portal | **Reuse** basics; **extend** approvals/annotations/versions. |
| M12 Admin console | **Reuse** env-settings + pixel-streaming panels; **build** users/task-board/monitoring/audit. |
| M13 CRM / Analytics / AI | Analytics: **reuse** partial; CRM: **build**; AI: **reuse** provider libs, build orchestration. |
| M14 Billing | **Reuse** (Stripe lib, payments routes, tiers, subscriptions). |
| M15 AI agents | **Build** orchestration on top of existing `lib/ai` providers. |
| M16 Communications | **Reuse** email pipeline; add in-app + multi-channel. |
| M17 Enterprise / Marketplace | Build (post-MVP; design only). |
| M18 Infra & Ops | **Reuse** CI/Vercel/Sentry/queues; fix cache header; add security headers, rate limits, secret scan. |

---

## 8. Recommended First Steps (in order)

1. **ADR: adopt the reuse strategy** — record exactly what is reused vs rebuilt so it never drifts.
2. **Resolve auth** — cut to Supabase Auth, add `middleware.ts` + role gates, remove hardcoded admin creds. *Unblocks every gated flow and is the top risk in their own source-of-truth doc.*
3. **Align the design system** — fonts, dual-theme provider, glass tokens, radius. *This is the "no design compromise" gate; do it before restyling any page.*
4. **Merge the marzipano viewer** and wire it as the primary 360 tour viewer (Babylon retained for 3D/WebXR/VR).
5. **Fix the global immutable cache header.**
6. Then continue the complete-build roadmap (`VIZTR-MASTER-PLAN.md`) — next big builds: content engine, XR World Console, then agents.

---

*Assessment date: August 10, 2026 · Based on direct inspection of the repo at the given path.*
