# VizTR — Contributing

> **Status**: Intended workflow. VizTR is 100% planning-phase — this is the contribution
> contract the repo **will** enforce after Phase 0/1.

---

## 1. Repo Layout

- **apps/**: web (marketing), admin, client-portal, agent-api (CEO orchestrator, 13-agent
  manifest), xr-runner (Babylon.js core + Marzipano carve-out)
- **packages/**: ui, database, utils, types, queue, qa, billing, analytics, booking,
  marketplace, whitelabel, api, mcp
- **services/**: planned microservices · **infrastructure/**: docker, terraform, CI/CD
- **docs/**: planning + runbooks (authoritative source of truth)

## 2. Conventional Commits

```bash
feat(auth): add Google OAuth
feat(agents): add CEO LangGraph orchestrator, 13-agent manifest
feat(content): add Content-as-Code page upsert and PR-based deploy flow
```

## 3. TDD Requirement (Mandatory)

Every plan task follows a five-step loop — do not skip steps:

1. Write the failing test first (`*.test.ts`, Vitest) → 2. run it (must FAIL) →
3. write the minimal implementation → 4. run again (must PASS) → 5. commit.

CI gates: `pnpm typecheck && pnpm lint && pnpm test` plus `pnpm test:coverage` with a
**90% global line threshold** on `packages/utils`, `packages/database`, `packages/ui`.
E2E (Playwright) covers critical flows from Phase 2.

## 4. Branch Protection + PR Review (Content-as-Code)

- `main` is protected: work on `feature/*`, open a PR, no direct pushes.
- Content-as-Code (agent-generated MDX / `website_pages`): Website Developer Agent opens a
  GitHub PR whose body links a Vercel `/preview` URL so the rendered page is reviewed
  **before** approval — human approval is the gate.
- Non-critical content PRs **auto-approve after 24h** (`CONTENT_AUTO_APPROVE_HOURS`);
  **critical** changes (pricing, legal) always require manual approval.

## 5. No-Code Design-Primitive Workflow (UI/UX Contributors)

Designers/UI contributors do **not** write app components. They touch only the shared
design system in `packages/ui`:

- Edit tokens (`packages/ui/src/styles/tokens.css`, `src/tokens.ts`) — colors, typography
  (Bebas Neue / Syne / DM Sans / JetBrains Mono), spacing, radius, light/dark. Apps
  consume tokens, never hard-coded values.
- XR scenes are authored in the **Babylon.js Editor** by non-technical designers and
  exported via the Next.js template — no Three.js/R3F, no per-scene code. Marzipano is
  the narrow 360° tour-viewer carve-out only (ADR 6.1.1).

## 6. Security Rules

- **Never commit secrets.** `.env*`, service-role keys, API keys, tokens stay out of git;
  `.env.example` has placeholders only.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — never in client bundles or tests
  (`getServiceClient()` in `packages/database`, §18.1).
- Run the scan **before every push** (also in CI on push/PR): `node
  scripts/scan-env-secrets.mjs` (PowerShell variant `scripts/scan-env-secrets.ps1`, Phase 6).
- No secrets in test fixtures — use fakes (`anonKey: "test"`). Never bypass RLS: RLS on
  every table; route through Supabase.

## 7. Style

- **TypeScript strict mode** everywhere. `no-explicit-any` is an error; `no-console`
  limited to `warn`/`error`; `prefer-const` enforced.
- **Prettier** is the single formatter (`.prettierrc`): no semicolons, single quotes,
  `tabWidth: 2`, `trailingComma: "es5"`, `printWidth: 100` + `prettier-plugin-tailwindcss`.
- `pnpm lint --fix` + `pnpm typecheck` before committing; Husky + lint-staged.
- Engine policy: Babylon.js is the single core 3D/XR engine. Three.js only for a
  developer-built, code-driven data-viz view; Marzipano only inside `TourEngine`.

---

*When Phase 0/1 CI lands, the automated gates (commit lint, secret scan, coverage threshold, engine-policy lint) become the enforceable version of this document.*
