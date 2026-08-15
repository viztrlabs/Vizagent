# VizTR — Adapted File Structure (reconciled to Locked Stack)
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Target blueprint

> **Source:** the reference "FILE STRUCTURE — Generate All Files" blueprint. **Action:** translated every entry onto our locked architecture (Supabase, Prisma, R2, Resend, Supabase Auth, Babylon/Marzipano/MindAR, Glass/cyan‑violet design system, 4-role model), kept the good concepts, added what VizTR needs that the reference lacked (content engine, XR World Console, versioning, SEO), and mapped to the existing repo so we *extend, don't duplicate*.
>
> **Frame:** this is the **application layer**. Where it physically lives — repo root (current, single Next app) vs `apps/web` in a monorepo — is a packaging decision, not a layout decision; the tree below is identical either way. Recommendation in §7: keep the current single-app root (lightest, matches your instinct), split agent-server/local-runner out only when needed.

---

## 1. Stack Translation (reference → ours)

| Reference | Ours | Where |
|---|---|---|
| MongoDB + Mongoose (`models/*.ts`) | Supabase PostgreSQL + **Prisma** (`prisma/schema.prisma`) | DB layer |
| NextAuth (`api/auth/[...nextauth]`, `lib/auth.ts`, `store/useAuthStore`) | **Supabase Auth** (`lib/supabase/*`, session hooks) | Auth |
| AWS S3 (`lib/s3.ts`, `media/upload` presigned) | **Cloudflare R2** (existing `lib/server/lib/r2.ts` + `@aws-sdk/client-s3`) | Storage |
| Nodemailer (`lib/email.ts`) | **Resend + React Email** (existing `lib/emails/*`) | Email |
| A-Frame (VR) / model-viewer (AR) / Three.js (tour/webxr) | **Babylon.js core** (ADR 6.1) + **Marzipano** 360 (ADR 6.1.1) + **MindAR/WebXR** for AR | XR engines |
| `next.config.js` | `next.config.ts` (single, fixed cache headers) | Config |
| `middleware.ts` (NextAuth) | Supabase guard + role gates + rate limit | Auth |
| `api/auth/[...nextauth]/route.ts` | Removed (Supabase) | Auth |
| `types/next-auth.d.ts` | Removed (Supabase types) | Types |

---

## 2. Good ideas we ADOPT from the reference

- **Public, revocable XR token share-links** — `view/` routes keyed by `[token]`: `tour` / `ar` / `vr` / `xr` / `stream`. Open, no‑auth viewers for clients; token issued via `api/xr/links` (matches existing `XrAsset.shareToken` + `Session`). M8/M10/M11.
- **Role-tiered dashboards** — `super-admin / admin / studio / client` ≈ our locked `super_admin / admin / user(studio) / client` + public. Adopt naming.
- **Full marketing page inventory** — about, services(+slug), 5 XR product pages, portfolio(+slug), blog(+slug), contact, book, pricing, privacy, terms. Adopt; pages become **content-engine records** (admin-editable) per M9, with static fallbacks.
- **`home/*` section components** — HeroSection, ServicesGrid, XRProductsSection, Benefits, PortfolioPreview, Testimonials, FAQ, CTA, DualPositioning. Adopt and restyle to glass/cyan‑violet + cinematic 3D hero.
- **`dashboard/*` operational components** — GPUMonitor, LogStream, FeatureToggles, XRLinkGenerator, PixelStreamingControl, ReviewViewport, RevenueChart, DataTable, MetricCard. Adopt (core of M10/M12).
- **`lib/seo.ts` + `sitemap` + `og` routes** — adopt, plus `robots.ts`, `opengraph-image.tsx`.
- **Zustand stores + hooks** (`useXR`, `usePixelStreaming`, `useSettings`, `useToast`) — adopt (state/realtime per locked stack).
- **`scripts/seed.ts`** — adopt, rewritten for Prisma/Supabase.

---

## 3. Adapted File Tree

