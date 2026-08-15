# VizTR — Existing Repo (`VizAgent`) Reuse Assessment
**Can we adopt the existing ~30% repo without discrepancy or design/performance compromise?**

> **Date:** August 10, 2026 · **Status:** Working assessment · **Evidence basis:** `PROJECT-SINGLE-SOURCE-OF-TRUTH.md` (uploaded) describing `C:\Users\Arch_Viz\Desktop\VizAgent`. A code-level audit is still pending (repo not yet mounted). Every "verify" below is a check to run against the actual code before locking the integration plan.

---

## 1. Verdict

**YES — adopt the repo as the codebase foundation, but migrate it onto the locked plan before building further.** It is built on the same core stack we locked (Next.js 16, Supabase + Prisma, Babylon.js, Marzipano, Resend, Vercel, zustand, Vitest, Playwright), so reuse saves real build time — especially the hardest parts (Babylon tour viewer, Pixel Streaming client + admin, QA pipeline, bookings/calendar/email).

**However, it cannot be merged as-is.** It has 6 categories of deltas that would otherwise silently compromise the project:
1. **Design system mismatch** (dark-only theme, wrong display font) → must be migrated to the locked dual-theme glass system. This is a token-level swap, not a rewrite.
2. **Role model mismatch** (5-role model incl. PUBLIC/STAFF) → reconcile to the locked 4-role model + public surface.
3. **Security foundation missing** (no RLS, no auth UI/middleware, env-secrets stored in a DB-backed admin panel) → conflicts with the locked security model.
4. **Storage backend undecided** (Supabase Storage vs Cloudflare R2) → locked decision is Cloudflare R2.
5. **Structural divergence** (single app vs the locked pnpm monorepo; stray `VizTR-OS` submodule; excluded `babylon_XR_World/` demo code).
6. **Locked platform modules not present at all** (content engine, XR World Console, CRM, 13 agents, billing, immersive public site) → these get built per the master plan, not bolted on.

Bottom line: **reuse the skeleton and the hard XR/booking/QA infrastructure; replace or re-skin the non-conforming parts early; build the missing platform modules on top.** The repo shortens Phase 1 of the master plan substantially but does not eliminate it.

---

## 2. What the repo actually is (per SSOT)

| Area | State |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 3.4 |
| Backend/data | Supabase (Auth/Storage), Prisma + PostgreSQL; **schema exists but never migrated** |
| Auth | Supabase libs wired, **no sign-in/sign-up UI, no middleware** |
| Tour viewer | Babylon.js viewer **implemented**; Marzipano 360 viewer **mid-integration** (worktree, Task 8 pending) |
| Pixel streaming | Player, admin panel, local Windows scripts, metrics server — **partial/implemented** |
| QA pipeline | `lib/qa` + `/api/qa/*` — **partial** |
| Bookings | Booking → Google Calendar → Resend reminders — **implemented at API level** |
| Client portal | `/portal` — **partial** (needs auth) |
| Dashboard | `/dashboard` + `/api/dashboard` — **partial** |
| Admin | `/admin/env-settings`, `/admin/pixel-streaming` — **implemented (env-settings needs security rework)** |
| Quality gates | ESLint flat config + `tsc --noEmit` **pass clean** (2026-08-10) |
| Tests | 3 small unit test files only; Vitest + Playwright deps present |
| CI/deploy | Vercel auto-deploy + one cron; **no CI gate** |
| Readiness | ~33% (frontend 45%, backend 40%, data 20%, auth 10%, testing 10%, security 5%) |

---

## 3. Stack alignment vs locked decisions

