# Phase 5 — Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monetize the platform: analytics & observability, billing & subscriptions, booking system, marketplace, white-label SaaS, and public API access.

**Architecture:** Stripe (subscriptions + usage metering + webhooks) with entitlements cached in Redis and enforced at the API boundary (§27.8). Booking and marketplace build on the billing primitives. Analytics splits product/XR events (PostHog/segment + Vercel + Supabase) and business metrics (§15). Public API adds scoped API keys.

**Tech Stack:** Stripe Node SDK, Redis 7, PostHog (self-hostable), Vercel Analytics, Sentry, react-email + Resend, BullMQ (reuse Phase 3), zod.

## Global Constraints

- Entitlements: subscription state + usage cached in Redis; refreshed on Stripe webhooks; enforced at API boundary (§27.8).
- Trials: 14-day free trial on paid tiers via Stripe trial settings (`trial_period_days`); trial state tracked in entitlements (`trialEndsAt`), converts on `invoice.paid`.
- Free tier limits for `TierEnforcer` (placeholder — finalize with §11.4): 3 projects, 5GB storage, 100 AI credits/mo, 1 active render at a time; loaded from plan metadata so limits are tunable without deploys.
- Usage-based: rendering credits, Pixel Streaming minutes, AI generation credits.
- Marketplace: asset + theme listings with platform fee; payouts via Stripe Connect.
- White-label: per-org theme tokens + optional per-org domain (CNAME).
- Public API: API keys with scopes, rate limits, and docs.
- Compliance: GDPR data export/deletion; PCI scope avoided (Stripe Checkout).
- Payments: Stripe primary; Razorpay shipped alongside for the India market (arch-vis demand, §14.3), not post-launch — checkout + webhook parity across Tasks 1–2.
- Analytics: XR engagement events (§9.23) + funnels + Sentry error tracking.

---

### Task 1: Billing core (Stripe)

**Files:**
- Create: `packages/billing/src/plans.ts`
- Create: `packages/billing/src/checkout.ts`
- Create: `packages/billing/src/usage.ts`
- Test: `packages/billing/test/billing.test.ts`

**Interfaces:**
- Consumes: `@viztr/utils` zod, `getServiceClient` (Phase 0/1).
- Produces: `PLANS` (Free/Pro/Studio/Enterprise with monthly + credits, §11.4/§14), `createCheckout(orgId, planId)`, `createPortalSession(orgId)`, `meterUsage(orgId, metric, amount)`, `listInvoices(orgId)`.

- [ ] **Step 1: Write the failing test**

```ts
import { PLANS, resolvePlan } from "../src/plans";
describe("plans", () => {
  it("includes four tiers", () => {
    expect(Object.keys(PLANS)).toEqual(["free", "pro", "studio", "enterprise"]);
  });
  it("studio includes pixel streaming credits", () => {
    expect(resolvePlan("studio").credits.pixelStreamingMinutes).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/billing test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`plans.ts`:
```ts
export const PLANS = {
  free: { id: "free", name: "Free", monthly: 0, credits: { render: 1, pixelStreamingMinutes: 0, ai: 5 } },
  pro: { id: "pro", name: "Pro", monthly: 29, credits: { render: 10, pixelStreamingMinutes: 60, ai: 100 } },
  studio: { id: "studio", name: "Studio", monthly: 149, credits: { render: 50, pixelStreamingMinutes: 600, ai: 1000 } },
  enterprise: { id: "enterprise", name: "Enterprise", monthly: 0, credits: { render: Infinity, pixelStreamingMinutes: Infinity, ai: Infinity } },
} as const;
export function resolvePlan(id: string) { return PLANS[id as keyof typeof PLANS]; }
```

`checkout.ts`: `stripe.checkout.sessions.create` with success/cancel URLs + `client_reference_id: orgId`. `usage.ts`: `meterUsage` writes usage row + updates Redis counter; decrements on consume.

Note: `createCheckout` accepts a provider (`stripe` | `razorpay`) for India-market checkout parity on launch, not post-launch (§14.3).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/billing test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/billing
git commit -m "feat(billing): add plan matrix, checkout, portal, usage metering"
```

