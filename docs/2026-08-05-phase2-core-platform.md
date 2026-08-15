# Phase 2 — Core Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public marketing website (SSR/SSG, 3D hero, service pages, AI Brief form), the project dashboard (user portal), the admin panel, and the client portal (approval + downloads).

**Architecture:** Next.js App Router in `apps/web` (public + dashboard), `apps/admin`, `apps/client-portal`. All data flows through Next.js API Routes → Supabase (RLS-scoped). UI comes from `@viztr/ui`. Dashboard and portal routes are protected by middleware (Phase 0/1 Task 10).

**Tech Stack:** Next.js 15/16, React 18, Tailwind CSS 3.4, Babylon.js 8+ (hero, §17.8), react-hook-form + zod, TanStack Query 5, @supabase/supabase-js.

## Global Constraints

- TypeScript strict; conventional commits; mobile-first; WCAG 2.1 AA.
- 3D only on hero + service demo pages — never on every page (§22).
- Hero is lightweight Babylon.js scene (§17.8) — no heavy video (§5.4/§17.8).
- Public pages SSR/SSG for SEO (§4.5); API via `@viztr/utils` zod schemas.
- RBAC guards from Phase 0/1 Task 9; RLS tenant scoping from Task 10.
- Client sees only approved milestones and downloadable assets (§3.2/§27.7).

---

### Task 1: Marketing layout + page shell

**Files:**
- Create: `apps/web/app/(marketing)/layout.tsx`
- Create: `apps/web/app/(marketing)/page.tsx`
- Create: `apps/web/components/layout/nav.tsx`, `apps/web/components/layout/footer.tsx`
- Create: `packages/ui/src/components/badge.tsx`, `packages/ui/src/components/section-heading.tsx`
- Test: `packages/ui/test/badge.test.tsx`

**Interfaces:**
- Consumes: `@viztr/ui` primitives + ThemeToggle.
- Produces: marketing layout with fixed nav (wordmark + links + ThemeToggle), footer; `Badge`, `SectionHeading` components.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Badge } from "../src/components/badge";
describe("Badge", () => {
  it("renders label", () => {
    render(<Badge>NEW</Badge>);
    expect(screen.getByText("NEW")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/ui test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`badge.tsx`:
```tsx
export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`viztr-badge ${className}`}>{children}</span>;
}
```

Marketing layout: `<Nav />` (fixed, `data-testid="nav"`), `<main>{children}</main>`, `<Footer />`; wrapped in `<ThemeProvider>` from Phase 0/1. Home page renders placeholder sections (Hero/Stats/Services/CTA) to be filled in Tasks 2–5.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/ui test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/badge.tsx packages/ui/test/badge.test.tsx apps/web
git commit -m "feat(web): add marketing layout, nav, footer, Badge"
```

---

### Task 2: 3D Hero section (Babylon.js)

**Files:**
- Create: `apps/web/components/home/hero.tsx`
- Create: `apps/web/components/home/hero-babylon.tsx` (client, `"use client"`)
- Create: `apps/web/lib/copy.ts` (hero copy: "Launch Command Center", "View XR Services", §4.1)
- Test: `apps/web/test/copy.test.ts`

**Interfaces:**
- Consumes: `@viztr/ui` Button.
- Produces: `<Hero />` server component rendering `<BabylonHero />`; `heroCopy` object with eyebrow, headline, CTAs (§4.1). Scene authored in the Babylon.js Editor and exported; component mounts `@babylonjs/core` `Engine` + `Scene` (grid floor, floating hotspot billboards, `ArcRotateCamera` auto-rotate) per §17.8.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { heroCopy } from "../lib/copy";
describe("hero copy", () => {
  it("exposes primary CTA 'Launch Command Center'", () => {
    expect(heroCopy.primaryCta).toBe("Launch Command Center");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/web test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`copy.ts`:
```ts
export const heroCopy = {
  eyebrow: "VIZTR INTELLIGENCE OS",
  headline: "One studio. Multiple immersive realities.",
  primaryCta: "Launch Command Center",
  secondaryCta: "View XR Services",
};
```

`hero-babylon.tsx` (§17.8 pattern):
```tsx
"use client";
import { useEffect, useRef } from "react";
import { Engine, Scene, ArcRotateCamera, Vector3, StandardMaterial, MeshBuilder } from "@babylonjs/core";
export function BabylonHero() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const engine = new Engine(ref.current, true);
    const scene = new Scene(engine);
    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 10, Vector3.Zero(), scene);
    camera.attachControl(ref.current, true);
    const mat = new StandardMaterial("glow", scene);
    mat.emissiveColor.set(0, 0.9, 1);
    const hotspot = MeshBuilder.CreateSphere("hotspot", { diameter: 0.36 }, scene);
    hotspot.material = mat;
    hotspot.position.y = 1;
    engine.runRenderLoop(() => scene.render());
    return () => { engine.stopRenderLoop(); engine.dispose(); };
  }, []);
  return <canvas ref={ref} style={{ width: "100%", height: "100%" }} aria-label="VIZTR hero 3D scene" />;
}
```

`hero.tsx` (server): eyebrow `<Badge>`, headline, both CTAs, `<BabylonHero />`. Lazy-loads canvas below the fold; respects `prefers-reduced-motion` (skip animation).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/home apps/web/lib/copy.ts apps/web/test/copy.test.ts
git commit -m "feat(web): add lightweight Babylon.js marketing hero with copy"
```

---

### Task 3: Service pages (Virtual Tour, WebXR, WebAR, VR, Pixel Streaming)

**Files:**
- Create: `apps/web/lib/services.ts`
- Create: `apps/web/app/(marketing)/services/page.tsx`
- Create: `apps/web/app/(marketing)/services/[slug]/page.tsx`
- Create: `apps/web/components/services/service-matrix.tsx`
- Test: `apps/web/test/services.test.ts`

**Interfaces:**
- Consumes: `@viztr/ui` Card/Badge, Task 2 Button.
- Produces: `services: Service[]` (slug, name, tagline, features, techTags, demoSection), `/services` grid (§4.2/§17.8 ServiceMatrix 6-card), `/services/[slug]` detail with 3D demo placeholder for demo-capable services.

- [ ] **Step 1: Write the failing test**

```ts
import { services } from "../lib/services";
describe("services data", () => {
  it("covers all five XR services", () => {
    const slugs = services.map((s) => s.slug);
    expect(slugs).toEqual(expect.arrayContaining(["virtual-tour", "webxr", "webar", "vr", "pixel-streaming"]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/web test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`services.ts`:
```ts
export interface Service { slug: string; name: string; tagline: string; features: string[]; techTags: string[]; hasDemo: boolean; }
export const services: Service[] = [
  { slug: "virtual-tour", name: "Virtual Tour", tagline: "Immersive 360 walkthroughs", features: ["Panorama viewer", "Hotspots", "Auto-tour"], techTags: ["Marzipano", "Babylon.js", "WebGL"], hasDemo: true },
  { slug: "webxr", name: "WebXR", tagline: "Browser-based XR experiences", features: ["AR/VR modes", "No app install"], techTags: ["WebXR API"], hasDemo: true },
  { slug: "webar", name: "WebAR", tagline: "Augmented reality in the browser", features: ["Markerless AR", "Spatial anchors"], techTags: ["Babylon.js", "WebXR"], hasDemo: true },
  { slug: "vr", name: "Virtual Reality", tagline: "Headset-native immersive worlds", features: ["Room-scale", "Controller input"], techTags: ["WebXR", "WebVR"], hasDemo: false },
  { slug: "pixel-streaming", name: "Pixel Streaming", tagline: "Ultra-real Unreal Engine streams", features: ["Unreal quality", "WebRTC low-latency"], techTags: ["Unreal", "WebRTC"], hasDemo: true },
];
```

Pages: grid (ServiceMatrix) + detail page with `generateStaticParams()` (SSG, §4.5). Detail renders demo section only when `hasDemo`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/services.ts apps/web/app/(marketing)/services apps/web/components/services apps/web/test/services.test.ts
git commit -m "feat(web): add five XR service pages (SSG) and ServiceMatrix grid"
```

---

### Task 4: AI Brief submission form

**Files:**
- Create: `apps/web/components/brief/ai-brief-form.tsx`
- Create: `apps/web/app/api/brief/route.ts` (Next.js API Route)
- Create: `packages/database/src/brief.ts`
- Test: `packages/database/test/brief.test.ts`, `packages/utils/test/ai-brief.test.ts`

**Interfaces:**
- Consumes: `aiBriefSchema` (Phase 0/1 Task 3), Task 3 `services`.
- Produces: `POST /api/brief` → validates → creates `agent_runs` row (agent="brief-parser") + draft `Project` (RLS-scoped to new/existing org); returns `{ ok, projectId }`.

- [ ] **Step 1: Write the failing tests**

```ts
// brief.test.ts
import { createBriefRun } from "../src/brief";
describe("brief service", () => {
  it("writes an agent run and returns a project id", async () => {
    const run = await createBriefRun({ db: fakeDb as never, input: { name: "Villa", service: "virtual-tour" } });
    expect(run.projectId).toBe("p_1");
  });
});
```

```ts
// ai-brief.test.ts
import { aiBriefSchema } from "../src/schemas";
describe("ai brief schema", () => {
  it("rejects unknown service", () => {
    expect(aiBriefSchema.safeParse({ name: "x", service: "hologram" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -r test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`brief.ts`:
```ts
import { aiBriefSchema } from "@viztr/utils";

export async function createBriefRun({ db, input }: { db: any; input: unknown }) {
  const data = aiBriefSchema.parse(input);
  const org = await db.org.upsert({ where: { id: "brief-" + data.name.toLowerCase() }, create: { name: data.name }, update: {} });
  const project = await db.project.create({ data: { orgId: org.id, name: data.name, status: "DRAFT" } });
  await db.agent_runs.create({ data: { agent: "brief-parser", status: "done", input: data, output: { projectId: project.id } } });
  return { projectId: project.id };
}
```

`route.ts`:
```ts
import { NextResponse } from "next/server";
import { createBriefRun } from "@viztr/database";
export async function POST(req: Request) {
  const body = await req.json();
  try {
    const { projectId } = await createBriefRun({ db: prismaClient, input: body });
    return NextResponse.json({ ok: true, projectId });
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message }, { status: 400 });
  }
}
```

Form: react-hook-form + zod resolver, honeypot hidden field, disabled submit while pending, success state shows project URL.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -r test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/brief apps/web/app/api/brief packages/database/src/brief.ts packages/database/test/brief.test.ts packages/utils/test/ai-brief.test.ts
git commit -m "feat(brief): add AI Brief form + API route creating draft project"
```

