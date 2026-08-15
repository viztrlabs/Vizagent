# VizTR Execution Plan — Migration + Full Build
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Active

> **Scope:** Reconcile the running VizAgent repo (Next.js 16, ~40% built) onto the locked decisions, then execute the complete-build roadmap through M1–M18 to launch. Based on: `VIZTR-MASTER-PLAN.md`, `VIZTR-UXUI-DESIGN-SYSTEM.md`, `VIZTR-REPO-REUSE-ASSESSMENT.md`, and live repo inspection.
>
> **Locked decisions governing everything:** COMPLETE BUILD (no lean MVP), Supabase Auth, Babylon.js core + Marzipano 360 carve-out, Space Grotesk/Inter/JetBrains Mono, dual-theme glass, Vercel + Railway, all 13 agents, all 5 XR modes.

---

## 1. Executive Summary

| Aspect | Current State | Target | Gap |
|---|---|---|---|
| **Auth** | Dual (NextAuth5 + Supabase) + hardcoded admin | Supabase Auth only + `middleware.ts` + role gates | 4 files to remove/replace |
| **Design** | Dark-only, Bebas/Syne/DM Sans, no glass, radius 4/8/12/16 | Dual dark/light/auto, Space Grotesk/Inter/JetBrains, glass tokens, radius 8/12/16/24 | Token swap + provider + CSS vars |
| **Tour Viewer** | Babylon in `/tour/[id]`; Marzipano in `.worktrees/feat-marzipano-tour-viewer` | Marzipano primary for 360, Babylon for 3D/WebXR/VR | Merge worktree + wire route |
| **Cache** | `immutable` on `/:path*` (breaks all HTML/API) | Scoped to `/_next/static`, `/fonts`, images | `next.config.ts` fix + remove duplicate `.js` |
| **Roles** | String `client` default; docs show 5 roles | `super_admin/admin/user/client` + public | Prisma enum + Supabase claims map |
| **Security** | No middleware, no RLS, no headers, no rate limit | Full hardening per master plan M2/M18 | New middleware + RLS + headers + CI scan |

**Migration effort:** ~2–3 weeks (M0). **Full build after migration:** ~40–50 weeks total per master plan phases.

---

## 2. Phase M0 — Repo Migration (Weeks 1–3)

### M0.1 Auth Cutover (Week 1) — **HIGHEST PRIORITY**

**Goal:** Single Supabase Auth stack; route protection via `middleware.ts`; role claims flow from Supabase → server.

#### Files to Remove
| File | Reason |
|---|---|
| `lib/auth.ts` | NextAuth5 config — remove entirely |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth route handler — remove |
| `components/providers.tsx` | Wraps `SessionProvider` from NextAuth — replace with Supabase provider |

#### Files to Create/Modify
| File | Action | Spec |
|---|---|---|
| `middleware.ts` (new, root) | Create | Matcher: `/dashboard/:path*`, `/portal/:path*`, `/admin/:path*`, `/api/:path*`. Calls `supabase.auth.getUser()`; redirects unauthenticated to `/auth/signin?next=<url>`. Adds `x-user-role` header from Supabase claims for server components. |
| `lib/supabase/server.ts` | Modify | Add `createServerClient()` with cookie handling; export `getUser()`, `getRole()`. |
| `lib/supabase/middleware.ts` | Create | Shared Supabase client for middleware (no cookies, uses request/response). |
| `app/(auth)/layout.tsx` | Create | New auth group layout with Supabase `AuthProvider` (client component) wrapping children. |
| `app/(auth)/signin/page.tsx` | Create/Modify | Supabase sign-in UI: email/password + Google OAuth + magic link. No hardcoded admin. |
| `app/(auth)/signup/page.tsx` | Create | Email/password + Google; on success → `/dashboard`. |
| `lib/auth/roles.ts` | Create | Map: `SUPER_ADMIN`/`ADMIN`/`USER`/`CLIENT` strings ↔︎ Supabase `app_metadata.role`. `getServerRole()`, `hasRole()`. |
| `app/dashboard/layout.tsx` | Modify | Remove any NextAuth session usage; read role from `headers().get('x-user-role')` or server `getRole()`. |
| `components/Header.tsx` | Modify | Replace `useSession()` from NextAuth with Supabase `useUser()` + role display. |

