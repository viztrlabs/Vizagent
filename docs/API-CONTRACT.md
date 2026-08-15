# VizTR — API Contract & Versioning

> **Status**: Planning-time contract. VizTR is 100% in the planning phase (zero production code). This document describes the **intended** API surface — no fabricated implementations. Contracts land in Phase 0/1 (MVP Next.js API Routes) and Phase 5 (public API) per `VIZTR-COMPLETE-FEATURES.md` §6.2/§27.6 and the phase plans.

---

## 1. Base URL & Versioning Policy

| Version | Prefix | Status |
|---------|--------|--------|
| **v1** | `/api/v1/*` | Stable — the only version shipped at MVP |
| **v2** | `/api/v2/*` | Breaking changes only; cut when required |

- **Stable surface**: `/api/v1/*` is the long-term contract — 115+ endpoints across `public/`, `admin/`, `client/`, `internal/`, `auth/` (§6.2). Additive changes (new optional fields, new endpoints) land on v1 with no version bump.
- **Breaking changes** ship as `/api/v2/*`. The superseded version is marked with a `Warning: 299 - "deprecated"` response header and kept alive for a **12-month support window** before removal (Phase 5 advisory, `2026-08-05-phase5-monetization.md`).
- The XR engine (`xr.viztr.com`) consumes `GET /api/v1/public/projects/[id]` for scene config and honors `?mode=tour|vr|ar` (§6.2).

## 2. Standard Error Envelope

Every API response uses a single envelope defined in `packages/utils` (Phase 0/1 Task 3, `AppError` + `assertValid`). Success is `{ "success": true }` (plus `data` when a payload is returned); failure:

```json
{
  "success": false,
  "error": { "code": "VALIDATION", "message": "Invalid input" }
}
```

- `error.code` is a stable, machine-readable string: `VALIDATION`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `PAYMENT_REQUIRED`, `CONFLICT`, `INTERNAL`.
- HTTP status codes remain meaningful (400/401/403/404/429/500); the envelope is the machine-readable body.

## 3. Authentication Model

- **Transport**: `Authorization: Bearer <jwt>` on every protected request; public endpoints (portfolio/services/contact) sit on an explicit allowlist (§27.6).
- **Issuer**: Supabase Auth JWT — access JWT expires in 1h, refresh JWT in 1w (Phase 0/1 Task 8). Browsers use `@supabase/ssr` cookies; API/SSR clients use the Bearer header.
- **Authorization (RBAC)**: roles Public → Client → Staff → Admin → Super Admin (§3.2); server-side checks via `hasPermission(role, scope)` in middleware + route guards (`projects:manage`, `billing:manage`, `users:manage`, `platform:manage`, §18.2).
- **Data isolation (RLS)**: every tenant table carries `org_id`; Postgres RLS enforces tenant isolation from the JWT claim `auth.jwt() ->> 'org_id' = org_id` (Phase 0/1 Task 10, §27.7). The service-role key is **server-only** and never in client bundles.
- **Rate limiting**: per-IP + per-user tiers; sliding-window counters in Redis (§27.6).
- **Public API (Phase 5)**: paid tiers get scoped API keys (`sk_live_*`, hashed at rest) carrying scopes + rate-limit buckets (`packages/api`).

## 4. Route Families (5)

| Family | Domain | Approx. Count | Auth |
|--------|--------|---------------|------|
| `public/` | portfolio, services, contact | 25+ | allowlist (no auth) |
| `admin/` | users, projects, analytics, finances | 45+ | Admin/Super Admin |
| `client/` | projects, files, messages, billing | 30+ | Client/Staff (org-scoped) |
| `internal/` | webhooks, jobs, services | 15+ | signature / service token |
| `auth/` | login, signup, magic-link, OAuth, refresh | — | public (token minting) |