### `app/` — routes
```
app/
├── (marketing)/                      # cinematic public site — content-engine driven (M9)
│   ├── page.tsx                      # 3D hero, services, XR products, portfolio, testimonials, FAQ, CTA
│   ├── loading.tsx / error.tsx / not-found.tsx
│   ├── about/page.tsx
│   ├── services/page.tsx
│   ├── services/[slug]/page.tsx
│   ├── xr/
│   │   ├── virtual-tour/page.tsx     # 360 tours product page
│   │   ├── webar/page.tsx
│   │   ├── virtual-reality/page.tsx
│   │   ├── webxr/page.tsx
│   │   └── pixel-streaming/page.tsx
│   ├── portfolio/page.tsx
│   ├── portfolio/[slug]/page.tsx
│   ├── blog/page.tsx
│   ├── blog/[slug]/page.tsx
│   ├── contact/page.tsx
│   ├── book/page.tsx
│   ├── pricing/page.tsx
│   ├── privacy-policy/page.tsx
│   └── terms-of-service/page.tsx
│
├── auth/                              # Supabase Auth (email, Google, magic-link)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── client-access/page.tsx
│
├── dashboard/                         # role-tiered (≈ locked roles)
│   ├── layout.tsx                     # shell: Sidebar + main
│   ├── super-admin/
│   │   ├── page.tsx                   # overview: revenue, health, users, CMS
│   │   ├── projects/page.tsx
│   │   ├── users/page.tsx
│   │   ├── revenue/page.tsx
│   │   ├── health/page.tsx            # GPU + Redis + agents + uptime
│   │   ├── cms/page.tsx               # content-engine admin (page/section/block builder, versions)
│   │   ├── audit/page.tsx             # (NEW) audit-log viewer
│   │   └── settings/page.tsx          # incl. env-settings (encrypted) + workstation/hermes pairing
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── projects/page.tsx
│   │   └── bookings/page.tsx
│   ├── studio/                        # = locked "user(studio)"
│   │   ├── page.tsx
│   │   ├── projects/page.tsx
│   │   ├── assets/page.tsx
│   │   ├── xr/
│   │   │   ├── console/page.tsx       # (NEW) XR WORLD CONSOLE — launch pad for all 5 modes
│   │   │   ├── links/page.tsx         # manage share tokens
│   │   │   ├── virtual-tour/new/page.tsx
│   │   │   ├── webar/new/page.tsx
│   │   │   ├── webxr/new/page.tsx
│   │   │   └── vr/new/page.tsx
│   │   ├── pixel-streaming/page.tsx   # stream control + GPU monitor
│   │   └── review/[projectId]/page.tsx# client-ready ReviewViewport (annotations/approvals)
│   └── client/
│       ├── page.tsx                   # approvals, deliverables, timeline (M11)
│       ├── timeline/page.tsx
│       └── deliverables/page.tsx
│
├── view/                              # PUBLIC token-based XR share links (open, revocable)
│   ├── tour/[token]/page.tsx          # Marzipano 360 viewer
│   ├── ar/[token]/page.tsx            # MindAR / WebXR hit-test
│   ├── vr/[token]/page.tsx            # Babylon WebXR immersive (Quest)
│   ├── xr/[token]/page.tsx            # Babylon WebXR walkthrough
│   └── stream/[token]/page.tsx        # Pixel Streaming WebRTC player
│
├── api/                                # route handlers (server-side; Supabase, never direct DB from client)
│   ├── users/route.ts  ·  users/[id]/route.ts
│   ├── projects/route.ts  ·  projects/[id]/route.ts  ·  projects/[id]/comments/route.ts
│   ├── services/route.ts  ·  services/[slug]/route.ts
│   ├── blog/route.ts  ·  blog/[slug]/route.ts
│   ├── testimonials/route.ts
│   ├── media/route.ts  ·  media/upload/route.ts       # R2 pre-signed (chunked, resumable)
│   ├── bookings/route.ts
│   ├── contact/route.ts
│   ├── settings/route.ts
│   ├── xr/links/route.ts              # token gen/validate/revoke
│   ├── xr/links/[token]/route.ts
│   ├── xr/links/[token]/revoke/route.ts
│   ├── streaming/session/route.ts  ·  streaming/session/[id]/route.ts
│   ├── analytics/route.ts
│   ├── sitemap/route.ts
│   └── og/route.tsx
│
├── layout.tsx                         # root: fonts (next/font), ThemeProvider, Header/Nav, Footer
├── globals.css                        # Tailwind + locked tokens + glass utilities (dual theme)
└── providers.tsx                      # Supabase session + ThemeProvider + Zustand
```

### `components/`
```
components/
├── layout/    Nav.tsx(glass+dropdowns+ThemeToggle) · Footer.tsx · Breadcrumbs.tsx
├── home/      HeroSection · DualPositioningSection · ServicesGrid · XRProductsSection ·
│              BenefitsSection · PortfolioPreview · TestimonialsSection · FAQSection · CTASection
├── xr/        VirtualTourViewer(marzipano) · WebARViewer · VRViewer · WebXRViewer · PixelStreamingViewer
├── dashboard/ Sidebar · MetricCard · DataTable · RevenueChart · GPUMonitor · LogStream ·
│              FeatureToggles · ProjectCard · ReviewViewport · XRLinkGenerator · PixelStreamingControl
├── content/   (NEW) PageRenderer · BlockRenderer · Block[registry] · ContentToolbar  # content engine
├── console/   (NEW) XRWorldConsole · ModeLaunchCard · ServiceStatus         # launch pad
├── ui/        shadcn base + glass: Button · Badge · Card · Modal · Toggle · ProgressBar ·
│              Timeline · UploadZone · ThemeToggle · LoadingSpinner
└── forms/     ContactForm · BookingForm · LoginForm(Supabase)
```