#### Acceptance Criteria
- No `next-auth` in `package.json` (uninstall).
- `middleware.ts` blocks unauthenticated access to protected routes.
- Google OAuth works; magic link works; no `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars used.
- Role is available server-side via `getRole()` and client-side via `useUser()` + `app_metadata.role`.

---

### M0.2 Design System Alignment (Week 1–2) — **NO DESIGN COMPROMISE GATE**

**Goal:** Swap to locked tokens; add dual-theme provider + glass; fix radius scale; update all consuming components.

#### Files to Modify
| File | Changes |
|---|---|
| `tailwind.config.ts` | Replace `fontFamily`: `display:['Space Grotesk']`, `heading:['Space Grotesk']`, `body:['Inter']`, `mono:['JetBrains Mono']`. Replace `borderRadius`: `sm:8px`, `md:12px`, `lg:16px`, `xl:24px`, `full:9999px`. Add glass tokens: `glass-bg`, `glass-border`, `glass-highlight`, `glass-blur`. Add dual-theme colors: `light-bg`, `light-surface`, `light-cyan-deep`, `light-violet-deep`. |
| `globals.css` / `app/globals.css` | Add CSS custom properties for all semantic tokens (dark + light). Add `@layer base { html { @apply bg-bg-base text-text-primary; } }`. Import Google Fonts: Space Grotesk, Inter, JetBrains Mono. Add `glass` utility class: `backdrop-blur-[16px] saturate-140 bg-glass-bg border-glass-border border-t-glass-highlight`. Add `@media (prefers-color-scheme: light)` block for auto theme. |
| `app/layout.tsx` | Wrap `<html>` with `ThemeProvider` (client); add `className={theme}` (not hardcoded `dark`); add `<Script>` for theme persistence. |
| `components/ThemeProvider.tsx` | Create — React context + `useEffect` to read `localStorage.theme` or `prefers-color-scheme`, apply to `document.documentElement`. Exports `useTheme()`, `setTheme()`. |
| `components/ThemeToggle.tsx` | Create — cycle: `dark` → `light` → `auto`; persists to localStorage. |
| `components/Header.tsx` | Add `ThemeToggle` to nav; ensure glass nav uses new tokens (`bg-glass-bg`, etc.). |
| All page components | Audit for hardcoded `bg-black`, `text-white`, `dark:` classes — replace with semantic tokens (`bg-bg-base`, `text-text-primary`, `bg-glass-bg`, etc.). |

#### Font Loading (Performance)
- Add `next/font/google` in `app/layout.tsx`: `Space_Grotesk` (display), `Inter` (body, variable), `JetBrains_Mono` (mono). Preload via `preload: true`. Remove `<link>` from `globals.css`.

#### Acceptance Criteria
- `npm run dev` shows light theme when system prefers light; toggle cycles correctly.
- All text uses Space Grotesk (display/heading) / Inter (body) / JetBrains Mono (code).
- Glass surfaces render correctly in both themes.
- No Bebas Neue, Syne, DM Sans loaded.

---

### M0.3 Marzipano Merge (Week 2) — **TOUR VIEWER FIX**

**Goal:** Make Marzipano the primary 360° tour viewer per ADR 6.1.1; keep Babylon for 3D/WebXR/VR.

#### Files to Merge from `.worktrees/feat-marzipano-tour-viewer/`
| Source | Destination | Notes |
|---|---|---|
| `components/marzipano/MarzipanoTourViewer.tsx` | `components/marzipano/MarzipanoTourViewer.tsx` | Primary viewer component |
| `components/marzipano/useMarzipanoTour.ts` | `components/marzipano/useMarzipanoTour.ts` | Hook for tour lifecycle |
| `components/marzipano/navigation.ts` | `components/marzipano/navigation.ts` | Hotspot navigation logic |
| `components/marzipano/navigation.test.ts` | `components/marzipano/navigation.test.ts` | Keep tests |
| `app/(public)/tour/[id]/TourPageClient.tsx` | `app/(public)/tour/[id]/TourPageClient.tsx` | Replaces Babylon `TourPageClient` |

#### Files to Modify
| File | Change |
|---|---|
| `app/(public)/tour/[id]/page.tsx` | Keep server fetch; render new `TourPageClient` (Marzipano). |
| `lib/tour/types.ts` | Ensure `TourConfig` includes Marzipano-specific fields (cube faces, hotspot data). |
| `package.json` | Add `marzipano` dependency (if not present in worktree `package.json`). |

#### Acceptance Criteria
- `/tour/[id]` loads a 360° equirectangular image via Marzipano (not Babylon).
- Hotspot navigation works.
- Babylon viewer remains available for `/configurator`, `/stream`, WebXR/VR routes.
- No duplicate viewer code.

---

### M0.4 Cache Header Fix (Week 2) — **PERF/CORRECTNESS**

**Goal:** Scope immutable caching to static assets only; remove duplicate `next.config.js`.

#### Files to Modify
| File | Change |
|---|---|
| `next.config.ts` | Remove `source: '/:path*'` header block entirely. Keep only: `/_next/static/:path*`, `/_next/image/:path*`, `/fonts/:path*` with `max-age=31536000, immutable`. Add security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. |
| `next.config.js` | **Delete** — duplicate config, keep only `.ts`. |

#### Acceptance Criteria
- `curl -I http://localhost:3000/` → no `Cache-Control: immutable`.
- `curl -I http://localhost:3000/_next/static/...` → has `immutable`.
- Security headers present on all responses.