| Layer | Locked decision | Existing repo | Verdict |
|---|---|---|---|
| Framework | Next.js 16.x (App Router) | Next.js 16.3.0 | ✅ Aligned (lock to 16.x) |
| Language | TypeScript strict | TypeScript | ✅ Aligned (verify strict) |
| Styling | Tailwind + shadcn/ui | Tailwind 3.4 + cva/clsx/tailwind-merge | 🟡 Close — verify shadcn/ui components present; adopt if not |
| Core 3D engine | **Babylon.js** (ADR 6.1 Revised) | Babylon.js tour viewer | ✅ Aligned |
| Virtual tours | **Marzipano** (ADR 6.1.1) | Marzipano mid-integration | ✅ Aligned — finish Task 8 |
| AR | MindAR markers + Babylon WebXR-AR | `ARPanel` (engine to verify) | 🟡 Verify → align to locked AR approach |
| State | Zustand + TanStack Query | zustand present | 🟡 Verify TanStack Query; add if missing |
| Motion | Framer Motion + GSAP + Lenis | unknown | 🟡 Verify → add (required by design system) |
| Database | Supabase PostgreSQL + Prisma + **RLS on all tables** | Supabase + Prisma; no RLS | 🟡 Core aligned; RLS to be added |
| Auth | Supabase Auth + JWT, MFA for admins | Supabase libs; no UI/middleware | 🟡 Aligned — finish auth flow |
| Storage | **Cloudflare R2** | undecided (Supabase Storage vs R2) | ❌ Decision needed → R2 per locked decision |
| Email | Resend | Resend + React Email | ✅ Aligned |
| Payments | Stripe/Razorpay | not built | 🔶 Gap — per roadmap |
| Hosting | Vercel + Railway | Vercel only | 🟡 Add Railway for agents/queues later |
| CDN/tunnel | Cloudflare (CDN, DNS, tunnels) | Cloudflare implied (Vercel) | 🟡 Verify tunnel readiness for Pixel Streaming |
| Queue | Redis + BullMQ | none | 🔶 Gap — per roadmap |
| Testing | Vitest + RTL + Playwright | Vitest + Playwright deps | ✅ Aligned — add RTL, build coverage |
| Design tokens | `packages/design-tokens` dual-theme | Tailwind custom theme (dark only) | ❌ Migrate (see §4) |
| Repo structure | pnpm monorepo (Turborepo) | single app + stray submodule | ❌ Structural decision (§6) |

**~10 layers aligned, ~3 to verify, ~3 need explicit action.** This is why reuse is clearly worthwhile.

---

## 4. Design-system delta (the "no design compromise" part)

The repo's design and the locked `VIZTR-UXUI-DESIGN-SYSTEM.md` diverge. All fixes are **token/theme-level**, not page rewrites:

| Item | Repo today | Locked design system | Action |
|---|---|---|---|
| Theme | dark-only (`#080a0f` / `#0D0D0F`) | **dual theme** dark/light/auto + glass throughout | Build dual-theme tokens; theme provider with system-follow + manual toggle |
| Display font | Syne | **Space Grotesk** | Swap in font stack |
| Body font | Inter | Inter | ✅ keep |
| Mono font | JetBrains Mono | JetBrains Mono | ✅ keep |
| Accent palette | (verify) | cyan `#00e5ff` + violet `#7c3aed` (deepened in light) | Align tokens |
| Surfaces | dark flat | glass: blur(16px) saturate(140%), glass borders, elevation | Apply glass system to nav/cards/panels |
| Layout | (verify) | 12-col, 1280px site / 1440px dashboard, radius 8–24, 4px scale | Align geometry |
| Motion | minimal | deep-breathing hero, scroll camera, staggered reveals, reduced-motion support | Add motion layer per design system |
| 3D stage rule | — | hero + XR canvases stay cinematic dark in **both** themes | Enforce in theme provider |
| Component inventory | Header, Cards, StatsCards, Charts, Dropzone, ViewerControls, SessionCard, ARPanel, HotspotMarker, StreamPlayer, LazyWrapper | Site + dashboard inventory (Hero3D, Navbar, ServicePillarCard, XRLaunchCard, XRConsoleGrid, BlockEditor, PublishBar, …) | Map existing → inventory; build missing |
| Placeholder strategy | — | `is_placeholder: true` everywhere until real content | Adopt in content model |

**Consequence:** existing screens get re-skinned onto the token system. This is expected work and does not count against the "30% reuse" — the logic, APIs, and XR code are untouched; only presentation layers conform.

---

## 5. Performance posture (the "no performance compromise" part)

The repo already has good instincts (LazyWrapper code-splitting, typed client/server split). The locked targets are: web load <2s (3G), FCP <1.5s, 60fps desktop / 30fps mobile, VR 90fps, model load <3s, streaming latency <100ms.