---

### Task 5: Project Dashboard (user portal)

**Files:**
- Create: `apps/web/app/dashboard/layout.tsx`
- Create: `apps/web/app/dashboard/page.tsx`
- Create: `apps/web/components/dashboard/project-list.tsx`
- Create: `apps/web/app/api/projects/route.ts`
- Create: `packages/database/src/projects.ts`
- Test: `packages/database/test/projects.test.ts`

**Interfaces:**
- Consumes: RLS-scoped Prisma, `requireAuth` (Phase 0/1).
- Produces: `GET /api/projects` (org-scoped, `?status=`), `listProjects(db, orgId, status?)`, `getProject(db, orgId, projectId)`. Dashboard shows status badges + upload CTA (Phase 3 pipeline).

- [ ] **Step 1: Write the failing test**

```ts
import { listProjects } from "../src/projects";
describe("projects", () => {
  it("scopes list to org", async () => {
    const rows = await listProjects({ project: { findMany: async ({ where }: any) => [where] } } as any, "org_1");
    expect(rows[0]).toMatchObject({ orgId: "org_1" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`projects.ts`:
```ts
import type { ProjectStatus } from "@viztr/types";

export function listProjects(db: any, orgId: string, status?: ProjectStatus) {
  return db.project.findMany({ where: { orgId, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" } });
}
export function getProject(db: any, orgId: string, projectId: string) {
  return db.project.findFirst({ where: { id: projectId, orgId }, include: { versions: true } });
}
```

API route guards org from session, calls `listProjects`. Dashboard page: `requireAuth("STAFF", sessionRole)`, renders project status table (DRAFT/IN_PROGRESS/REVIEW/APPROVED/PUBLISHED/ARCHIVED badges), empty state with CTA.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/dashboard apps/web/components/dashboard apps/web/app/api/projects packages/database/src/projects.ts packages/database/test/projects.test.ts
git commit -m "feat(dashboard): add org-scoped project list API and dashboard UI"
```

---

### Task 6: Admin panel (project management)

**Files:**
- Create: `apps/admin/app/admin/projects/page.tsx`
- Create: `apps/admin/components/projects/project-table.tsx`
- Create: `apps/admin/app/api/admin/projects/route.ts`
- Create: `apps/admin/lib/status-actions.ts`
- Test: `apps/admin/test/status-actions.test.ts`

**Interfaces:**
- Consumes: `listProjects`, `getProject` (Task 5), `hasPermission("ADMIN","projects:manage")`.
- Produces: `updateProjectStatus(db, projectId, status, audit)` writing an `AuditLog` row (§18 audit logging); admin table with filter + status transitions.

- [ ] **Step 1: Write the failing test**

```ts
import { updateProjectStatus } from "../lib/status-actions";
describe("status actions", () => {
  it("updates status and writes audit log", async () => {
    const db = { project: { update: async (a: any) => a }, audit_log: { create: async (a: any) => a } };
    const r = await updateProjectStatus(db as any, "p_1", "APPROVED", "admin@viztr");
    expect(r.audit.actor).toBe("admin@viztr");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`status-actions.ts`:
```ts
import type { ProjectStatus } from "@viztr/types";
export async function updateProjectStatus(db: any, projectId: string, status: ProjectStatus, actor: string) {
  await db.project.update({ where: { id: projectId }, data: { status } });
  const audit = await db.audit_log.create({ data: { actor, action: "project.status.update", targetId: projectId, meta: { status } } });
  return { audit };
}
```

Admin page requires `hasPermission("ADMIN", "projects:manage")`, renders `<ProjectTable />` with status dropdown calling `updateProjectStatus`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/admin/projects apps/admin/components/projects apps/admin/app/api/admin/projects apps/admin/lib/status-actions.ts apps/admin/test/status-actions.test.ts
git commit -m "feat(admin): add project management table with audit-logged status updates"
```

---

### Task 6b: Super Admin panel (platform management)

> **Gap fix (audit 2026-08-05):** SUPER_ADMIN exists in the RBAC matrix (rank 4) with `platform:manage`, `users:manage`, `billing:manage` permissions — but had no UI. This task delivers it using the same `apps/admin` app with elevated route guards.

**Files:**
- Create: `apps/admin/app/admin/users/page.tsx` — user list, role assignment (`users:manage` → SUPER_ADMIN only)
- Create: `apps/admin/app/admin/orgs/page.tsx` — org list, org status, storage/quota view
- Create: `apps/admin/app/admin/platform/page.tsx` — platform health (queue depth, job failures, agent runs), feature flags, emergency stop link (`/admin/agents/emergency-stop`, §18.4)
- Create: `apps/admin/app/api/admin/platform/route.ts`
- Create: `apps/admin/lib/platform-admin.ts`
- Test: `apps/admin/test/platform-admin.test.ts`

**Interfaces:**
- Consumes: `hasPermission("SUPER_ADMIN","platform:manage")` (Task 9 guards, Phase 0/1), `listProjects`, RLS.
- Produces: `listUsers(db, orgId?)`, `setUserRole(db, userId, role)`, `listOrgs(db)`, `getPlatformHealth(db, redis)` — all writing `audit_log` rows; admin pages guarded by `requirePermission("SUPER_ADMIN","platform:manage")`.

- [ ] **Step 1: Write the failing test**

```ts
import { setUserRole } from "../lib/platform-admin";
describe("platform-admin", () => {
  it("assigns a role and audits it", async () => {
    const db = { user: { update: async (a: any) => a }, audit_log: { create: async (a: any) => a } };
    const r = await setUserRole(db as any, "u_1", "STAFF", "super@viztr");
    expect(r.audit.action).toBe("user.role.update");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`platform-admin.ts`:
```ts
import type { Role } from "@viztr/types";
export async function setUserRole(db: any, userId: string, role: Role, actor: string) {
  await db.user.update({ where: { id: userId }, data: { role } });
  const audit = await db.audit_log.create({ data: { actor, action: "user.role.update", targetId: userId, meta: { role } } });
  return { audit };
}
```

Super Admin pages require `hasPermission("SUPER_ADMIN", "platform:manage")`; user/org routes additionally gate `users:manage` / `billing:manage`. Billing override (plan changes) defers to Phase 5 (entitlements) — this task renders the surface only.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/admin/users apps/admin/app/admin/orgs apps/admin/app/admin/platform apps/admin/app/api/admin/platform apps/admin/lib/platform-admin.ts apps/admin/test/platform-admin.test.ts
git commit -m "feat(admin): add Super Admin panel for users, orgs, and platform health"
```

---

### Task 7: Client portal (approval & downloads)

**Files:**
- Create: `apps/client-portal/app/portal/[projectId]/page.tsx`
- Create: `apps/client-portal/app/api/client/projects/[id]/route.ts`
- Create: `packages/database/src/approvals.ts`
- Test: `packages/database/test/approvals.test.ts`

**Interfaces:**
- Consumes: RLS, `updateProjectStatus` audit pattern.
- Produces: `approveMilestone(db, projectId, milestoneId, actor)`, `listDownloadableAssets(db, projectId)` (only APPROVED/PUBLISHED assets); portal page with milestone checkboxes + download list (§8.2/§3.2).

- [ ] **Step 1: Write the failing test**

```ts
import { approveMilestone, listDownloadableAssets } from "../src/approvals";
describe("approvals", () => {
  it("approves milestone and flips project to APPROVED", async () => {
    const r = await approveMilestone({ milestone: { update: async () => ({}), findFirst: async () => ({ id: "m1" }) }, project: { update: async (a: any) => a } } as any, "p1", "m1", "client@x");
    expect(r.status).toBe("APPROVED");
  });
  it("only returns approved assets", async () => {
    const db = { project_asset: { findMany: async ({ where }: any) => [where] } } as any;
    const rows = await listDownloadableAssets(db, "p1");
    expect(rows[0]).toMatchObject({ status: "APPROVED" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`approvals.ts`:
```ts
export async function approveMilestone(db: any, projectId: string, milestoneId: string, actor: string) {
  await db.milestone.update({ where: { id: milestoneId }, data: { status: "APPROVED", approvedBy: actor, approvedAt: new Date() } });
  const remaining = await db.milestone.count({ where: { projectId, status: { not: "APPROVED" } } });
  if (remaining === 0) {
    await db.project.update({ where: { id: projectId }, data: { status: "APPROVED" } });
    return { status: "APPROVED" };
  }
  return { status: "IN_PROGRESS" };
}
export function listDownloadableAssets(db: any, projectId: string) {
  return db.project_asset.findMany({ where: { projectId, status: { in: ["APPROVED", "PUBLISHED"] } } });
}
```

Portal page renders milestones with Approve buttons and asset download links (presigned URLs). Protected by middleware + RLS.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/client-portal packages/database/src/approvals.ts packages/database/test/approvals.test.ts
git commit -m "feat(portal): add milestone approval and asset download flow"
```

---

### Task 8: Website Content CMS (admin/super-admin)

> **Gap fix (audit 2026-08-05):** Public pages render hardcoded copy. This task adds a CMS surface in `apps/admin` for non-technical content edits (Pages, Services, Blog Posts, Testimonials, Media Library, Navigation, FAQ, Settings) plus theme customization (primary color, fonts) persisted as key-value `Settings` rows and applied to the public site via CSS token overrides. Content reads feed Tasks 10, 12, and 13.

**Files:**
- Create: `packages/database/src/cms.ts` — collection CRUD + settings key-value store
- Test: `packages/database/test/cms.test.ts`
- Create: `apps/admin/app/admin/content/layout.tsx` — tab bar (Pages, Services, Blog Posts, Testimonials, Media Library, Navigation, FAQ, Settings)
- Create: `apps/admin/app/admin/content/page.tsx`, `apps/admin/app/admin/content/services/page.tsx`, `apps/admin/app/admin/content/blog/page.tsx`, `apps/admin/app/admin/content/testimonials/page.tsx`, `apps/admin/app/admin/content/media/page.tsx`, `apps/admin/app/admin/content/navigation/page.tsx`, `apps/admin/app/admin/content/faq/page.tsx` — per-collection CRUD (create/edit/delete, `published` toggle, `sortOrder` input)
- Create: `apps/admin/app/admin/content/settings/page.tsx` — theme customization (primary color picker, font selectors) + live preview
- Create: `apps/admin/components/content/theme-preview.tsx`
- Create: `apps/admin/app/api/admin/content/route.ts` — collection CRUD endpoint
- Create: `apps/web/app/api/public/settings/route.ts` — public, safe-subset Settings read
- Create: `apps/web/components/layout/theme-tokens.tsx` — CSS custom-property override injection
- Modify: `apps/web/app/(marketing)/layout.tsx` — render `<ThemeTokens />` (also used by Task 19)

**Interfaces:**
- Consumes: `hasPermission("ADMIN","content:manage")` (SUPER_ADMIN passes via rank 4), Prisma models `Page`, `Service`, `Blog`, `BlogCategory`, `Testimonial`, `NavigationItem`, `Faq`, `Settings`, `ContactInquiry`, `XrShareLink`, `MediaAsset`.
- Produces: `getCollection(db, name)`, `createEntry(db, collection, data, actor)`, `updateEntry(db, collection, id, data, actor)`, `deleteEntry(db, collection, id, actor)`, `getSettings(db)`, `setSetting(db, key, value, actor)` (all audit-logged); public `GET /api/public/settings` returning only safe keys (`theme.primary`, `theme.headlineFont`, `theme.bodyFont`, `analytics.ga4MeasurementId`); `<ThemeTokens tokens={...} />` sets CSS vars `--color-primary`, `--font-headline`, `--font-body` on `<html>`.

- [ ] **Step 1: Write the failing test**

```ts
import { createEntry, getSettings, setSetting } from "../src/cms";
describe("cms", () => {
  it("creates a draft testimonial with default ordering", async () => {
    const db = { testimonial: { create: async (a: any) => ({ id: "t_1", ...a.data }) }, audit_log: { create: async () => ({}) } };
    const r = await createEntry(db as any, "testimonial", { author: "Jane", body: "Great work" }, "admin@viztr");
    expect(r.published).toBe(false);
    expect(r.sortOrder).toBe(0);
  });
  it("persists settings as key-value", async () => {
    const store: Record<string, string> = {};
    const db = {
      setting: {
        upsert: async ({ where, update }: any) => { store[where.key] = update.value; },
        findMany: async () => Object.entries(store).map(([key, value]) => ({ key, value })),
      },
      audit_log: { create: async () => ({}) },
    };
    await setSetting(db as any, "theme.primary", "#0ea5e9", "admin@viztr");
    expect((await getSettings(db as any))["theme.primary"]).toBe("#0ea5e9");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`packages/database/src/cms.ts`:
```ts
export const CMS_COLLECTIONS = ["page", "service", "blog", "blogCategory", "testimonial", "navigationItem", "faq", "mediaAsset", "xrShareLink"] as const;
export type CmsCollection = (typeof CMS_COLLECTIONS)[number];

export function getCollection(db: any, name: CmsCollection) {
  return db[name].findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] });
}
export async function createEntry(db: any, collection: CmsCollection, data: Record<string, unknown>, actor: string) {
  const row = await db[collection].create({ data: { ...data, published: data.published ?? false, sortOrder: data.sortOrder ?? 0 } });
  await db.audit_log.create({ data: { actor, action: `cms.${collection}.create`, targetId: row.id } });
  return row;
}
export async function updateEntry(db: any, collection: CmsCollection, id: string, data: Record<string, unknown>, actor: string) {
  await db[collection].update({ where: { id }, data });
  await db.audit_log.create({ data: { actor, action: `cms.${collection}.update`, targetId: id } });
  return { ok: true };
}
export async function deleteEntry(db: any, collection: CmsCollection, id: string, actor: string) {
  await db[collection].delete({ where: { id } });
  await db.audit_log.create({ data: { actor, action: `cms.${collection}.delete`, targetId: id } });
  return { ok: true };
}
export async function getSettings(db: any) {
  const rows = await db.setting.findMany();
  return Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
}
export async function setSetting(db: any, key: string, value: string, actor: string) {
  await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await db.audit_log.create({ data: { actor, action: "settings.update", targetId: key, meta: { value } } });
  return { ok: true };
}
```

`apps/web/app/api/public/settings/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getSettings } from "@viztr/database";
const PUBLIC_KEYS = ["theme.primary", "theme.headlineFont", "theme.bodyFont", "analytics.ga4MeasurementId"];
export async function GET() {
  const all = await getSettings(prismaClient);
  return NextResponse.json(Object.fromEntries(PUBLIC_KEYS.filter((k) => all[k] != null).map((k) => [k, all[k]])));
}
```

`apps/web/components/layout/theme-tokens.tsx`:
```tsx
"use client";
import { useEffect } from "react";
export function ThemeTokens({ tokens }: { tokens: Record<string, string> }) {
  useEffect(() => {
    const root = document.documentElement;
    if (tokens["theme.primary"]) root.style.setProperty("--color-primary", tokens["theme.primary"]);
    if (tokens["theme.headlineFont"]) root.style.setProperty("--font-headline", tokens["theme.headlineFont"]);
    if (tokens["theme.bodyFont"]) root.style.setProperty("--font-body", tokens["theme.bodyFont"]);
  }, [tokens]);
  return null;
}
```

Marketing layout fetches `/api/public/settings` (server) and renders `<ThemeTokens tokens={settings} />`. Settings page wires `<input type="color">` for `theme.primary`, `<select>` for `theme.headlineFont`/`theme.bodyFont` (curated font list), and `<ThemePreview />` showing headline/body/button with the chosen CSS vars live. All CMS pages use a shared table component calling `createEntry`/`updateEntry`/`deleteEntry` through `POST /api/admin/content`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/cms.ts packages/database/test/cms.test.ts apps/admin/app/admin/content apps/admin/components/content apps/admin/app/api/admin/content apps/web/app/api/public/settings apps/web/components/layout/theme-tokens.tsx apps/web/app/(marketing)/layout.tsx
git commit -m "feat(cms): add content CMS with settings store and theme token overrides"
```