---

### M0.5 Role Model + Security Hardening (Week 2–3)

#### Prisma Role Enum
| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `enum UserRole { SUPER_ADMIN ADMIN USER CLIENT }`. Change `User.role` from `String @default("client")` to `UserRole @default(CLIENT)`. Run `pnpm db:push`. |

#### Supabase Claims Mapping
| File | Change |
|---|---|
| `lib/auth/roles.ts` | `mapSupabaseRole(claims)`: reads `app_metadata.role`; falls back to `CLIENT`. |
| Supabase Dashboard | Add `app_metadata: { role: "SUPER_ADMIN" }` for first admin user. |

#### RLS Policies (SQL migrations)
| File | Change |
|---|---|
| `prisma/migrations/..._rls_policies.sql` | Create — enable RLS on all tables; policies: `tenant_id = current_setting('app.current_tenant')::uuid` AND role-based access (SUPER_ADMIN bypasses tenant, ADMIN = tenant, USER = tenant, CLIENT = own records only). |

#### Rate Limiting + Headers (already in M0.4 `next.config.ts`; add middleware layer)
| File | Change |
|---|---|
| `lib/server/middleware/rate-limit.ts` | Create — Upstash Redis sliding window: 100/min authenticated, 20/min anonymous. Apply in `middleware.ts` for `/api/:path*`. |

#### Secret Scanning (CI)
| File | Change |
|---|---|
| `.github/workflows/ci.yml` | Add `gitleaks` step; fail on secrets. |

#### Acceptance Criteria
- `UserRole` enum in DB; existing users migrated.
- RLS policies active; cross-tenant queries return zero rows.
- Rate limiting returns 429 on excess.
- CI fails on committed secrets.

---

### M0.6 Cleanup & Verification (Week 3)

- **KEEP `babylon_XR_World/`** — used as a working template/reference for the XR configurator + viewers (do not remove; document its intent). Consider relocating to `components/xr/`/`lib/xr/` when the M5 refactor lands so it stops existing as a top-level demo dir.
- Remove `VizAgents(Opencode-Hermes-Gravity-)/` and zip.
- Remove `Extended Features/` only if unused; otherwise reclaim as planning reference.
- Run full test suite: `pnpm lint && pnpm tsc && pnpm test && pnpm build`.
- Verify all routes from the user's list still return 200/expected codes.