| Area | Repo today | Needed to hit locked targets |
|---|---|---|
| Code-splitting | `LazyWrapper` for heavy viewers ✅ | Keep; enforce route-level budgets |
| Image/media optimization | ❌ not configured | `next/image` + format conversion (AVIF/WebP), CDN caching |
| Public tour caching | ❌ none | ISR / `revalidatePath` for `/tour/[id]`; CDN edge caching |
| 3D/WebGL budgets | (verify) | Draco/KTX2 compression, LODs, FPS-driven quality, GPU cleanup on unmount |
| Dashboard aggregates | (verify) | Cache/queue for stats; pagination on all lists |
| Bundle budgets | `@next/bundle-analyzer` pinned ^15 (Next is 16) | Upgrade pin, set budgets, Lighthouse gate ≥90 |
| Fonts | (verify) | Subset + preload; Space Grotesk + Inter + JetBrains Mono |
| Motion perf | — | Respect `prefers-reduced-motion`; JS-driven scroll via Lenis capped to desktop |
| Observability | ❌ | Sentry + Vercel analytics; perf traces |

No blocker — these are the same hardening items already in master plan phases 4/7.

---

## 6. Reuse map — what to keep, adapt, or build fresh

### ✅ Reuse as-is (core value of the repo)
- Next.js 16 App Router scaffolding, typed `lib/` split (utils, types, validations, analytics).
- Supabase client/admin split + Prisma setup (schema to be re-migrated/extended).
- Babylon.js Virtual Tour viewer (`VirtualTourViewer`, `useVirtualTourScene`, `HotspotMarker`, `ARPanel`) — matches ADR 6.1 Revised.
- Marzipano viewer worktree (`useMarzipanoTour`, `MarzipanoTourViewer`) — finish Task 8 → matches ADR 6.1.1.
- Pixel Streaming client + player + admin + local `.bat` scripts + metrics server.
- QA pipeline (`lib/qa`, `/api/qa/*`) — extend with the locked 5 checks + extended checks.
- Bookings → Google Calendar → Resend pipeline (confirmations + reminders + cron).
- Upload dropzone + progress + `/api/assets/upload-url`.
- zustand, recharts, lucide-react baseline; LazyWrapper pattern.
- Tailwind config as the seed for the locked design tokens.

### 🔄 Adapt (must change to conform)
- **Design layer:** dual-theme + glass tokens, Space Grotesk swap, motion layer, component-inventory mapping (§4).
- **Roles:** `PUBLIC/CLIENT/STAFF/ADMIN/SUPER_ADMIN` → locked **Super Admin / Admin / User-Studio / Client** + public surface (`STAFF` → `User/Studio`; PUBLIC handled as route-level public area, not a DB role).
- **Storage backend:** finalize **Cloudflare R2** (locked); keep the presigned-URL flow.
- **Auth:** build sign-in/sign-up/middleware (missing anyway); wire Supabase Auth roles to app roles.
- **Env-settings panel:** **rework or remove** — storing secrets in a DB-backed admin panel violates the locked security model (secrets live in Vercel/Supabase vault, never DB). Replace with read-only status/settings view if kept.
- **Tour page:** make Marzipano the primary client-facing viewer, Babylon secondary (per ADR 6.1.1); keep both in the XR World Console.
- **Dashboard:** evolve into the locked **XR World Console** (one launcher for all 5 modes) rather than a single stats page.

### 🔨 Build fresh (locked platform, absent in repo)
Per the master plan §3 module catalog — **M9 Content Engine** (non-coding website, Page/Section/Block + admin builder), **M10 XR World Console** full, **M11 Client Portal** completion, **M12 Admin/Super Admin console** (users, audit, monitoring), **M13 CRM + Analytics + AI access**, **M14 Billing**, **M15 13-agent AI system**, **M16 Communications** depth, **M17 Enterprise + Marketplace**, **M18 ops hardening**, plus the **immersive public site** (Home / Studio / XR World / About / Contact per the blueprint), RLS + audit, security hardening, SEO/analytics/legal.

---

## 7. Must-fix discrepancies before integration (the "no discrepancy" part)

