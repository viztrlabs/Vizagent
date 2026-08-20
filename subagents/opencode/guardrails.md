# OpenCode Guardrails — Architecture & Engine Compliance

## Engine Rules
- SINGLE core engine: Babylon.js (Editor + Next.js template) — NO Three.js/R3F parallel
- Marzipano ONLY for Virtual Tour (named carve-out, ADR 6.1.1) — Babylon PhotoDome fallback
- WebXR/AR/VR/Pixel Streaming all use Babylon.js
- Experience Engine: `ExperienceEngine` base class with mode-specific extensions

## Architecture Rules
- Route handlers + zod + typed responses + `lib/api` helpers
- Prisma repositories for all DB access — no raw queries in routes
- Tenant scoping via `withTenant` middleware on EVERY API route
- RBAC checks server-side via `hasPermission(role, permission)`
- BullMQ queues for async work (QA, AI, emails, calendar sync)
- Socket.io for real-time (collab, presence, cursors) — NOT Supabase Realtime

## Code Quality
- TypeScript strict mode — no `any`
- Vitest unit tests for all lib code (90%+ coverage on utils/db)
- Playwright E2E for critical flows (auth, publish, XR launch)
- No secrets in code; env via `.env.local` only

## Review Gate
- Every OpenCode output reviewed by Lead before merge
- Run `pnpm typecheck && pnpm test` locally before reporting PASS