### M0.7 Additional Performance & Cleanup Fixes (Week 3) — from repo audit

| # | Issue (verified) | Fix |
|---|---|---|
| 1 | **Render-blocking font `@import`** at `globals.css:1` — loads Bebas/Syne/DM Sans via CSS import, no preload, no preconnect | Remove `@import`; load Space Grotesk/Inter/JetBrains via `next/font/google` with `preload: true`; add `<link rel="preconnect">` to Google Fonts. Already required by M0.2 — do it there. |
| 2 | **`app/dashboard.bak/` ships a live route** `/dashboard.bak` (Next builds every non-`_`/non-`(` folder) — dead duplicate code in the bundle + an exposed route | Delete `app/dashboard.bak/`. |
| 3 | **`components/providers.tsx` is dead** — not imported anywhere, and `SessionProvider` is not mounted (client auth state never wired) | Delete as part of M0.1 auth cutover. |
| 4 | **Nav `href="/tour"` → 404** — tour route is `/tour/[id]`, nav points to a page that doesn't exist | Fix Header nav to `/tour/[id]` of a sample, or add a `/tour` index. |
| 5 | **Duplicate config** — both `next.config.js` and `next.config.ts` at root | Keep `.ts`, delete `.js` (with M0.4). |
| 6 | **Only 1 `next/image` usage** — no breadth of image optimization (matters once the site is built) | Standardize `next/image` + AVIF/WebP in the UI kit (M1). |
| 7 | **`next-auth` weighs the bundle** until removed | Remove in M0.1 (already planned); leaves `recharts` + Babylon as the main heavy deps — keep server-only / route-split. |

**Regression guard (add to CI in M0.5):** run `pnpm analyze` (bundle) + Lighthouse CI on PRs so perf regressions fail the build, not silently ship.

---

## 3. Forward Build Roadmap (M1–M18)

> Aligned to `VIZTR-MASTER-PLAN.md` §7 "Build Roadmap — Complete Build". M0 is the new prerequisite phase.

### Phase 0: Foundation (Weeks 3–4, post-M0)
| Module | Deliverables |
|---|---|
| M1 Foundation | Monorepo structure (`apps/`, `packages/`), shared TS config, UI kit (shadcn + VizTR tokens), CI/CD, Vercel + Railway environments, secrets management. |
| M2 Identity & Access | Supabase Auth fully integrated (M0 done), RLS policies, audit logging, API keys, rate limiting, security headers, secret scanning. |

### Phase 1: Core Platform (Weeks 5–12)
| Module | Deliverables |
|---|---|
| M3 Projects | CRUD, team membership, settings, archive/restore. |
| M4 Asset Pipeline | Chunked upload (done), validation, **optimization**: Blender headless (GLB → Draco + KTX2 + meshopt), LOD generation, 360° multi-res tiling, thumbnails. |
| M5 XR Engines | **WebXR** (Babylon WebXR session manager, AR hit-test, VR teleport), **Virtual Tour** (Marzipano + hotspot editor), **Pixel Streaming** (UE5 integration, signaling, metrics overlay — extend existing). |
| M6 Interaction Editor | No-code hotspot placement, animation timeline, conditional branching, preview mode — build on existing configurator panels. |
| M7 QA Engine | Extend checks: triangle budget, texture memory, draw calls, shader complexity, load time; CI gate + per-project report; block publish on fail. |
| M8 Publish Engine | Preview deployments, QA gate integration, approval token workflow, production deploy to Vercel, rollback, custom domains (later). |

### Phase 2: All XR Modes (Weeks 13–20)
| Module | Deliverables |
|---|---|
| M5.3 WebAR | MindAR image tracking + markerless (WebXR hit-test); AR session manager; QR code launch; fallback for non-AR devices. |
| M5.4 VR Builds | Standalone builds for Quest (OpenXR), Pico, Vision Pro; shared codebase via Babylon Native / Capacitor; store assets; comfort settings (vignette, snap turn). |

