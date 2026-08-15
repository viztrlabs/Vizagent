# VizTR — Implementation Plan
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Active (Complete Build)

> Builds on **FINAL tech stack (TECHSPEC.md)**. Requires migrating the running repo (`localhost:3000`) onto it first. Effort in engineer-weeks (assume 1–2 core devs; ~74 ew total → ~5–6 months at 3+ devs).

---

## Phase M0 — Repo Migration (Weeks 1–3)

| # | Workstream | Scope | Est |
|---|---|---|---|
| M0.1 | **Auth cutover** → Supabase-only | Remove NextAuth (`lib/auth.ts`, `api/auth/[...nextauth]`, `components/providers.tsx`); add `middleware.ts` guard + `lib/supabase/server.ts` (getUser/getRole) + role helpers; auth UI | 4–5 d |
| M0.2 | **Design tokens** | Fonts→Space Grotesk/Inter/JetBrains; dual-theme provider+toggle; glass; radius 8/12/16/24; remove hardcoded dark; `next/font`+preconnect; fix render-blocking `@import` | 3–4 d |
| M0.3 | **Marzipano merge** | Merge `.worktrees/feat-marzipano-tour-viewer`; wire Marzipano as primary 360 viewer; Babylon stays for 3D/WebXR/VR; route-split | 3–5 d |
| M0.4 | **Cache + config** | `next.config.ts`: drop `/:path*` immutable; scope to static/fonts/images; security headers; delete duplicate `next.config.js` | 1 d |
| M0.5 | **Roles + security** | `UserRole` enum; RLS policies; rate limit (Upstash) in middleware; gitleaks CI | 2–3 d |
| M0.6 | **Cleanup** | KEEP `babylon_XR_World/` (template); remove VizAgents zip + Extended Features (if unused); full `lint/tsc/test/build` | 1–2 d |
| M0.7 | **Perf fixes** | Remove `app/dashboard.bak/`; delete dead `providers.tsx`; fix nav `/tour` → 404; ensure `next/image` breadth; remove `next-auth` dep; add Lighthouse/`analyze` CI | 1–2 d |

**M0 exit:** build green, Supabase auth live, dual-theme glass, marzipano tours, correct caching, RLS on core.

## Phase 1 — Foundation + Identity (Weeks 4–6)
Monorepo-or-single decision; shared UI kit on tokens; Storybook; CI/CD (Vercel+Railway, GH Actions); secrets (Vault); RLS + audit + rate limit live; onboarding + role gating complete.

## Phase 2 — Core Platform (Weeks 7–14)
Projects (M3) · Asset pipeline + optimization (Blender/Draco/KTX2/LOD/360 tiling) (M4) · XR engines baseline: WebXR + Tour + Pixel Streaming core (M5) · Interaction editor (M6) · QA gate (M7) · Publish + version + token shares (M8).

## Phase 3 — All XR Modes (Weeks 15–22)
WebAR (MindAR/WebXR) (M5.3) · VR standalone (Quest/Pico/Vision Pro) (M5.4) · Pixel Streaming prod hardening → all **5 modes from one asset**.

## Phase 4 — Content + Console + Public Site (Weeks 23–26)
Content engine (pages/sections/blocks/versions/`is_placeholder`) (M9) · XR World Console (M10) · Cinematic 3D marketing site + analytics consent (F19).

## Phase 5 — Portals + Billing + Admin + CRM (Weeks 27–34)
Client portal (approvals/annotations/comments) (M11) · Admin console (users/audit/task board/health/env-settings) (M12) · CRM + analytics (M13) · Billing Stripe/Razorpay (M14).

## Phase 6 — AI Agent System (Weeks 35–46)
Lightweight runtime: CEO step-loop + provider router (`lib/ai/router.ts`) + agents + MCP + RAG (M15) · **Hermes local GPU/CPU connection** (F18) per `HERMES-AGENT-SECURE-CONTROL.md` · Communications (M16).

## Phase 7 — Infra, Security, Enterprise, Launch (Weeks 47–58)
Infra hardening/monitoring/DR (M18) · Enterprise/white-label/marketplace (M17, incremental) · Full test suite (Vitest 80%, Playwright, Chromatic, Lighthouse, agent evals) · security audit · **launch**.

---

## Milestones
| MS | Gate | Target |
|---|---|---|
| 1 | M0 complete; build green | wk3 |
| 2 | First end-to-end publish (asset→QA→approve→share) | wk14 |
| 3 | All 5 XR modes functional | wk22 |
| 4 | Content engine + public site live (consent gate) | wk26 |
| 5 | Billing + portal + admin complete | wk34 |
| 6 | Agents + Hermes local connection demo | wk46 |
| 7 | Launch (security clean) | wk58 |

## Team
2× full-stack · 1× frontend/design · 1–2× 3D/XR · 1× backend/infra · 1× AI/agents · 0.5× QA.

## Dependencies / Critical path
Auth → Design → Core platform → XR modes → Content/Console → Agents(Hermes) → Billing/Admin → Launch. Phases 3 & 4 may overlap; agent stubs may start in Phase 4.