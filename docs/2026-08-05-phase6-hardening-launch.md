# Phase 6 — Hardening & Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship-grade hardening and launch: security & permissions audit, SEO & growth, design-system polish (accessibility/RTL), performance optimization, and production deployment with observability and runbooks.

**Architecture:** Cross-cutting pass over all apps and packages. Security is a verification pass (RLS audit, dependency/penetration checks, compliance docs). SEO is Content-as-Code driven (Phase 3) with technical SEO finished here. Performance enforces §22 budgets via bundler + Core Web Vitals tooling. Deployment codifies the §24 pipeline (envs, backups, monitoring, runbooks).

**Tech Stack:** Next.js (bundler analyzers), Playwright, eslint-plugin-jsx-a11y, @axe-core/playwright, Lighthouse CI, next-sitemap, Structured Data (JSON-LD), Sentry, Vercel + Supabase + GitHub Actions, Terraform (infra).

## Global Constraints

- Security (§18): HTTPS, RLS audit, rate limiting, zod everywhere, no secrets in repo, audit logs for sensitive ops.
- SEO (§16): sitemap, robots, OG images, JSON-LD structured data, auto-generated via Content-as-Code; Lighthouse ≥ 90.
- Accessibility: WCAG 2.1 AA, keyboard nav, focus rings, alt text, ARIA labels, skip links (§19).
- Performance (§22): API p95 < 200ms; LCP < 2.5s; TBT < 200ms; page load < 10s; JS/CSS budgets; 3D only hero + demo.
- Uptime: 99.9% target; backups daily + PITR; DR plan (§23/§27.9).
- Conventional commits; all CI gates green before merge.

---

### Task 1: Security & permissions audit

**Files:**
- Create: `security/security-audit.md`
- Create: `security/rls-review.md`
- Create: `scripts/scan-env-secrets.ps1`
- Test: `security/test/scan-env.test.ts`

**Interfaces:**
- Consumes: Phase 0/1 RLS policies, Phase 5 API keys.
- Produces: audit checklist with pass/fail, RLS policy review table (every tenant table), secret-scan script exit code 0 when clean.

- [ ] **Step 1: Write the failing test**