### Phase 3: Interactivity + Content Engine + Public Site (Weeks 21–24)
| Module | Deliverables |
|---|---|
| M9 Content Engine | **Page → Section → Block** model; admin visual builder; `is_placeholder` flag; draft/publish/version/rollback; per-page SEO; sitemap/robots; content preview. |
| M10 XR World Console | Single dashboard launching all 5 XR services; project overview; real-time status; connects existing configurator/projects as panels. |
| Public 3D Website | Cinematic 3D hero (Babylon, dark in both themes), glass nav, scroll-driven camera, staggered reveals, portfolio grid (placeholder → CMS), demo booking. |

### Phase 4: Infrastructure & Security (Weeks 25–30)
| Module | Deliverables |
|---|---|
| M18 Infra & Ops | Full CI/CD (GitHub Actions), preview deployments, Sentry + Vercel Analytics, log aggregation, uptime monitoring, backup/restore, disaster recovery, cost dashboards. |

### Phase 5: AI Agent System (Weeks 31–46)
| Module | Deliverables |
|---|---|
| M13 CRM/Analytics/AI | CRM (leads, pipeline, activities), analytics dashboards (usage, performance, conversion), **AI provider layer** (already in `lib/ai` — extend). |
| M15 AI Agents | **Lightweight orchestrator + provider router (no LangGraph/CrewAI — DECIDED 2026-08-10):** CEO Agent (step-loop orchestrator); Hermes Agent (local, Ollama); 5 Service Agents; 5 Internal Agents; MCP Connector; per-agent primary+fallback `{provider, model}` binding; agent memory + RAG; guardrails + spend caps. |

> **M15 architecture — lightweight agent runtime (no heavy LLM framework on a VPS):**
> - **CEO Agent** is a thin **step-loop orchestrator** (not a graph): receive task → call CEO model → get `decompose` plan or a `dispatch`/`tool` call → enqueue sub-task to the right service agent via the existing **BullMQ** queue → worker runs it → return result → CEO synthesizes → propose next action or request approval. Loop bounded to N steps.
> - **Each agent = a spec** in `agent-behaviors.json` (system prompt, tool allowlist, guardrails, spend cap) **plus a primary + fallback `{provider, model}` binding** in a small `model-bindings.json`.
> - **Unified `lib/ai/router.ts`** maps `agentId → provider → model → API key` and normalizes every provider's response into `{text, toolCalls[]}`. Providers: OpenAI, Anthropic, Groq, Mistral, Cohere, Google Gemini, DeepSeek, OpenRouter (optional aggregator only — not required), and **Ollama local** for Hermes on the GPU workstation. Built on the existing `lib/ai/*` provider libs already in the repo.
> - **Durability / retry / checkpointing** = BullMQ job state + `agent_runs`/`tasks` tables (no framework checkpointing needed). **Human-in-the-loop** = approval-gate events parked in the queue before anything that spends money, deploys, shares data, or sends contracts.
> - **Why it wins for VizTR:** lighter/faster (direct provider API calls, zero framework overhead), cheaper (each skill → cheapest capable model), simpler ops (no LangGraph server to host), and per-agent cost/failover control. Provider keys in Supabase Vault/env.
> - **Hermes is a distinct local-capable agent** with super-admin-only, password/OTP-protected, area-scoped, rollback-safe control over the website from the admin's workstation — full spec in `HERMES-AGENT-SECURE-CONTROL.md`.

### Phase 6: Console + Portal + Billing + Enterprise (Weeks 47–54)
| Module | Deliverables |
|---|---|
| M11 Client Portal | Approvals, pinned 3D annotations, threaded comments, version history, shareable review links, white-label. |
| M12 Admin Console | User directory, login history, API key mgmt, audit log viewer, live task board, env-settings (encrypted + RBAC + audit). |
| M14 Billing | Stripe + Razorpay; tiers (Free/Pro/Studio/Enterprise); usage metering (GPU hrs, storage, bandwidth); webhooks; dunning; proration; invoices. |
| M17 Enterprise/Marketplace | White-label, SSO/SAML, multi-tenant, API access, marketplace (templates, assets), custom integrations. |