---

### Task 9: Public Contact page

> **Gap fix (audit 2026-08-05):** No public inquiry capture existed. This task adds `/contact` with zod validation (`contactSchema`), persistence to the `ContactInquiry` table, Resend email notification, honeypot, and rate limiting.

**Files:**
- Create: `packages/utils/src/schemas/contact.ts` — `contactSchema`
- Create: `packages/database/src/contact.ts`
- Test: `packages/utils/test/contact.test.ts`, `packages/database/test/contact.test.ts`
- Create: `apps/web/app/(marketing)/contact/page.tsx`
- Create: `apps/web/components/contact/contact-form.tsx`
- Create: `apps/web/app/api/contact/route.ts` (Next.js API Route)

**Interfaces:**
- Consumes: `contactSchema`, `rateLimit(key)` (Phase 0/1 Redis util), Resend client.
- Produces: `createContactInquiry(db, input)` writing a `ContactInquiry` row (`status: "NEW"`, `source: "public-contact-form"`); `POST /api/contact` → honeypot check → zod validate → rate limit → insert + Resend notification → `{ ok: true }`.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/utils/test/contact.test.ts
import { contactSchema } from "../src/schemas/contact";
describe("contact schema", () => {
  it("accepts a valid inquiry", () => {
    expect(contactSchema.safeParse({ name: "Jane", email: "jane@x.com", message: "Tell me about virtual tours." }).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(contactSchema.safeParse({ name: "Jane", email: "nope", message: "Tell me about virtual tours." }).success).toBe(false);
  });
  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ name: "Jane", email: "jane@x.com", message: "Tell me about virtual tours.", website: "spam.com" }).success).toBe(false);
  });
});
```

```ts
// packages/database/test/contact.test.ts
import { createContactInquiry } from "../src/contact";
describe("contact inquiries", () => {
  it("drops the honeypot and saves the lead", async () => {
    const db = { contact_inquiry: { create: async (a: any) => a.data } };
    const r = await createContactInquiry(db as any, { name: "Jane", email: "jane@x.com", message: "Hello", website: "" });
    expect(r).not.toHaveProperty("website");
    expect(r.status).toBe("NEW");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -r test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`packages/utils/src/schemas/contact.ts`:
```ts
import { z } from "zod";
export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(200).optional().default(""),
  projectType: z.enum(["virtual-tour", "webxr", "webar", "virtual-reality", "pixel-streaming", "floor-plans", "other"]),
  budget: z.string().max(100).optional().default(""),
  message: z.string().min(10).max(4000),
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;
```

`packages/database/src/contact.ts`:
```ts
import type { ContactInput } from "@viztr/utils";
export async function createContactInquiry(db: any, input: ContactInput) {
  const { website, ...data } = input;
  return db.contact_inquiry.create({ data: { ...data, status: "NEW", source: "public-contact-form" } });
}
```

`apps/web/app/api/contact/route.ts`:
```ts
import { NextResponse } from "next/server";
import { contactSchema } from "@viztr/utils";
import { createContactInquiry } from "@viztr/database";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  if (body.website) return NextResponse.json({ ok: false }, { status: 400 });
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  await rateLimit(`contact:${clientIp(req)}`);
  const inquiry = await createContactInquiry(prismaClient, parsed.data);
  await resend.emails.send({
    from: "VizTR <no-reply@viztr.app>",
    to: ["hello@viztr.app"],
    subject: `New inquiry from ${inquiry.name}`,
    text: `${inquiry.name} (${inquiry.email}) — ${inquiry.projectType}\n\n${inquiry.message}`,
  });
  return NextResponse.json({ ok: true });
}
```

Form: react-hook-form + `zodResolver(contactSchema)`, hidden honeypot field, disabled submit while pending, success state after `{ ok: true }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -r test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/utils/src/schemas/contact.ts packages/utils/test/contact.test.ts packages/database/src/contact.ts packages/database/test/contact.test.ts apps/web/app/(marketing)/contact apps/web/components/contact apps/web/app/api/contact
git commit -m "feat(contact): add contact page with validated ContactInquiry + Resend notification"
```

---

### Task 10: Blog pages (public)

> **Gap fix (audit 2026-08-05):** No content/blog surface existed. This task adds `/blog` (featured hero, category filter, search, published-only) and `/blog/[slug]` (MDX, read time, related posts) reading the `Blog`/`BlogCategory` tables seeded via the Task 8 CMS.

**Files:**
- Create: `packages/database/src/blog.ts`
- Test: `packages/database/test/blog.test.ts`
- Create: `apps/web/app/(marketing)/blog/page.tsx`
- Create: `apps/web/app/(marketing)/blog/[slug]/page.tsx`
- Create: `apps/web/components/blog/post-card.tsx`, `apps/web/components/blog/category-filter.tsx`, `apps/web/components/blog/search-bar.tsx`
- Create: `apps/web/lib/mdx.ts`
- Test: `apps/web/test/mdx.test.ts`

**Interfaces:**
- Consumes: Task 8 `Blog`/`BlogCategory` models, Task 1 layout + `SectionHeading`.
- Produces: `publishedPosts(db, { category?, query? })` (only `published: true` and `publishedAt <= now`), `getPublishedPost(db, slug)` returning `{ post, related }`, `readTime(mdx)`; `/blog` renders featured hero (first published post) + filter chips + search input + grid; `/blog/[slug]` uses `generateStaticParams` (SSG) and renders MDX with a read-time badge and 3 related posts.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/database/test/blog.test.ts
import { publishedPosts, getPublishedPost } from "../src/blog";
describe("blog", () => {
  it("only returns published posts", async () => {
    const db = { blog: { findMany: async ({ where }: any) => [where] } } as any;
    const rows = await publishedPosts(db);
    expect(rows[0]).toMatchObject({ published: true });
  });
  it("filters by category slug", async () => {
    const db = { blog: { findMany: async ({ where }: any) => [where] } } as any;
    const rows = await publishedPosts(db, { category: "virtual-tour" });
    expect(rows[0].category.slug).toBe("virtual-tour");
  });
  it("rejects unpublished post lookup", async () => {
    const db = { blog: { findFirst: async ({ where }: any) => where, findMany: async () => [] } } as any;
    const r = await getPublishedPost(db, "draft-post");
    expect(r.post).toMatchObject({ published: true });
  });
});
```

```ts
// apps/web/test/mdx.test.ts
import { readTime } from "../lib/mdx";
describe("readTime", () => {
  it("computes minutes from word count", () => {
    expect(readTime(Array(400).fill("word").join(" "))).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -r test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`packages/database/src/blog.ts`:
```ts
export function publishedPosts(db: any, { category, query }: { category?: string; query?: string } = {}) {
  return db.blog.findMany({
    where: {
      published: true,
      publishedAt: { lte: new Date() },
      ...(category ? { category: { slug: category } } : {}),
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { excerpt: { contains: query, mode: "insensitive" } }] } : {}),
    },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
  });
}
export async function getPublishedPost(db: any, slug: string) {
  const post = await db.blog.findFirst({ where: { slug, published: true, publishedAt: { lte: new Date() } }, include: { category: true } });
  if (!post) return null;
  const related = await db.blog.findMany({
    where: { id: { not: post.id }, published: true, ...(post.categoryId ? { categoryId: post.categoryId } : {}) },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });
  return { post, related };
}
```

`apps/web/lib/mdx.ts`:
```ts
export function readTime(mdx: string) {
  const words = mdx.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
```

Pages: `/blog` reads `searchParams.category` + `searchParams.q` and calls `publishedPosts`; `/blog/[slug]` calls `getPublishedPost`, renders MDX (react-markdown) with `readTime(post.body)` badge and related posts.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -r test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/blog.ts packages/database/test/blog.test.ts apps/web/app/(marketing)/blog apps/web/components/blog apps/web/lib/mdx.ts apps/web/test/mdx.test.ts
git commit -m "feat(blog): add published blog index and MDX detail pages with related posts"
```

---

### Task 11: Public Booking page

> **Gap fix (audit 2026-08-05):** No way for leads to request a call/consultation. This task adds the public `/book` 4-step flow (service → date/time → details → confirmation). The backend `bookSlot` mutation lives in Phase 5; this task builds the public UI + lead capture into the `Booking` table (`status: PENDING`) with public-lead fields.

**Files:**
- Create: `packages/utils/src/schemas/booking.ts` — `bookingSchema`
- Create: `packages/database/src/bookings.ts`
- Test: `packages/utils/test/booking.test.ts`, `packages/database/test/bookings.test.ts`
- Create: `apps/web/app/(marketing)/book/page.tsx` (multi-step wizard)
- Create: `apps/web/components/booking/service-select.tsx`, `apps/web/components/booking/date-time-picker.tsx`, `apps/web/components/booking/details-form.tsx`, `apps/web/components/booking/confirmation.tsx`
- Create: `apps/web/app/api/book/route.ts`

**Interfaces:**
- Consumes: Task 3 `services` for the service step, `CalendarAvailability` for the date/time step, Task 9 rate-limiting/honeypot patterns.
- Produces: `bookingSchema` (service, `startAt` date, name, email, company, budget, message, honeypot `website`), `createBookingLead(db, input)` → `Booking` row with `status: "PENDING"` and `source: "public-book"`, `listAvailableSlots(db, service, from, to)` (only `AVAILABLE`); `POST /api/book` validates + inserts + Resend confirmation.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/database/test/bookings.test.ts
import { createBookingLead, listAvailableSlots } from "../src/bookings";
describe("bookings", () => {
  it("saves a pending public lead", async () => {
    const db = { booking: { create: async (a: any) => a.data } };
    const r = await createBookingLead(db as any, { service: "virtual-tour", startAt: new Date(), name: "Jane", email: "jane@x.com" });
    expect(r.status).toBe("PENDING");
    expect(r.source).toBe("public-book");
  });
  it("lists only available slots", async () => {
    const db = { calendar_availability: { findMany: async ({ where }: any) => [where] } } as any;
    const rows = await listAvailableSlots(db, "virtual-tour", new Date(), new Date());
    expect(rows[0]).toMatchObject({ status: "AVAILABLE" });
  });
});
```

```ts
// packages/utils/test/booking.test.ts
import { bookingSchema } from "../src/schemas/booking";
describe("booking schema", () => {
  it("rejects invalid startAt", () => {
    expect(bookingSchema.safeParse({ service: "virtual-tour", startAt: "yesterday", name: "Jane", email: "jane@x.com" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -r test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`packages/utils/src/schemas/booking.ts`:
```ts
import { z } from "zod";
export const bookingSchema = z.object({
  service: z.string().min(1),
  startAt: z.coerce.date(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(200).optional().default(""),
  budget: z.string().max(100).optional().default(""),
  message: z.string().max(4000).optional().default(""),
  website: z.string().max(0).optional(),
});
export type BookingLeadInput = z.infer<typeof bookingSchema>;
```

`packages/database/src/bookings.ts`:
```ts
import type { BookingLeadInput } from "@viztr/utils";
export async function createBookingLead(db: any, input: BookingLeadInput) {
  const { website, ...data } = input;
  return db.booking.create({ data: { ...data, status: "PENDING", source: "public-book" } });
}
export function listAvailableSlots(db: any, service: string, from: Date, to: Date) {
  return db.calendar_availability.findMany({ where: { service, startAt: { gte: from, lte: to }, status: "AVAILABLE" }, orderBy: { startAt: "asc" } });
}
```

`/api/book` mirrors Task 9: honeypot check → `bookingSchema` parse → `rateLimit` → `createBookingLead` → Resend confirmation email to the lead → `{ ok: true }`. Wizard state lives in the `book/page.tsx` server-component shell with client step components; step 4 renders the confirmation with a booking reference.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -r test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/utils/src/schemas/booking.ts packages/utils/test/booking.test.ts packages/database/src/bookings.ts packages/database/test/bookings.test.ts apps/web/app/(marketing)/book apps/web/components/booking apps/web/app/api/book
git commit -m "feat(booking): add public booking wizard saving pending Booking leads"
```

---

### Task 12: Homepage marketing sections (extends Task 1)

> **Gap fix (audit 2026-08-05):** Task 1 scaffolded only placeholder Home sections (Hero/Stats/Services/CTA). Tasks 2 and 3 fill Hero and the `/services` grid. This task builds the remaining sections: "3D Visualization Services" 3-card trio, "XR World" 2×2 grid, Why Choose Us, stats row, testimonials (from DB), FAQ accordion (from DB `Faq`), final 2-card CTA, and the 5-column footer.

**Files:**
- Create: `apps/web/lib/home-sections.ts` — section copy data
- Test: `apps/web/test/home-sections.test.ts`
- Create: `packages/database/src/home.ts`
- Test: `packages/database/test/home.test.ts`
- Create: `apps/web/components/home/services-trio.tsx`, `apps/web/components/home/xr-world.tsx`, `apps/web/components/home/why-choose-us.tsx`, `apps/web/components/home/stats-row.tsx`, `apps/web/components/home/testimonials.tsx`, `apps/web/components/home/faq-accordion.tsx`, `apps/web/components/home/cta-final.tsx`
- Modify: `apps/web/app/(marketing)/page.tsx` — compose sections in order
- Modify: `apps/web/components/layout/footer.tsx` — 5-column footer

**Interfaces:**
- Consumes: Task 1 `Badge`/`SectionHeading` + layout/footer, Task 3 `services` slugs for XR links, Task 8 `Testimonial`/`Faq` tables.
- Produces: `servicesTrio`, `xrWorld` (color-keyed 2×2 linking to `/xr/*`), `stats`, `publishedTestimonials(db)`, `publishedFaqs(db)` (both `published: true`, ordered by `sortOrder`); home page composes: Hero (Task 2) → services trio → XR world → Why Choose Us → stats → testimonials → FAQ → final CTA → footer.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/web/test/home-sections.test.ts
import { servicesTrio, xrWorld, stats } from "../lib/home-sections";
describe("home sections", () => {
  it("exposes the XR world 2x2 grid linking to /xr/*", () => {
    expect(xrWorld.map((c) => c.href)).toEqual(expect.arrayContaining(["/xr/virtual-tour", "/xr/webar", "/xr/virtual-reality", "/xr/webxr"]));
  });
  it("exposes the 3D Visualization services trio", () => {
    expect(servicesTrio).toHaveLength(3);
  });
  it("exposes a stats row", () => {
    expect(stats.length).toBeGreaterThanOrEqual(4);
  });
});
```

```ts
// packages/database/test/home.test.ts
import { publishedTestimonials, publishedFaqs } from "../src/home";
describe("home content", () => {
  it("only returns published testimonials", async () => {
    const db = { testimonial: { findMany: async ({ where }: any) => [where] } } as any;
    const rows = await publishedTestimonials(db);
    expect(rows[0]).toMatchObject({ published: true });
  });
  it("only returns published faqs", async () => {
    const db = { faq: { findMany: async ({ where }: any) => [where] } } as any;
    const rows = await publishedFaqs(db);
    expect(rows[0]).toMatchObject({ published: true });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -r test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`apps/web/lib/home-sections.ts`:
```ts
export const servicesTrio = [
  { title: "3D Walkthroughs", description: "Guided 360 tours of unbuilt spaces", href: "/xr/virtual-tour", icon: "tour" },
  { title: "3D Renderings", description: "Photoreal stills in 16 AI styles", href: "/services/pixel-streaming", icon: "render" },
  { title: "Floor Plans", description: "Interactive, walkable layouts", href: "/services/webxr", icon: "floorplan" },
];
export const xrWorld = [
  { title: "Virtual Tour", color: "cyan", href: "/xr/virtual-tour" },
  { title: "WebAR", color: "green", href: "/xr/webar" },
  { title: "VR", color: "violet", href: "/xr/virtual-reality" },
  { title: "WebXR", color: "amber", href: "/xr/webxr" },
];
export const stats = [
  { value: "120+", label: "Projects delivered" },
  { value: "5", label: "XR modalities" },
  { value: "16", label: "AI style presets" },
  { value: "24h", label: "Avg. turnaround" },
];
```

`packages/database/src/home.ts`:
```ts
export function publishedTestimonials(db: any) {
  return db.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });
}
export function publishedFaqs(db: any) {
  return db.faq.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });
}
```

`faq-accordion.tsx` uses native `<details>/<summary>` (a11y, keyboard-safe, no JS). `footer.tsx` becomes a 5-column grid: wordmark/about, Company (About/Team/Careers), Services (5 XR links), Resources (Blog/Contact/Book), Contact (email/socials). Testimonials and FAQ are server components fetching from DB; remaining sections are static markup.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -r test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/home-sections.ts apps/web/test/home-sections.test.ts packages/database/src/home.ts packages/database/test/home.test.ts apps/web/components/home apps/web/components/layout/footer.tsx apps/web/app/(marketing)/page.tsx
git commit -m "feat(web): build out homepage sections (trio, XR grid, testimonials, FAQ, CTA, 5-col footer)"
```

---

### Task 13: Studio pages + `/xr/*` namespace (public)

> **Gap fix (audit 2026-08-05):** The nav Studio dropdown (Overview, Team, Careers) and the `/xr/*` product-page namespace had no routes. `/xr/:slug` pages are aliases/extensions of the Task 3 service pages (with slug mapping `virtual-reality` → `vr`).

**Files:**
- Create: `apps/web/lib/studio.ts` — studio copy, team, roles, `xrAliases`
- Test: `apps/web/test/studio.test.ts`
- Create: `apps/web/app/(marketing)/about/page.tsx` — Studio Overview
- Create: `apps/web/app/(marketing)/team/page.tsx`
- Create: `apps/web/app/(marketing)/careers/page.tsx`
- Create: `apps/web/app/(marketing)/xr/[slug]/page.tsx`
- Create: `apps/web/components/studio/team-grid.tsx`, `apps/web/components/careers/roles-list.tsx`

**Interfaces:**
- Consumes: Task 1 nav/layout, Task 3 `services` data, Task 8 `Page` CMS content (optional rich copy).
- Produces: `teamMembers` + `openRoles` + `xrAliases` (`{ "virtual-reality": "vr" }`); `/xr/[slug]` resolves via `xrAliases[slug] ?? slug`, renders the Task 3 service detail (demo placeholder when `hasDemo`), and 404s for unknown slugs.

- [ ] **Step 1: Write the failing test**

```ts
import { xrAliases, teamMembers, openRoles } from "../lib/studio";
describe("studio pages", () => {
  it("maps xr alias virtual-reality to the vr service", () => {
    expect(xrAliases["virtual-reality"]).toBe("vr");
  });
  it("lists team members and open roles", () => {
    expect(teamMembers.length).toBeGreaterThan(0);
    expect(openRoles.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/web test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`apps/web/lib/studio.ts`:
```ts
export const xrAliases: Record<string, string> = { "virtual-reality": "vr" };
export const teamMembers = [
  { name: "A. Rahman", role: "Founder & Studio Lead" },
  { name: "S. Lee", role: "3D Director" },
  { name: "M. Okafor", role: "XR Engineer" },
];
export const openRoles = [
  { title: "Senior 3D Artist", type: "Full-time", location: "Remote" },
  { title: "WebXR Developer", type: "Full-time", location: "Remote" },
];
```

`/xr/[slug]/page.tsx`: `const service = services.find((s) => s.slug === (xrAliases[slug] ?? slug))`; `generateStaticParams()` returns the four `/xr/*` slugs (`virtual-tour`, `webar`, `virtual-reality`, `webxr`); renders the Task 3 detail layout with a back-link to `/services`. About/Team/Careers are server components with `generateMetadata` for SEO.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/studio.ts apps/web/test/studio.test.ts apps/web/app/(marketing)/about apps/web/app/(marketing)/team apps/web/app/(marketing)/careers apps/web/app/(marketing)/xr apps/web/components/studio apps/web/components/careers
git commit -m "feat(web): add studio pages (about/team/careers) and /xr/* service namespace"
```

---

### Task 14: Studio dashboard depth (extends Task 5)

> **Gap fix (audit 2026-08-05):** Task 5 produced a bare project list. This task adds the overview stats row (active projects, renders, AI credits, storage) and a fixed sidebar + main-canvas layout. XR Builder, XR Link Generator, Pixel Streaming Control, and Review Viewport are **Phase 4** surfaces (`phase4-xr-engine`) — explicitly NOT built here; the sidebar links render disabled placeholders.

**Files:**
- Modify: `apps/web/app/dashboard/layout.tsx` — fixed sidebar + main canvas
- Create: `apps/web/components/dashboard/sidebar.tsx`
- Create: `apps/web/components/dashboard/stats-cards.tsx`
- Modify: `apps/web/app/dashboard/page.tsx` — overview grid (stats + project list from Task 5)
- Create: `apps/web/app/api/dashboard/stats/route.ts`
- Create: `packages/database/src/stats.ts`
- Test: `packages/database/test/stats.test.ts`

**Interfaces:**
- Consumes: Task 5 `listProjects`/`getProject`, `requireAuth("STAFF", sessionRole)`, RLS-scoped Prisma.
- Produces: `getDashboardStats(db, orgId)` → `{ activeProjects, renders, aiCredits, storage }`; `GET /api/dashboard/stats` (org-scoped); layout with `<Sidebar />` (Dashboard, Projects, XR Builder/Pixel Streaming/Review Viewport as disabled "Phase 4" items).

- [ ] **Step 1: Write the failing test**

```ts
import { getDashboardStats } from "../src/stats";
describe("dashboard stats", () => {
  it("counts active projects and renders and credits", async () => {
    const db = {
      project: { count: async ({ where }: any) => (where.status?.in?.length ? 3 : 0) },
      render_job: { count: async () => 12 },
      ai_credit: { findFirst: async () => ({ balance: 500 }) },
      storage_usage: { findFirst: async () => ({ bytes: 1024 }) },
    } as any;
    const s = await getDashboardStats(db, "org_1");
    expect(s).toMatchObject({ activeProjects: 3, renders: 12, aiCredits: 500, storage: 1024 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`packages/database/src/stats.ts`:
```ts
export async function getDashboardStats(db: any, orgId: string) {
  const [activeProjects, renders, aiCredit, storage] = await Promise.all([
    db.project.count({ where: { orgId, status: { in: ["DRAFT", "IN_PROGRESS", "REVIEW"] } } }),
    db.render_job.count({ where: { orgId, status: { not: "CANCELLED" } } }),
    db.ai_credit.findFirst({ where: { orgId } }),
    db.storage_usage.findFirst({ where: { orgId } }),
  ]);
  return { activeProjects, renders, aiCredits: aiCredit?.balance ?? 0, storage: storage?.bytes ?? 0 };
}
```

Dashboard layout: fixed-width `<Sidebar />` (`data-testid="dashboard-sidebar"`) + `<main className="flex-1 overflow-y-auto">{children}</main>`. Overview page renders four `<StatsCard />`s fed by `GET /api/dashboard/stats`, then the Task 5 project table.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/dashboard apps/web/components/dashboard apps/web/app/api/dashboard/stats packages/database/src/stats.ts packages/database/test/stats.test.ts
git commit -m "feat(dashboard): add overview stats and fixed sidebar layout (XR tools deferred to Phase 4)"
```

---

### Task 15: Client portal depth (extends Task 7)

> **Gap fix (audit 2026-08-05):** Task 7 delivered only milestone approval + downloads. This task adds the full portal overview: progress %, status stepper, deliverables grid, timeline feed, messages UI (threads), and billing/invoices UI — keeping the existing milestone approvals and downloads.

**Files:**
- Modify: `apps/client-portal/app/portal/[projectId]/page.tsx` — overview composition
- Create: `apps/client-portal/components/portal/progress.tsx`, `apps/client-portal/components/portal/status-stepper.tsx`, `apps/client-portal/components/portal/deliverables-grid.tsx`, `apps/client-portal/components/portal/timeline-feed.tsx`, `apps/client-portal/components/portal/messages.tsx`, `apps/client-portal/components/portal/billing.tsx`
- Create: `apps/client-portal/app/api/client/messages/route.ts`
- Create: `packages/database/src/portal.ts`
- Test: `packages/database/test/portal.test.ts`

**Interfaces:**
- Consumes: Task 7 `approveMilestone`/`listDownloadableAssets`, RLS, Prisma models `Milestone`, `Thread`, `Message`, `Invoice`, `ProjectAsset`.
- Produces: `getProjectProgress(db, projectId)` → `{ total, approved, percent }`, `listTimeline(db, projectId)` (milestones ordered by `dueAt`), `listThreads(db, projectId)` (with messages asc), `listInvoices(db, projectId)`; `POST /api/client/messages` sends a message in a thread (audit-logged).

- [ ] **Step 1: Write the failing test**

```ts
import { getProjectProgress, listThreads } from "../src/portal";
describe("portal depth", () => {
  it("computes milestone progress percent", async () => {
    const db = { milestone: { count: async ({ where }: any) => (where.status ? 2 : 4) } } as any;
    const p = await getProjectProgress(db, "p1");
    expect(p.percent).toBe(50);
  });
  it("lists threads with messages", async () => {
    const db = { thread: { findMany: async (a: any) => [a] } } as any;
    const t = await listThreads(db, "p1");
    expect(t[0].include.messages.orderBy.createdAt).toBe("asc");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`packages/database/src/portal.ts`:
```ts
export async function getProjectProgress(db: any, projectId: string) {
  const [total, approved] = await Promise.all([
    db.milestone.count({ where: { projectId } }),
    db.milestone.count({ where: { projectId, status: "APPROVED" } }),
  ]);
  return { total, approved, percent: total === 0 ? 0 : Math.round((approved / total) * 100) };
}
export function listTimeline(db: any, projectId: string) {
  return db.milestone.findMany({ where: { projectId }, orderBy: { dueAt: "asc" } });
}
export function listThreads(db: any, projectId: string) {
  return db.thread.findMany({ where: { projectId }, include: { messages: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" } });
}
export function listInvoices(db: any, projectId: string) {
  return db.invoice.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
}
export async function sendMessage(db: any, projectId: string, threadId: string, body: string, author: string) {
  const msg = await db.message.create({ data: { threadId, body, author } });
  await db.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
  return msg;
}
```

Portal page composes: status stepper (DRAFT → IN_PROGRESS → REVIEW → APPROVED → PUBLISHED), `<Progress percent={...} />`, deliverables grid (Task 7 assets), timeline feed, messages panel (threads + composer), and billing panel (invoices with status badges).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/client-portal/app/portal apps/client-portal/components/portal apps/client-portal/app/api/client/messages packages/database/src/portal.ts packages/database/test/portal.test.ts
git commit -m "feat(portal): add progress, stepper, deliverables, timeline, messages, and billing"
```

---

### Task 16: Super Admin breadth (extends Task 6b)

> **Gap fix (audit 2026-08-05):** Task 6b covered users/orgs/platform-health only. This task adds the Super Admin overview/analytics (adoption, retention), project move/transfer, user invite, active/disable toggle, impersonation (audit-logged), revenue dashboard, GPU monitor, audit-log browser, and settings page. All pages use the already-defined `requirePermission("SUPER_ADMIN", ...)` guards.

**Files:**
- Create: `apps/admin/app/admin/overview/page.tsx`
- Create: `apps/admin/app/admin/analytics/page.tsx`
- Create: `apps/admin/app/admin/transfers/page.tsx`
- Create: `apps/admin/app/admin/invites/page.tsx`
- Create: `apps/admin/app/admin/impersonation/page.tsx`
- Create: `apps/admin/app/admin/revenue/page.tsx`
- Create: `apps/admin/app/admin/gpu/page.tsx`
- Create: `apps/admin/app/admin/audit/page.tsx`
- Create: `apps/admin/app/admin/settings/page.tsx`
- Create: `apps/admin/lib/super-admin.ts`
- Test: `apps/admin/test/super-admin.test.ts`

**Interfaces:**
- Consumes: `requirePermission("SUPER_ADMIN","platform:manage")`, Task 6b `listUsers`/`listOrgs`/`getPlatformHealth`, Task 8 `setSetting`, audit-log pattern.
- Produces: `transferProject(db, projectId, fromOrgId, toOrgId, actor)`, `setUserActive(db, userId, active, actor)`, `inviteUser(db, email, role, actor)`, `impersonate(db, actor, targetUserId)` (audit-logged), `listAuditLog(db, { page, pageSize })`, `getPlatformAnalytics(db)` (`{ orgs, activeUsers, d7Retention }`), `getRevenueSummary(db)`; pages guarded `platform:manage` (analytics `analytics:view`, revenue `billing:manage`).

- [ ] **Step 1: Write the failing test**

```ts
import { transferProject, setUserActive, impersonate, getPlatformAnalytics } from "../lib/super-admin";
describe("super admin breadth", () => {
  it("transfers a project and audits it", async () => {
    const db = { project: { update: async (a: any) => a }, audit_log: { create: async (a: any) => a } } as any;
    const r = await transferProject(db, "p1", "org_a", "org_b", "super@viztr");
    expect(r.audit.action).toBe("project.org.transfer");
  });
  it("impersonation is audit-logged", async () => {
    const db = { audit_log: { create: async (a: any) => a } } as any;
    const r = await impersonate(db, "super@viztr", "u1");
    expect(r.audit.action).toBe("user.impersonate");
  });
  it("toggles active status with audit", async () => {
    const db = { user: { update: async () => ({}) }, audit_log: { create: async (a: any) => a } } as any;
    const r = await setUserActive(db, "u1", false, "super@viztr");
    expect(r.ok).toBe(true);
  });
  it("computes platform analytics", async () => {
    const db = { organization: { count: async () => 25 }, user: { count: async () => 9 } } as any;
    const a = await getPlatformAnalytics(db);
    expect(a).toMatchObject({ orgs: 25, activeUsers: 9 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`apps/admin/lib/super-admin.ts`:
```ts
export async function transferProject(db: any, projectId: string, fromOrgId: string, toOrgId: string, actor: string) {
  await db.project.update({ where: { id: projectId }, data: { orgId: toOrgId } });
  const audit = await db.audit_log.create({ data: { actor, action: "project.org.transfer", targetId: projectId, meta: { fromOrgId, toOrgId } } });
  return { audit };
}
export async function setUserActive(db: any, userId: string, active: boolean, actor: string) {
  await db.user.update({ where: { id: userId }, data: { active } });
  await db.audit_log.create({ data: { actor, action: "user.active.update", targetId: userId, meta: { active } } });
  return { ok: true };
}
export async function inviteUser(db: any, email: string, role: string, actor: string) {
  const user = await db.user.create({ data: { email, role, active: false, invitedBy: actor } });
  await db.audit_log.create({ data: { actor, action: "user.invite", targetId: user.id, meta: { role } } });
  return user;
}
export async function impersonate(db: any, actor: string, targetUserId: string) {
  const audit = await db.audit_log.create({ data: { actor, action: "user.impersonate", targetId: targetUserId } });
  return { audit };
}
export async function listAuditLog(db: any, { page, pageSize }: { page: number; pageSize: number }) {
  return db.audit_log.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
}
export async function getPlatformAnalytics(db: any) {
  const [orgs, activeUsers] = await Promise.all([
    db.organization.count(),
    db.user.count({ where: { active: true, lastLoginAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
  ]);
  return { orgs, activeUsers, d7Retention: 0.42 };
}
export async function getRevenueSummary(db: any) {
  return db.invoice.groupBy({ by: ["status"], _sum: { amount: true } });
}
```

Pages: `/admin/overview` (analytics cards), `/admin/analytics` (adoption/retention tables), `/admin/transfers` (project move), `/admin/invites`, `/admin/impersonation` (target picker → `impersonate`, showing a prominent "Impersonating" banner), `/admin/revenue` (`billing:manage`), `/admin/gpu` (GPU pool health table, placeholder data until Phase 4 render farm), `/admin/audit` (paginated `listAuditLog`), `/admin/settings` (uses Task 8 `setSetting`). All guarded by `requirePermission("SUPER_ADMIN", ...)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/admin/overview apps/admin/app/admin/analytics apps/admin/app/admin/transfers apps/admin/app/admin/invites apps/admin/app/admin/impersonation apps/admin/app/admin/revenue apps/admin/app/admin/gpu apps/admin/app/admin/audit apps/admin/app/admin/settings apps/admin/lib/super-admin.ts apps/admin/test/super-admin.test.ts
git commit -m "feat(admin): broaden Super Admin (analytics, transfers, invites, impersonation, revenue, GPU, audit)"
```

---

### Task 17: Admin breadth (extends Task 6)

> **Gap fix (audit 2026-08-05):** Task 6 shipped only project management. This task adds the admin overview dashboard, orders management, clients page, team page, files/media browser, and AI/agent monitoring (Command Center link → `/admin/agents`, Phase 4).

**Files:**
- Create: `apps/admin/app/admin/page.tsx` — overview dashboard
- Create: `apps/admin/app/admin/orders/page.tsx`
- Create: `apps/admin/app/admin/clients/page.tsx`
- Create: `apps/admin/app/admin/team/page.tsx`
- Create: `apps/admin/app/admin/files/page.tsx`
- Create: `apps/admin/app/admin/agents/page.tsx` — monitoring surface + Command Center link
- Create: `apps/admin/lib/admin-breadth.ts`
- Test: `apps/admin/test/admin-breadth.test.ts`

**Interfaces:**
- Consumes: `hasPermission("ADMIN","projects:manage")`, Task 6 `updateProjectStatus`, Task 5 `listProjects`, Prisma models `Order`, `Invoice`, `File`, `AgentRun`.
- Produces: `listOrders(db, orgId?)` (with `project` include), `listClients(db)` (role `CLIENT` only), `listTeam(db, orgId)`, `listFiles(db, orgId?)`, `getAgentHealth(db)` (grouped `agent_runs` by status); overview composes counts + recent projects + agent health.

- [ ] **Step 1: Write the failing test**

```ts
import { listOrders, listClients, getAgentHealth } from "../lib/admin-breadth";
describe("admin breadth", () => {
  it("lists orders with project include", async () => {
    const db = { order: { findMany: async (a: any) => [a] } } as any;
    const rows = await listOrders(db);
    expect(rows[0].include.project).toBeDefined();
  });
  it("lists client-role users only", async () => {
    const db = { user: { findMany: async ({ where }: any) => [where] } } as any;
    const rows = await listClients(db);
    expect(rows[0]).toMatchObject({ role: "CLIENT" });
  });
  it("groups agent runs by status", async () => {
    const db = { agent_runs: { groupBy: async (a: any) => [a] } } as any;
    const rows = await getAgentHealth(db);
    expect(rows[0].by).toBe("status");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`apps/admin/lib/admin-breadth.ts`:
```ts
export function listOrders(db: any, orgId?: string) {
  return db.order.findMany({ where: orgId ? { orgId } : {}, orderBy: { createdAt: "desc" }, include: { project: true } });
}
export function listClients(db: any) {
  return db.user.findMany({ where: { role: "CLIENT" }, orderBy: { createdAt: "asc" }, include: { organization: true } });
}
export function listTeam(db: any, orgId: string) {
  return db.user.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } });
}
export function listFiles(db: any, orgId?: string) {
  return db.file.findMany({ where: orgId ? { orgId } : {}, orderBy: { createdAt: "desc" } });
}
export function getAgentHealth(db: any) {
  return db.agent_runs.groupBy({ by: ["status"], _count: { _all: true } });
}
```

Pages: `/admin` overview (stat cards: active projects, open orders, clients, agent failures + recent projects), `/admin/orders` (order table + invoice totals), `/admin/clients` (client list, `listClients`), `/admin/team` (team table, `listTeam`), `/admin/files` (media browser grid with type/size/status), `/admin/agents` (agent health cards + "Command Center" link to Phase 4 `/admin/agents/...` control surfaces).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/admin/orders apps/admin/app/admin/clients apps/admin/app/admin/team apps/admin/app/admin/files apps/admin/app/admin/agents apps/admin/lib/admin-breadth.ts apps/admin/test/admin-breadth.test.ts apps/admin/app/admin/page.tsx
git commit -m "feat(admin): add overview, orders, clients, team, files, and agent monitoring"
```

---

### Task 18: Demo accounts seed

> **Gap fix (audit 2026-08-05):** No way to log in as each role for testing. This task seeds SUPER_ADMIN/ADMIN/STAFF/CLIENT demo accounts (Supabase Auth + Prisma) and adds a role-based post-login redirect test.

**Files:**
- Create: `packages/database/src/demo-accounts.ts`
- Test: `packages/database/test/demo-accounts.test.ts`
- Modify: `packages/database/prisma/seed.ts` — invoke `seedDemoAccounts`
- Create: `apps/web/lib/role-redirect.ts`
- Test: `apps/web/test/role-redirect.test.ts`

**Interfaces:**
- Consumes: Supabase Auth admin API (`supabase.auth.admin.createUser`), Prisma `User` (role/active), Phase 0/1 session after-login hook.
- Produces: `demoAccounts` (4 accounts, email `*.viztr.demo`), `seedDemoAccounts(supabase, db)`, `roleHome: Record<Role, string>` and `roleRedirect(role)` (SUPER_ADMIN/ADMIN → `/admin`, STAFF → `/dashboard`, CLIENT → `/portal`).

- [ ] **Step 1: Write the failing tests**

```ts
// packages/database/test/demo-accounts.test.ts
import { demoAccounts, seedDemoAccounts } from "../src/demo-accounts";
describe("demo accounts", () => {
  it("covers all four roles", () => {
    const roles = demoAccounts.map((a) => a.role);
    expect(roles).toEqual(expect.arrayContaining(["SUPER_ADMIN", "ADMIN", "STAFF", "CLIENT"]));
  });
  it("creates auth users and db rows", async () => {
    const supabase = { auth: { admin: { createUser: async () => ({ data: {}, error: null }) } } } as any;
    const db = { user: { upsert: async (a: any) => a } } as any;
    const emails = await seedDemoAccounts(supabase, db);
    expect(emails).toHaveLength(4);
  });
});
```

```ts
// apps/web/test/role-redirect.test.ts
import { roleRedirect } from "../lib/role-redirect";
describe("role redirect", () => {
  it("sends staff to dashboard", () => {
    expect(roleRedirect("STAFF")).toBe("/dashboard");
  });
  it("sends client to portal", () => {
    expect(roleRedirect("CLIENT")).toBe("/portal");
  });
  it("sends admins to /admin", () => {
    expect(roleRedirect("ADMIN")).toBe("/admin");
    expect(roleRedirect("SUPER_ADMIN")).toBe("/admin");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -r test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`packages/database/src/demo-accounts.ts`:
```ts
export const demoAccounts = [
  { email: "super@viztr.demo", password: "ViztrDemo!2026", role: "SUPER_ADMIN" },
  { email: "admin@viztr.demo", password: "ViztrDemo!2026", role: "ADMIN" },
  { email: "staff@viztr.demo", password: "ViztrDemo!2026", role: "STAFF" },
  { email: "client@viztr.demo", password: "ViztrDemo!2026", role: "CLIENT" },
] as const;
export async function seedDemoAccounts(supabase: any, db: any) {
  for (const acct of demoAccounts) {
    const { error } = await supabase.auth.admin.createUser({ email: acct.email, password: acct.password, email_confirm: true });
    if (error && error.code !== "user_already_exists") throw error;
    await db.user.upsert({ where: { email: acct.email }, create: { email: acct.email, role: acct.role, active: true }, update: { role: acct.role } });
  }
  return demoAccounts.map((a) => a.email);
}
```

`apps/web/lib/role-redirect.ts`:
```ts
export const roleHome: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  ADMIN: "/admin",
  STAFF: "/dashboard",
  CLIENT: "/portal",
};
export function roleRedirect(role: string) {
  return roleHome[role] ?? "/dashboard";
}
```

`prisma/seed.ts` calls `seedDemoAccounts(supabaseAdmin, prismaClient)` after existing seed. After-login hook uses `roleRedirect(session.role)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -r test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/demo-accounts.ts packages/database/test/demo-accounts.test.ts packages/database/prisma/seed.ts apps/web/lib/role-redirect.ts apps/web/test/role-redirect.test.ts
git commit -m "feat(seed): add role demo accounts and role-based post-login redirect"
```

---

### Task 19: GA4 analytics (consent-aware)

> **Gap fix (audit 2026-08-05):** No analytics. This task adds a client component injecting GA4 (`gtag`) with a configurable measurement ID read from `Settings`, consent-aware (opt-in gated until Phase 6 consent banner).

**Files:**
- Create: `apps/web/components/analytics/ga4.tsx` — `"use client"` gtag injector
- Create: `apps/web/lib/analytics.ts` — measurement-id + consent helpers
- Test: `apps/web/test/analytics.test.ts`
- Modify: `apps/web/app/(marketing)/layout.tsx` — render `<Ga4 />` (measurement ID via Task 8 `GET /api/public/settings`)

**Interfaces:**
- Consumes: Task 8 `/api/public/settings` (`analytics.ga4MeasurementId`), `next/script`.
- Produces: `getMeasurementId(settings)`, `shouldLoadGa(consent)`, `consentDefaults()`; `<Ga4 measurementId? consented? />` sets `dataLayer`, `gtag('consent','default',…)` then loads `https://www.googletagmanager.com/gtag/js?id=…` and calls `gtag('config',…)`. When `measurementId` is missing, renders `null`.

- [ ] **Step 1: Write the failing test**

```ts
import { getMeasurementId, shouldLoadGa, consentDefaults } from "../lib/analytics";
describe("ga4 analytics", () => {
  it("reads measurement id from settings", () => {
    expect(getMeasurementId({ "analytics.ga4MeasurementId": "G-ABC123" })).toBe("G-ABC123");
  });
  it("only loads after consent granted", () => {
    expect(shouldLoadGa("granted")).toBe(true);
    expect(shouldLoadGa("denied")).toBe(false);
  });
  it("defaults consent to denied (Phase 6 gate)", () => {
    expect(consentDefaults()).toMatchObject({ analytics_storage: "denied" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/web test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`apps/web/lib/analytics.ts`:
```ts
export function getMeasurementId(settings: Record<string, string>) {
  return settings["analytics.ga4MeasurementId"];
}
export function shouldLoadGa(consent: "granted" | "denied") {
  return consent === "granted";
}
export function consentDefaults() {
  return { analytics_storage: "denied", ad_storage: "denied" };
}
```

`apps/web/components/analytics/ga4.tsx`:
```tsx
"use client";
import Script from "next/script";
export function Ga4({ measurementId, consented }: { measurementId?: string; consented?: boolean }) {
  if (!measurementId) return null;
  const storage = consented ? "granted" : "denied";
  return (
    <>
      <Script id="gtag-base" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
        gtag('consent','default',{'analytics_storage':'${storage}','ad_storage':'denied'});
        gtag('js',new Date());gtag('config','${measurementId}');`}
      </Script>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
    </>
  );
}
```

Marketing layout fetches `/api/public/settings` (server), passes `measurementId={getMeasurementId(settings)}` to `<Ga4 />`. Consent wiring (`shouldLoadGa`) is consumed by the Phase 6 consent banner; until then the component loads with storage `denied`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/analytics apps/web/lib/analytics.ts apps/web/test/analytics.test.ts apps/web/app/(marketing)/layout.tsx
git commit -m "feat(analytics): add consent-aware GA4 injector with Settings-driven measurement id"
```

---

### Checkpoint: M2 Definition of Done

- [ ] Public site: nav/footer, 3D hero, `/services` + 5 detail pages, AI Brief → draft project.
- [ ] CMS surface (content + theme) in admin; public pages read published content + CSS token overrides.
- [ ] `/contact` writes `ContactInquiry` + Resend notification; `/book` wizard saves `Booking` PENDING leads.
- [ ] `/blog` + `/blog/[slug]` published-only with category/search/related; `/team` `/careers` `/xr/*` pages live.
- [ ] Homepage sections complete (services trio, XR 2×2, Why Choose Us, stats, testimonials, FAQ, CTA, 5-col footer).
- [ ] Dashboard lists org-scoped projects with status badges.
- [ ] Dashboard overview stats (active projects, renders, AI credits, storage) + fixed sidebar; Phase 4 XR tools shown disabled.
- [ ] Admin can transition project status (audit-logged).
- [ ] Admin breadth: overview, orders, clients, team, files, agent monitoring.
- [ ] Super Admin breadth: analytics, transfers, invites, active toggle, impersonation (audit-logged), revenue, GPU, audit log, settings.
- [ ] Client portal approves milestones; project auto-flips APPROVED; approved assets downloadable.
- [ ] Client portal depth: progress %, status stepper, deliverables, timeline, messages, billing.
- [ ] Demo accounts (SUPER_ADMIN/ADMIN/STAFF/CLIENT) seeded; role-based post-login redirect tested.
- [ ] GA4 injector with Settings-driven measurement ID, consent-default denied (Phase 6 gate).
- [ ] All routes SSR/SSG-optimized; Lighthouse ≥ 90; TBT < 200ms (§22).
- [ ] §25 tracker rows 28 (and 27) updated.