---

### Task 2: Subscription lifecycle + webhooks

**Files:**
- Create: `packages/billing/src/webhooks.ts`
- Create: `apps/web/app/api/billing/webhook/route.ts`
- Test: `packages/billing/test/webhooks.test.ts`

**Interfaces:**
- Consumes: Task 1, `agent_runs`/org tables.
- Produces: `handleStripeEvent(event, db)` — `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted` → updates org plan + entitlements cache; webhook route verifies signature.

- [ ] **Idempotency:** record processed Stripe `event.id`s (Redis set `webhook:processed:<eventId>` with TTL) before handling; skip already-processed events to guard against duplicate webhook deliveries.

- [ ] **Step 1: Write the failing test**

```ts
import { handleStripeEvent } from "../src/webhooks";
describe("stripe webhooks", () => {
  it("activates plan on checkout completion", async () => {
    const db = { org: { update: async (a: any) => a } };
    const r = await handleStripeEvent({ type: "checkout.session.completed", data: { object: { client_reference_id: "org_1", metadata: { plan: "pro" } } } } as any, db as any);
    expect(r.where.id).toBe("org_1");
    expect(r.data.plan).toBe("pro");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/billing test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
export async function handleStripeEvent(event: { type: string; data: { object: any } }, db: any) {
  const o = event.data.object;
  switch (event.type) {
    case "checkout.session.completed":
      return db.org.update({ where: { id: o.client_reference_id }, data: { plan: o.metadata.plan, subscriptionStatus: "ACTIVE" } });
    case "customer.subscription.deleted":
      return db.org.update({ where: { id: o.metadata.orgId }, data: { subscriptionStatus: "CANCELLED" } });
    default:
      return null;
  }
}
```

Webhook route: `stripe.webhooks.constructEvent(raw, sig, endpointSecret)`.