### Phase 7: Testing, Security, Launch (Weeks 55–58)
| Activity | Target |
|---|---|
| Unit tests | 80% coverage (Vitest) |
| Integration tests | Supabase/Redis test instances |
| E2E | Playwright (desktop + mobile) |
| Visual regression | Chromatic (Storybook) |
| Performance | Lighthouse 90+ |
| Agent correctness | LangSmith (tool usage, guardrails) |
| Penetration test | External audit |
| Launch | Production deploy, DNS, monitoring, runbooks |

---

## 4. Critical Path & Dependencies

```
M0 (Auth → Design → Marzipano → Cache → Roles/Security)
    ↓
Phase 0 (Monorepo + RLS)
    ↓
Phase 1 (Projects → Assets → XR Engines → Editor → QA → Publish)
    ↓
Phase 2 (WebAR + VR Builds)          Phase 3 (Content Engine + Console + Public Site)
    ↓                                     ↓
Phase 4 (Infra Hardening)              ↓
    ↓                                     ↓
Phase 5 (AI Agents) ←──────────────────────┘
    ↓
Phase 6 (Portal + Admin + Billing + Enterprise)
    ↓
Phase 7 (Testing + Launch)
```

**Hard blockers:**
- M0 Auth → unblocks every gated route.
- M0 Design → no page restyle before tokens land.
- M0 Marzipano → unblocks `/tour` correctness.
- M0 Roles/RLS → unblocks multi-tenant data isolation.
- Phase 1 Asset Pipeline optimization → needed before high-fidelity WebXR/VR.
- Phase 5 Hermes Agent → needs local runner + Cloudflare Tunnel (infrastructure from Phase 4).

---

## 5. Milestones

| # | Milestone | Target Week | Gate |
|---|---|---|---|
| 1 | Repo migration complete (M0) | 3 | All M0 acceptance criteria pass; `pnpm build` green. |
| 2 | Monorepo + RLS live | 4 | Multi-tenant isolation verified. |
| 3 | First end-to-end publish (Project → Asset → QA → Approve → Deploy) | 12 | WebXR + Tour viewers working; publish workflow green. |
| 4 | All 5 XR modes functional | 20 | WebXR, WebAR, VR, Tour, Pixel Streaming each have a working demo. |
| 5 | Content engine + Public site live | 24 | Admin builds a page; public site renders cinematic hero. |
| 6 | Agent orchestration demo | 46 | CEO Agent decomposes a natural-language task → service agents execute → QA → deploy. |
| 7 | Billing + Portal + Admin complete | 54 | Stripe/Razorpay live; client approves tour; admin manages users. |
| 8 | Launch readiness | 58 | All Phase 7 gates pass; security audit clean. |

---

## 6. Effort Estimates (Engineer-Weeks)

| Phase | Core | Frontend | Backend/Infra | 3D/XR | AI/Agents | Total |
|---|---|---|---|---|---|---|
| M0 Migration | 1 | 2 | 1 | 1 | 0 | **5** |
| Phase 0 | 1 | 1 | 2 | 0 | 0 | **4** |
| Phase 1 | 2 | 3 | 3 | 4 | 0 | **12** |
| Phase 2 | 1 | 1 | 1 | 6 | 0 | **9** |
| Phase 3 | 1 | 4 | 2 | 2 | 0 | **9** |
| Phase 4 | 1 | 0 | 4 | 0 | 0 | **5** |
| Phase 5 | 0 | 1 | 2 | 1 | **8** | **12** |
| Phase 6 | 2 | 3 | 3 | 0 | 1 | **9** |
| Phase 7 | 2 | 2 | 2 | 1 | 2 | **9** |
| **Total** | **11** | **17** | **20** | **15** | **11** | **~74 engineer-weeks** |

