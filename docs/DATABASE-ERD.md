# VizTR — Database ERD (100 Models)

> **Status**: Planning-time contract. VizTR is 100% in the planning phase. The full 100-model Prisma schema is generated incrementally across ordered migrations; only the foundation subset exists at Phase 0/1 (Task 2). This document describes the intended domain organization and core relationships — no fabricated schema.

---

## 1. Schema Overview — 100 Models in 10 Domain Groups

| # | Domain Group | Representative Models | Purpose |
|---|--------------|----------------------|---------|
| 1 | **Core/Identity** | Organization, User, Client, Admin, Staff, Role, Permission, UserSession, Workspace, WorkspaceMember, api_key, Settings | Auth, tenants (orgs), RBAC, global site settings |
| 2 | **Projects** | Project, ProjectVersion, ProjectAsset, Milestone, ProjectSetting, ProjectConfig, ProjectTimeline, Deployment, qa_reports, qa_checks, Approval | Project lifecycle, QA gate, publish (§12/§27.3) |
| 3 | **Portfolio** | Portfolio, PortfolioImage, PortfolioCategory, Blog, BlogCategory, Faq, Testimonial, NavigationItem | Public showcase galleries + website content (blog, FAQ, testimonials, navigation) |
| 4 | **Services** | Service, ServiceCategory, ServicePricing, Booking, BookingSession, CalendarAvailability, ContactInquiry | Offerings + booking + public lead capture (§20) |
| 5 | **Commerce** | Order, Invoice, Payment, PaymentMethod, Subscription, Plan, UsageMeter, UsageMetric, MarketplaceListing, Payout | Billing, subscriptions, marketplace (§14/§27.8) |
| 6 | **Files** | File, FileVersion, FilePermission, MediaAsset, AssetMetadata, AssetVersion, AssetLod | Uploads + access control (§11) |
| 7 | **Messaging** | Message, Thread, Conversation, Notification, NotificationRule | Client ↔ studio comms (§6.6) |
| 8 | **Analytics** | Analytics, Metric, Report, AnalyticsEvent, Heatmap, UserSession, ToolUsageLog, SecurityEvent | Product + XR engagement (§15) |
| 9 | **XR** | Experience, ExperienceMode, Session, ViewerConfig, Scene, CameraSetting, LightingProfile, MaterialConfig, Interaction, Hotspot, Portal, CameraPath, FloorPlan, ModelOptimization, XrShareLink | XR engine config + interactions + public share links (§9/§13) |
| 10 | **Agents** | agents, agent_runs, agent_logs, agent_messages, agent_memory, tasks, website_pages, audit_log | Agent orchestration + Content-as-Code (§10) |

> Per-group model counts are planning estimates; the authoritative enumeration is the generated Prisma schema (migration `0001_init`). Domain naming follows §6.5/§27.4. `website_pages` and `agent_runs` are agent-operated tables (§6.5).

## 2. Core ERD — Foundation Models

```
┌────────────────────┐  org_id   ┌────────────────────┐
│    Organization     │ ────────► │        User        │
│  id PK · name       │           │  id PK · email     │
└─────────┬───────────┘           │  role · orgId FK   │
          │ 1:N                   └─────────┬──────────┘
          │                                │ 1:N (actor)
          ▼                                ▼
┌────────────────────┐           ┌────────────────────┐
│       Project      │           │     agent_runs     │
│  id PK · orgId FK  │           │  agent · status    │
│  status · qaPassed │           │  input/output Json │
│  approvedBy?       │           └────────────────────┘
└─────────┬──────────┘           ┌────────────────────┐
          │ 1:N (project_id)     │    website_pages   │
          ├───────────┬──────┐   │  slug PK · locale  │
          │           │      │   │  content · updated │
          ▼           ▼      ▼   └────────────────────┘
┌──────────────┐ ┌──────────────┐ ┌────────────────────┐
│  Milestone   │ │  qa_reports  │ │     audit_log      │
│ projectId FK │ │ projectId FK │ │  actor · action    │
│ status       │ │ passed · Json│ │  targetId · meta   │
│ approvedBy   │ └──────────────┘ └────────────────────┘
└──────────────┘ ┌──────────────┐
                 │project_asset │
                 │ projectId FK │
                 │ kind · bytes │
                 └──────────────┘
```

### 2.1 Relation Annotations