1. **`VizTR-OS` submodule inside the app repo** — remove from the app; it's a separate project and `tsconfig` exclusion is hiding type gaps.
2. **`babylon_XR_World/` excluded demo code** — remove or properly integrate; it currently bypasses type-checking (last remaining `any`).
3. **Role model** — reconcile 5 roles → locked 4-role model + public surface; map Supabase claims to app roles consistently.
4. **Env-settings secret storage** — rework per security model (no secrets in DB).
5. **Storage backend** — decision required: **Cloudflare R2** (locked default).
6. **DB never migrated** — `prisma migrate` against a real Supabase project is the first execution step; schema v2 per master plan §4.
7. **No CI gate** — add typecheck + lint + test + `pnpm audit` on PR (SSOT already flags this).
8. **Placeholder env values** — confirm `.env.local` is gitignored; never commit.

---

## 8. Integration roadmap (repo → master plan)

The repo's existing work slots into master plan phases 0–2; it shortens those phases, then phases 3–7 proceed as planned:

| Master-plan phase | With repo adopted |
|---|---|
| 0 — Foundation | Monorepo decision; adopt repo app into structure; design tokens; CI baseline (fast — most is done) |
| 1 — Core Platform | **Mostly provided**: upload, tour viewer (finish Marzipano Task 8), QA, publish flow, bookings. Remaining: auth UI + middleware, RLS, storage → R2, env cleanup |
| 2 — All XR Modes | **Mostly provided**: Babylon WebXR-ready, ARPanel, Pixel Streaming. Remaining: WebAR alignment (MindAR), VR mode, streaming hardening |
| 3 — Interactivity + Content Engine + Public Site | Build fresh: interaction editor, content engine, admin console, immersive public site (design system applied here, not retrofitted) |
| 4 — Infra + Security | Build fresh: full security, Railway/queues, monitoring, audit |
| 5 — AI Agents | Build fresh: 13 agents, tool connector, CRM/analytics/AI access |
| 6 — Console + Portal + Billing + Enterprise | Build fresh: XR World Console, client portal completion, billing, enterprise |
| 7 — Testing + Security + Launch | Hardening + full test suite + audit + launch |

**Structural decision needed (owner):** the locked plan is a pnpm monorepo (`apps/web`, `apps/dashboard`, …). Options: (a) fold the repo's single app into the monorepo as `apps/web` (recommended — preserves the monorepo for shared packages), or (b) keep a single app and add packages later. Recommend (a), done in Phase 0.

---

## 9. Verify-in-code checklist (once the repo is mounted)

1. Tailwind config: exact tokens, fonts, presence of shadcn/ui components and `packages/design-tokens`-style structure.
2. TanStack Query and Framer Motion/GSAP/Lenis dependencies in `package.json`.
3. Prisma schema content + Role enum definition + whether any RLS policies exist.
4. `ARPanel` engine used (Babylon WebXR-AR vs MindAR vs other).
5. `.env.local` contents vs `.env.example`; gitignore status.
6. `babylon_XR_World/` and `VizTR-OS` presence; tsconfig include/exclude.
7. `/api` routes auth coverage; where zod is and isn't applied.
8. Tour page current viewer wiring; Marzipano worktree diff size.
9. Bundle sizes / `next.config` settings; `@next/bundle-analyzer` pin.

---

## 10. Open decisions for the owner

| # | Decision | Recommendation |
|---|---|---|
| 1 | Adopt repo as foundation? | **Yes** — with the migration guardrails in §7 |
| 2 | Repo structure | Fold into pnpm monorepo as `apps/web` (Phase 0) |
| 3 | Storage backend | **Cloudflare R2** (locked) |
| 4 | Primary tour viewer | **Marzipano primary, Babylon secondary** (per ADR 6.1.1) |
| 5 | Env-settings panel | Remove secret storage; keep read-only settings if useful |
| 6 | Mount `VizAgent` for the code audit | Required to finalize §9 findings and lock the integration plan |

---

*Assessment v1.0 — August 10, 2026 · Based on `PROJECT-SINGLE-SOURCE-OF-TRUTH.md`; code audit pending repo access.*