> With a team of 3–4, this maps to ~18–24 calendar weeks after M0 (~4.5–6 months to launch). Parallelization: Phases 2 & 3 can overlap; Phase 5 agents can start stubs during Phase 3. **LangGraph/CrewAI removal saves ~4 engineer-weeks in Phase 5.**

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Auth cutover breaks existing sessions | Medium | High | Feature-flag NextAuth removal; run both behind flag for 1 sprint; migrate users via script. |
| Marzipano + Babylon bundle size | Medium | Medium | Route-level code splitting; dynamic imports; analyze with `@next/bundle-analyzer`. |
| Supabase RLS performance on large tables | Low | High | Add composite indexes on `(tenant_id, user_id)`; use `pg_stat_statements` to monitor. |
| Hermes Agent local tunnel security | High | Critical | **See `HERMES-AGENT-SECURE-CONTROL.md`** — outbound Cloudflare Tunnel, super-admin-only pairing, password/OTP approval on mutations, device-scoped **area-control scope token** (deny-by-default), change ledger + snapshot rollback, emergency stop, audit — finalize ADR in Phase 4. |
| Agent budget overruns (LLM costs) | Medium | High | Hard per-agent token limits; daily caps; alerting; cost dashboard in M13. |
| **Provider API outage / rate limit** | Medium | High | **Fallback chain per agent** (primary → fallback → local Ollama); request caching for repeat tool calls; circuit breaker in router. |
| Pixel Streaming GPU availability | Medium | Medium | Queue with priority; fallback to pre-rendered WebXR; monitoring + auto-scale signal. |
| Design token drift across apps | Low | Medium | Single `packages/ui` with tokens as source; Storybook visual tests; lint rule for hardcoded colors. |
| Scope creep in agent features | High | Medium | Guardrail: "NEVER auto-execute spend/deploy/share" codified in agent framework; all new agent tools require approval gate. |

---

## 8. Team Shape (Recommended)

| Role | Count | Focus |
|---|---|---|
| Full-stack (Next.js + Supabase + Prisma) | 2 | Auth, projects, assets, API, billing, admin |
| Frontend/Design System | 1 | Tokens, theme, glass, marketing site, portal UI |
| 3D/XR Engineer | 1–2 | Babylon, Marzipano, WebXR, WebAR, VR builds, Pixel Streaming |
| Backend/Infra | 1 | Queues, workers, Railway, Vercel, CI/CD, monitoring, RLS |
| AI/ML Engineer | 1 | Lightweight step-loop orchestrator, unified provider router (`lib/ai/router.ts`), per-agent model bindings, MCP, RAG, local LLMs (Ollama), cost/failover logic |
| QA/Automation | 0.5 | Vitest, Playwright, Chromatic, agent evals (LangSmith) |

---

## 9. Next Immediate Actions (This Week)

1. **Create ADR-001** — record "Adopt VizAgent as foundation; migration strategy = M0 then forward build."
2. **Start M0.1 Auth Cutover** — create `middleware.ts`, Supabase server client, auth routes; remove NextAuth files.
3. **Start M0.2 Design Tokens** — update `tailwind.config.ts`, create `ThemeProvider`, `ThemeToggle`, CSS vars.
4. **Merge Marzipano** — copy worktree components, wire `/tour/[id]`.
5. **Fix Cache Header** — edit `next.config.ts`, delete `next.config.js`.
6. **Run full CI** — `pnpm lint && pnpm tsc && pnpm test && pnpm build` after each sub-task.

---

## 10. Change Control Protocol (from Master Plan)

> **Any change to this plan requires:**
> 1. Written justification (what, why, impact on milestones).
> 2. Approval from Tech Lead + Product Owner.
> 3. Update to this document with version bump.
> 4. Communication to team.

**No exceptions.** This plan is the single planning surface.

---

*Generated: 2026-08-10 · Based on live repo inspection, `VIZTR-MASTER-PLAN.md`, `VIZTR-REPO-REUSE-ASSESSMENT.md`, `VIZTR-UXUI-DESIGN-SYSTEM.md`*