# Phase 0/1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the monorepo, database schema, shared design system + UI library, theme provider, Supabase authentication, auth UI, and role-based access control (RBAC).

**Architecture:** Turborepo + pnpm monorepo with `apps/web`, `apps/admin`, `apps/client-portal`, and `packages/{ui,database,utils,types}`. All apps consume the shared packages; Supabase is the single backend (Auth + Postgres + RLS); Next.js API Routes handle app-layer logic. Design follows §27.2 and §24.2 (MVP: no separate backend).

**Tech Stack:** pnpm 9, Turborepo 2, Next.js 15/16 (App Router), React 18, TypeScript 5.3 strict, Tailwind CSS 3.4, shadcn/ui, next-themes, @supabase/supabase-js, Prisma 5, PostgreSQL 16, zod 3, Vitest.

## Global Constraints

- TypeScript strict mode enabled everywhere (no `any`).
- Conventional commits (feat/fix/chore/test).
- Mobile-first responsive; WCAG 2.1 AA.
- Minimal Software Rule (§21.4): no framework stacking — one UI lib, one state lib, one schema lib.
- `next-themes`: light / dark / system, default = **system** (§17.1).
- Supabase Auth: email/password + Google OAuth (§18.1).
- Every tenant-owned table carries `org_id` and RLS policy (§27.7).
- 90%+ test coverage on `packages/utils`, `packages/database`, `packages/ui` core.
- No secrets in code or tests; env via `.env.local` (see §18/§27.9).
- CI from Day 1: `.github/workflows/ci.yml` runs `pnpm typecheck && pnpm lint && pnpm test` plus a secret-scan step (`node scripts/scan-env-secrets.mjs`) on every push/PR.
- Integration tests needed for auth/RLS/upload against a **real Supabase test project + real DB** — unit mocks don't catch Supabase API version breaks. Live tests live in `packages/database/test/integration/` (Supabase test-project env; separate scheduled/manual CI job, not on every push).

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `apps/web/package.json`, `apps/web/next.config.mjs`, `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`
- Create: `apps/admin/package.json`, `apps/admin/app/layout.tsx`, `apps/admin/app/page.tsx`
- Create: `apps/client-portal/package.json`, `apps/client-portal/app/layout.tsx`, `apps/client-portal/app/page.tsx`
- Create (empty stubs — package.json + blank `app/route.ts`, code lands in Phase 3/4): `apps/agent-api/package.json` (`@viztr/agent-api`), `apps/xr-runner/package.json` (`@viztr/xr-runner`)
- Create: `packages/ui/package.json`, `packages/database/package.json`, `packages/utils/package.json`, `packages/types/package.json`
- Create (empty stubs — `package.json` with `"name"` + `"exports"`, no code yet, resolves later-phase imports): `packages/queue`, `packages/qa`, `packages/billing`, `packages/analytics`, `packages/booking`, `packages/marketplace`, `packages/whitelabel`, `packages/api`, `packages/mcp`

**Interfaces:**
- Consumes: nothing (root of everything).
- Produces: workspace package names `@viztr/web`, `@viztr/admin`, `@viztr/client-portal`, `@viztr/agent-api`, `@viztr/xr-runner`, `@viztr/ui`, `@viztr/database`, `@viztr/utils`, `@viztr/types`, `@viztr/queue`, `@viztr/qa`, `@viztr/billing`, `@viztr/analytics`, `@viztr/booking`, `@viztr/marketplace`, `@viztr/whitelabel`, `@viztr/api`, `@viztr/mcp`; root scripts `dev:web`, `dev:admin`, `dev:client`, `dev:all`, `build`, `test`, `typecheck`, `lint` (§21.3).
- **CORS:** every `apps/*/next.config.mjs` defines `headers()` with an explicit origin allowlist (AgentGPT, mobile clients, `xr.viztr.com`) — no `*` wildcard; required for API consumers.
- [ ] **Create CI workflow + secret scan** — `.github/workflows/ci.yml` runs `pnpm typecheck && pnpm lint && pnpm test` plus `node scripts/scan-env-secrets.mjs` on push/PR from Day 1.
- [ ] **Vitest coverage thresholds** — `packages/utils`, `packages/database`, `packages/ui` each get a `vitest.config.ts` with `coverage: { thresholds: { global: { lines: 90 } } }`; CI runs `pnpm test:coverage` and fails when below the 90% threshold.

