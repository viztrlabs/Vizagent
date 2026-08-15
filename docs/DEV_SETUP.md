# VizTR — Local Development Setup

> **Status**: Intended setup. VizTR is 100% planning-phase — no production code exists yet.
> This describes how the local env **will** work after Phase 0/1 (see Starter guide and
> `implementation-plans/2026-08-05-phase0-1-foundation.md`).

---

## 1. Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Node.js | 20 LTS | Runtime for all apps + packages |
| pnpm | 9.0+ | Workspace package manager |
| Docker Desktop | Latest | Local Postgres, Redis, Supabase stack |
| Supabase CLI | 1.x | Local Supabase (Auth + Postgres + Storage) |
| Git | 2.x | Version control |
| Blender | 4.x (optional) | Asset pipeline (Phase 2+) |

Editor: VS Code or Cursor with the ESLint/Prettier/Tailwind extension pack (Starter §2.2).

## 2. Clone + Install

```bash
git clone <repo-url> viztr-platform && cd viztr-platform
pnpm install
```

Installs `apps/*` (web, admin, client-portal, agent-api, xr-runner) and `packages/*`
(ui, database, utils, types, queue, qa, billing, analytics, booking, marketplace,
whitelabel, api, mcp) under the `@viztr/*` scope.

## 3. Environment Variables

```bash
cp .env.example .env.local
```

> `.env.example` is **planned** (Phase 0/1 Task 7) and starts with the Supabase trio
> (§18.1): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
> `SUPABASE_SERVICE_ROLE_KEY` (server-only). The full planned template is in Starter §2.3
> (Google OAuth, Cloudflare R2, Supabase Storage, API LLM keys, Stripe, Vercel, Sentry).
> Fill in real values before starting.

## 4. Database Setup

```bash
pnpm db:setup
```

Runs (Phase 0/1 + Phase 6 Task 5): `docker-compose up -d` (Redis + Postgres), `supabase
start` (local Supabase), `pnpm db:migrate` (Prisma first migration — 92-model schema,
incl. `agent_runs` + `website_pages` for Content-as-Code).

## 5. Start Development

```bash
pnpm dev:all                          # all apps (Turborepo, parallel)
pnpm --filter @viztr/web dev          # single app — or admin/client-portal/agent-api/xr-runner
```

Root scripts: `dev:web`, `dev:admin`, `dev:client`, `dev:all`, `build`, `test`,
`typecheck`, `lint`.

## 6. Tests

```bash
pnpm test             # unit + integration (Vitest)
pnpm test:coverage    # enforces 90% global line threshold per package
```

Threshold configured on `packages/utils`, `packages/database`, `packages/ui` (`lines:
90`); CI runs `pnpm typecheck && pnpm lint && pnpm test` and fails below it. E2E via
Playwright (`pnpm test:e2e`, Phase 2+).

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| **Port 3000/3001 in use** | Web runs on `:3000`, others on incremented ports. Stop the conflicting process or override in `.env.local`. |
| **Supabase migration fails** | `supabase stop && supabase start`; rerun `pnpm db:migrate`. Docker not running is the usual cause. |
| **Redis connection refused** | `docker-compose up -d` first — queue layer needs `redis://localhost:6379` (Phase 3). |
| **WASM decoder errors (Draco/KTX2)** | Decoders (~500KB–1MB each) are served from the Cloudflare R2 CDN and cached, **not** bundled (Phase 4 constraint). Offline in dev → CDN URL unreachable; check the env CDN base. |
| **Type errors after install** | `pnpm typecheck`; root `clean` script clears stale `node_modules`. |
| **Secrets scan blocks push** | Run `node scripts/scan-env-secrets.mjs` before pushing; rotate any leaked key. |

---

*Refs: `VIZTR-COMPLETE-FEATURES.md` §18.1/§21.3, Starter §2.3, Phase 0/1 Tasks 1–7,
Phase 4 XR Engine (Global Constraints), Phase 6 Task 5.*
