# VizTR — Technical Requirements / Tech Spec (TRD)
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** FINAL TECH STACK

> **This is the authoritative, FINAL tech stack.** Do not override with reference docs. Reference file-structure docs are design-flow only.

---

## 1. FINAL Tech Stack (Locked)

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.2** (App Router), **TypeScript strict**, pnpm |
| UI | **Tailwind CSS + shadcn/ui** |
| 3D / WebGL | **Babylon.js** core engine (ADR 6.1 Revised) · **Marzipano** for 360° tours (ADR 6.1.1) · **MindAR** for AR |
| Motion | **Framer Motion + GSAP + Lenis** |
| State | **Zustand + TanStack Query** |
| Database | **Supabase PostgreSQL + Prisma + RLS** |
| Auth | **Supabase Auth** (email, Google OAuth, magic link) |
| Realtime | **Socket.io + Supabase Realtime** |
| Storage | **Cloudflare R2** + Supabase Storage |
| Queue | **BullMQ + Redis** (Railway / Upstash) |
| Email | **Resend + React Email** |
| Payments | **Stripe** (default) + **Razorpay** |
| LLM routing | **Lightweight `lib/ai/router.ts`** → OpenAI · Anthropic · Groq · Mistral · Cohere · Gemini · DeepSeek · (OpenRouter optional aggregator) · **Ollama local**. **No LangGraph / CrewAI** — CEO step-loop orchestrator on BullMQ |
| Local LLMs | **Ollama** (Qwen2.5-Coder, Llama 3.x, nomic-embed-text) |
| Pixel Streaming | UE5.3+ · Cirrus · coturn · Cloudflare Tunnel |
| Deploy | **Vercel** (web) + **Railway** (backend / agents / queues) |
| CDN / Tunnel | Cloudflare (R2, CDN, Tunnel) |
| CI/CD | GitHub Actions |
| Monitoring | Vercel Analytics + Sentry |
| Testing | Vitest + React Testing Library + Playwright + Chromatic + Lighthouse |

---

## 2. Architecture

### 2.1 Repository layout
Recommended: **single app at repo root** (current state, lightest) with agent-runtime + local-runner under `lib/ai/` and `local/`; split into a monorepo (`apps/web`, `apps/dashboard`, `packages/*`) only when Hermes/agents need independent deploy scale. File layout per `VIZTR-FILE-STRUCTURE.md` (design-flow reference).

### 2.2 Server layering
`route handlers → services → repositories → (Prisma / R2 / external)`, with **BullMQ queues + workers** for async work (upload processing, QA, XR generation, pixel streaming juggling, agent tasks, emails).

### 2.3 XR engine mapping
| Mode | Engine | Bundling |
|---|---|---|
| WebXR | Babylon.js | lazy, route-split |
| WebAR | MindAR / WebXR hit-test | lazy |
| VR (Quest/Pico/Vision Pro) | Babylon VR (OpenXR) | lazy |
| Virtual Tour | Marzipano | lazy, route-split |
| Pixel Streaming | UE5 + WebRTC | lazy |

Heavy engines are code-split per route; no engine loads on the marketing pages.

### 2.4 Agent runtime (M15) — lightweight
- **CEO** = bounded step-loop on BullMQ (decompose → dispatch → collect → synthesize → approve).
- Each agent = spec in `agent-behaviors.json` (prompt, tool allowlist, guardrails, spend cap) + primary/fallback `{provider, model}` binding (`model-bindings.json`).
- `lib/ai/router.ts` normalizes `{text, toolCalls[]}` across providers.
- Durability/retries/checkpoints = BullMQ job state + DB (`agent_runs`, `tasks`).
- Human-in-the-loop = approval-gate events before spend/deploy/share.

---

## 3. API Surface (key)