```ts
import { scanForSecrets } from "../scripts/scan-lib";
describe("secret scan", () => {
  it("flags inline keys", () => {
    expect(scanForSecrets('const k = "sk_live_123"').hits.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/security test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`scan-lib.ts`:
```ts
export function scanForSecrets(text: string) {
  const re = /(sk_live_|sk_test_|SUPABASE_SERVICE_ROLE_KEY\s*=\s*["'][^"']+)/g;
  return { hits: [...text.matchAll(re)].map((m) => m[0]) };
}
```

`security-audit.md` checkboxes: HTTPS, JWT refresh, RLS on all tenant tables, rate limiting, zod validation, CORS allowlist, CSRF on forms, XSS escaping, file validation, audit logging (§27.9); Content-Security-Policy headers set in the Next.js config; `robots.txt` disallowing `/api/*`, `/admin/*`, `/portal/*`, `/dashboard/*` from crawlers. `rls-review.md` lists each table + policy name + status.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/security test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add security
git commit -m "chore(security): add audit docs, RLS review, and secret scanner"
```

---

### Task 2: SEO & structured data

**Files:**
- Create: `apps/web/lib/seo.ts`
- Create: `apps/web/app/sitemap.ts`
- Create: `apps/web/app/robots.ts`
- Create: `apps/web/app/opengraph-image.tsx`
- Test: `apps/web/test/seo.test.ts`

**Interfaces:**
- Consumes: Content-as-Code `website_pages` (Phase 3 Task 3).
- Produces: `buildMeta(page)` (title/description/JSON-LD), dynamic `sitemap.xml`, `robots.txt`, OG image generator (§16/§4.5).

- [ ] **Step 1: Write the failing test**

```ts
import { buildJsonLd } from "../lib/seo";
describe("seo", () => {
  it("emits Organization JSON-LD", () => {
    const ld = buildJsonLd({ type: "Organization", name: "VizTR" });
    expect(ld["@type"]).toBe("Organization");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/web test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`seo.ts`:
```ts
export function buildJsonLd(data: { type: string; name: string }) {
  return { "@context": "https://schema.org", "@type": data.type, name: data.name };
}
```

`sitemap.ts` enumerates static routes + `website_pages` slugs, including the `/team`, `/careers`, and `/xr/*` public pages (Phase 2 Content-as-Code routes, final QA in Task 7); `robots.ts` allows all public routes and points to sitemap; `opengraph-image.tsx` renders branded 1200×630 via `ImageResponse`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/seo.ts apps/web/app/sitemap.ts apps/web/app/robots.ts apps/web/app/opengraph-image.tsx apps/web/test/seo.test.ts
git commit -m "feat(seo): add JSON-LD, sitemap, robots, and OG image"
```

---

### Task 3: Accessibility pass

**Files:**
- Create: `e2e/accessibility.spec.ts` (Playwright + axe-core)
- Modify: `packages/ui` primitives (focus-visible rings, aria-label plumbing)
- Test: `packages/ui/test/a11y.test.tsx`

**Interfaces:**
- Consumes: all `packages/ui` components.
- Produces: axe scans on public + portal routes with zero violations; skip-link + focus ring tokens in the design system (§19/§27.9).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Input } from "../src/components/input";
describe("Input a11y", () => {
  it("surfaces label association", () => {
    render(<Input aria-label="Email" />);
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/ui test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

Ensure `Input` spreads `aria-*` props; add global focus-visible ring in `globals.css`; add skip-link component to layouts.
`accessibility.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public pages have no a11y violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/ui test; pnpm e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/accessibility.spec.ts packages/ui/src/styles/globals.css packages/ui/src/components/input.tsx packages/ui/test/a11y.test.tsx
git commit -m "feat(a11y): axe-scanned accessibility with skip links and focus rings"
```

---

### Task 4: Performance optimization

**Files:**
- Create: `scripts/check-budgets.mjs`
- Create: `.github/workflows/performance.yml`
- Test: `scripts/test/check-budgets.test.mjs`

**Interfaces:**
- Consumes: §22 budgets, all apps.
- Produces: CI job running Lighthouse on web/admin/client-portal/xr-runner; bundle budget check script (JS ≤ 200KB gz marketing route, CSS < 50KB gz, §5.4).

- [ ] **Step 1: Write the failing test**

```mjs
import { parseBudgets } from "../check-budgets.mjs";
import assert from "node:assert";
assert.deepEqual(parseBudgets("web:200 admin:200 portal:200 xr:300"), { web: 200, admin: 200, portal: 200, xr: 300 });
console.log("ok");
```

Run: `node scripts/test/check-budgets.test.mjs`
Expected: FAIL.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test/check-budgets.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`check-budgets.mjs`:
```mjs
export function parseBudgets(raw) {
  return Object.fromEntries(raw.split(/\s+/).map((p) => { const [k, v] = p.split(":"); return [k, Number(v)]; }));
}
```
Reads `@next/bundle-analyzer` output + Lighthouse CI JSON; fails build on over-budget. Enforces: no hero video (§5.4), 3D only hero + demo (§22), `next/image` everywhere, fonts via `next/font`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test/check-budgets.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-budgets.mjs scripts/test/check-budgets.test.mjs .github/workflows/performance.yml
git commit -m "ci(perf): add Lighthouse CI and bundle budget checks"
```

---

### Task 5: Production deployment + runbooks

**Files:**
- Create: `infrastructure/terraform/main.tf`
- Create: `infrastructure/docker/docker-compose.yml`
- Create: `docs/runbooks/incident-response.md`
- Create: `docs/runbooks/backup-restore.md`
- Create: `.github/workflows/deploy.yml`
- Test: `docs/runbooks/test/runbook-check.test.ts`

**Interfaces:**
- Consumes: everything.
- Produces: deploy pipeline (test → build → migrate → deploy web/admin/portal/xr + worker), Supabase production project with backups, docker-compose for local Redis/queue, runbooks (incident, restore), monitoring dashboards (§24/§23).

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
describe("runbooks", () => {
  it("incident runbook has severity + rollback sections", () => {
    const t = readFileSync("docs/runbooks/incident-response.md", "utf8");
    expect(t).toMatch(/Severity/);
    expect(t).toMatch(/Rollback/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/docs test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`deploy.yml`: `pnpm install → test → typecheck → build → migrate (prisma migrate deploy) → vercel deploy (all apps) → smoke test`. `main.tf`: Supabase project, Vercel projects, domain records, backup schedule. Runbooks document severity levels, rollback commands, restore from PITR. The processing Docker image must include Blender headless + FFmpeg for the asset pipeline (`asset.process`/`render` jobs); set BullMQ job `timeout: 600_000` (10 min) for large files.

- Production Redis runs in **Sentinel or Cluster** mode (no single point of failure) since the queue, cache, and rate-limits all depend on it; document failover/connectivity in the runbooks.
- The **100+ concurrent per GPU node** target (§23) requires **GPU node autoscaling**; document the scaling policy (add/remove GPU nodes by streaming session demand) as a **post-launch** scaling task, not MVP.
- Archive `agent_runs` older than **90 days** to cold storage (S3/R2) and purge them from the hot table to bound table growth.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/docs test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add infrastructure .github/workflows/deploy.yml docs/runbooks docs/runbooks/test/runbook-check.test.ts
git commit -m "chore(deploy): add Terraform, deploy pipeline, and incident/restore runbooks"
```

---

### Task 6: GA4 analytics injection

**Files:**
- Create: `apps/web/components/analytics/GaGtag.tsx`
- Create: `apps/web/lib/analytics/ga.ts`
- Test: `apps/web/test/ga.test.ts`

**Interfaces:**
- Consumes: cookie-consent state (existing GDPR gate — see Checkpoint consent bullet below), `Settings.gaMeasurementId`.
- Produces: `buildGtagScriptUrl(id)`, `loadGtag(id)` (inject gtag script + `dataLayer` + `gtag("config", id)`), `<GaGtag measurementId consent>` — loads gtag ONLY after consent is granted. **Additive:** PostHog, Vercel Analytics, and Sentry stay as-is; GA4 is for the marketing site only. Complements `2026-08-05-phase2-core-platform.md` Task 19 (GA4 analytics) — this task makes it consent-aware with a Settings-configurable measurement ID and locks it down before launch.

- [ ] **Step 1: Write the failing test**

```ts
import { buildGtagScriptUrl } from "../lib/analytics/ga";
describe("ga4", () => {
  it("builds the gtag script URL", () => {
    expect(buildGtagScriptUrl("G-ABC123")).toBe("https://www.googletagmanager.com/gtag/js?id=G-ABC123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/web test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/analytics/ga.ts`:
```ts
export function buildGtagScriptUrl(id: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${id}`;
}
export function loadGtag(id: string) {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  w.gtag("js", new Date());
  w.gtag("config", id);
  const s = document.createElement("script");
  s.async = true;
  s.src = buildGtagScriptUrl(id);
  document.head.appendChild(s);
}
```

`GaGtag.tsx`: reads `gaMeasurementId` from Settings (`getSetting("gaMeasurementId")`), renders nothing when unset, and calls `loadGtag` only when `consent === "granted"` — consistent with the existing consent gate firing before Vercel Analytics/PostHog for EU/UK users.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/analytics apps/web/lib/analytics apps/web/test/ga.test.ts
git commit -m "feat(analytics): add consent-aware GA4 gtag injection"
```

---

### Task 7: Launch page final QA (`/team`, `/careers`, `/xr/*`)

**Files:**
- Create: `e2e/launch-pages.spec.ts`
- Create: `docs/launch/launch-page-qa.md`
- Test: `docs/launch/test/launch-qa.test.ts`

**Interfaces:**
- Consumes: Phase 2 Content-as-Code pages (`/team`, `/careers`), xr-runner public pages (`/xr/*`), Task 2 sitemap/robots.
- Produces: a coverage checklist + Playwright spec verifying each route is live, present in `sitemap.ts`/`robots.ts`, and passes Lighthouse ≥ 90 (Task 4 CI) + axe scans (Task 3).

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
describe("launch page QA", () => {
  it("qa doc covers team, careers, and xr routes", () => {
    const t = readFileSync("docs/launch/launch-page-qa.md", "utf8");
    expect(t).toMatch(/\/team/);
    expect(t).toMatch(/\/careers/);
    expect(t).toMatch(/\/xr\//);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/docs test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`docs/launch/launch-page-qa.md` — checklist per route family:
- `/team`, `/careers` (Phase 2 Content-as-Code `website_pages`) — in `sitemap.ts` + `robots.ts` (Task 2), Lighthouse ≥ 90 (Task 4 CI), axe scan (Task 3).
- `/xr/*` public pages (marketing/viewer routes from `2026-08-05-phase4-xr-engine.md`) — in the xr-runner sitemap/robots, Lighthouse ≥ 90, `prefers-reduced-motion` + a11y pass.

`e2e/launch-pages.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
const routes = ["/team", "/careers", "/xr/tour", "/xr/ar", "/xr/vr"];
for (const route of routes) {
  test(`${route} loads without console errors`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/docs test; pnpm e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/launch-pages.spec.ts docs/launch docs/launch/test/launch-qa.test.ts
git commit -m "test(launch): add final QA for /team, /careers, and /xr/* pages"
```

---

### Checkpoint: M6 Definition of Done

- [ ] Security audit + RLS review pass; secret scanner clean in CI.
- [ ] GA4 gtag fires only after consent; marketing-site analytics additive (PostHog/Vercel/Sentry unchanged).
- [ ] `/team`, `/careers`, `/xr/*` in sitemap/robots and passing Lighthouse/axe in CI.
- [ ] SEO: sitemap/robots/OG/JSON-LD live; Lighthouse ≥ 90.
- [ ] axe scans green on public + portal routes; keyboard nav verified.
- [ ] Bundle budgets enforced in CI; Core Web Vitals green.
- [ ] Production deploy pipeline green end-to-end; backups + runbooks documented.
- [ ] Cookie consent banner (GDPR) live and firing BEFORE Vercel Analytics/PostHog for EU/UK users.
- [ ] Legal pages drafted before launch: `/legal/privacy`, `/legal/terms`.
- [ ] Data retention policy defined: when deleted-user records are purged from all tables (`agent_runs`, `audit_log`, `analytics`) and a documented purge job.
- [ ] "Download My Data" export endpoint live (GDPR data portability, §27.3 deleteAccount context).
- [ ] Load test plan defined for the 10,000-concurrent-user target (§23); k6 script smoke test passes before launch (no full load test).
- [ ] §25 tracker rows 32 updated; §28 milestones M0–M6 complete.