### 4.1 `public/` — Marketing endpoints (example surface)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/public/portfolio` | List published portfolio projects |
| GET | `/api/v1/public/portfolio/[slug]` | Portfolio detail + gallery |
| GET | `/api/v1/public/services` | List services + pricing |
| POST | `/api/v1/public/contact` | Contact form submit (rate-limited) |
| POST | `/api/v1/public/ai-brief` | AI brief → creates project + task board |

**Representative** — `GET /api/v1/public/portfolio?category=villa`:
```json
{ "success": true, "data": [{ "id": "pf_01JX...", "slug": "ocean-villa", "title": "Ocean Villa", "cover": "https://cdn.viztr.com/pf/ocean-villa/cover.webp", "modes": ["tour", "webxr", "vr"] }] }
```

### 4.2 `admin/` — Management endpoints (example surface)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/projects` | Org project list + status |
| POST | `/api/v1/admin/projects` | Create project (org-scoped) |
| GET | `/api/v1/admin/analytics` | Dashboard metrics (XR engagement, §15.3) |
| GET | `/api/v1/admin/finances` | Invoices / revenue |
| POST | `/api/v1/admin/agents/emergency-stop` | Halt active agent runs (Phase 3) |

**Representative** — `POST /api/v1/admin/projects` (request → response):

```json
{ "name": "Luxury Villa", "service": "virtual-tour", "clientId": "cli_01JX..." }
```
```json
{ "success": true, "data": { "id": "p_01JX...", "orgId": "org_01JX...", "status": "DRAFT", "qaPassed": false } }
```

### 4.3 `client/` — Client portal endpoints (example surface)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/client/projects` | Client-visible projects |
| GET | `/api/v1/client/projects/[id]/milestones` | Milestones + approval state |
| GET | `/api/v1/client/files` | Shared files (presigned URLs) |
| POST | `/api/v1/client/messages` | Send message to thread |
| GET | `/api/v1/client/billing/invoices` | Invoices for org |

**Representative** — `GET /api/v1/client/projects/p_01JX.../milestones`:
```json
{ "success": true, "data": [{ "id": "m_01JX...", "name": "Interior Renders", "status": "PENDING", "approvedBy": null, "approvedAt": null }] }
```

### 4.4 `internal/` — Service endpoints (example surface)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/internal/webhooks/stripe` | Stripe events (sig-verified, idempotent) |
| POST | `/api/v1/internal/webhooks/github` | Content-as-Code PR/CI events |
| POST | `/api/v1/internal/webhooks/vercel` | Deploy state |
| POST | `/api/v1/internal/jobs/[queue]/retry` | BullMQ DLQ re-dispatch |
| GET | `/api/v1/internal/pixel-streaming/session` | Stream broker session status (§9.6) |

**Representative** — `POST /api/v1/internal/webhooks/stripe` (Stripe signed `checkout.session.completed` with `Stripe-Signature` header):

```json
{ "success": true }
```

### 4.5 `auth/` — Authentication endpoints (example surface)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/signup` | Email/password signup |
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/magic-link` | Passwordless email link |
| POST | `/api/v1/auth/refresh` | Rotate access JWT |
| POST | `/api/v1/auth/logout` | Revoke session |

**Representative** — `POST /api/v1/auth/signup` (zod `signupSchema`):
```json
{ "email": "client@studio.com", "password": "correct-horse-12", "name": "A. Client" }
```
```json
{ "success": true, "data": { "user": { "id": "u_01JX...", "email": "client@studio.com" }, "session": { "accessToken": "<jwt>", "expiresIn": 3600 } } }
```

## 5. Machine-Readable OpenAPI Spec

The OpenAPI 3.1 spec is **generated from the shared Zod schemas** via `zod-to-openapi` — all 115+ endpoints share one source of truth with the runtime validation layer (`packages/utils`, Phase 0/1 Task 3). The generated spec is exposed at **`/api/docs`** (Swagger UI) for internal and public API consumers (Phase 5 advisory, `2026-08-05-phase5-monetization.md`).