- Auth: Supabase (`/api/auth/*` handled by Supabase SDK; custom session refresh)
- `/api/projects` CRUD · `/api/assets*` (upload/validate/optimize) · `/api/qa/*` · `/api/deployments/*`
- `/api/xr/links*` (token gen/validate/revoke) · `/api/streaming/session*`
- `/api/content/*` (pages/sections/blocks/versions) · `/api/services` · `/api/blog` · `/api/testimonials` · `/api/contact` · `/api/bookings`
- `/api/settings` · `/api/analytics` · `/api/users`
- `middleware.ts` — Supabase session guard + role gates + rate limit
- Public: `app/view/{tour,ar,vr,xr,stream}/[token]` — open, no-auth share viewers

---

## 4. Data Access & RLS
- Every table has `tenant_id`; RLS enabled via `current_setting('app.current_tenant')`.
- `UserRole` enum: `SUPER_ADMIN ADMIN USER CLIENT`.
- Roles mapped from Supabase `app_metadata.role` server-side; never trusted from client.
- Workers/repositories use service roles with explicit `tenant_id` where-clauses. (See `SCHEMA.md`.)

---

## 5. Security
- Supabase Auth (JWT 1h/7d refresh; MFA for admins).
- RBAC server-side + RLS on all tables.
- Presigned R2 uploads (short TTL; virus scan; 500MB cap).
- Rate limiting (100/min auth, 20/min anon) via Upstash in middleware.
- CSP + security headers in `next.config.ts`; immutable cache scoped to static assets only.
- Secrets in Supabase Vault; rotation 90d; never in logs/code; gitleaks in CI.
- **Hermes local connection:** super-admin-only, password/OTP approvals, device-scoped area token, outbound Cloudflare Tunnel, revocation + emergency stop, audit log (full spec: `HERMES-AGENT-SECURE-CONTROL.md`).

---

## 6. Performance Budgets
- WebXR: 60 fps desktop / 30 fps mobile / 90 fps VR.
- Pixel Streaming latency < 100 ms.
- Lighthouse ≥ 90 (perf/accepted/accessibility/SEO).
- Fonts via `next/font` + preconnect; no render-blocking `@import`.
- Immutable long-cache only for `_next/static`, `/fonts`, images.
- Route-level code-splitting for all heavy engines; Lighthouse CI on PRs.

---

## 7. Deployment & Environment
- Vercel: web/marketing/dashboard/viewers.
- Railway: BullMQ workers + agent runtime + pixel-streaming signaling/Cirrus; Redis (Upstash).
- Environments: preview + production; CI/CD via GitHub Actions; feature-flag deploys; rollback via Vercel + deploy tags (Hermes).
- `.env.example` lists all required vars; `.env*` gitignored.

---

## 8. LOCAL GPU / CPU CONNECTION — Tech Spec (F18)
- **Hermes runner** on studio workstation (`apps/local-runner` or `local/`): Blender headless, UE5, coturn, Ollama.
- **Reverse tunnel** (outbound `cloudflared`), no inbound ports.
- Device model + scope token (areas); policy gateway in front of MCP tools; deny-by-default.
- Queue of jobs (BullMQ) honoring device availability; status heartbeat; `local_sync` table tracks workstation state/jobs.
- Security: super-admin-only pairing, OTP approval on mutations, rollback ledger, emergency stop. See `HERMES-AGENT-SECURE-CONTROL.md`.

## 9. COOKIE / CONSENT — Tech Spec (F19)
- `ConsentProvider` client component; modal on first visit; **demo CTA disabled until consent chosen**.
- `lib/consent.ts` + a signed/anonymous consent cookie (no PII); gating analytics (Plausible-style) & non-essential cookies.
- Options: Accept all / Reject non-essential / Manage preferences; stored via `zustand` + cookie; revocable.
- Fully server-/client-consistent; SSR reads consent for CSR analytics scripts.

## 10. Open / ADR Notes
- Repo packaging (single-app now → monorepo at M15).  ·  Named vs quick Cloudflare Tunnel.  ·  mTLS vs HTTPS+token.  ·  Approval granularity (TOTP recommended).  ·  Hermes undo semantics (redeploy-tag primary).  ·  Ollama backend for Hermes.