- [ ] **Step 1: Write the failing test (workspace resolution)**

```bash
pnpm install
pnpm --filter @viztr/web exec tsc --noEmit
```

Expected: FAIL — `@viztr/web` does not exist yet.

- [ ] **Step 2: Create workspace config**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "test": { "dependsOn": ["^build"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

`tsconfig.base.json`: strict, ES2022, `moduleResolution: "bundler"`, `jsx: "preserve"`, `paths` mapping `@viztr/*` → `packages/*/src`.

- [ ] **Step 3: Create the three apps**

Each app: Next.js 15 App Router, TypeScript, `"@viztr/ui": "workspace:*"` dependency, empty `app/page.tsx` render.
Root `package.json` scripts: `dev:web`, `dev:admin`, `dev:client`, `dev:all` (`turbo run dev --parallel`), `build`, `test`, `typecheck`, `lint` (§21.3).

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm install && pnpm typecheck && pnpm build
```

Expected: PASS — all workspaces resolve, apps build.

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml turbo.json tsconfig.base.json package.json apps packages
git commit -m "feat(foundation): scaffold pnpm+turbo monorepo with web/admin/client-portal apps"
```

---

### Task 2: Prisma schema foundation + migrations

**Files:**
- Create: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/0001_init/migration.sql`
- Create: `packages/database/prisma/migrations/0008_website/migration.sql`
- Create: `packages/database/src/client.ts`
- Test: `packages/database/test/client.test.ts`

**Interfaces:**
- Consumes: Task 1 workspace.
- Produces: `prisma-client` with `org_id` on tenant tables; models: `Organization`, `User`, `Client`, `Admin`, `Staff`, `Role`, `Permission`, `Project`, `ProjectVersion`, `ProjectAsset`, `website_pages`, `agent_runs` (§6.5/§27.4); public website/lead-capture models `ContactInquiry`, `Settings`, `Faq`, `Blog`, `BlogCategory`, `Testimonial`, `NavigationItem`, `XrShareLink`; `Booking` extended with public lead-capture fields (created in the `0008_website` migration).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { getClient } from "../src/client";

describe("prisma client", () => {
  it("exposes an Org model with id field", async () => {
    const db = getClient("DATABASE_URL_UNSET");
    // @ts-expect-error - offline client just checks schema surface
    expect(db.org).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL — `client.ts` does not exist.

- [ ] **Step 3: Write schema + client**

`schema.prisma` (foundation subset + public website/lead-capture models; 100-model schema expands later):
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model Organization { id String @id @default(cuid()) name String createdAt DateTime @default(now()) users User[] projects Project[] }
model User { id String @id @default(cuid()) email String @unique name String? orgId String? org Organization? @relation(fields: [orgId], references: [id]) role Role @default(CLIENT) ... }
enum Role { PUBLIC CLIENT STAFF ADMIN SUPER_ADMIN }
model Project { id String @id @default(cuid()) orgId String org Organization @relation(fields: [orgId], references: [id]) name String status ProjectStatus @default(DRAFT) qaPassed Boolean @default(false) milestones Milestone[] qaReports qa_reports[] ... }
enum ProjectStatus { DRAFT IN_PROGRESS REVIEW APPROVED PUBLISHED ARCHIVED }
model Milestone { id String @id @default(cuid()) projectId String project Project @relation(fields: [projectId], references: [id]) name String status String @default("PENDING") approvedBy String? approvedAt DateTime? }
model qa_reports { id String @id @default(cuid()) projectId String project Project @relation(fields: [projectId], references: [id]) report Json passed Boolean createdAt DateTime @default(now()) }
model audit_log { id String @id @default(cuid()) actor String action String targetId String? meta Json? createdAt DateTime @default(now()) }
model agent_runs { id String @id @default(cuid()) agent String status String input Json? output Json? createdAt DateTime @default(now()) }
model website_pages { id String @id @default(cuid()) slug String @unique locale String @default("en") translationOf String? title String content Json? updatedAt DateTime @updatedAt }

enum BookingStatus { PENDING CONFIRMED COMPLETED CANCELLED }
model Booking { id String @id @default(cuid()) clientName String clientEmail String service String date DateTime time String? message String? status BookingStatus @default(PENDING) createdAt DateTime @default(now()) }
enum XrShareAccessType { PUBLIC PASSWORD TOKEN }
model ContactInquiry { id String @id @default(cuid()) name String email String company String? projectType String? budget String? message String status String @default("NEW") createdAt DateTime @default(now()) }
model Settings { key String @id value Json label String? type String group String updatedAt DateTime @updatedAt }
model Faq { id String @id @default(cuid()) question String answer String category String? order Int @default(0) }
model BlogCategory { id String @id @default(cuid()) name String slug String @unique }
model Blog { id String @id @default(cuid()) title String slug String @unique excerpt String content String coverImage String? readTime Int @default(0) featured Boolean @default(false) publishedAt DateTime? tags String[] category String? author String? createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
model Testimonial { id String @id @default(cuid()) clientName String quote String rating Int @default(5) projectLink String? logo String? published Boolean @default(true) order Int @default(0) }
model NavigationItem { id String @id @default(cuid()) label String href String order Int @default(0) parentId String? placement String @default("header") }
model XrShareLink { id String @id @default(cuid()) projectId String mode String accessType XrShareAccessType @default(PUBLIC) passwordHash String? token String @unique expiry DateTime? viewCount Int @default(0) revoked Boolean @default(false) createdBy String? createdAt DateTime @default(now()) }
```

> **Production DB config (set in Phase 6):** `schema.prisma` uses `url` = Supabase pooler (PgBouncer) connection string for the app, and `directUrl` = direct Postgres URL for `prisma migrate`/Studio. Phase 0 keeps `url = env("DATABASE_URL")`; Phase 6 wires the pooler + directUrl values.

`client.ts`:
```ts
import { PrismaClient } from "@prisma/client";

declare global { var __viztrDb: PrismaClient | undefined; }

export function getClient(databaseUrl: string): PrismaClient {
  return (globalThis.__viztrDb ??= new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  }));
}
```

- [ ] **Step 4: Run migration + test**

```bash
pnpm --filter @viztr/database exec prisma migrate dev --name init
pnpm --filter @viztr/database test
```

Expected: PASS — migration applies; `db.org` surface check passes.

- [ ] **Step 5: Add `0008_website` migration — content/settings/lead-capture tables + RLS**

```bash
pnpm --filter @viztr/database exec prisma migrate dev --name website
```

Prisma generates the new tables from the schema above. Unique constraints are enforced via schema attributes — `Settings.key` (`@id`), `Blog.slug` (`@unique`), `BlogCategory.slug` (`@unique`), `XrShareLink.token` (`@unique`). Hand-add supporting indexes + RLS policies in `packages/database/prisma/migrations/0008_website/migration.sql`:

```sql
CREATE INDEX "XrShareLink_projectId_idx" ON "XrShareLink"("projectId");
CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");
CREATE INDEX "NavigationItem_parentId_idx" ON "NavigationItem"("parentId");

ALTER TABLE "ContactInquiry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_inquiry_public_insert" ON "ContactInquiry" FOR INSERT WITH CHECK (true);
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Faq" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Blog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NavigationItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_content_read" ON "Faq" FOR SELECT USING (true);
CREATE POLICY "public_content_read" ON "Blog" FOR SELECT USING (true);
CREATE POLICY "public_content_read" ON "BlogCategory" FOR SELECT USING (true);
CREATE POLICY "public_content_read" ON "Testimonial" FOR SELECT USING (true);
CREATE POLICY "public_content_read" ON "NavigationItem" FOR SELECT USING (true);
ALTER TABLE "XrShareLink" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xr_share_link_public_read" ON "XrShareLink" FOR SELECT USING (accessType = 'PUBLIC' AND NOT revoked AND (expiry IS NULL OR expiry > now()));
```

Public content tables allow anonymous `SELECT`; `ContactInquiry` allows anonymous `INSERT` (public contact form); `Settings` and `XrShareLink` writes go through the service role / app-layer auth.

```bash
pnpm --filter @viztr/database test
```

Expected: PASS — migration applies; new tables + policies present.

- [ ] **Step 6: Commit**

```bash
git add packages/database
git commit -m "feat(foundation): add Prisma schema with org-scoped core models and migrations"
```

---

### Task 3: Shared types + zod schemas (`packages/types`, `packages/utils`)

**Files:**
- Create: `packages/types/src/index.ts`
- Create: `packages/utils/src/schemas.ts`
- Create: `packages/utils/src/errors.ts`
- Test: `packages/utils/test/schemas.test.ts`

**Interfaces:**
- Consumes: nothing external.
- Produces: `Role`, `ProjectStatus`, `TenantAware<T>`; `projectCreateSchema`, `loginSchema`, `signupSchema`, `aiBriefSchema`; `AppError`, `assertValid<T>(schema, data): T`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { aiBriefSchema, signupSchema } from "../src/schemas";

describe("shared schemas", () => {
  it("accepts a valid AI brief", () => {
    const input = { name: "Luxury Villa", service: "virtual-tour", budget: "10k" };
    expect(aiBriefSchema.safeParse(input).success).toBe(true);
  });
  it("rejects signup without email", () => {
    expect(signupSchema.safeParse({ password: "x".repeat(12) }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/utils test`
Expected: FAIL — modules missing.

- [ ] **Step 3: Write implementation**

`types/src/index.ts`:
```ts
export type Role = "PUBLIC" | "CLIENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
export type ProjectStatus = "DRAFT" | "IN_PROGRESS" | "REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";
export interface TenantAware<T> { orgId: string; data: T; }
```

`utils/src/schemas.ts`:
```ts
import { z } from "zod";
export const signupSchema = z.object({ email: z.string().email(), name: z.string().min(1), password: z.string().min(12) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const aiBriefSchema = z.object({ name: z.string().min(1), service: z.enum(["virtual-tour","webxr","webar","vr","pixel-streaming"]), budget: z.string().optional(), notes: z.string().max(2000).optional() });
```

`utils/src/errors.ts`:
```ts
export class AppError extends Error { constructor(public code: string, message: string) { super(message); } }
export function assertValid<T>(schema: { safeParse(d: unknown): { success: boolean; data: T } }, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new AppError("VALIDATION", "Invalid input");
  return r.data;
}
```

- **Error envelope standard (all phases):** every API route returns `{ success: boolean, error?: { code: string, message: string } }` — `success: true` on success, else a stable machine-readable `error.code` (e.g. `VALIDATION`) plus `error.message`. `AppError` carries the `code`; `assertValid` throws code `VALIDATION`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/utils test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/types packages/utils
git commit -m "feat(foundation): add shared types, zod schemas, and error helpers"
```

---

### Task 4: Design tokens (`packages/ui`)

**Files:**
- Create: `packages/ui/src/styles/tokens.css`
- Create: `packages/ui/src/styles/globals.css`
- Test: `packages/ui/test/tokens.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: CSS custom properties `--viztr-bg`, `--viztr-surface`, `--viztr-text`, `--viztr-text-muted`, `--viztr-line`, `--viztr-accent`, `--viztr-glow`, `--viztr-radius`, spacing scale; theme classes `.theme-light`/`.theme-dark` (Command Center cyan/violet system, §17.7).

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
describe("design tokens", () => {
  it("defines dark and light accent variables", () => {
    expect(tokens).toContain("--viztr-accent");
    expect(tokens).toMatch(/\.theme-dark/);
    expect(tokens).toMatch(/\.theme-light/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/ui test`
Expected: FAIL — files missing.

- [ ] **Step 3: Write tokens**

`tokens.css` (Command Center system — dark luxury UI, cyan `#00e5ff` + violet `#7c3aed` glow, §17.7):
```css
:root { --viztr-radius: 0.75rem; --viztr-font-display: "Syne", sans-serif; --viztr-font-body: "DM Sans", sans-serif; --z-base: 0; --z-nav: 100; --z-dropdown: 500; --z-toast: 9999; --z-modal: 8000; --z-overlay: 7000; --z-xr-controls: 6000; }
.theme-dark { --viztr-bg: #0a0a12; --viztr-surface: #14141f; --viztr-text: #f4f4f8; --viztr-text-muted: rgba(244,244,248,.6); --viztr-line: rgba(255,255,255,.08); --viztr-accent: #00e5ff; --viztr-glow: rgba(124,58,237,.35); }
.theme-light { --viztr-bg: #f7f7fb; --viztr-surface: #ffffff; --viztr-text: #101018; --viztr-line: rgba(16,16,24,.1); --viztr-accent: #0e7490; --viztr-glow: rgba(124,58,237,.18); }
```

- **RTL:** `tokens.css` uses CSS logical properties (`margin-inline-start`, `padding-inline`, `inset-inline`) so spacing/margins flip correctly for RTL locales.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/ui test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): add Command Center design tokens (dark/light)"
```

---

### Task 5: Core UI primitives (`packages/ui`)

**Files:**
- Create: `packages/ui/src/components/button.tsx`
- Create: `packages/ui/src/components/input.tsx`
- Create: `packages/ui/src/components/card.tsx`
- Create: `packages/ui/src/index.ts`
- Test: `packages/ui/test/components.test.tsx`

**Interfaces:**
- Consumes: Task 4 tokens.
- Produces: `Button({ variant: "primary"|"ghost"|"outline", size, children, ...props })`, `Input(props)`, `Card({ children })` — all forward refs, `data-testid` support, className merge.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "../src/components/button";

describe("Button", () => {
  it("renders children and primary class", () => {
    render(<Button variant="primary">Publish</Button>);
    expect(screen.getByRole("button", { name: "Publish" })).toHaveClass("viztr-button--primary");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/ui test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`button.tsx`:
```tsx
import { forwardRef } from "react";
export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"ghost"|"outline"; size?: "sm"|"md"|"lg" }>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => (
    <button ref={ref} className={`viztr-button viztr-button--${variant} viztr-button--${size} ${className}`} {...props} />
  ),
);
Button.displayName = "Button";
```

`index.ts` re-exports `Button`, `Input`, `Card`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/ui test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): add Button, Input, Card primitives"
```

---

### Task 6: Theme provider (next-themes)

**Files:**
- Create: `packages/ui/src/theme/provider.tsx`
- Create: `packages/ui/src/theme/theme-toggle.tsx`
- Test: `packages/ui/test/theme.test.tsx`
- Modify: `apps/web/app/layout.tsx`, `apps/admin/app/layout.tsx`, `apps/client-portal/app/layout.tsx`

**Interfaces:**
- Consumes: Task 4 tokens.
- Produces: `<ThemeProvider>` (wraps next-themes, `defaultTheme="system"`), `<ThemeToggle />` (cycles light/dark/system, persisted), client-only.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThemeToggle } from "../src/theme/theme-toggle";

describe("ThemeToggle", () => {
  it("renders a toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/ui test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`provider.tsx`:
```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>{children}</NextThemesProvider>;
}
```

`theme-toggle.tsx`:
```tsx
"use client";
import { useTheme } from "next-themes";
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  return <button aria-label="Toggle theme" onClick={() => setTheme(next)}>Theme: {theme}</button>;
}
```

Wire `<ThemeProvider>` into all three `app/layout.tsx` files (§5/§17.1).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/ui test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui apps/web/app/layout.tsx apps/admin/app/layout.tsx apps/client-portal/app/layout.tsx
git commit -m "feat(ui): add next-themes ThemeProvider and ThemeToggle (default system)"
```

---

### Task 7: Supabase client + env setup

**Files:**
- Create: `packages/database/src/supabase.ts`
- Create: `.env.example`
- Test: `packages/database/test/supabase.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: `getSupabaseClient()` (anon key), `getServiceClient()` (service-role key, **server-only**), env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (§18.1).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { getSupabaseClient } from "../src/supabase";
describe("supabase client", () => {
  it("returns a client with auth", () => {
    const c = getSupabaseClient({ url: "https://example.supabase.co", anonKey: "test" });
    expect(c.auth).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`supabase.ts`:
```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
export interface SupabaseEnv { url: string; anonKey: string; }
export function getSupabaseClient({ url, anonKey }: SupabaseEnv): SupabaseClient {
  return createClient(url, anonKey);
}
export function getServiceClient(env: { url: string; serviceRoleKey: string }): SupabaseClient {
  return createClient(env.url, env.serviceRoleKey, { auth: { persistSession: false } });
}
```

`.env.example` documents the three vars (§18.1 Google OAuth setup note: redirect URL configured in Supabase dashboard).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database .env.example
git commit -m "feat(auth): add Supabase client factories and env template"
```

---

### Task 8: Authentication service

**Files:**
- Create: `packages/database/src/auth.ts`
- Test: `packages/database/test/auth.test.ts`

**Interfaces:**
- Consumes: Task 7 client, Task 3 schemas.
- Produces: `signUpWithEmail(input): { user, session }`, `signInWithEmail(input)`, `signInWithGoogle()`, `signOut()`, `getSession()`, `refreshSession()`, `changeEmail(sb, newEmail)`, `updatePassword(sb, newPassword)`, `listActiveSessions(sb)`, `revokeSession(sb, refreshToken)`, `getActivityLog(sb, userId)` (user-facing activity log, reads `audit_log`), `deleteAccount(userId)` (GDPR, §27.3).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { signUpWithEmail } from "../src/auth";

describe("auth service", () => {
  it("signs up a user via supabase", async () => {
    const fake = { auth: { signUp: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) } };
    const result = await signUpWithEmail(fake as never, { email: "a@b.com", name: "A", password: "x".repeat(12) });
    expect(result.user.id).toBe("u1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
import { type SupabaseClient } from "@supabase/supabase-js";
import { loginSchema, signupSchema, type signupSchema as S } from "@viztr/utils";

export async function signUpWithEmail(sb: SupabaseClient, input: unknown) {
  const { email, password, name } = signupSchema.parse(input);
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
  if (error) throw new Error(error.message);
  return data;
}
export function signInWithGoogle(sb: SupabaseClient, redirectTo: string) {
  return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
}
export async function signInWithEmail(sb: SupabaseClient, input: unknown) {
  const { email, password } = loginSchema.parse(input);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}
export async function refreshSession(sb: SupabaseClient) {
  const { data, error } = await sb.auth.refreshSession();
  if (error) throw new Error(error.message);
  return data.session;
}
export async function deleteAccount(sb: SupabaseClient) {
  const { error } = await sb.auth.admin.deleteUser((await sb.auth.getUser()).data.user!.id);
  if (error) throw new Error(error.message);
}
export async function changeEmail(sb: SupabaseClient, newEmail: string) {
  const { data, error } = await sb.auth.updateUser({ email: newEmail });
  if (error) throw new Error(error.message);
  return data.user;
}
export async function updatePassword(sb: SupabaseClient, newPassword: string) {
  const { data, error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return data.user;
}
export async function listActiveSessions(sb: SupabaseClient) {
  const { data, error } = await sb.auth.listSessions();
  if (error) throw new Error(error.message);
  return data.sessions;
}
export async function revokeSession(sb: SupabaseClient, refreshToken: string) {
  const { error } = await sb.auth.revokeSession(refreshToken);
  if (error) throw new Error(error.message);
}
export async function getActivityLog(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb.from("audit_log").select("*").eq("actor", userId).order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
```

- **Security notes:** (a) MFA/TOTP is a documented follow-up task **after** Phase 0/1 — not part of this phase's steps; (b) rely on Supabase defaults and document them — access JWT expires in **1h**, refresh JWT in **1w**; (c) the Task 9 signup form also runs client-side `zxcvbn` (or equivalent) password-strength estimation alongside the min-12 rule.
- **Account settings UI note:** `deleteAccount` is backend-ready (GDPR §27.3) — surface it only in the account settings page behind a confirm modal (with email re-auth), never in the auth forms. `changeEmail`, `updatePassword`, `listActiveSessions`, `revokeSession`, and `getActivityLog` wire to the same account settings UI.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/auth.ts packages/database/test/auth.test.ts
git commit -m "feat(auth): add signup/signin/OAuth/session/delete auth service"
```

---

### Task 9: Authentication UI + route guards

**Files:**
- Create: `packages/ui/src/auth/login-form.tsx`
- Create: `packages/ui/src/auth/signup-form.tsx`
- Create: `packages/ui/src/auth/auth-shell.tsx`
- Create: `packages/utils/src/guards.ts`
- Test: `packages/utils/test/guards.test.ts`, `packages/ui/test/auth-forms.test.tsx`

**Interfaces:**
- Consumes: Task 8 service, Task 5 primitives, Task 3 schemas.
- Produces: `<LoginForm onSubmit>` (email + password + "Continue with Google"), `<SignupForm onSubmit>`, `requireAuth(role)` route-guard helper, `hasPermission(role, permission)`, `getDefaultRouteForRole(role): string` (post-login redirect target).

- [ ] **Step 1: Write the failing tests**

```ts
// guards.test.ts
import { getDefaultRouteForRole, hasPermission, requireAuth } from "../src/guards";
describe("guards", () => {
  it("grants ADMIN on projects:manage", () => expect(hasPermission("ADMIN", "projects:manage")).toBe(true));
  it("denies CLIENT on projects:manage", () => expect(hasPermission("CLIENT", "projects:manage")).toBe(false));
  it("throws for insufficient role", () => expect(() => requireAuth("CLIENT", "ADMIN")).toThrow(/forbidden/));
  it("routes each role to its default dashboard", () => {
    expect(getDefaultRouteForRole("SUPER_ADMIN")).toBe("/admin");
    expect(getDefaultRouteForRole("ADMIN")).toBe("/admin");
    expect(getDefaultRouteForRole("STAFF")).toBe("/dashboard");
    expect(getDefaultRouteForRole("CLIENT")).toBe("/portal");
  });
});
```

```tsx
// auth-forms.test.tsx
import { render, screen } from "@testing-library/react";
import { LoginForm } from "../src/auth/login-form";
describe("LoginForm", () => {
  it("renders email, password, google CTA", () => {
    render(<LoginForm onSubmit={() => {}} onGoogle={() => {}} />);
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByText(/continue with google/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -r test --filter @viztr/utils --filter @viztr/ui`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`guards.ts`:
```ts
import type { Role } from "@viztr/types";
const ROLE_RANK: Record<Role, number> = { PUBLIC: 0, CLIENT: 1, STAFF: 2, ADMIN: 3, SUPER_ADMIN: 4 };
export function hasPermission(role: Role, permission: string): boolean {
  const matrix: Record<string, Role[]> = { "projects:view": ["CLIENT","STAFF","ADMIN","SUPER_ADMIN"], "projects:manage": ["STAFF","ADMIN","SUPER_ADMIN"], "billing:manage": ["ADMIN","SUPER_ADMIN"], "users:manage": ["ADMIN","SUPER_ADMIN"], "platform:manage": ["SUPER_ADMIN"] };
  return (matrix[permission] ?? []).includes(role);
}
export function requireAuth(required: Role, current: Role): void {
  if (ROLE_RANK[current] < ROLE_RANK[required]) throw new Error("forbidden");
}
export function getDefaultRouteForRole(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN": return "/admin";
    case "STAFF": return "/dashboard";
    case "CLIENT": return "/portal";
    default: return "/";
  }
}
```

`login-form.tsx`: email + password inputs (zod `loginSchema` inline validation), submit, "Continue with Google" button calling `onGoogle`. On successful login, redirect with `getDefaultRouteForRole(user.role)` — SUPER_ADMIN/ADMIN → `/admin`, STAFF → `/dashboard`, CLIENT → `/portal` — so each role lands on its default dashboard.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -r test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/auth packages/utils/src/guards.ts packages/utils/test/guards.test.ts packages/ui/test/auth-forms.test.tsx
git commit -m "feat(auth): add auth UI forms and RBAC guard utilities"
```

---

### Task 10: RBAC enforcement — RLS policies + middleware

**Files:**
- Create: `packages/database/prisma/migrations/0002_rbac/migration.sql`
- Create: `apps/web/middleware.ts`
- Create: `packages/database/src/rbac.ts`
- Test: `packages/database/test/rbac.test.ts`

**Interfaces:**
- Consumes: Task 2 models, Task 9 guards.
- Produces: SQL RLS policies on `Project`/`ProjectVersion`/`ProjectAsset` scoped by `org_id` (§27.7); `enforceRls(rlsEnabled: boolean)`; middleware that rejects unauthenticated `/dashboard`, `/admin`, `/portal` paths.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { policySql } from "../src/rbac";
describe("rbac policies", () => {
  it("emits an org-scoped policy for Project", () => {
    expect(policySql).toContain("CREATE POLICY");
    expect(policySql).toContain("org_id");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`migration.sql`:
```sql
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_tenant_isolation" ON "Project"
  USING (auth.jwt() ->> 'org_id' = "org_id");
```
(Repeat for `ProjectVersion`, `ProjectAsset`.)

`rbac.ts` exports the policy SQL string, plus:
```ts
export function isTenantAccessible(userOrgId: string | null, rowOrgId: string): boolean {
  return userOrgId != null && userOrgId === rowOrgId;
}
```

`middleware.ts` (Next.js):
```ts
import { NextResponse, type NextRequest } from "next/server";
const PROTECTED = ["/dashboard", "/admin", "/portal"];
export function middleware(req: NextRequest) {
  const token = req.cookies.get("sb-access-token")?.value;
  if (PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p)) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
```

> **Session cookies (must use `@supabase/ssr`):** cookie/session management MUST use `createServerClient` from `@supabase/ssr` — it handles the `sb-access-token`/`sb-refresh-token` cookie names automatically (including rotation). Do not manually parse cookie names; replace the stub above with `createServerClient`.

> **Post-login redirect:** after a successful sign-in, redirect to `getDefaultRouteForRole(user.role)` (Task 9) — SUPER_ADMIN/ADMIN → `/admin`, STAFF → `/dashboard`, CLIENT → `/portal`. The middleware above guards exactly those three paths, so every role default route is protected.

- [ ] **Step 4: Run migration + test**

```bash
pnpm --filter @viztr/database exec prisma migrate dev --name rbac
pnpm --filter @viztr/database test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database apps/web/middleware.ts
git commit -m "feat(rbac): add RLS policies, tenant access check, and route middleware"
```

---

### Task 11: Seed demo accounts (dev)

**Files:**
- Create: `packages/database/prisma/seed.config.ts`
- Create: `packages/database/prisma/seed.ts`
- Update: `packages/database/package.json` (`prisma.seed` → `"tsx prisma/seed.ts"`)
- Test: `packages/database/test/seed.test.ts`

**Interfaces:**
- Consumes: Task 8 auth service (`getServiceClient`), Task 2 `User`/`Role` models.
- Produces: four demo accounts — one per role — with known dev credentials for demos: `superadmin@viztr.dev` (SUPER_ADMIN), `admin@viztr.dev` (ADMIN), `staff@viztr.dev` (STAFF), `client@viztr.dev` (CLIENT), all sharing password `DemoPass!2026`. Runs via `pnpm --filter @viztr/database db:seed` (add root `db:seed` script). Dev-only — never seeds against prod.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { DEMO_ACCOUNTS } from "../prisma/seed.config";
describe("demo seed config", () => {
  it("defines one account per role", () => {
    expect(DEMO_ACCOUNTS.map((a) => a.role).sort()).toEqual(["ADMIN", "CLIENT", "STAFF", "SUPER_ADMIN"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL — seed config missing.

- [ ] **Step 3: Write seed config + seed script**

`seed.config.ts`:
```ts
export const DEMO_PASSWORD = "DemoPass!2026";
export const DEMO_ACCOUNTS = [
  { role: "SUPER_ADMIN", email: "superadmin@viztr.dev" },
  { role: "ADMIN", email: "admin@viztr.dev" },
  { role: "STAFF", email: "staff@viztr.dev" },
  { role: "CLIENT", email: "client@viztr.dev" },
] as const;
```

`seed.ts`: for each demo account, `getServiceClient(env).auth.admin.createUser({ email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { role } })`, then upsert the matching `User` row with the same `role`. Idempotent — skip accounts that already exist.

- [ ] **Step 4: Run seed + test**

```bash
pnpm --filter @viztr/database db:seed
pnpm --filter @viztr/database test
```

Expected: PASS — four demo users exist and sign in with the documented credentials.

- [ ] **Step 5: Commit**

```bash
git add packages/database/prisma/seed.ts packages/database/prisma/seed.config.ts packages/database/package.json packages/database/test/seed.test.ts
git commit -m "feat(db): seed demo accounts for all roles (SUPER_ADMIN/ADMIN/STAFF/CLIENT)"
```

---

### Checkpoint: M1 Definition of Done

- [ ] Monorepo builds (`pnpm build`), typechecks, tests green.
- [ ] `pnpm dev:all` starts all three apps.
- [ ] Design tokens + primitives + ThemeToggle render; theme persists (`localStorage`).
- [ ] Email + Google OAuth signup/signin work against a real Supabase project.
- [ ] Unauthenticated `/dashboard`, `/admin`, `/portal` redirect to `/login`.
- [ ] `hasPermission`/`requireAuth` covered by tests; RLS policies applied to Project tables.
- [ ] Demo accounts seeded — SUPER_ADMIN, ADMIN, STAFF, CLIENT sign in with documented dev credentials (Task 11).
- [ ] Header §25 row 27 flipped to **In Progress → Done** when verified.