| Relation | Cardinality | Foreign Key | Semantics |
|----------|-------------|-------------|-----------|
| Organization → User | 1 : N | `User.orgId` → `Organization.id` | A user belongs to one org (nullable pre-tenant users) |
| Organization → Project | 1 : N | `Project.orgId` → `Organization.id` | Tenant scoping on every project row (RLS key) |
| Project → Milestone | 1 : N | `Milestone.projectId` → `Project.id` | Client-visible milestones with approval state (§8) |
| Project → qa_reports | 1 : N | `qa_reports.projectId` → `Project.id` | Automated QA report history (§12); flips `Project.qaPassed` |
| Project → project_asset | 1 : N | `project_asset.projectId` → `Project.id` | Uploads (GLB/panorama/video) per project (§11) |
| User → agent_runs | 1 : N | `agent_runs.actor` → `User.id` | Every agent run persisted for audit/budgeting (§10.7) |
| User → website_pages | 1 : N | `website_pages.updatedBy` → `User.id` | Content-as-Code authorship + approval trail (§10.9) |
| User → audit_log | 1 : N | `audit_log.actor` → `User.id` | Immutable audit trail for sensitive operations (§18) |

### 2.2 Foundation Naming Note

The foundation subset (Phase 0/1 Task 2) models three agent-operated tables in lowercase snake_case — `model qa_reports`, `model agent_runs`, `model website_pages` — matching their agent/DB-facing usage (§6.5). PascalCase models (`Organization`, `User`, `Project`, `Milestone`, `ProjectAsset`) follow standard Prisma naming; later migrations preserve the snake_case table names for these three.

### 2.3 Public Website & Lead-Capture Models

Added in migration `0008_website` (Phase 0/1 Task 2). These public-facing content, settings, lead-capture, and share-link tables are **not tenant-scoped**; RLS allows anonymous reads (public content), anonymous inserts (contact form), or authenticated/service-role access (settings, share links).

| Model | Fields | RLS |
|-------|--------|-----|
| `ContactInquiry` | name, email, company?, projectType?, budget?, message, status | anonymous INSERT (public contact form); reads via service role |
| `Settings` | key (PK), value (Json), label, type, group | authenticated (staff/admin) read/write |
| `Faq` | question, answer, category?, order | public SELECT |
| `Blog` | title, slug (unique), excerpt, content (MDX), coverImage?, readTime, publishedAt?, featured, tags, category?, author? | public SELECT |
| `BlogCategory` | name, slug (unique) | public SELECT |
| `Testimonial` | clientName, quote, rating, projectLink?, logo? | public SELECT |
| `NavigationItem` | label, href, order, parentId?, placement (header/footer) | public SELECT |
| `XrShareLink` | projectId, mode, accessType (PUBLIC\|PASSWORD\|TOKEN), passwordHash?, token (unique), expiry?, viewCount, revoked, createdBy? | public SELECT on non-revoked, unexpired PUBLIC links; PASSWORD/TOKEN verified app-side |

**Booking (Services §20) extended for public lead capture:** `Booking` gains `clientName`, `clientEmail`, `service`, `date`, `time`, `message`, `status` (enum `BookingStatus`: PENDING/CONFIRMED/COMPLETED/CANCELLED) so the same table serves both scheduling and public booking/lead forms.

## 3. Migration Numbering Convention

Migrations are ordered prefixes under `packages/database/prisma/migrations/`, applied via `prisma migrate dev` locally and `prisma migrate deploy` in CI (Phase 6 Task 5):

| Prefix | Content |
|--------|---------|
| `0001_init` | Foundation schema (orgs, users, projects, agent tables) |
| `0002_rbac` | RLS policies + role/guard infrastructure |
| `0003_projects` | Versions, assets, milestones, QA tables |
| `0004_xr` | Experience, ViewerConfig, interactions, scenes |
| `0005_billing` | Subscription, Plan, UsageMeter, invoices |
| `0006_marketplace` | Listings, payouts, licenses |
| `0007_analytics` | Events, metrics, reports, heatmaps |
| `0008_website` | Public website content (Blog, BlogCategory, Faq, Testimonial, NavigationItem), Settings, ContactInquiry, XrShareLink + Booking lead-capture fields, with RLS policies |

## 4. RLS & Connection Strategy

- **RLS on ALL tenant tables**: every tenant-owned table carries `org_id`; Postgres RLS enforces isolation via `auth.jwt() ->> 'org_id' = org_id` (Phase 0/1 Task 10, §27.7). The service-role key bypasses RLS but is server-side only.
- **Pooler vs direct (Prisma datasource)**: `url` = Supabase **PgBouncer pooler** connection string (transaction mode) for app runtime; `directUrl` = direct Postgres URL used **only** by `prisma migrate`/Studio (avoids pooler DDL issues). Phase 0 uses `url = env("DATABASE_URL")`; Phase 6 wires the pooler + `directUrl` values (Phase 0/1 Task 2 note).