### `lib/`
```
lib/
├── server/            # existing repository/service/queue/worker architecture (reuse, extend)
│   ├── repositories/  (base, project, asset, deployment, …)
│   ├── services/  ·   queues/ (BullMQ)  ·   workers/
│   └── lib/  r2.ts (R2) · emails.ts (Resend) · stripe.ts
├── supabase/          client.ts · server.ts (getUser/getRole) · admin.ts · middleware.ts
├── db.ts              → Prisma singleton (server-only)   [replaces MongoDB]
├── auth/roles.ts      role helpers (super_admin/admin/user/client) + Supabase claims map
├── ai/                (NEW) router.ts (provider router) · agents/ (CEO step-loop + specs)   [M15]
├── xr.ts              token generation/validation (share links)
├── streaming.ts       pixel-streaming session management
├── content.ts         (NEW) page/section/block CRUD + version/rollback   [M9]
├── qa/                existing QA engine (extend checks)                [M7]
├── seo.ts             metadata + sitemap/robots helpers
└── utils.ts
```

### Root-level
```
prisma/schema.prisma      # locks stack DB (replaces models/*.ts)
middleware.ts             # Supabase guard + role + rate limit (M0.1)
store/                    useAuthStore(Supabase) · useThemeStore · useDashboardStore
types/                    index.ts · xr.ts            (next-auth.d.ts removed)
hooks/                    useXR · usePixelStreaming · useSettings · useToast · useXRLinks
scripts/seed.ts           Prisma/Supabase seed (sample projects, XR links, content)
public/                   fonts · icons · schema/organization.json
docs/ai-ready/            context · database-schema · agents · mcp-tools · design-tokens …
next.config.ts            (single; fixed cache + security headers)
tailwind.config.ts        locked tokens (fonts, radius 8/12/16/24, glass, dual theme)
package.json · tsconfig.json · README.md
```

---

## 4. What we ADD that the reference lacked

| Addition | Purpose | Module |
|---|---|---|
| `components/content/*` + `lib/content.ts` + `dashboard/super-admin/cms` | **Non-coding content engine** — page/section/block builder, draft/publish/version/rollback | M9 |
| `dashboard/studio/xr/console` + `components/console/*` | **XR World Console** — single launch pad for all 5 modes | M10 |
| `dashboard/super-admin/audit` | audit-log viewer | M12 |
| `lib/ai/*` + agent specs | lightweight agent runtime (CEO step-loop + provider router), no LangGraph | M15 |
| `dashboard/super-admin/settings` (workstation pairing) | Hermes secure pairing + emergency stop + scope config | Hermes |
| `sitemap.ts`/`robots.ts`/`opengraph-image.tsx`/consent banner | SEO + analytics consent | M9/M13 |
| Route-level `loading/error/not-found` + `view/*` token links | resilience + public XR sharing | All |

## 5. Map to existing repo (extend, don't duplicate)

| Reference entry | Existing repo asset | Action |
|---|---|---|
| `lib/server/lib/r2.ts` | already present | reuse |
| upload (chunked/presigned) | `components/upload/*`, `app/api/assets/*` | reuse → `media/upload` |
| QA | `lib/qa/*`, `app/api/qa/*` | reuse → extend |
| deploy | `lib/server/repositories/deployment*` | reuse → gate |
| bookings/calendar/email | `lib/google-calendar.ts`, `lib/emails/*`, `app/api/bookings/*` | reuse |
| pixel streaming | `lib/pixel-streaming/*`, `app/(public)/stream/*`, admin panel | reuse → `view/stream/[token]` |
| configurator/viewers | `components/configurator/*`, `components/viewer/*`, `babylon_XR_World/` | reuse as template → `components/xr/*` |
| tour viewer | `.worktrees/feat-marzipano-tour-viewer` | merge → Marzipano (M0.3) |
| supabase client/server | `lib/supabase/*` | reuse → add server/middleware |

## 6. Removed from reference / why

- `api/auth/[...nextauth]`, `lib/auth.ts` NextAuth, `types/next-auth.d.ts`, `store/useAuthStore(NextAuth)` → **Supabase Auth**.
- `models/*.ts` (Mongoose) → **Prisma**.
- `lib/s3.ts`, `lib/email.ts` (Nodemailer) → R2 + Resend.
- `.env.example` → cleaned to our stack (no NextAuth/admin creds).

## 7. Open packaging decision

Keep the app as the **single repo root** (current state, lightest) and colocate agent-runtime artifacts under `lib/ai/` + `local/` for now; split a separate `agent-server`/`local-runner` only when Hermes/agents need independent deploy scale. Recommended: **stay single-app now** — matches the reference, keeps the repo fast and simple; revisit at M15.

*If you confirm single-app, this tree is the literal target layout for the repo; if you prefer monorepo, only the parent folder changes (`apps/web/…`), nothing inside.*