Idempotency note: check `event.id` against `processed_events` before handling and record it before any side effects — Stripe can redeliver webhooks, so handlers must be safe to run twice.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/billing test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/billing/src/webhooks.ts apps/web/app/api/billing/webhook
git commit -m "feat(billing): add subscription lifecycle webhook handler"
```

---

### Task 3: Analytics & observability

**Files:**
- Create: `packages/analytics/src/events.ts`
- Create: `packages/analytics/src/ingest.ts`
- Create: `packages/analytics/src/dashboards.ts`
- Test: `packages/analytics/test/analytics.test.ts`

**Interfaces:**
- Consumes: XR engagement events (§9.23), PostHog/Sentry.
- Produces: `track(event, props)` (XR enter/exit/hotspot/VR/AR/pixel events), `dailyMetric(db, orgId, metric, value)` (upsert `Metric`), `reportQuery(db, range)` for dashboards.

- [ ] **Step 1: Write the failing test**

```ts
import { normalizeEvent } from "../src/events";
describe("analytics events", () => {
  it("tags xr events", () => {
    const e = normalizeEvent({ type: "xr.enter", projectId: "p1", mode: "vr" });
    expect(e.categories).toContain("xr");
    expect(e.payload.mode).toBe("vr");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/analytics test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`events.ts`:
```ts
export function normalizeEvent(e: { type: string; projectId: string; mode?: string }) {
  return { categories: e.type.startsWith("xr.") ? ["xr", e.type.split(".")[1]] : ["app"], payload: { projectId: e.type.startsWith("xr.") ? e.projectId : undefined, mode: e.mode } };
}
```

`ingest.ts` forwards to PostHog + stores `Analytics` row. `dashboards.ts` aggregates `Metric` by day for the admin analytics pages (§7.2).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/analytics test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/analytics
git commit -m "feat(analytics): add event normalize, ingest, and dashboard queries"
```

---

### Task 4: Booking system

**Files:**
- Create: `packages/booking/src/availability.ts`
- Create: `packages/booking/src/book.ts`
- Test: `packages/booking/test/booking.test.ts`

**Interfaces:**
- Consumes: org + project tables, `notify` worker (Phase 3 Task 1).
- Produces: `availableSlots(studioId, date)` (slot grid from config), `bookSlot(db, studioId, orgId, projectId, slot, actor)` (create `Booking`, enqueue reminder, conflict-checked).

- [ ] **Step 1: Write the failing test**

```ts
import { availableSlots } from "../src/availability";
describe("booking availability", () => {
  it("returns slots within working hours", () => {
    const slots = availableSlots("2026-08-10", { start: "09:00", end: "12:00", durationMin: 60, booked: ["10:00"] });
    expect(slots).toEqual(["09:00", "11:00"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/booking test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`availability.ts`:
```ts
export function availableSlots(date: string, cfg: { start: string; end: string; durationMin: number; booked: string[] }) {
  const [sh, sm] = cfg.start.split(":").map(Number);
  const [eh] = cfg.end.split(":").map(Number);
  const out: string[] = [];
  for (let h = sh; h < eh; h += cfg.durationMin / 60) {
    const t = `${String(h).padStart(2, "0")}:00`;
    if (!cfg.booked.includes(t)) out.push(t);
  }
  return out;
}
```

`book.ts` double-checks the slot is still free, creates booking, enqueues `notify.send` (reminder).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/booking test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/booking
git commit -m "feat(booking): add availability and conflict-checked booking"
```

---

### Task 5: Marketplace

**Files:**
- Create: `packages/marketplace/src/catalog.ts`
- Create: `packages/marketplace/src/payouts.ts`
- Test: `packages/marketplace/test/marketplace.test.ts`

**Interfaces:**
- Consumes: billing credits (Task 1), Stripe Connect.
- Produces: `listListings(db, { type, q })` (assets/themes), `purchaseListing(db, orgId, listingId)` (credit-debit + license row), `payoutToSeller(sellerAccountId, amountCents)`.

- [ ] **Step 1: Write the failing test**

```ts
import { applyPlatformFee } from "../src/catalog";
describe("marketplace fees", () => {
  it("applies 15% platform fee", () => {
    expect(applyPlatformFee(100_00)).toBe(15_00);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/marketplace test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`catalog.ts`:
```ts
export const PLATFORM_FEE = 0.15;
export function applyPlatformFee(priceCents: number): number {
  return Math.round(priceCents * PLATFORM_FEE);
}
```

`payouts.ts`: `stripe.transfers.create` minus `applyPlatformFee`. Listings filtered by `type: "asset" | "theme"`.

Note: the 15% is a configurable platform fee, not a magic number — read from `MARKETPLACE_FEE_PCT` (default 0.15) or an admin setting so it can be adjusted per promo/region without a deploy.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/marketplace test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/marketplace
git commit -m "feat(marketplace): add catalog, platform fee, and Stripe Connect payouts"
```

---

### Task 6: White-label SaaS

**Files:**
- Create: `packages/whitelabel/src/themes.ts`
- Create: `packages/whitelabel/src/domains.ts`
- Test: `packages/whitelabel/test/whitelabel.test.ts`

**Interfaces:**
- Consumes: design tokens (Phase 0/1 Task 4), org settings.
- Produces: `applyOrgTheme(orgId, overrides)` (CSS variable overrides incl. font tokens from `Theme`/`StylePreset`, consumed by the Task 9 customizer UI), `resolveOrgDomain(host, orgs)` (CNAME → orgId), `customDomains(db, orgId)`.

- [ ] **Step 1: Write the failing test**

```ts
import { applyOrgTheme } from "../src/themes";
describe("white-label themes", () => {
  it("overrides accent token", () => {
    expect(applyOrgTheme({ accent: "#ff6600" })).toContain("--viztr-accent: #ff6600");
  });
  it("overrides heading font token", () => {
    expect(applyOrgTheme({ headingFont: "Manrope" })).toContain("--viztr-heading-font: Manrope");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/whitelabel test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`themes.ts`:
```ts
export interface OrgThemeOverrides { accent?: string; bg?: string; fontFamily?: string; headingFont?: string }
export function applyOrgTheme(overrides: OrgThemeOverrides): string {
  const tokenMap: Record<string, string> = {
    accent: "--viztr-accent", bg: "--viztr-bg",
    fontFamily: "--viztr-font-family", headingFont: "--viztr-heading-font",
  };
  return Object.entries(overrides)
    .map(([k, v]) => `${tokenMap[k]}: ${v};`)
    .join("\n");
}
```

`domains.ts` maps hostname → org by `custom_domains` table lookup; middleware applies `applyOrgTheme` for matched org.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/whitelabel test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/whitelabel
git commit -m "feat(whitelabel): add org theme overrides and custom domain resolution"
```

---

### Task 7: Public API access

**Files:**
- Create: `packages/api/src/keys.ts`
- Create: `apps/api/plans.ts` (post-MVP gateway mount)
- Test: `packages/api/test/keys.test.ts`

**Interfaces:**
- Consumes: org + plan (Task 1).
- Produces: `issueApiKey(db, orgId, scopes, actor)` (hashed `sk_live_*`), `verifyApiKey(db, key)` (scopes + rate-limit bucket), `revokeApiKey(db, keyId)`.

**Versioning & contract (advisory):**
- API versioning/deprecation: `/api/v1/*` is the stable surface; breaking changes ship as `/api/v2/*` and the old version is deprecated with a deprecation notice header and a 12-month support window before removal.
- OpenAPI from Zod: generate the OpenAPI/Swagger spec from the Zod schemas with `zod-to-openapi` so all 115+ endpoints have a machine-readable contract; expose it at `/api/docs` (Swagger UI) for internal + public API consumers.
- Error envelope: all public API responses use the standard envelope `{ success: boolean, error?: { code: string, message: string } }` (defined in `packages/utils`, Phase 0/1) — consistent with the other phases.

- [ ] **Step 1: Write the failing test**

```ts
import { hashKey, verifyHash } from "../src/keys";
describe("api keys", () => {
  it("hashes and verifies keys", () => {
    const { hash, prefix } = hashKey("sk_live_abc");
    expect(prefix).toBe("sk_live");
    expect(verifyHash("sk_live_abc", hash)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/api test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`keys.ts`:
```ts
import { createHash } from "node:crypto";
export function hashKey(key: string): { hash: string; prefix: string } {
  const [prefix] = key.split("_");
  return { prefix, hash: createHash("sha256").update(key).digest("hex") };
}
export function verifyHash(key: string, hash: string): boolean {
  return hashKey(key).hash === hash;
}
```

`issueApiKey` stores the hash + scopes; `verifyApiKey` applies Redis rate-limit counter per key.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api
git commit -m "feat(api): add scoped public API key issue/verify/revoke"
```

---

### Task 8: Admin bookings management UI

**Files:**
- Create: `apps/admin/app/(protected)/bookings/page.tsx`
- Create: `apps/admin/lib/bookings-admin.ts`
- Test: `apps/admin/test/bookings-admin.test.ts`

**Interfaces:**
- Consumes: `Booking` rows + `availableSlots` (Task 4), `notify` worker (Phase 3 Task 1), admin session.
- Produces: `listBookings(db, { status?, from?, to?, studioId? })` (filter by status/date), `autoConfirm(booking)`, `setBookingStatus(db, bookingId, status, actor)` (approve/reject/cancel/reschedule with audit), `reschedule(db, bookingId, slot)` (re-checks Task 4 `availableSlots`) — bookings table UI with status/date filters, approve/reject/auto-confirm actions, and a reschedule dialog.

- [ ] **Step 1: Write the failing test**

```ts
import { autoConfirm, setBookingStatus } from "../lib/bookings-admin";
describe("bookings admin", () => {
  it("auto-confirms and rejects bookings", () => {
    const b = { id: "b1", status: "PENDING" as const };
    expect(autoConfirm(b).status).toBe("CONFIRMED");
    expect(setBookingStatus(b, "REJECTED").status).toBe("REJECTED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/bookings-admin.ts`:
```ts
export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
export function autoConfirm(b: { id: string; status: BookingStatus }) {
  return { ...b, status: "CONFIRMED" as const };
}
export function setBookingStatus(b: { id: string; status: BookingStatus }, status: BookingStatus) {
  return { ...b, status };
}
export async function listBookings(db, filters: { status?: BookingStatus; from?: string; to?: string; studioId?: string }) {
  let q = db.from("Booking").select("*");
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.from) q = q.gte("scheduledAt", filters.from);
  if (filters.to) q = q.lte("scheduledAt", filters.to);
  if (filters.studioId) q = q.eq("studioId", filters.studioId);
  return (await q.order("scheduledAt", { ascending: true })).data;
}
```

`apps/admin/app/(protected)/bookings/page.tsx`: filter bar (status chips + date range + studio), bookings table (client, studio, slot, status), actions approve/reject/auto-confirm; reschedule opens a dialog that re-checks `availableSlots` (Task 4) and saves the new slot; every write audit-logs `actor` and enqueues `notify.send` via the Phase 3 worker.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/(protected)/bookings apps/admin/lib/bookings-admin.ts apps/admin/test/bookings-admin.test.ts
git commit -m "feat(admin): add bookings management UI with approve/reject/reschedule"
```

---

### Task 9: Theme customization UI (extends Task 6 whitelabel)

**Files:**
- Create: `apps/admin/app/(protected)/settings/theme/page.tsx`
- Create: `apps/admin/components/theme/ThemeCustomizer.tsx`
- Test: `apps/admin/test/theme-customizer.test.tsx`

**Interfaces:**
- Consumes: `applyOrgTheme` + `OrgThemeOverrides` (Task 6, extended with fonts), org `Settings` row.
- Produces: `loadOrgTheme(db, orgId)`, `saveOrgTheme(db, orgId, overrides, actor)` (persists to Settings/CSS token overrides) — `ThemeCustomizer` with primary color picker, font selector, and live preview applying the `applyOrgTheme` CSS variables.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeCustomizer } from "../components/theme/ThemeCustomizer";
describe("theme customizer", () => {
  it("previews the picked primary color", () => {
    render(<ThemeCustomizer overrides={{}} onSave={vi.fn()} />);
    fireEvent.input(screen.getByLabelText("Primary color"), { target: { value: "#1a73e8" } });
    expect(screen.getByTestId("theme-preview").style.getPropertyValue("--viztr-accent")).toBe("#1a73e8");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`apps/admin/components/theme/ThemeCustomizer.tsx`: `input[type=color]` labeled "Primary color", `<select>` labeled "Font" (design-system families: Inter, Manrope, Space Grotesk, Playfair Display), preview panel `data-testid="theme-preview"` with `style={{ "--viztr-accent": color, "--viztr-font-family": font }}` applied live; **Save** persists via `saveOrgTheme` → org `Settings` row → applied org-wide (Task 6 middleware).

```ts
export async function saveOrgTheme(db, orgId: string, overrides: OrgThemeOverrides, actor: string) {
  return db.from("OrgSettings").upsert({ orgId, cssTokenOverrides: overrides, updatedBy: actor });
}
export async function loadOrgTheme(db, orgId: string) {
  return (await db.from("OrgSettings").select("cssTokenOverrides").eq("orgId", orgId).maybeSingle()).data?.cssTokenOverrides ?? {};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/(protected)/settings/theme apps/admin/components/theme apps/admin/test/theme-customizer.test.tsx
git commit -m "feat(admin): add theme customization UI with live preview"
```

---

### Checkpoint: M5 Definition of Done

- [ ] Checkout → webhook → org plan + entitlements live; usage decrements.
- [ ] Admin bookings UI filters/approves/rejects/reschedules; notifications enqueued.
- [ ] Theme customizer picks color + font with live preview; `applyOrgTheme` supports font tokens.
- [ ] XR + funnel analytics flow to dashboards; Sentry wired.
- [ ] Booking slots conflict-free; reminders enqueued.
- [ ] Marketplace purchases debit credits; payouts minus fee.
- [ ] Custom domain + org theme override applied.
- [ ] API keys scoped + rate-limited; docs page live.
- [ ] §25 tracker rows 31 updated.
