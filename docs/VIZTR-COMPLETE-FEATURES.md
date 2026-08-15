# VizTR Platform — Complete Feature Architecture Document

**Version**: 1.7.0 | **Date**: August 5, 2026 | **Status**: Living Document (editable)
**Owner**: VizTR Architecture Team | **Role View**: Senior Full-Stack Engineer, UI/UX Designer, CMS Architect, SEO Specialist, Lead Software Architect

> **Purpose of this document**: This is the single source of truth for the entire VizTR concept, strategy, and feature set. It is intentionally structured for future editing — new features, enhancements, and roadmap items are appended to the relevant sections. Every feature below is traceable to an implementation spec in `Dev_Docs/specs/`.

---

## Table of Contents

1. [Vision & Strategy](#1-vision--strategy)
2. [Platform Architecture Overview](#2-platform-architecture-overview)
3. [Product Roles & Experiences](#3-product-roles--experiences)
4. [Feature Domain 01 — Public Marketing Website](#4-feature-domain-01--public-marketing-website)
5. [Feature Domain 02 — Frontend Applications](#5-feature-domain-02--frontend-applications)
6. [Feature Domain 03 — Backend, API & CMS](#6-feature-domain-03--backend-api--cms)
7. [Feature Domain 04 — Admin Dashboard & User Dashboards](#7-feature-domain-04--admin-dashboard--user-dashboards)
8. [Feature Domain 05 — Client Portal](#8-feature-domain-05--client-portal)
9. [Feature Domain 06 — XR Technology & Viewers](#9-feature-domain-06--xr-technology--viewers)
10. [Feature Domain 07 — AI Agent System](#10-feature-domain-07--ai-agent-system)
11. [Feature Domain 08 — Asset Management & Processing](#11-feature-domain-08--asset-management--processing)
12. [Feature Domain 09 — Quality Assurance & Publishing](#12-feature-domain-09--quality-assurance--publishing)
13. [Feature Domain 10 — 3D Interaction Editor](#13-feature-domain-10--3d-interaction-editor)
14. [Feature Domain 11 — Billing, Subscriptions & Monetization](#14-feature-domain-11--billing-subscriptions--monetization)
15. [Feature Domain 12 — Analytics & Observability](#15-feature-domain-12--analytics--observability)
16. [Feature Domain 13 — SEO & Growth](#16-feature-domain-13--seo--growth)
17. [Feature Domain 14 — Design System & UX](#17-feature-domain-14--design-system--ux)
18. [Feature Domain 15 — Security, Compliance & Governance](#18-feature-domain-15--security-compliance--governance)
19. [Feature Domain 16 — Accessibility & Internationalization](#19-feature-domain-16--accessibility--internationalization)
20. [Feature Domain 17 — Forms, Bookings & Communication](#20-feature-domain-17--forms-bookings--communication)
21. [Technology Stack Matrix](#21-technology-stack-matrix)
22. [Performance Targets](#22-performance-targets)
23. [Scalability Model](#23-scalability-model)
24. [Development Roadmap](#24-development-roadmap)
25. [Feature Status Tracker](#25-feature-status-tracker)
26. [Appendix — Spec References](#26-appendix--spec-references)
27. [SaaS Platform — Technical Description & Requirements](#27-saas-platform--technical-description--requirements)
28. [Comprehensive Implementation Plan](#28-comprehensive-implementation-plan)

---

## 1. Vision & Strategy

### 1.1 Core Vision
**VizTR (Visual Tech Reality)** is a hybrid Architectural Visualization Studio + XR SaaS platform that converts 3D architectural models into 5 interactive web experiences (WebXR, WebAR, VR, Virtual Tour, Pixel Streaming) with local GPU workstation control, automated QA, and one-click publish workflow.

### 1.2 Core Promise
> **Upload once → Generate everywhere → Connect locally → QA automatically → Publish after approval.**

### 1.3 Primary Goal
Generate high-value leads, showcase premium services, and enable client project interaction with immersive technologies.

### 1.4 Target Audience
Real estate developers, architects, interior designers, 3D studios, luxury property marketers, and enterprise clients.

### 1.5 Brand Tone & Style
Ultra-modern, luxury, futuristic, high-tech, cinematic, minimal dark UI with premium visual storytelling.

### 1.6 Success Metrics (KPIs)
| KPI | Target |
|-----|--------|
| Lead conversion rate | ≥ 5% of site visitors |
| Time to first interactive XR demo | ≤ 3 min from project creation |
| Client approval cycle | Reduced by 60% vs. traditional renders |
| Lighthouse scores | ≥ 90 all categories |
| API p95 response | < 200ms |
| 3D scene init | < 2s desktop, < 3s mobile |

---

## 2. Platform Architecture Overview

### 2.1 System Topology (17 Repositories — Monorepo)
```
viztr-platform/                          # Single Monorepo (pnpm + Turborepo)
├── apps/                                # 6 Deployable Applications
│   ├── web/                             # Next.js 15/16 Public Website (Vercel)
│   ├── xr/                              # Next.js XR Engine — xr.viztr.com (Babylon.js/WebXR) (≈ spec "xr-runner")
│   ├── dashboard/                       # Next.js 15/16 Dashboard (Vercel)
│   ├── agent-server/                    # Node.js 20 API + MCP Server (Railway) (≈ spec "agent-api")
│   ├── local-runner/                    # Hermes Local Agent (Binary/Node)
│   └── pixel-streaming-web/             # WebRTC Stream Client (Vercel)
│
├── packages/                            # 12+ Shared Packages
│   ├── shared-types/                    # All TS interfaces + Zod schemas
│   ├── shared-ui/                       # shadcn/ui + VizTR components
│   ├── shared-utils/                    # Helpers, API client, formatters
│   ├── agents/                          # 13 Agent implementations
│   ├── mcp/                             # MCP Connector + 30+ tools
│   ├── tools/                           # Shared agent tool functions (≈ spec "tools")
│   ├── experience-engine/               # Core + 5 XR mode engines
│   ├── asset-pipeline/                  # GLB optimization (Draco, KTX2, Meshopt)
│   ├── blender-scripts/                 # Blender headless Python scripts
│   ├── unreal-config/                   # UE5 Pixel Streaming config
│   ├── design-tokens/                   # Colors, typography, spacing (JSON)
│   ├── testing-utils/                   # Test factories, mocks, fixtures
│   └── analytics/                       # Event tracking, heatmaps
│
├── infra/                               # Infrastructure as Code
│   ├── supabase/                        # Migrations, RLS, seeds, pgvector
│   ├── hostinger/                       # VPS config (PostgreSQL, Redis, MinIO, Nginx)
│   └── ci-cd/                           # GitHub Actions workflows
│
├── pipelines/                           # Headless processing pipelines
│   ├── blender/                         # Blender headless cleanup/export scripts
│   ├── gltf/                            # gltf-transform / Draco / Meshopt / KTX2
│   ├── texture/                         # Texture resize/compress/convert
│   └── unreal/                          # UE5 Pixel Streaming build/run config
│
├── local/                               # Local workstation (heavy production machine)
│   ├── hermes-agent/                    # Hermes Agent local runner config
│   ├── unreal/                          # Unreal projects + Pixel Streaming sessions
│   ├── signaling-server/                # Node.js Pixel Streaming signaling server
│   ├── tunnel-config/                   # Cloudflare Tunnel configs
│   └── qa-scripts/                      # Local QA/validation scripts
│
├── prompts/                             # Agent system prompts
│   ├── ceo-agent.md
│   ├── hermes-agent.md
│   ├── webxr-agent.md
│   ├── webar-agent.md
│   ├── vr-agent.md
│   ├── virtual-tour-agent.md
│   ├── pixel-streaming-agent.md
│   ├── website-developer-agent.md
│   └── internal-agents/                 # sales, support, design, finance, analytics, qa
│
├── content/                             # Website content (Content-as-Code)
│   ├── pages/                           # MDX: home, services, portfolio, about, contact
│   ├── portfolio/                       # MDX: project case studies + XR embeds
│   └── blog/                            # MDX: articles
│
└── docs/                                # All documentation
    ├── specs/                           # 6 spec documents
    ├── ai-ready/                        # Machine-readable specs for agents
    ├── sop/                             # SOP knowledge base (see §10.8 Architecture Intelligence)
    ├── architecture/                    # System architecture notes
    ├── pricing/                         # Pricing + proposal templates
    └── client-onboarding/               # Client intake, briefs, onboarding scripts
```

### 2.2 Data Flow
```
User → Web/Dashboard → API → Agent Server (MCP) → Agents
                                      ↓
                               Supabase (PostgreSQL + pgvector)
                                      ↓
                               Assets → Cloudflare R2
                                      ↓
                               Local Workstation (Hermes) ←→ Cloudflare Tunnel
                                      ↓
                               Vercel Deployment → Production
```

### 2.3 Platform Layering Model
| Layer | Contains |
|-------|----------|
| **Experience Layer** | Web, Dashboard, Client Portal, Pixel Streaming Client |
| **Intelligence Layer** | CEO Agent, 5 Service Agents, 7 Internal Agents, MCP Server |
| **Service Layer** | Agent Server API, Queue System, Notification Service, Audit Service |
| **Data Layer** | PostgreSQL, Redis, MinIO/R2, pgvector embeddings |
| **Infrastructure Layer** | Vercel, Railway, Hostinger VPS, Cloudflare, Docker/K8s |

---

## 3. Product Roles & Experiences

> **Requirements (SaaS)**: RBAC must be enforced server-side (Supabase RLS) and drive all UI gates, route guards, and API authorization. Full role matrix in §27.7.

### 3.1 Role Model
| Role | Access Level | Primary Surfaces |
|------|-------------|------------------|
| **Super Admin** | Full system access | Admin Dashboard, System Settings, Audit Logs |
| **Admin** | All workspaces, user management | Admin Dashboard, Project Management |
| **User (Studio Staff)** | Assigned projects, tooling | User Dashboard, Interaction Editor, Asset Pipeline |
| **Client** | Own projects, deliverables, approvals | Client Portal |
| **Public** | Marketing website, demos, booking | Web |

### 3.2 Permission Model (RBAC)
Permission system covering: `projects:*`, `assets:*`, `scenes:*`, `interactions:*`, `qa:*`, `deployments:*`, `analytics:*`, `agents:*`, `billing:*`, `team:*`, `admin:*`.

- **super_admin**: `['*']` — all permissions
- **admin**: full CRUD on projects/assets/scenes/interactions/qa/deployments/analytics/billing/team + admin:users/agents/settings/audit + approve publish
- **user**: read/update on assigned projects; upload assets; read assigned scenes/interactions/qa/deployments/analytics
- **client**: view own projects; upload assets; approve deliverables **and milestones**; manage own approvals/messages/bookings
- **public**: marketing website + **Public Dashboard** (anonymous read-only demo hub, §7.6); no system permissions

**Role access matrix**:
| Role | Projects | Assets | QA / Publish | Billing | Public Dashboard |
|------|----------|--------|--------------|---------|------------------|
| **Super Admin** | Full | Full | Full | Full | View |
| **Admin** | Manage | Manage | Approve publish | Full | View |
| **User (Staff)** | Assigned tasks | Upload / assigned | View QA | — | View |
| **Client** | View + upload assets | View / upload | Approve milestones | View invoices | — |
| **Public** | — | — | — | — | Read-only demo hub (§7.6) |

---

## 4. Feature Domain 01 — Public Marketing Website

> **Requirements (SaaS)**: Public pages are marketing + lead-gen: SSR/SSG for SEO, 3D hero (lightweight Babylon.js, §17.8), service pages, AI Brief form → project creation. Public access map in §27.7; endpoint map in §27.6.

> *Owner role: Senior Full-Stack Website Builder + SEO Specialist*

### 4.1 Homepage Sections (Intelligent Ordering — Auto-Adaptive)
| # | Section | Description | Notes |
|---|---------|-------------|-------|
| 1 | **Hero** | Cinematic 3D architectural shell (Babylon.js hero scene, §17.8), bold headline, primary CTA "Launch Command Center" | Eyebrow "VIZTR INTELLIGENCE OS"; overlay "Live Experience Engine"; secondary CTA "View XR Services" |
| 2 | **Dual Positioning** | (A) Architectural Visualization Services, (B) XR Technology | Two-column split narrative |
| 3 | **Services Showcase** | Exterior Rendering, Interior Visualisation, Walkthrough/Cinematic Animation, Virtual Reality, Virtual Tour, WebXR/WebAR, Pixel Streaming | Categorized cards; ServiceMatrix 6-card grid (WebXR, WebAR, VR, Virtual Tour, Pixel Streaming, Architecture Viz) |
| 4 | **Interactive Demo** | "Tap to Experience" XR preview + Pixel Streaming live demo CTA | No account required |
| 5 | **Command Center** | Glass panel introducing the AI-agent operation: "Manage VizTR like an AI-operated company" | CEO Agent + 12 agents orchestration teaser, CTA → dashboards |
| 6 | **Benefits** | No hardware required, real-time interaction, faster client approvals, premium presentation quality | Outcome-focused, not feature-focused |
| 7 | **Visual Storytelling** | Project transformation, before/after, immersive previews | Cinematic storytelling blocks |
| 8 | **Showreel / Portfolio** | Video previews, project categories, filterable grid | 3D thumbnails with hover rotation |
| 9 | **Client Experience** | Client Dashboard preview with project tracking | Shows product value |
| 10 | **Testimonials / Case Studies** | Social proof, quantified results | Includes client logos |
| 11 | **Trust Indicators** | Stats counters, client logos, project counts, uptime | Animated counters |
| 12 | **FAQ** | 8+ accordion items per page | Schema.org FAQ markup |
| 13 | **CTA Section** | Book consultation / request demo | Persistent conversion path |
| 14 | **Footer** | Navigation, contact, social links, legal pages | Newsletter signup |
| 15 | **XR World** | 4 product cards in a 2×2 grid, each with its own brand color: Virtual Tour (cyan), WebAR (green), Virtual Reality (violet), WebXR (amber) | Product showcase; cards link to the `/xr/*` pages (§4.2); colors from the `product.*` tokens (§17.7); position configurable via section-ordering editor (§17.4) |

**Auto-adaptive ordering mechanism**: The default order above is the base sequence. Sections reorder at runtime based on:
- **Audience segment** — first-time visitor (Demo-first) vs. returning lead (Case-study + CTA first) vs. enterprise (Trust indicators + case studies promoted)
- **Device** — mobile shortens/compresses non-essential sections (reorders FAQ higher if scroll depth signals interest)
- **Lead stage** — lead with saved AI Brief → Benefits + CTA promoted; booked consultation → Case Studies + Testimonials promoted
- **CMS control** — admin can toggle/customize the priority of any section via the section-ordering editor (§17.4); A/B variants supported

### 4.2 Required Pages (Auto-Generated via CMS)
| Page | Route | Key Content |
|------|-------|-------------|
| Home | `/` | 3D Hero, services, portfolio preview, stats, CTA |
| About | `/about` | Company story, vision & mission, team introduction |
| Team | `/team` | Company team (nav "Studio" dropdown target) |
| Careers | `/careers` | Job openings, culture, perks (nav "Studio" dropdown target) |
| Services | `/services` | All service categories + detail pages |
| — Exterior Rendering | `/services/exterior-rendering` | Detail + demo + pricing + FAQ |
| — Interior Visualisation | `/services/interior-visualisation` | Detail + demo + pricing + FAQ |
| — Walkthrough/Animation | `/services/walkthrough` | Detail + demo + pricing + FAQ |
| — Virtual Reality | `/services/vr` | Detail + demo + pricing + FAQ |
| — Virtual Tour | `/services/virtual-tour` | Detail + demo + pricing + FAQ |
| — WebXR / WebAR | `/services/webxr-webar` | Detail + interactive demo + FAQ |
| — Pixel Streaming | `/services/pixel-streaming` | Detail + live cloud GPU demo |
| XR World (Hub) | `/xr` | Hub for the 5 XR product pages — alias/extension of the `/services/xr` detail pages |
| — XR Virtual Tour | `/xr/virtual-tour` | Product page — alias of `/services/virtual-tour` (demo, pricing, FAQ) |
| — XR WebAR | `/xr/webar` | Product page — alias of `/services/webxr-webar` (live AR demo, QR preview) |
| — XR Virtual Reality | `/xr/virtual-reality` | Product page — alias of `/services/vr` (VR demo, headset support) |
| — XR WebXR | `/xr/webxr` | Product page — alias of `/services/webxr-webar` (interactive demo) |
| — XR Pixel Streaming | `/xr/pixel-streaming` | Product page — alias of `/services/pixel-streaming` (live cloud GPU demo) |
| Showreel / Portfolio | `/portfolio` | Categorized projects, video previews, case studies |
| Case Study | `/portfolio/[slug]` | Challenge/Solution/Results + testimonial |
| Blog / Insights | `/blog` | Featured-post hero, category filter, search; articles on architecture, XR, technology |
| — Blog Category | `/blog/category/[slug]` | Category-filtered article listing |
| Blog Post | `/blog/[slug]` | MDX content, SEO metadata, related posts |
| Contact | `/contact` | Inquiry form, business details, map |
| Book Consultation | `/book-consultation` | Service selection, schedule meeting, form |
| Client Access | `/client-access` | Login via Project ID and Password |
| Pricing | `/pricing` | 4 tiers, monthly/yearly toggle, usage calculator |
| AI Brief | `/ai-brief` | Multi-step lead capture form with AI analysis |
| Privacy Policy | `/privacy-policy` | Legal, editable via CMS |
| Terms & Conditions | `/terms` | Legal, editable via CMS |
| XR Labs (Coming Soon) | `/labs` | Under-development features (Spatial AI showcase, XR demos) labeled "Coming Soon" — teaser, not a live tool |

> **Breadcrumbs on inner pages**: All inner pages (services, `/xr/*`, portfolio, blog) render a breadcrumb trail (e.g. `Home › XR World › Virtual Tour`) with `BreadcrumbList` JSON-LD markup (§16.1) for navigation and SEO.

### 4.3 Marketing Conversion Features
- **AI Brief Form** (4-step): Project basics → Details → Assets → Contact & AI Processing → returns concept renders, timeline estimate, budget range, suggested deliverables → auto-creates draft project
- **Pricing Calculator**: Real-time cost estimation via sliders (projects, storage, GPU hours)
- **Waitlist Capture**: Email collection for early access
- **Newsletter Signup**: Footer + dedicated sections
- **Live Demo**: Embedded WebXR viewer, AR QR code preview, Pixel Streaming demo badge — "View in 3D/VR" CTAs route to the decoupled engine via the URL bridge (`xr.viztr.com/view?project=ID&mode=tour|vr|ar`)

### 4.4 Under-Development Features (Public "Coming Soon")
- **Rule**: Under-development features appear publicly as **"Coming Soon"** teasers (e.g. `/labs`), never as live tools.
- **Spatial AI Showcase** (see §10.6) — teaser with before/after slider, render-time chart, pipeline diagram; labeled "Coming Soon".
- **XR Demos / Viewer previews** — placeholder CTAs funnel to waitlist while under development.

### 4.5 SEO & On-Page Optimization
- **Per-page meta controls**: title, description, keywords, canonical URL
- **Schema markup**: `Service`, `Organization`, `FAQPage`, `Article`, `PortfolioItem`, `Review`, `BreadcrumbList`
- **Clean URL structure**: descriptive slugs, hierarchical paths
- **Sitemap generation**: `sitemap.xml` auto-generated, robots.txt
- **Open Graph + Twitter Cards**: rich social previews
- **Structured data validation**: Schema.org validator pass
- **Core Web Vitals optimization**: LCP < 2.5s, CLS < 0.1, TTI < 3.5s
- **Analytics-ready**: Google Analytics / Plausible / tracking pixel support
- **SSR/SSG**: Server components + static generation for marketing pages
- **Image optimization**: Next.js Image, AVIF/WebP, responsive srcset

---

## 5. Feature Domain 02 — Frontend Applications

> **Requirements (SaaS)**: Three apps (web/dashboard/client-portal) share one design system and theme provider (next-themes); route maps and per-app performance budgets in §27.2/§27.9.

### 5.1 App 1: `web` — Next.js 15/16 Public Website
- **Framework**: Next.js 15.2 (App Router, Server Components) — **target Next.js 16 on release (spec baseline)**; TypeScript 5.3 strict
- **Styling**: Tailwind CSS 3.4 + shadcn/ui + design-tokens
- **3D**: Babylon.js 8+ (Editor + Next.js template — core engine, §21.5)
- **Animations**: Framer Motion 11
- **Forms**: React Hook Form 7.51 + Zod 3.23
- **Deployment**: Vercel Edge Network

### 5.2 App 2: `dashboard` — Next.js 15/16 Dashboard
- **Framework**: Next.js 15/16 (App Router), React 18.3, TypeScript 5.3 strict (single framework for web + dashboard + xr, §21.1)
- **State**: Zustand 4.5 + TanStack Query 5.56
- **Routing**: Next.js App Router (file-based routing)
- **Charts**: Recharts 2.12
- **Deployment**: Vercel → dashboard.viztr.io

### 5.3 Dashboard Route Map (25+ Pages)
| Area | Pages |
|------|-------|
| **Auth** | Login, Signup, MagicLink, Callback |
| **Dashboard Home** | Overview: stats, recent projects, quick actions |
| **Projects** | List, Detail (Overview/Assets/Scenes/Interactions/QA/Deployments/Analytics/Settings/Team tabs), Kanban, Timeline |
| **Assets** | Global library, upload, viewer, metadata editor |
| **Analytics** | Charts, heatmaps, conversion funnel, viewer analytics |
| **Team** | Member management, invites, roles |
| **Billing** | Subscription, usage, invoices, payment methods |
| **Settings** | Profile, notifications, API keys, MFA |
| **Command Center** | Agent chat, Kanban, agent status grid, logs, approval queue |
| **Agent Dashboard** | Per-agent status, last run, task queue, health, cost |
| **Project Dashboard** | Dedicated project workspace (overview, boards, deliverables, QA status) |
| **XR Service Dashboard** | Per-service studio workflows — WebXR, WebAR, VR, Virtual Tour, Pixel Streaming (see §7.7) |
| **Pixel Streaming Dashboard** | Stream management, FPS/latency/bitrate, GPU, tunnel status |
| **Website Content Dashboard** | CMS page/content editing, section ordering, publish state |
| **Website Content CMS** | Tabbed surface: Pages, Services, Blog Posts, Testimonials, Media Library, Navigation, FAQ, Settings; theme customization (primary color picker, font selector, live preview) |
| **Finance Dashboard** | Estimates, invoices, revenue, GPU billing, ROI |
| **Client Portal** | Dashboard, project view, deliverables, invoices, bookings |
| **Admin** | System dashboard, user management, agent monitoring, system settings, audit logs |

### 5.4 Frontend Performance Budgets
| Metric | Budget |
|--------|--------|
| Initial JS | < 200 KB gzipped |
| Total CSS | < 50 KB gzipped |
| Font Load | < 100 KB (variable fonts) |
| 3D Scene Init | < 2s desktop, < 3s mobile |
| API Response | < 200ms p95 |
| FCP | < 1.8s |
| LCP | < 2.5s |
| TBT | < 200ms |
| CLS | < 0.1 |
| Page load (public pages) | < 10s |
| TTI | < 3.5s |

### 5.5 Responsive Breakpoints
| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| sm | 640px | Sidebar → drawer, cards stack |
| md | 768px | 2-col grids, sidebar visible |
| lg | 1024px | 3-col grids, full sidebar |
| xl | 1280px | 4-col portfolio |
| 2xl | 1536px | Full-width, spacious |

---

## 6. Feature Domain 03 — Backend, API & CMS

> **Requirements (SaaS)**: MVP runs on Next.js API Routes + Supabase (no separate backend first — §24.2). Full backend logic, connectivity, and API surface in §27.3/§27.5/§27.6.

> *Owner role: CMS Architect*

### 6.1 API Gateway (`agent-server`)
- **Runtime**: Node.js 20 LTS, Fastify 4.28
- **Database**: Supabase (PostgreSQL 15+) via `@supabase/supabase-js`
- **Queue**: BullMQ 5.15 + Redis
- **Auth**: Supabase Auth JWT verification
- **WebSockets**: Socket.io 4.7 (real-time updates)
- **Serverless**: Supabase Edge Functions for auth hooks, webhooks, and lightweight compute (asset upload hooks, agent-run callbacks)
- **Deployment**: Railway (auto-scale)

> **⚠️ Backend decision (reconciled)**: **MVP uses Next.js API Routes + Supabase only — do NOT build a separate backend first.** The `agent-server` (Node/Fastify, this section) and any GraphQL layer are the **post-MVP** API (Phase 2+ / when agent scale demands it). Optional later: FastAPI (Python) + Docker for heavy processing. See §24.2 MVP scope.

### 6.2 API Route Map (115+ Endpoints)
| Domain | Routes | Purpose |
|--------|--------|---------|
| **public/** | portfolio, services, contact, bookings, ai-brief, waitlist | 25+ marketing endpoints |
| **admin/** | users, projects, analytics, finances, agents, settings, audit | 45+ management endpoints |
| **client/** | projects, files, messages, billing, approvals, bookings | 30+ client endpoints |
| **internal/** | webhooks, jobs, services, pixel-streaming | 15+ service endpoints |
| **auth/** | login, signup, magic-link, OAuth, refresh | Auth flows |
| **api/** | projects, assets, scenes, interactions, qa, deployments, agents, analytics, billing | REST + GraphQL |

**XR engine route — `/api/project/[id]`** (serves the XR engine scene config):
- `GET /api/project/[id]` → returns `{ model: "/models/villa.glb", hotspots: [{ id, position, action, target }], annotations: [{ id, position, text }] }`
- Consumed by `SceneManager` on `xr.viztr.com/view?project=ID`
- Also honors `?mode=tour|vr|ar` to return mode-specific config

### 6.3 GraphQL Layer
- Apollo Server over Express
- Type-first schema generated from shared-types
- Resolvers delegating to service layer
- Complex queries: dashboards, analytics rollups, cross-entity fetches

### 6.4 CMS Architecture (Headless + Admin-Editable)
> **Key differentiator**: Full content editing for non-technical staff.

#### CMS Collections
| Collection | Fields (Core) | Editable By |
|------------|---------------|-------------|
| **Users** | name, email, role, avatar, status | Super Admin/Admin |
| **Projects** | name, client, service types, status, budget, deadline, settings | Admin/User |
| **Clients** | contact, company, project history, portal credentials | Admin |
| **Services** | name, slug, description, pricing, icon, gallery, SEO | Admin/User |
| **Blog Posts** | title, slug, content (MDX), featured image, excerpt, readTime, category, featured (boolean), publishedAt, tags, author, SEO | Admin/User |
| **Blog Categories** | name, slug, description, order | Admin |
| **Testimonials** | client name, quote, rating, project link, logo | Admin |
| **Contact Inquiries** | name, email, company, projectType, budget, message, status | Admin |
| **Media Assets** | file, type, alt, caption, usage count | Admin/User |
| **Pages** | slug, sections, layout config, SEO | Super Admin/Admin |
| **Bookings** | service, date, time, clientName, clientEmail, message, status (enum) | Admin/User |
| **Team Members** | name, role, bio, photo, socials | Admin |
| **Site Settings** | key, value (JSON), label, type, group | Super Admin/Admin |
| **FAQ** | question, answer, category, order | Admin |
| **Navigation** | label, href, order, parentId, placement (header/footer) | Super Admin/Admin |

#### CMS Features
- **Create / edit / delete**: Pages, Blog posts, Services, Projects, Testimonials
- **Media manager**: Upload, organize, replace, optimize all media
- **SEO metadata control**: Per-page meta title, description, keywords, OG tags
- **Slug and URL management**: Custom slugs, redirect handling
- **Draft / publish workflow**: Draft → Review → Publish, scheduled publishing
- **Theme customization**: Colors, fonts, layout (admin-level)
- **Section toggling**: Enable/disable homepage sections
- **Navigation/menu editor**: Build and reorder menus; menus persisted as `navigation.header` / `navigation.footer` JSON keys in the Site Settings store (NavigationItem model, §6.5)
- **Version history**: Rollback any CMS content change

### 6.5 Database Schema (100 Models / 25 Migrations)
Core entity groups:
- **Identity**: users, roles, MFA, sessions, workspaces, workspace_members, api_keys
- **Projects**: projects, project_settings, project_configs, project_timelines
- **Assets**: assets, asset_metadata, asset_versions, asset_lods
- **Scenes**: scenes, camera_settings, lighting_profiles, material_configs
- **Interactions**: interactions, hotspots, portals, camera_paths, floor_plans
- **Agents**: agents, agent_runs, agent_logs, tasks, agent_messages, agent_memory
- **QA**: qa_reports, qa_checks, qa_issues, approvals
- **Deployments**: deployments, deployment_versions, local_sync, tunnels, xr_share_links
- **Financials**: invoices, expenses, usage_metrics, subscriptions, payment_methods
- **Analytics**: events, heatmaps, sessions, reports
- **Communications**: conversations, messages, notifications, threads
- **Bookings**: bookings, booking_sessions, calendar_availability
- **CMS**: pages, sections, blogs, blog_categories, services, testimonials, media, navigation, faq, site_settings, contact_inquiries
- **Enterprise**: sso_configs, tenants, white_label_configs
- **Audit**: audit_logs, tool_usage_logs, security_events
- **Embeddings**: pgvector store for agent RAG memory

**Field-level specs (agent-operated tables)**:
```sql
-- Projects
id, client_id, name, service_type, status, budget, deadline, progress, created_at, updated_at

-- Tasks
id, project_id, assigned_agent, title, description, status, priority, due_date, output_url, created_at, completed_at

-- Agent Runs
id, task_id, agent_name, input, output, status, cost, created_at

-- Website Pages
id, slug, title, content, seo_title, seo_description, status, created_by_agent, approved_by, published_at
```

### 6.6 Real-Time Features
- **WebSocket channels**: project updates, agent status, QA progress, deployment logs, notifications
- **Live asset upload progress**: WebSocket + upload queue events
- **Real-time chat**: between client and studio staff

---

## 7. Feature Domain 04 — Admin Dashboard & User Dashboards

> **Requirements (SaaS)**: Dashboard surfaces (Super Admin, Admin, Staff, Command Center, Public, XR Service) map to RBAC scopes; project-management workflows in §27.3.

### 7.1 Super Admin Panel
> Status tags: ✅ **built** = surfaced in a Phase 2 dashboard; 📝 **spec-only** = specified but not yet built into a dashboard surface.

- **Admin & user management**: create, disable, role assignment, impersonation — ✅ built (create/disable/roles); impersonation 📝 spec-only
- **User invite + active/disable status toggle**: invite users by email; toggle accounts active/disabled — ✅ built (Phase 2 Task 11b)
- **Overview / analytics dashboard**: platform-wide adoption, retention, feature-adoption metrics — 📝 spec-only (Analytics Dashboard, §5.3)
- **Project move/transfer between orgs**: reassign a project to another workspace, with full audit trail — 📝 spec-only
- **System analytics**: platform-wide metrics, adoption, retention — ✅ built
- **Revenue dashboard**: MRR, ARR, churn, payment history, refunds — ✅ built (Finance Dashboard, §5.3)
- **GPU monitor dashboard**: Pixel Streaming session costs, GPU hours per workspace, live GPU utilization — ✅ built (Pixel Streaming Dashboard, §5.3/§7.7)
- **Feature toggles**: global and per-workspace feature flags — ✅ built
- **System settings**: tier limits, pricing overrides, maintenance mode — 📝 spec-only (Settings surface)
- **Audit log browser**: searchable, filterable, exportable — ✅ built (Phase 2 Task 11b)
- **Agent governance**: emergency stop, per-agent budgets, approval overrides — ✅ built (Command Center, §7.4)

### 7.2 Admin Panel
- **Project management**: full CRUD across all workspaces
- **Assign projects** to users/teams
- **Upload assets** on behalf of clients
- **Monitor client activity**: sessions, logins, engagement
- **Content management**: blog, services, pages, testimonials via CMS
- **Booking management**: approve/reject/auto-confirm bookings
- **Analytics overview**: pipeline, revenue, usage dashboards
- **Overview dashboard**: pipeline, revenue, usage summary at a glance
- **Orders management**: order lifecycle, fulfillment status, invoices
- **Clients page**: client list, contact details, project history, portal access
- **Team page**: staff list, roles, invites, active status
- **Files/media browser**: browse, search, organize all uploaded media
- **AI/agent monitoring surface**: agent runs, costs, health per workspace

### 7.3 User (Studio Staff) Dashboard
- **Create and manage projects**: lifecycle from draft to published
- **Upload models and assets**: drag-drop, validation, optimization status
- **Generate WebXR / AR / VR / Tour links**: one-click preview generation
- **Manage Pixel Streaming demos**: start/stop streams, quality, viewer count
- **Interaction editor access**: hotspots, materials, camera paths, floor plans
- **Run QA**: trigger automated checks, review reports, resolve issues
- **Publish workflow**: preview → approve → production
- **Agent task assignment**: delegate work to agents via Command Center
- **XR Builder workspace**: 3D canvas (Babylon.js) for scene assembly + live preview (§13 viewport pattern)
- **XR Link Generator**: create per-mode share links (public/password/token) with expiry, per-link view counts, revoke — backed by `XrShareLink` (§6.5/§9.13)
- **Pixel Streaming Control**: start/stop streams, live latency/GPU/cost monitoring (§9.6)
- **Review Viewport**: pin markers + comments on rendered images, load/save pin sets, share link, visibility toggle for client feedback (§12 QA note)

### 7.4 Command Center (Agent Collaboration)
- Natural language commands to agents
- Kanban board of agent tasks
- Live agent status grid (13 agents, health, last run)
- Expandable agent logs
- Approval queue (pending approvals, expiry)
- Emergency stop controls

### 7.5 XR & 3D Admin Pages (Enhancements)
> **Requirement**: No placeholder logic — all sections driven by real pipeline data.

**`/admin/models3d`** — 3D model management:
- Compression ratio (from `ModelOptimization.fileSizeReductionPct`)
- LOD previews (LOD0 / LOD1 / LOD2 thumbnails)
- Performance grade badge (from `optimizationScore`)

**`/admin/analytics`** — XR engagement analytics:
- XR engagement chart (events over time)
- AR usage % / VR usage %
- Average time in viewer

**`/admin/xr-world`** — XR tool management:
- Tool status management
- Roadmap timeline control
- Feature activation toggles

### 7.6 Public Dashboard
> **Purpose**: A public-facing dashboard surface on the website (no login) that demonstrates product value and surfaces live/featured content to prospects and public visitors.

- **Live demo hub** — one-click launch of featured WebXR / Virtual Tour demos (no account required, routed via URL bridge to `xr.viztr.com`)
- **Public portfolio grid** — published project case studies with XR embeds
- **Featured services matrix** — the 6 service cards (WebXR, WebAR, VR, Virtual Tour, Pixel Streaming, Architecture Viz) with `/services/*` CTAs
- **Command Center preview** — read-only visual teaser of the agent operation (agent status cards, task board mock)
- **Stats strip** — "5 XR Modes" / "AI Agent Studio" / "SaaS Ready" counters
- **Waitlist / CTA capture** — conversion paths into the funnel (§4.3)
- **Difference vs. client portal**: public dashboard is anonymous and read-only; the client portal (§8) is authenticated with per-project data.

### 7.7 XR Service Dashboards (Per-Service Studio Workflows)
> **Purpose**: Each XR service gets its own studio dashboard following the common pipeline: **Upload → Optimize → Generate → Scene-build → Preview → [Connect Local Development] → QA → [Publish]** (buttons per §12.5). These are the day-to-day operator surfaces for delivering each service.

**WebXR Dashboard** — Upload GLB → Optimize model → Generate scene → Add hotspots → Add camera path → Preview → Connect Local Development → QA → Publish

**WebAR Dashboard** — Upload GLB → Upload target image → Generate AR scene → Mobile preview → QR code → QA → Publish

**Virtual Reality Dashboard** — WebXR VR mode → Teleport controls → Controller support → Performance report → Headset test → QA → Publish

**Virtual Tour Dashboard** — Upload 360 images → Create rooms → Add hotspots → Add floor navigation → Preview → QA → Publish

**Pixel Streaming Dashboard** — Select Unreal project → Start local Pixel Streaming → Start signaling server → Start Cloudflare Tunnel → Show stream URL → Show FPS → Show latency → Show bitrate → Connect Local Development → QA → Publish

**Shared workspace tools** (available across all service dashboards): **XR Builder** (3D canvas, §13), **XR Link Generator** (public/password/token share links with expiry + revoke), **Pixel Streaming Control** (start/stop, latency/GPU/cost), **Review Viewport** (pins + comments on renders, share link, visibility toggle) — see §7.3.

---

## 8. Feature Domain 05 — Client Portal

> **Requirements (SaaS)**: Client access via Supabase Auth (email magic link + Google OAuth); approval + download flows are RLS-scoped per project. See §27.3/§27.7.

### 8.1 Authentication & Access
- **Login via Project ID and Password** (client-specific credentials)
- Optionally: email/password + magic link
- Single-sign-on links from email notifications

### 8.2 Client Features
| Feature | Description |
|---------|-------------|
| **Project tracking timeline** | Visual progress milestones, status badges |
| **Overview page** | Client portal landing: project summary, progress %, quick actions, recent activity |
| **Progress % + status stepper** | Percent complete + milestone status stepper (draft → in-review → approved) |
| **Deliverables grid** | Card grid of all deliverables with status, version, download |
| **Timeline feed** | Chronological activity feed — milestones, uploads, approvals, messages |
| **Deliverables access** | Download renders, 3D models, videos, documents |
| **XR demo launch** | One-click launch of WebXR/AR/VR/Tour/Pixel demos |
| **Feedback & approvals** | Comment threads, approve/reject deliverables |
| **Change requests** | Request revisions with context |
| **Message center** | Direct messaging with studio team |
| **Messages UI** | Threaded messaging with studio team (files + media attachments) |
| **Invoice & payment history** | View invoices, make payments, download receipts |
| **Billing/invoices UI** | Invoice list, payment status, pay, download receipts |
| **Booking sessions** | Schedule review calls / demo sessions |
| **File downloads** | Versioned asset downloads with permissions |

### 8.3 Client Experience (Marketing Preview)
Marketing site embeds a preview of the client dashboard to demonstrate the product value to prospects.

---

## 9. Feature Domain 06 — XR Technology & Viewers

> **Requirements (SaaS)**: 3D Experience Engine (WebGL/WebXR/AR/VR/Tour) + Pixel Streaming compose the core product; render jobs and streaming sessions run through the job queue (§27.3) and decoupled engine (§9.13).

> **One Engine, Five Modes** — shared `experience-engine` core with mode-specific engines.

### 9.1 Experience Modes
| Mode | Engine | Output | Key Tech |
|------|--------|--------|----------|
| **Virtual Tour** | `TourEngine` | `tour.html` + tiles | Marzipano (primary panorama viewer, Apache 2.0) + Babylon.js PhotoDome (fallback) + Babylon.js (dollhouse) |
| **WebXR** | `WebXREngine` | `webxr.html` + assets | Babylon.js + WebXR (Editor-produced scene), GLB |
| **WebAR** | `WebAREngine` | `webar.html` + QR | MindAR (image tracking), Babylon.js WebXR AR fallback |
| **VR** | `VREngine` | `vr.html` + manifest | Babylon.js, WebXR + WASM, native wrappers |
| **Pixel Streaming** | `PixelStreamEngine` | `stream.html` + WebRTC | UE5 plugin, Cirrus signaling, Coturn, Cloudflare Tunnel |

### 9.2 Virtual Tour Features
- 360° equirectangular rendering with multi-resolution tile pyramid (Level 0: 512px → Level 4: 8192px)
- Progressive tile loading with LRU cache (max 200MB)
- Hotspots (info, portal, media, material_switch, light_toggle)
- SVG floor plan with clickable areas + navigation graph
- Compass, gyroscope controls, fullscreen, auto-rotate
- Room-to-room crossfade/slide/instant transitions
- URL hash navigation (`#room=living-room`)
- **Marzipano renderer** — primary 360° panorama viewer (named carve-out, §21.5/ADR 6.1.1); Babylon.js PhotoDome fallback flag in tour config

**44-Feature Reference (Categories A–F)** — source: VizTR 360° Virtual Tour Updated Feature Reference (2026-08-05). "Marpinano" misspellings normalized to Marzipano.

#### A. Core 3D Tour / Navigation ⭐ Marzipano-Powered

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 1 | 360° Rotating Panorama | ✅ Marzipano | Low | Native Marzipano touch/rotate functionality |
| 2 | Play/Pause Button (bottom-center) | ✅ Marzipano overlay | Low | Autorotate toggle with custom UI |
| 3 | Left Navigation Arrow | ✅ | Low | Previous scene navigation |
| 4 | Right Navigation Arrow | ✅ | Low | Next scene navigation |
| 5 | Floor Plan Extender/Pop-up | ✅ | Medium | Overlay with clickable scene markers |
| 6 | Multi-Level Floor Navigation | ✅ | Low-Medium | Up to 4 floors supported |
| 7 | Wayfinder/Compass | ✅ Marzipano | Low | Autoplay, map marker, close controls |
| 8 | View Modes | ⚠️ Hybrid | High | Marzipano + Babylon.js dollhouse |
| 9 | Measurement Tool | ⚠️ Approximate | Medium | Marzipano-based distance calculation |
| 10 | VR Entry Button | ✅ Marzipano WebXR | Low-Medium | Native VR support |
| 11 | Fullscreen Toggle | ✅ | Low | Browser fullscreen API |
| 12 | Smooth Transitions | ✅ Marzipano | Low | Cross-fade animations |

#### B. Media & Content 📸 Marzipano Hotspots

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 13 | Panoramic Images | ✅ Marzipano | Low | Core Marzipano functionality |
| 14 | Photo Galleries per Room | ✅ | Low | Lightbox integration with Marzipano hotspots |
| 15 | Asset Management | ✅ | Medium | Organized media with CDN caching |
| 16 | Timeline/Sweep | ✅ | Medium | Guided walkthrough with floor-specific paths |
| 17 | Room/Location Labels | ✅ Marzipano hotspots | Low | Scene labeling system |
| 18 | Clickable Hotspots | ✅ Marzipano | Low | Info, video, image overlays |

#### C. Social & Sharing 🔗 Deep Linking

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 19 | Social Sharing | ✅ | Low | Facebook, X, WhatsApp, Email |
| 20 | Copy Tour URL | ✅ | Low | Clipboard integration |
| 21 | Share Current Position | ✅ | Medium | Marzipano deep linking |

#### D. Visitor UI/UX 🎨 Marzipano Customization

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 22 | Responsive Hamburger Menu | ✅ | Low | Mobile navigation with project info |
| 23 | Views Counter | ✅ | Low | Analytics integration |
| 24 | Visual Effects | ✅ Marzipano shaders | Low | Brightness/contrast/saturation |
| 25 | Audio/Background Music | ✅ | Low | Volume control with autoplay safety |
| 26 | Mobile Touch Navigation | ✅ Marzipano | Low | Swipe/pinch gestures |
| 27 | Accessibility | ✅ | Low | ARIA labels, keyboard navigation |
| 28 | Responsive Design | ✅ | Low | Adaptive layout for all screens |

#### E. Admin-Facing (Editor / Backend, No-Code) 🛠️

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 29 | Scene/Panorama Upload | ✅ | Low | Marzipano scene management |
| 30 | Hotspot Placement | ✅ Marzipano | Low | Drag-and-drop editor |
| 31 | Floor Plan Builder | ✅ | Medium | Upload + Marzipano marker placement |
| 32 | Photo Gallery Manager | ✅ | Low | Multiple image sets per scene |
| 33 | Menu Builder | ✅ | Low | Logo, nav links, language toggles |
| 34 | Branding Config | ✅ | Low | Colors, cover images, start scene |
| 35 | Access Control | ✅ | Low | Password, expiry, limits; token-based share links via `XrShareLink` model (§6.5/§9.13) |
| 36 | Asset/Media Library | ✅ | Medium | Cross-project reuse |
| 37 | Analytics Dashboard | ✅ | High | Heatmap, engagement tracking |
| 38 | Theming System | ✅ | Low | CSS custom properties |
| 39 | Publish/Versioning | ✅ | Low | Draft vs. live state |

#### F. Technical / Architecture Layer 🏗️

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 40 | Tour Config Schema | ✅ | Medium | JSON with Marzipano extensions |
| 41 | Stats API Endpoint | ✅ | Medium | Real-time analytics |
| 42 | WebGL Rendering | ✅ Marzipano | Built-in | Effect composer integration |
| 43 | Asset CDN/Caching | ✅ | High | Optimized media delivery |
| 44 | Rendering Engine | ✅ Marzipano | Built-in | Apache 2.0 licensed |

#### Implementation Priority (Phase-Based)

**Phase 1: Core MVP (30 Days)** — Dependencies: Marzipano viewer integration
1. ✅ 360° Panorama with Marzipano
2. ✅ Bottom-center controls (Play/Pause + Arrows)
3. ✅ Floor plan pop-up with scene markers
4. ✅ Hotspot placement editor
5. ✅ Basic navigation system

**Phase 2: Enhanced Experience (30 Days)** — Dependencies: Marzipano hotspots
6. ✅ Multi-level floor navigation
7. ✅ Audio system with volume control
8. ✅ Views counter integration
9. ✅ Mobile responsive design
10. ✅ Social sharing features

**Phase 3: Advanced Features (30 Days)** — Dependencies: Marzipano customization
11. ✅ Photo galleries with lightbox
12. ✅ Visual effects controls
13. ✅ Deep linking for sharing
14. ✅ Asset library management
15. ✅ Advanced analytics dashboard

> **Execution coverage**: `implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md` fully implements **25 of 44 features** (Tasks 1–15; +3 partially: #18 viewer render, #32 admin manager, #40 schema definition) and treats #27/#35 as cross-cutting constraints. The remaining **14 features are assigned to owners below** and are tracked in the owning plan, not the Marzipano task list.

**Ownership of the 14 non-task features:**

| # | Feature | Owner | Where it lands |
|---|---------|-------|----------------|
| 7 | Wayfinder/Compass | Tour plan (Marzipano) | Marzipano Phase 2/3 nav extension (adjacent to Task 5) |
| 8 | View Modes (Tour ⇄ Dollhouse) | `2026-08-05-phase4-xr-engine.md` | ModeManager routing + Babylon dollhouse (Global Constraints) |
| 9 | Measurement Tool | Tour plan (Marzipano) | Marzipano Phase 3 (approximate, Marzipano-based) |
| 10 | VR Entry Button | `2026-08-05-phase4-xr-engine.md` | VR mode entry; button mounts in tour viewer |
| 11 | Fullscreen Toggle | Tour plan (Marzipano) | Folded into controls (Task 2/5) |
| 16 | Timeline/Sweep | Tour plan (Marzipano) | Marzipano Phase 3 guided walkthrough |
| 17 | Room/Location Labels | Tour plan (Marzipano) | Scene config + hotspot labels (Task 4) |
| 22 | Responsive Hamburger Menu | Tour plan (Marzipano) | Folded into responsive Task 9 |
| 29 | Scene/Panorama Upload | `2026-08-05-phase3-automation.md` upload pipeline + Tour admin | Upload service `mimeMap` (add `jpg/jpeg`); admin scene manager |
| 31 | Floor Plan Builder | Tour admin (Marzipano) | Admin editor extension (Task 3/4) |
| 33 | Menu Builder | Tour admin (Marzipano) | Admin editor extension (Task 4) |
| 34 | Branding Config | Tour admin (Marzipano) | Admin editor extension (Task 4) |
| 38 | Theming System | Platform design system (phase0-1 tokens) + Tour admin | CSS custom properties per tour |
| 39 | Publish/Versioning | Platform publish-engine + Tour admin | Draft vs live per tour project |

- **Ambient audio / background music**: per-tour or per-room audio track, mute toggle, auto-pause on tab blur (via `PLAY_MEDIA` interaction, §9.11)

### 9.3 WebXR Features
- **Camera modes**: Orbit, First Person (WASD + touch joystick), XR Inline, Immersive VR
- **Camera path animation**: keyframes, easing, loop, auto-play
- **Material system**: PBR variants, swatches, switching
- **Hotspots**: 3D markers, info panels, portals
- **Post-processing**: SSAO, Bloom, ToneMapping
- **LOD + frustum culling**: adaptive performance
- **Device support**: Quest, Pico, Vision Pro controller profiles
- **Teleport system**: VR comfort-first locomotion

### 9.4 WebAR Features
- **AR mode priority**: WebXR AR (immersive-ar, Android) → MindAR image target (iOS/Android) → MindAR pattern marker → 3D viewer fallback
- **Hit-testing** for surface placement
- **Scale controls**: pinch + slider
- **Lighting estimation**
- **QR code generator** for shareable AR experiences
- **Custom marker file upload**: `.patt` / `.mind` pattern files for MindAR image/pattern targets (marker management in the WebAR Dashboard, §7.7)
- **Matrix-code fallback**: matrix-code markers used when image targets fail to track
- **WebAR fullscreen**: fullscreen mode for the AR session
- **Device-orientation**: device-orientation based placement control
- **Shadows, anchors, occlusion**: WebXR AR surface stability (with hit-testing + light estimation)
- **Compatibility banner** for unsupported devices

### 9.5 VR Features
- **Comfort settings**: vignette, snap-turn (30°/45°), FOV reduction, teleport cooldown, motion sickness modes
- **Teleport system**: parabolic arc preview, snap-to-navmesh
- **Controller profiles**: Quest, Pico, Vision Pro, generic
- **Performance**: 90fps target (72/90 on Quest 2, 90 on Quest 3/Pico 4)
- **Native builds**: Capacitor Android/iOS/visionOS, PWA manifest
- **Room switching**: scene-to-scene teleportation

### 9.6 Pixel Streaming Features
- **Streaming**: UE5 Pixel Streaming + WebRTC via `@epicgames/epicpixelstreaming`
- **Signaling**: Cirrus (Node.js) + Coturn STUN/TURN for NAT traversal
- **Edge**: Nginx reverse proxy / TLS termination in front of the signaling server
- **Tunnel**: Cloudflare Tunnel exposing local GPU workstation
- **Quality presets**: Low (5 Mbps/720p/30fps) → Ultra (50 Mbps/4K/60fps), auto-adapt
- **Input mapping**: keyboard/mouse/touch/gamepad → UE5 controls
- **Monitoring**: real-time FPS, latency, bitrate, viewer count, GPU stats (NVML)
- **Screenshot capture**: capture still frames from the live stream (client-side capture + server snapshot)
- **Reconnection**: auto-reconnect with session resume
- **GPU budget enforcement**: per-workspace limits

> **⚠️ Operating note**: Pixel Streaming requires GPU infrastructure and cannot realistically run for free at production scale. **For MVP: run on the local GPU machine (via Cloudflare Tunnel). For clients: charge GPU hosting separately** as an enterprise service line (see §24.2).

**Local Pixel Streaming launcher (`.bat`)** — one script starts the full local stack and reports status to the dashboard:
```bat
@echo off
echo Starting VizTR Pixel Streaming...
start "" "C:\Program Files\Epic Games\UE_5.x\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" "D:\VizTRProjects\ProjectName\ProjectName.uproject" -run=game -PixelStreamingIP=0.0.0.0 -PixelStreamingPort=8866
start cmd /k "cd /d D:\VizTRPixelStreaming\signaling && node signaling_server.js"
start cmd /k "cloudflared tunnel --url http://localhost:8866"
echo VizTR Pixel Streaming started.
pause
```
Launches: 1) Unreal Pixel Streaming session → 2) signaling server → 3) STUN/TURN if needed → 4) Cloudflare Tunnel → 5) **status reporter** (Hermes Agent posts stream status/FPS/latency to the VizTR dashboard, powers the [Connect Local Development] button, §12.5).

### 9.7 Shared Scene Graph
```typescript
interface SceneGraph {
  nodes: SceneNode[];
  materials: Material[];
  animations: Animation[];
  cameras: Camera[];
  lights: Light[];
  interactions: Interaction[];
}
```
All engines extend `ExperienceEngine` (loadAsset, renderScene, handleInteraction, setCameraMode, animateCamera, setLighting, exportConfig).

### 9.8 Hybrid Progressive Immersion System (Tour → VR → AR)
> **Core principle**: Progressive immersion — start light (no device), upgrade to deep (headset). This is the primary product differentiator.

**Mental model**: Virtual Tour = Trailer 🎬 → VR = Full Movie 🍿

| Stage | Experience | Device | Friction |
|-------|-----------|--------|----------|
| **Entry (Tour Mode)** | 360° virtual tour, click-based room navigation | Mobile / Laptop | None |
| **Upgrade Prompt** | Contextual "🚀 Experience this in full immersive VR" + "Enter VR Mode" + "AR View" buttons | Any | Low |
| **Immersive (VR/WebXR)** | Full WebXR environment, teleport navigation, real-time lighting, interactions | VR Headset / AR-capable phone | High but premium |

**Why Hybrid wins (Business POV)**:
1. Removes friction — most users lack VR headsets; tour gets them in instantly
2. Creates the "wow moment" — VR mode = emotional impact → higher conversion
3. Works for everyone — casual users stay in tour, premium users jump into VR
4. Perfectly matched to real estate & architecture use cases

### 9.9 Mode Manager (Single State Controller)
```typescript
type Mode = "tour" | "vr" | "ar";

class ModeManager {
  currentMode: Mode = "tour";
  switchMode(mode: Mode) {
    this.currentMode = mode;
    // trigger XR session or fallback
    if (mode === "vr") navigator.xr?.requestSession("immersive-vr");
  }
}
```
- **Shared scene data across modes**: camera positions, room mapping, assets (GLB models)
- **Transition logic (core magic)**: load 3D model → match current camera position → smooth transition animation → activate WebXR session. No reload feel = premium UX.

**Camera-match transition (Enter VR implementation)**:
1. Tour engine captures the current **camera position + room/scene ID** before switching
2. Payload passed from TourEngine → VREngine: `{ roomId, cameraPosition, cameraLookAt, activeAnnotationIds }`
3. VR scene loads the same room/GLB and places the player at the captured position (seamless continuation, no teleport-spawn feel)
4. Smooth transition animation (fade → zoom → enter XR) masks the hand-off
5. On exit VR, the player is restored to the equivalent tour camera/room

### 9.10 Four-Layer Interaction Architecture
> The layered, scalable architecture powering all viewers — clean separation of concerns.

```
Layer 1 — Scene Layer (Galaxy):      360 panorama OR full 3D (GLB). The base world.
Layer 2 — Interaction Layer (Hotspot):  Clickable nodes that trigger actions.
Layer 3 — Info Layer (Annotation):    Informational labels / overlays on objects.
Layer 4 — Navigation Layer (Teleport): Movement system (comfort-first).
```

| Term | Role | Purpose |
|------|------|---------|
| **Hotspot** 🎯 | Trigger | Click to do something (navigate, open info, play media) |
| **Galaxy** 🌌 | Environment | The world/scene the user is inside (360 or 3D) |
| **Annotation** 📝 | Info | Explain / highlight objects with text and details |
| **Teleportation** 🚶 | Movement | Move the user inside the space (prevents motion sickness) |

### 9.11 Smart Interaction Logic & Event System
**Event types**:
| Event | Action |
|-------|--------|
| `TELEPORT` | Move to target point/room |
| `OPEN_ANNOTATION` | Show info card |
| `PLAY_MEDIA` | Play video/image/audio |
| `EXTERNAL_LINK` | Open external URL |

**Priority logic** (when elements overlap): `Teleport > Hotspot > Annotation` — avoids user confusion.

**Hotspot behavior types**: Navigation (teleport), Info (show annotation), Media (play video/image), External (open link).

### 9.12 Data Schemas (JSON)
```json
// Scene JSON
{ "sceneId": "living_room", "type": "360", "asset": "livingroom.hdr",
  "hotspots": [...], "teleports": [...], "annotations": [...] }

// Hotspot Schema
{ "id": "door_1", "position": [0, 1.5, -2], "action": "teleport", "target": "bedroom" }

// Teleport Schema
{ "id": "tp_1", "position": [1, 0, 1] }

// Annotation Schema
{ "id": "floor", "text": "Italian Marble", "attachTo": "floor_mesh" }
```

**Unified Experience Config** (one JSON format drives all 5 modes — the automation contract between agents, engine, and deployment):
```json
{
  "projectId": "luxury-villa-001",
  "experienceType": "webxr",
  "title": "Luxury Villa WebXR Walkthrough",
  "assets": {
    "model": "/assets/luxury-villa.glb",
    "thumbnail": "/assets/luxury-villa-thumb.jpg"
  },
  "scenes": [
    {
      "id": "living-room",
      "name": "Living Room",
      "camera": { "position": [0, 1.6, 4], "target": [0, 1.4, 0] }
    }
  ],
  "interactions": [
    { "type": "hotspot", "label": "Italian Marble Flooring", "position": [0, 0.05, 0] },
    { "type": "teleport", "targetScene": "bedroom" }
  ],
  "devices": {
    "desktop": { "modes": ["webxr", "vr", "tour"], "viewers": ["/view/xr", "/view/vr", "/view/tour"], "config": { "quality": "high" } },
    "mobile": { "modes": ["webar", "tour"], "viewers": ["/view/ar", "/view/tour"], "config": { "quality": "medium", "arFallback": "mindar" } },
    "hmd": { "modes": ["vr"], "viewers": ["/view/vr"], "config": { "quality": "high", "comfort": "snap-turn" } }
  },
  "deployment": { "preview": true, "production": false }
}
```
- `experienceType` ∈ `webxr | webar | vr | tour | pixelstreaming`
- Generated by service agents (see §10.3), served via `/api/project/[id]` (see §6.2), consumed by the shared `experience-engine`.
- **Device matrix** (`devices`): per device class (desktop / mobile / hmd) — which modes are enabled, which delivery viewers are available (`/view/*` routes, §9.13), and per-mode config (quality, AR fallbacks, comfort settings).

### 9.13 Decoupled XR Engine Architecture
> **Strategy**: Separate the XR engine from the main website. Prevents lag, improves performance, scales better.

```
Main Website → viztr.com  (lightweight, SEO, marketing + showcase + client dashboard)
XR Engine    → xr.viztr.com (heavy rendering, WebXR, 3D, interaction engine)
```

**Connection Layer (Bridge) — 3 methods used together**:
1. **Webhooks** — trigger XR scene creation, sync project updates
2. **API Gateway** — fetch scenes, load project configs
3. **URL-based state passing** (fastest + powerful): `https://xr.viztr.com/view?project=abc123&mode=tour`

**Data flow**: User opens viztr.com → clicks "View in 3D/VR" → redirected to `xr.viztr.com/view?project=ID` → XR Engine fetches data → scene loads.

**Engine code structure**:
```
/src
  /app
    /view
      page.tsx        # reads searchParams.project (and mode), renders XRCanvas
  /engine
    SceneManager.ts   # loads project config + assets, orchestration of layers
    ModeManager.ts    # tour | vr | ar state controller
    InteractionManager.ts
  /components
    XRCanvas.tsx      # top-level <Canvas> wrapper; composes SceneManager + XR
    Hotspot.tsx
    Annotation.tsx
    Teleport.tsx
  /ui
    ControlBar.tsx
    MiniMap.tsx
    Loader.tsx
```

**Component responsibilities**:
- **XRCanvas**: renders the Babylon.js `<Babylon/>` scene (default camera positioned at `[0, 1.6, 3]`, ambient light) and hosts `<SceneManager>`; enters XR when VR available; mounts VR entry button.
- **SceneManager**: fetches `/api/project/[id]`, loads the GLB or 360 asset, then renders hotspot / annotation / teleport layers from the project config; owns loading state (returns null until scene data resolves).

**Token-based public delivery viewers** — replaces the open query-string bridge (`?project=ID&mode=`) as the primary share mechanism:
| Route | Type | Access |
|-------|------|--------|
| `/view/tour/[token]` | Virtual Tour | public / password / token |
| `/view/ar/[token]` | WebAR | public / password / token |
| `/view/vr/[token]` | VR | public / password / token |
| `/view/xr/[token]` | WebXR | public / password / token |
| `/view/stream/[token]` | Pixel Streaming | public / password / token |

Access types: **public** (anyone with the link), **password** (prompt for a share password), **token** (unique per-link token). Per-link **expiry**, **view counts** (feeds the Views Counter / analytics, §9.2), and **revoke** — backed by the `XrShareLink` model (§6.5) and the XR Link Generator (§7.3).

### 9.14 Multiuser Collaboration System
- **Real-time avatars**: position/rotation sync via WebSocket (`socket.emit("move", camera.position)`)
- **Voice chat**: WebRTC via `getUserMedia({ audio: true })`
- **Architecture**: Client ↔ Signaling Server ↔ Clients
- **Use case**: Agents + clients inside the same property for live walkthroughs
- **Roadmap**: shared pointer, gesture sync, room persistence

### 9.15 Smart UX Patterns (High Impact)
| Pattern | Behavior |
|---------|----------|
| **Progressive reveal** | Show VR button only after user explores 2–3 rooms |
| **Device detection** | Mobile → suggest AR; Desktop → suggest VR walkthrough |
| **Cinematic entry** | Fade + zoom + sound when entering VR ("stepping into another world") |
| **Scene entry** | Fade-in + slight zoom |
| **VR entry** | Blur screen → zoom forward → enter XR |
| **Annotation** | Slide + fade micro-interaction |

### 9.16 Mobile Performance Optimization (Android / iOS)
- **Formats**: GLB/GLTF primary (web-optimized); **USDZ for iOS AR Quick Look**
- **Optimization pipeline**: Draco compression, KTX2 textures (Basis), LOD reduction, mesh simplification (Blender/gltf-transform)
- **Runtime optimization**: device detection → load low/high quality, lazy loading, frustum culling, draw-call limits
- **Goal**: smooth on mid-range Android phones (critical for the India market)

### 9.17 VR Runtime Implementation (WebXR)
- **Session**: `navigator.xr.requestSession("immersive-vr")` via the Babylon.js WebXR Experience Helper (`WebXRDefaultExperience`, `enterXRAsync("immersive-vr")`)
- **Controllers & hands**: Babylon.js `WebXRControllerPointerSelection` + hand tracking (Quest, Pico, Vision Pro)
- **Teleportation**: `TeleportSystem` component using the `useXR()` player hook — `player.position.set(x, y, z)`; comfort-first snap/arc; listens to the `teleport` window event
- **Reticle**: center pointer for selection/interaction
- **Gaze-based cursor**: dwell-timer selection (look + hold to activate) for headset users without controllers
- **Interaction**: controller raycasting, trigger-click events
- **VR performance**: capped render resolution (`dpr={[1, 1.5]}`), disabled heavy shadows, low-poly models, dynamic resolution scaling, FPS stabilizer
- **Entry UX**: styled "Enter VR" button shown only when `navigator.xr !== undefined`
- **Device fallback**: WebXR unsupported → USDZ AR Quick Look (iOS) / MindAR (Android)

### 9.18 Advanced & Monetizable XR Features
| Feature | Description | Business Value |
|---------|-------------|----------------|
| **Cinematic Auto Tour** | Auto camera movement, guided walkthrough | Premium tier showcase |
| **AI Smart Annotations** | Auto-generate property highlights via AI pipeline | Automation, speed |
| **Analytics layer** | Most-clicked hotspots, time per room, drop-off points | **Sellable to real estate clients** |
| **Voice-guided tours** | Narrated guided experiences | Premium tier |
| **Multiuser walkthrough** | Live co-viewing with agents + clients | Differentiation |
| **Mini-map navigation** | Floor plan with current position + click-to-teleport | Standard premium UX |
| **Annotation gating** | Feature-gate (VR, Multiuser, Analytics) per SaaS tier | Revenue |

### 9.19 Full WebXR Demo (Production Implementation, Babylon.js)
> **Requirement**: Replace any partial `model-viewer` dependency with a fully controlled Babylon.js implementation. No placeholder logic.

**Core loaders**: `SceneLoader.ImportMesh` with `.glb` (Draco), `.hdr` environment, and Babylon.js post-processing (bloom/glow via `PostProcessRenderPipeline`).

**Scene requirements**:
- **Models**: Architectural Living Room, Modern Villa Exterior
- **Constraints**: Max compressed size 8–10MB, Draco compression, PBR materials, HDR lighting (8 selectable environments)

**Desktop mode controls**:
| Control | Behavior |
|---------|----------|
| OrbitControls | Standard orbit |
| Scroll zoom | Mouse wheel zoom |
| Double-click focus | Focus camera on clicked object |
| Reset camera | Restore initial view |
| Fullscreen toggle | Enter/exit fullscreen |
| HDR environment selector | Dropdown — 8 selectable environments |
| FPS monitor | Dev toggle overlay |

**Mobile mode (AR session)**:
- `WebXR immersive-ar` session
- Hit-test for placement
- Pinch to scale, rotate gesture, drag reposition
- Light estimation when supported
- Shadows, anchors, and occlusion for stable surface placement
- **Fallbacks**: Android → Scene Viewer intent; iOS → USDZ Quick Look

**VR mode (fully functional)**:
- `WebXR immersive-vr` session, XR-enabled renderer, proper render loop
- Controller detection
- Teleport or smooth locomotion (basic)

### 9.20 True WebGL 360 Panorama Viewer
> **Requirement**: Replace CSS-based panorama with WebGL spherical rendering.

- **Rendering**: **Marzipano** (primary, named carve-out §21.5/ADR 6.1.1) with Babylon.js `PhotoDome` / mesh `PhotoMesh` as fallback (`photoDomeFallback` flag), high-resolution 360° images
- **Controls**: drag rotation, scroll zoom, gyroscope support, smooth inertia
- **Features**: multi-scene switching, optional hotspot markers, optional WebXR VR support inside panorama

### 9.21 Unified Viewer System (360 + 3D) — Route `/viewer`
> **Requirement**: Fully functional toggle system. No disabled modes.

| Mode | Content |
|------|---------|
| **3D Model Mode** | WebXR 3D demo (Section 9.19) |
| **Panorama Mode** | WebGL 360 viewer (Section 9.20) |
| **Split View Mode** | Left: Panorama · Right: 3D Model · Shared navigation header · Independent controls |

### 9.22 Viewer Performance Enhancements
- **Lazy loading** for heavy models
- **Dynamic import** for WebXR components
- **Preload optimized GLB** on hover
- **Intersection Observer** for Labs sections
- **Texture caching**
- **Memory cleanup** on unmount
- **60 FPS target** on desktop; mobile safe fallback for heavy scenes

### 9.23 XR Engagement Analytics Events
| Event | When |
|-------|------|
| `xr.demo_open` | WebXR demo opened |
| `xr.model_loaded` | Model finished loading |
| `xr.time_in_viewer` | Cumulative time in viewer |
| `xr.ar_session_start` | AR session started |
| `xr.vr_session_start` | VR session started |
| `xr.panorama_switch` | Panorama scene changed |
| `xr.split_mode` | Split view activated |
| `xr.zoom` | Zoom interaction |
| `xr.environment_change` | HDR environment switched |

**Stored payload**: `UserSession`, `DeviceType`, `Timestamp`, `ModelId`, `Duration`. Feeds the `/admin/analytics` dashboard charts.

### 9.24 Consolidated UX Flow (End-to-End User Journey)
> Single authoritative sequence tying together entry → exploration → upgrade → immersion → collaboration.

1. **Entry** — user opens link (mobile/laptop); 360° tour loads instantly, no device/friction
2. **Explore** — click-based room navigation via hotspots; minimal UI; smooth camera rotation
3. **Interact** — tap hotspot → opens annotation OR teleports OR plays media (priority: Teleport > Hotspot > Annotation)
4. **View annotations** — glass card, one-at-a-time, closes on outside click
5. **Upgrade prompt** — "Enter VR Mode" / "AR View" appears contextually (progressive reveal, device detection)
6. **Enter VR** — camera-match transition (same room, no reload feel), cinematic blur→zoom entry
7. **Immerse** — teleport / smooth locomotion, real-time lighting, full interaction unlocked
8. **Collaborate (optional)** — multiuser avatars + voice chat
9. **Exit** — restored to equivalent tour camera/room; analytics captured throughout

### 9.25 Viewer UI Wireframes (ASCII)
> Consistent with §2.1/§9.13 ASCII style. Screen states for the immersive viewer.

```
MAIN VIEWPORT (DESKTOP) — Tour / 3D mode
+--------------------------------------------------------------+
| Project Name                                [Share] [Info]    |
|                                                              |
|                        ( Scene )                              |
|                       hotspots inside                         |
|                        ◦    ◦                                 |
|                                   • user view                |
|                          Mini-map      [⌖]                   |
|   +-------------------------------------------------------+  |
|   |  Home  |  Map  |  VR  |  AR  |  Info  |  Sound  | FS  |  |  <- Control bar (bottom, auto-hide 3s)
|   +-------------------------------------------------------+  |
+--------------------------------------------------------------+

ANNOTATION OPEN (DESKTOP)
+--------------------------------------------------------------+
|                                              +--------------+ |
|                        ( Scene )             | Italian      | |
|                        ◦              ●      | Marble       | |
|                                             | Premium fin.  | |
|                                             | [Read More]   | |
|                          Mini-map            +--------------+ |
+--------------------------------------------------------------+

VR MODE (MINIMAL UI)
+--------------------------------------------------------------+
|   [Exit]                                                     |
|                    ●  (reticle center)                        |
|                        ( Scene )                             |
|                 ◯  teleport rings   ◯                        |
|                          Mini-map                            |
+--------------------------------------------------------------+

MOBILE (GESTURE-FIRST)
+--------------------------------------------------------------+
|                                                              |
|                        ( Scene )                             |
|                  swipe = rotate · tap = hotspot              |
|                       pinch = zoom                            |
|   +-------------------------------------------------------+  |
|   |   ⌂   |   🗺   |   👓   |   ℹ️   |                      |  |  <- bottom floating bar
|   +-------------------------------------------------------+  |
+--------------------------------------------------------------+
```

---

## 10. Feature Domain 07 — AI Agent System

> **Requirements (SaaS)**: 13-agent orchestration (LangGraph online + Hermes local + AgentGPT online + API-provider LLMs) via Universal MCP Connector; agent_runs + website_pages tables drive Content-as-Code auto-updates. See §27.3/§27.5.

### 10.1 Agent Taxonomy (13 Agents)
```
CEO Agent (Orchestrator — LangGraph, online/cloud)
├── Hermes Agent (Local Controller — API-provider LLMs to the cloud stack)
├── Service Agents (XR Generation — 5)
│   ├── WebXR Agent
│   ├── WebAR Agent
│   ├── VR Agent
│   ├── Virtual Tour Agent
│   └── Pixel Streaming Agent
└── Internal Agents (Platform Services — 7)
    ├── Website Developer Agent
    ├── Finance Agent
    ├── Analytics Agent
    ├── QA Agent (PRE-PUBLISH GATE)
    ├── Support Agent
    ├── Design Agent
    └── Sales Agent
```

> **Framework ownership split (LangGraph vs AgentGPT vs Hermes)**:
> - **LangGraph owns the CEO workflow (online/cloud)** — task planning, stateful workflows, approval gates, conditional routing, QA checks, publish controls, the Connect/Publish workflow (§12.5), and agent supervision.
> - **AgentGPT owns the 12 specialized agents** — Sales, Support, Design, WebXR, WebAR, VR, Virtual Tour, Pixel Streaming, Website Developer, Finance, Analytics, QA (the Service + Internal agent groups above), running as an always-online browser-based multi-agent system (self-hosted GitHub build).
> - **Hermes runs local execution** (local-runner app, §10.3) and reports back into the LangGraph CEO loop.
> - **API-provider LLM models** power cloud work (OpenAI, OpenRouter, OmniRoute, Groq — via OmniRoute routing, §10.2/§21.4).
> - **Universal MCP Connector** (§10.4) is the shared tool layer LangGraph, AgentGPT, and Hermes agents call.

### 10.2 LLM Provider Chain (Priority)
```
OmniRoute → OpenAI (GPT-4.1) → OpenRouter → Groq → Host URL
```

### 10.3 Agent Capabilities Matrix
| Agent | Type | Key Capabilities | Guardrail: Never Auto-Execute | Requires Approval |
|-------|------|------------------|-------------------------------|-------------------|
| **CEO** | Orchestrator | goal decomposition, task assignment, quality review, approvals | spend_money, deploy_production, send_contracts, send_invoices, share_private_data | production_deployment, client_contract, invoice_generation, budget_increase |
| **Hermes** | Local Controller | local file ops, asset validation/optimization, pixel streaming, tunnel mgmt | delete_local_files, modify_system_config, expose_ports_externally | production_deployment, tunnel_creation |
| **WebXR/WebAR/VR/Tour** | Service | scene generation, camera paths, hotspots, materials, lighting, preview, deploy prep | publish_production | production_deployment |
| **Pixel Streaming** | Service | stream orchestration, GPU management, quality adaptation | spend_gpu_budget | production_deployment, gpu_budget_increase |
| **Website Dev** | Internal | MDX generation, SEO, PR creation, Vercel deploy | — | vercel.deploy, github.createPR |
| **Finance** | Internal | estimates, invoices, Stripe, ROI, GPU billing | send_invoice, charge_client, spend_money | invoice_generation, payment_processing, budget_increase |
| **Analytics** | Internal | metrics, heatmaps, forecasts, reports | — | analytics.report |
| **QA** | Internal | validation gates, performance, compatibility, SEO | bypass_qa_gate, approve_failed_qa | qa_gate_override |
| **Support** | Internal | tickets, FAQ, SLA, proactive updates | — | — |
| **Design** | Internal | brand consistency, asset optimization | — | — |
| **Sales** | Internal | leads, proposals, follow-up | — | — |

**Per-service agent responsibilities (MVP automation)**:
| Agent | Step-by-Step Responsibilities |
|-------|------------------------------|
| **WebXR Agent** | Read client brief → generate WebXR scene config → create Babylon.js scene (Editor output) → add hotspots → add camera path → run QA → generate preview link |
| **WebAR Agent** | Validate AR target image → prepare GLB model → set scale → generate AR scene → generate QR code → test on real mobile device (browser-dependent) |
| **VR Agent** | Check VR compatibility → generate VR controls → add teleport points → optimize scene performance → create VR QA checklist |
| **Virtual Tour Agent** | Create tour JSON → add rooms → add hotspots → generate navigation graph → generate preview → run QA (easiest service to automate) |
| **Pixel Streaming Agent** | Generate Unreal project setup guide → monitor stream health → check latency → generate deployment instructions → create client preview page (enterprise service, GPU required) |
| **Website Developer Agent** | Generate MDX/page draft → create GitHub PR → SEO + broken-link QA → await admin approval → merge → Vercel deploy → analytics check |

**Hermes Agent — Local Responsibilities (9 steps)** (runs on `apps/local-runner`, §2.1):
1. Read local project folders
2. Run QA checks (local)
3. Run asset validation
4. Check Unreal Pixel Streaming status (local GPU workstation)
5. Run local tests
6. Create deployment package
7. Sync to cloud (text/docs → Supabase; heavy/3D assets → R2)
8. Trigger GitHub/Vercel deployment
9. Report status to CEO Agent

> **Role**: Hermes is the bridge between the local workstation and the cloud dashboard — it powers the **[Connect Local Development]** button (see §12.5) and reports back to the CEO Agent loop (§10.7).

### 10.4 MCP Server (30+ Tools)

> **Universal MCP Connector**: MCP is the single integration hub that connects the **Dashboard** to all external systems. Every app and agent connects to the same MCP server.
```
Dashboard / Web / Client Portal
   │
   ▼
Universal MCP Connector  (packages/mcp — one MCP server)
   │
   ├──→ Supabase (Postgres, Auth, Storage, Edge Functions)
   ├──→ GitHub (repos, PRs, actions)
   ├──→ Vercel (deployments, preview URLs)
   ├──→ Files (local GPU workstation + cloud storage)
   ├──→ Unreal Engine (Pixel Streaming session control)
   └──→ API LLM providers (model layer — OmniRoute/OpenAI/OpenRouter/Groq)
```
All future apps (WebXR / WebAR / Virtual Tour / Pixel Streaming / Website / Finance / Analytics apps) and Hermes connect to this same MCP server — no per-app custom integrations.

| Tool Group | Tools |
|------------|-------|
| **Project** | project.create, project.update, project.get, project.list, project.delete |
| **Task** | task.create, task.update, task.assign, task.complete, task.list |
| **Asset** | asset.upload, asset.validate, asset.optimize, asset.get, asset.delete |
| **XR Generation** | webxr.generate/preview/deploy, webar.generate/preview/deploy, vr.generate/preview/deploy, tour.generate/preview/deploy, pixelstreaming.connect/start/stop/status |
| **QA** | qa.run, qa.status |
| **Deployment** | deploy.connect, deploy.publish, deploy.status |
| **Website** | website.generatePage, website.publish |
| **Analytics** | analytics.get, analytics.report |
| **Finance** | finance.createInvoice, finance.recordPayment, finance.getROI |
| **Local** | local.connect, local.status |

### 10.5 Agent Infrastructure
- **Base Agent class**: capabilities, guardrails, memory, message bus, tool calling with audit
- **Agent memory**: pgvector embeddings (nomic-embed-text, 768 dims), semantic recall
- **Message bus**: persistent inter-agent channels, WebSocket fan-out
- **Queue system**: asset, XR generation, QA, deployment, agent-task, notification queues (BullMQ)
- **Security**: per-agent tool allowlist, rate limits, budgets, emergency stop
- **Audit**: every agent decision and tool invocation logged

### 10.6 Spatial AI — Advanced Showcase (Under Development · Coming Soon)
> **Status**: This is an under-development feature showcased publicly as **"Coming Soon"**. Powered internally by VizTR's AI pipeline.

**Public placement**: Marketing website Labs section — labeled **"Coming Soon"**, not presented as a live tool.

**Visual components**:
1. **Before / After slider comparison** — original vs. AI-enhanced render
2. **Render time comparison chart** — Traditional workflow vs. Node-based AI workflow
3. **Pipeline diagram animation** — animated node-based flow

**Node-based workflow display**:
```
Input:  CAD / 3ds Max file
Pipeline:
  1. Preprocessing
  2. AI material enhancement
  3. AI lighting pass
  4. AI upscaling
  5. Manual refinement
  6. Final export
Tagline: "Faster Delivery with Controlled Quality."
```
- Rendered with **Intersection Observer** (lazy-load when scrolled into view)
- Respects theme engine and glass effect toggle

### 10.7 CEO Agent Orchestration Workflow
> **Role**: The CEO Agent is the main manager — it receives commands, creates projects/tasks, assigns agents, monitors progress, checks quality, requests approval, notifies clients, and generates reports.

**Workflow loop**:
```
User Command
   ↓
CEO Agent classifies request
   ↓
Creates project/task plan
   ↓
Assigns correct service agent
   ↓
Service Agent performs work
   ↓
Local Hermes Agent (local QA, asset checks, Unreal status)
   ↓
Local QA passed
   ↓
[Connect Local Development] → cloud preview
   ↓
Cloud QA Agent checks preview
   ↓
CEO Agent creates approval request
   ↓
Human approves
   ↓
[Publish] → deployment / client update
   ↓
Analytics Agent tracks result
```

**Guardrails (never auto-execute)**: spend money, deploy production, send legal contracts, send invoices, share private client data — all require human approval.

**Example command**:
> *"Create a WebXR project for ABC client. Deadline: 14 days. Budget: ₹75,000. Service: Interactive architectural walkthrough."*

**CEO response**:
```
Project created: ABC WebXR Walkthrough
Tasks:
  1. Support Agent — collect client assets
  2. Design Agent — prepare visual direction
  3. WebXR Agent — generate WebXR template
  4. QA Agent — test performance
  5. Finance Agent — create estimate
  6. CEO Agent — send client preview
Deadline: 14 days
Budget: ₹75,000
Approval required: production deployment
```

**End-to-end example — "Create WebXR demo for Luxury Villa"**:
```
CEO Agent creates project
WebXR Agent creates config
Hermes Agent checks local files
WebXR Agent builds local preview
QA Agent tests scene
→ You click [Connect Local Development]
Cloud dashboard receives local preview
QA Agent checks cloud preview
→ You click [Publish]
Vercel deploys
Client receives link
```

### 10.8 VizTR Architecture Intelligence (RAG + SOP Knowledge Base)
> **Internal AI brain** for the AI-operated studio. Use **RAG + SOP documents + agent tools** — do NOT fine-tune first (fine-tune later once real project data is collected).

**Knowledge base contents**:
- Architecture visualization SOPs
- Render quality rules
- Camera composition rules
- Lighting rules
- Material rules
- SketchUp export rules
- 3ds Max export rules
- Blender cleanup rules
- WebXR optimization rules
- WebAR rules
- VR comfort rules
- Virtual Tour rules
- Pixel Streaming setup rules
- Pricing templates
- Client proposal templates
- QA checklists

**Serving**: **zero-budget = ChromaDB + API embeddings; production = Supabase pgvector** (see §21.4) + SOP markdown docs + agent tool context. Stored in `docs/sop/`.

### 10.9 Website Auto-Update System (Content-as-Code)
> **Zero-budget method**: website content lives as MDX files in GitHub; agents generate MDX; admin approves the PR; Vercel deploys automatically.

```
Command Center
   ↓
Website Developer Agent
   ↓
Generates MDX / page draft
   ↓
Creates GitHub Pull Request
   ↓
QA checks (broken links, SEO)
   ↓
Admin approval
   ↓
Merge
   ↓
Vercel deploy
   ↓
Analytics Agent checks performance
```

### 10.10 AI Agent Configuration Dashboard (`/ai/agents`)
> **Critical UI Surface**: Comprehensive control over VizTR's 13-agent autonomous system.

**Dashboard Features**:
- **Agent Grid**: Visual cards for all 13 agents with status (active/inactive/error), task count, health score
- **Agent Configuration Modal**: Per-agent settings including model selection, temperature, max tokens, capabilities, rate limits, custom system prompts
- **Task Assignment**: Manual and auto-assignment rules for distributing work to agents
- **Performance Monitoring**: Success rate, average response time, cost per agent, tasks completed
- **Agent Logs & Debugging**: Real-time log viewer with filtering, entry details, input/output inspection

**Agent Categories**:
| Category | Agents | Purpose |
|----------|--------|---------|
| Content | Copywriter, SEO Specialist, Social Media | Content generation and optimization |
| Design | Interior Designer, Landscape Architect, Style Curator | Design recommendations |
| Technical | 3D Modeler, VR/AR Developer, QA Engineer | Technical implementation |
| Business | Client Coordinator, Project Manager, Pricing Analyst | Business operations |
| Analytics | Performance Analyst | Data analysis |

**Configuration Structure**:
```typescript
interface AgentConfiguration {
  id: string
  name: string
  type: AgentType
  status: 'active' | 'inactive' | 'error' | 'maintenance'
  model: string
  temperature: number
  maxTokens: number
  capabilities: string[]
  rateLimits: {
    perHour: number
    perDay: number
    maxConcurrent: number
    timeoutSeconds: number
  }
  systemPrompt: string
}
```

**Spec Reference**: `docs/VIZTR-AI-AGENT-CONFIGURATION-SPEC.md`

### 10.11 AI Safety & Guardrails Dashboard (`/ai/safety`)
> **Required for Production AI**: Comprehensive controls for content safety, output validation, and compliance.

**Dashboard Features**:
- **Content Filtering**: Category-based filtering (harassment, hate speech, violence, sexual content, PII)
- **Output Validation**: Quality checks, bias detection, factual accuracy, brand compliance
- **Blocked Topics & Keywords**: Topic blocking, keyword filtering, regex patterns, whitelist management
- **Compliance Rules**: GDPR, CCPA, industry-specific compliance configuration
- **Audit Logging**: Complete activity log with filtering and export
- **Safety Metrics Dashboard**: Safety score, blocked content breakdown, validation failures over time

**Safety Layers**:
| Layer | Purpose | Implementation |
|-------|---------|----------------|
| Input Filtering | Prevent harmful prompts | Keyword blocking, prompt validation |
| Output Validation | Ensure safe outputs | Content scoring, topic detection |
| Rate Limiting | Prevent abuse | Per-user, per-agent limits |
| Audit Logging | Track all AI activity | Complete activity log |
| Human Review | Catch edge cases | Approval queue for sensitive content |

**Spec Reference**: `docs/VIZTR-AI-SAFETY-GUARDRAILS-SPEC.md`

---

## 11. Feature Domain 08 — Asset Management & Processing

> **Requirements (SaaS)**: Upload Pipeline (validation, virus scan, format checks) → queue (BullMQ) → optimization (GLB Draco/KTX2). Asset storage + limits by tier in §27.4/§27.8.

### 11.1 Supported Formats
| Category | Formats | Max Size |
|----------|---------|----------|
| 3D Models | GLTF, GLB, FBX, OBJ, Blend, USD, USDZ | 500MB |
| DCC Sources | SketchUp (SKP → FBX/DAE), 3ds Max (MAX → FBX), Blender (BLEND) | 1GB |
| Images | JPG, JPEG, PNG, WebP, EXR, HDR | 50MB |
| Panoramas | JPG, PNG (360° equirectangular) | 200MB |
| Videos | MP4 (H.264/HEVC), WebM, MOV, ProRes (source), cinematic walkthrough/cinematic animation deliverables | 2GB |
| Archives | ZIP, TAR, GZ | 1GB |

### 11.2 Upload Pipeline
1. **Client Brief / Asset Upload** — briefs and source files enter the pipeline together
2. **Presigned URL generation** (15-min expiry, R2/MinIO)
3. **Multipart upload** for files > 100MB (10MB parts, resumable)
4. **Validation** (extension + MIME + magic bytes, size, ClamAV malware scan, gltf-validator)
5. **Conversion** (SketchUp → FBX/DAE, 3ds Max → FBX, FBX/OBJ/Blend → GLB via Blender headless)
6. **Material Check** — assign/correct PBR materials, missing texture detection, material count limits
7. **Scale Check** — real-world unit verification (cm/m), axis/ground-plane alignment, pivot reset
8. **Optimization** (Draco mesh, KTX2 textures, Meshopt, texture resize, LOD generation)
9. **Video transcoding** (source → H.264/HEVC MP4 + WebM, resolution ladder, poster frame extraction, streaming-ready)
10. **Ready** (status transitions: uploaded → validating → converting → optimizing → ready/failed)

### 11.3 Optimization Features
- **Draco compression** (mesh)
- **KTX2 / Basis Universal** (textures) with mipmaps
- **Meshopt** (alternative compression)
- **LOD generation** (3 levels: 100% / 50% / 25% triangles, decimation with UV/normal preservation)
- **Texture processing**: resize (mobile 1024 / desktop 2048 / VR 2048), compress, convert
- **Asset metadata extraction**: triangles, textures, materials, animations, bounding box, format version

### 11.4 Asset Limits by Tier
| Tier | Storage | File Size Cap | GPU Hours/mo | API Calls/mo |
|------|---------|---------------|--------------|--------------|
| Free | 1 GB | 500MB | 0 | 1,000 |
| Pro | 25 GB | 500MB | 10 | 50,000 |
| Studio | 100 GB | 500MB | 50 | 200,000 |
| Enterprise | Unlimited | 500MB+ | Unlimited | Unlimited |

### 11.5 Professional GLB Optimization Pipeline
> **Requirement**: Implement real optimization using glTF tooling. No simulated data — the `ModelOptimization` table is populated with real measurements.

**Tooling**: `gltf-transform` CLI / Node API, Draco mesh compression, texture resizing, WebP conversion, KTX2/Basis compression (optional advanced).

**Upload processing flow**:
```
1. Validate GLB
2. Analyze → polycount · texture count · material count
3. Apply  → Draco compression · texture resize (2K default, 4K optional)
            · remove unused nodes · deduplicate materials
4. Generate LODs:
     LOD0 → original optimized
     LOD1 → reduced poly
     LOD2 → mobile optimized
5. Store  → file size reduction % · estimated mobile FPS · optimization score
```

**ModelOptimization table (real data, not simulated)**:
| Field | Description |
|-------|-------------|
| `fileSizeReductionPct` | Actual compression ratio |
| `estimatedMobileFPS` | Predicted performance on mobile |
| `optimizationScore` | Composite grade (0–100) |
| `lod0/lod1/lod2` | Generated LOD asset references |
| `polycount` / `textureCount` / `materialCount` | Post-analysis metrics |
| `compressionFormats` | draco, webp, ktx2 flags |

---

## 12. Feature Domain 09 — Quality Assurance & Publishing

> **Requirements (SaaS)**: Automated QA gate (pre-publish) + Connect/Publish workflow (hybrid local/cloud) are non-negotiable publish paths; deployment pipeline in §27.3.

### 12.1 Automated QA Checks
| Check | What It Validates |
|-------|-------------------|
| **Performance** | FPS (60 desktop / 30 mobile / 90 VR), load time (<2s/3s), memory (<500MB), triangles (<300K/<150K), texture memory (<256MB), draw calls (<100) |
| **Compatibility** | Device/browser/XR support matrix (Chrome, Firefox, Safari, Edge, Quest, Pico, Vision Pro) |
| **Accessibility** | WCAG 2.1 AA via axe-core, contrast, keyboard nav, screen reader, ARIA, reduced-motion |
| **SEO** | Meta tags, structured data, performance signals |
| **Security** | Headers, CSP, CORS |
| **Manual** | Human review checklist |

### 12.2 QA Workflow
- **Scoring**: 0-100, pass threshold = 80
- **Issue tracking**: severity (critical/major/minor/info), category, recommendation, affected devices, metrics
- **QA history**: per-project report archive, re-runs
- **Reports**: dashboard viewer, HTML/PDF export
- **Review Viewport integration**: pinned comments on rendered images can be exported as QA issues; a pinned review session feeds the QA report (§7.3)

### 12.3 Publish Gates (Non-Negotiable)
- QA score ≥ 80 AND no critical issues → eligible
- Human approval required for production (7-day expiry)
- Approval token validation
- Audit logging of all approval actions

### 12.4 Deployment Features
| Feature | Description |
|---------|-------------|
| **Preview deployments** | PR-based, unique URLs, smoke tests |
| **Production deployment** | QA pass + approval, custom domain support |
| **Staging environment** | Full integration staging |
| **Versioning** | Incremental version per deployment |
| **Rollback** | To any previous successful deployment |
| **Auto-rollback** | On smoke test failure |
| **Local connection** | Cloudflare Tunnel to local workstation |
| **Status polling** | Real-time deployment status + notifications |
| **Deployment history** | Full audit of every deployment |

### 12.5 Connect / Publish Button Logic (Hybrid Local + Cloud)
> **The 2-button operator model**: every XR service dashboard (see §7.7) exposes two primary actions — **[Connect Local Development]** and **[Publish After QA]** — bridging the local GPU workstation to the cloud dashboard. Backed by MCP tools `local.connect` / `local.status` / `deploy.connect` / `deploy.publish` / `deploy.status` (§10.4).

**Button 1 — [Connect Local Development]**:
1. Start local dev server
2. Start local signaling server (if Pixel Streaming)
3. Start Cloudflare Tunnel (local workstation → secure public URL)
4. Register local endpoint in Supabase (`tunnels`/`local_sync` tables, §6.5)
5. Send status to dashboard
6. Run Hermes Agent local QA (§10.3)
7. Show preview URL

**Dashboard status block**:
```text
Local Development Connected
Preview URL: https://local-preview.viztr.ai
QA Status: Passed
Ready for Publish: Yes
```

**Button 2 — [Publish]**:
1. Check QA status (**must be Passed**)
2. Check admin approval (§12.3)
3. Create production build
4. Push to GitHub
5. Trigger Vercel deploy
6. Update project status
7. Notify client
8. Store deployment URL

> **⚠️ Hard rule**: Publish must NOT work unless QA status is **Passed** (enforced at the button + API layer).

---

## 13. Feature Domain 10 — 3D Interaction Editor

> **Requirements (SaaS)**: Editor persists interaction/config JSON per project version; event-driven model consumed by the XR engine. Save/publish lifecycle in §27.3.

### 13.1 Editors
| Editor | Capabilities |
|--------|--------------|
| **Hotspot Editor** | Add/move/remove/configure hotspots; 8 types (info, portal, media, material_switch, light_toggle, door_animation, camera_path, navigation) |
| **Portal Editor** | Link rooms, transitions (fade/slide/instant) |
| **Material Editor** | Add variants, real-time preview, set defaults |
| **Light Editor** | Toggle lights, default states |
| **Door Editor** | Configure animations, triggers (click/proximity/auto) |
| **Camera Path Editor** | Keyframes, timeline, easing, loop, speed, preview playback |
| **Floor Plan Editor** | SVG upload, clickable areas, room linking, navigation preview |
| **Annotation Editor** | Attach info labels to objects/meshes, icon + popup card config, one-at-a-time open logic |
| **Teleport Point Editor** | Define navigable points, floor placement, snap targets, comfort settings |

### 13.2 Editor Infrastructure
- **Viewport**: Babylon.js integration, selection manager, transform gizmo (move/rotate/scale)
- **Property panel**: type-specific configuration forms
- **Timeline panel**: camera path keyframe editing
- **Layers panel**: scene organization
- **Undo/redo**: full history support
- **Auto-save**: every 30 seconds
- **Export**: generate interaction config for deployment
- **Real-time preview**: immediate viewport feedback

### 13.3 Interaction Types
| Type | Config |
|------|--------|
| Hotspot | label, description, icon, mediaType, mediaUrl |
| Portal | targetSceneId, transitionType |
| Material Switch | objectName, materialSlot, materialOptions |
| Light Toggle | objectName, defaultState |
| Door Animation | objectName, animationKey, trigger |
| Camera Path | keyframes, loop, speed, easing, autoPlay |
| Navigation | targetRoomId, floorPlanPosition |
| Annotation | text, attachTo (mesh), icon, expandable content, readMoreLink |
| Teleport Point | position, snapRadius, floorLevel, linkedRoom |

### 13.4 Annotation System (UX Behavior)
- Icon inside scene → click opens popup card
- Click anywhere else closes popup (`stopPropagation` handled correctly)
- **Only 1 annotation open at a time**
- Smooth fade + scale animation
- Glassmorphism floating card (title + subtitle + "Read More")

### 13.5 Event-Driven Interaction Model
| Event | Triggered By | Handler |
|-------|--------------|---------|
| `TELEPORT` | Hotspot click / mini-map click | Move camera/player to target point |
| `OPEN_ANNOTATION` | Annotation icon click | Show info card |
| `PLAY_MEDIA` | Media hotspot click | Play video/image/audio |
| `EXTERNAL_LINK` | Link hotspot | Open URL |
| `ROOM_CHANGE` | Portal/navigation | Swap scene, update hotspots + mini-map |

**Overlap priority**: `Teleport > Hotspot > Annotation`.

---

## 14. Feature Domain 11 — Billing, Subscriptions & Monetization

> **Requirements (SaaS)**: Stripe-based tiers + usage-based rendering credits; white-label pricing; marketplace fees. Webhook-driven entitlement updates. Full model in §27.8.

### 14.1 Pricing Tiers (INR)
| Tier | Monthly | Yearly (−20%) | Target |
|------|---------|---------------|--------|
| **Free** | ₹0 | ₹0 | Trial / evaluation |
| **Pro** | ₹3,999 | ₹31,999 | Freelancers, small studios |
| **Studio** | ₹14,999 | ₹119,999 | Mid-size studios, agencies |
| **Enterprise** | Custom | Custom | Enterprises, white-label |

### 14.2 Tier Feature Matrix
| Feature | Free | Pro | Studio | Enterprise |
|---------|------|-----|--------|------------|
| Projects | 2 | 10 | Unlimited | Unlimited |
| Storage | 1 GB | 25 GB | 100 GB | Unlimited |
| Team Members | 1 | 5 | 20 | Unlimited |
| WebXR | ✓ | ✓ | ✓ | ✓ |
| WebAR | ✗ | ✓ | ✓ | ✓ |
| VR | ✗ | ✓ | ✓ | ✓ |
| Virtual Tour | ✓ | ✓ | ✓ | ✓ |
| Pixel Streaming | ✗ | ✗ | ✓ | ✓ |
| Analytics | ✗ | ✓ | ✓ | ✓ |
| Heatmaps | ✗ | ✗ | ✓ | ✓ |
| Export | ✗ | ✓ | ✓ | ✓ |
| API Access | ✗ | ✓ | ✓ | ✓ |
| Custom Domain | ✗ | ✓ | ✓ | ✓ |
| White Label | ✗ | ✗ | ✓ | ✓ |
| SSO | ✗ | ✗ | ✗ | ✓ |
| Priority Support | ✗ | ✗ | ✓ | ✓ |
| Dedicated Manager | ✗ | ✗ | ✗ | ✓ |
| Custom Contracts | ✗ | ✗ | ✗ | ✓ |

### 14.3 Billing Systems
- **Stripe integration**: subscriptions, invoices, payment methods, webhooks
- **Usage metering**: storage, GPU hours, API calls metered and billed
- **Billing periods**: monthly/yearly with auto-renewal
- **Tier enforcement**: programmatic limits via `TierEnforcer`
- **GPU budget**: Pixel Streaming per-session and per-workspace budgets
- **Invoice generation**: via Finance Agent (requires approval)
- **Payment processing**: Stripe, PayPal (planned), Razorpay (India-specific, planned)

---

## 15. Feature Domain 12 — Analytics & Observability

> **Requirements (SaaS)**: Product analytics (XR engagement, funnels), Vercel Analytics, Supabase Logs, error tracking, and business KPIs. Observability stack in §27.9.

### 15.1 Product Analytics
- **Event tracking**: capture user events (sessions, views, interactions)
- **Viewer analytics**: session count, duration, rooms visited, hotspots clicked
- **Heatmaps**: 2D page heatmaps + 3D viewer attention heatmaps
- **Conversion funnel**: Lead → Project → Published → Revenue
- **Usage charts**: processing hours, storage, GPU hours
- **Cohort analysis**: user retention, feature adoption
- **Custom reports**: via Analytics Agent, scheduled exports

### 15.2 System Observability
- **Prometheus + Grafana**: metrics dashboards, alerting (Grafana later)
- **Vercel Analytics**: web performance + audience (frontend)
- **Supabase Logs**: database, auth, edge function logs
- **Error tracking**: Sentry / custom error ingestion
- **Health checks**: all services, worker queues, agent health
- **Logging**: structured logs, ELK stack (planned)
- **Audit logs**: sensitive operations, agent decisions, admin actions
- **GPU monitoring**: NVML integration for Pixel Streaming

### 15.3 XR Engagement Dashboard (`/admin/analytics`)
> **Requirement**: Real XR analytics, no simulated numbers.

**Tracked events** (via `AnalyticsEvent` + `UserSession`): WebXR demo open, model loaded, time in viewer, AR session start, VR session start, panorama switch, split mode activation, zoom interactions, environment change. Payload: UserSession, DeviceType, Timestamp, ModelId, Duration.

**Dashboard charts**:
- **XR engagement chart** — events over time
- **AR usage percentage** — share of sessions using AR
- **VR usage percentage** — share of sessions using VR
- **Average time in viewer** — per model / per session
- **Model performance** — compression ratio, estimated mobile FPS, optimization score

### 15.4 System Status Page (`/system-status`)
> **Required for SLA Compliance**: Public and admin-facing system health visibility.

**Public Status Page Features**:
- **Overall Status**: Green/Yellow/Orange/Red indicators for all systems
- **Service Health**: Core services, AI services, XR services with uptime percentages
- **Performance Metrics**: API response time, error rate, throughput
- **Upcoming Maintenance**: Scheduled maintenance windows
- **Subscribe to Updates**: Email and SMS notification subscriptions
- **90-Day History**: Monthly uptime, incidents, MTTR

**Admin Status Dashboard Features**:
- **System Health Score**: 0-100 score with visual indicator
- **Real-Time Metrics**: Requests/s, error rate, P95 latency, active connections, queue depth, CPU usage
- **Service Grid**: Detailed status for each service with uptime, latency, error rate
- **Uptime Graph**: 24-hour uptime visualization
- **Incident Management**: Create, track, and resolve incidents with timeline updates

**SLA Tracking**:
- **SLA Targets vs Actual**: Uptime, API latency, error rate, incident MTTR, support response
- **SLA Credit Calculations**: Automatic credit calculation when SLA is breached
- **Uptime History**: 12-month rolling uptime record

**Spec Reference**: `docs/VIZTR-SYSTEM-STATUS-SPEC.md`

### 15.5 Platform Operations Dashboard (`/admin/operations`)
> **Required for Superadmin**: Deep visibility into system operations, queue management, and infrastructure.

**Operations Hub Features**:
- **Operations Health Score**: Overall system health metric
- **Quick Stats**: Queue depth, active jobs, failed jobs, storage, CDN bandwidth, DB queries
- **Active Alerts**: Real-time alerts for system issues
- **Recent Operations**: Log of recent system operations

**Queue Management**:
- **Queue Dashboard**: All queues with depth, processing, failed, status
- **Queue Depth Over Time**: Historical queue depth visualization
- **Queue Actions**: Pause, resume, purge, retry failed, configure

**Job Processing Monitor**:
- **Job Statistics**: Total jobs, running, completed, failed, queued
- **Active Jobs Table**: Job ID, type, status, started, duration
- **Job Types Distribution**: Pie chart of job types
- **Failed Jobs**: Failed job list with retry options

**Storage Analytics**:
- **Storage Overview**: Total storage, breakdown by type (models, renders, documents, temp)
- **Storage by Project**: Per-project storage usage
- **Storage Growth**: Historical growth visualization
- **Cleanup Rules**: Auto-delete temp files, archive inactive projects, compress large files

**CDN Performance**:
- **CDN Metrics**: Bandwidth, requests, cache hit rate, error rate
- **Bandwidth Over Time**: Historical bandwidth usage
- **Cache Performance**: Cache hits/misses, top cached assets
- **Top Errors**: Error breakdown by status code

**Database Operations**:
- **Database Metrics**: Connections, queries/sec, cache hit ratio, avg query time, database size
- **Connection Pool**: Active, idle, waiting connections
- **Slow Queries**: Query performance analysis
- **Replication Status**: Primary and replica health

**Infrastructure Metrics**:
- **System Resources**: CPU, memory, disk, network usage
- **Service Instances**: Per-service CPU, memory, status
- **Resource Alerts**: System resource warnings
- **Scaling Recommendations**: Auto-scaling configuration and recommendations

**Spec Reference**: `docs/VIZTR-PLATFORM-OPERATIONS-SPEC.md`

---

## 16. Feature Domain 13 — SEO & Growth

> **Requirements (SaaS)**: SEO is Content-as-Code (agents generate/update pages); sitemap, structured data, OG images, and technical SEO maintained by Website Developer Agent. See §27.3/§27.10.

### 16.1 Technical SEO
- Server-side rendering + static generation for indexable content
- Clean URL hierarchy, slug management via CMS
- Auto-generated sitemaps + robots.txt
- Canonical tags, hreflang (planned), Open Graph, Twitter Cards
- JSON-LD structured data (Service, Organization, FAQPage, Article, PortfolioItem, Review, BreadcrumbList)
- Core Web Vitals optimization as release gate
- Schema validation in CI

### 16.2 Content SEO
- Blog/Insights engine with MDX
- Keyword-driven content templates
- Internal linking strategy
- Per-page SEO controls via CMS (title, meta description, focus keywords)
- Case studies with quantified results (social proof)
- FAQ content targeting long-tail queries

### 16.3 Growth Features
- Waitlist capture
- Newsletter
- Referral program (planned)
- Free tier → paid conversion path
- Live demo assets for virality
- Social sharing on portfolio/case studies
- Analytics-ready (Google Analytics, Plausible, Meta Pixel hooks)
- **GA4 analytics component/injection**: inject gtag.js on all public pages (Next.js `<Script>` / third-party script component); forward events — `page_view`, XR engagement events (§9.23), form conversions — to the GA4 property

---

## 17. Feature Domain 14 — Design System & UX

> **Requirements (SaaS)**: One shared design system (packages/ui) across all apps; theme provider (next-themes); token-based theming for white-label. Architecture in §27.2.

### 17.1 Design Tokens
```json
{
  "colors": {
    "background": { "primary": "#080a0f", "surface": "#0d1117", "elevated": "#161b22" },
    "brand": { "cyan": "#00e5ff", "violet": "#7c3aed" },
    "text": { "primary": "#f8fafc", "secondary": "#cbd5e1", "muted": "#94a3b8" },
    "status": { "success": "#10b981", "warning": "#f59e0b", "error": "#ef4444", "info": "#3b82f6" }
  },
  "typography": {
    "display": "Bebas Neue",
    "heading": "Syne",
    "body": "DM Sans",
    "mono": "JetBrains Mono"
  },
  "spacing": { "base": "4px", "scale": [0,4,8,12,16,20,24,32,40,48,64] },
  "borderRadius": { "sm": "4px", "md": "8px", "lg": "12px", "xl": "16px", "full": "9999px" }
}
```

**Theme System (next-themes)** — applies to the web and dashboard apps:
- **Three modes**: `light` / `dark` / `system`
- **Default**: `system` — auto-adopts the user's OS theme (`defaultTheme="system"`, `enableSystem`, `attribute="class"`)
- Design tokens are dark-first (above); light mode maps the same token names to light surfaces
- Manual toggle stored in localStorage; system changes reflected live
- XR overlays (§17.6) continue to adapt to the active theme (light/dark/glass)

### 17.2 Component Library (50+ Components — shared-ui)
| Category | Components |
|----------|------------|
| Layout | AppShell, Sidebar, Header, Breadcrumb, Tabs |
| Data Display | ProjectCard, AssetCard, StatusBadge, ProgressRing, DataTable, MetricCard |
| Forms | ProjectForm, AssetUploadDropzone, InteractionEditor, SettingsPanel, HotspotEditor |
| Navigation | SidebarNav, CommandPalette, Breadcrumbs, Pagination |
| Feedback | Toast, Alert, Modal, ConfirmationDialog, LoadingSkeleton, ProgressStepper |
| XR | XRViewer, HotspotMarker, FloorPlan, CameraPathTimeline, MaterialSwatches |
| Agent | AgentStatusCard, TaskList, ApprovalQueue, AgentLogViewer |
| Charts | AnalyticsChart, HeatmapViewer, UsageChart |

### 17.3 UX Principles
- Mobile-first responsive design
- Dark luxury UI with futuristic accents (cyan/violet on near-black)
- Smooth animations and transitions (Framer Motion, spring physics)
- High-end typography and spacing
- Clean, intuitive navigation
- Fast loading performance (optimized assets)
- Accessibility-compliant (WCAG 2.1 AA)
- Cinematic visual storytelling
- Consistent cross-platform experience

### 17.4 Admin Customization Controls
- Change colors, fonts, and themes
- Edit layouts and section order
- Update all content
- Manage navigation menus
- Toggle sections on/off
- Upload and replace media
- Connect social media links

### 17.5 Premium XR UI System (Apple + Tesla + Unreal vibe)
> **Principle**: Premium feel is NOT about adding more UI. It's about **less clutter, smooth motion, consistent spacing, subtle glow + depth**.

**Design tokens (dark-first)**:
```json
{
  "xr-colors": {
    "background": "#0B0B0F",
    "surface": "rgba(255,255,255,0.06)",
    "border": "rgba(255,255,255,0.12)",
    "text-primary": "#FFFFFF",
    "text-secondary": "rgba(255,255,255,0.7)",
    "accent": "#7C5CFF"
  },
  "xr-radius": "12–20px",
  "xr-shadow": "0 10px 30px rgba(0,0,0,0.4)",
  "xr-type": { "headings": "600–700", "body": "400–500", "tracking": "-0.01em" }
}
```

**XR UI components**:
| Component | Behavior |
|-----------|----------|
| **GlassPanel** | Reusable glassmorphism panel — `backdrop-filter: blur(16px)`, translucent surface, 1px border, soft shadow |
| **ControlBar** | Floating bottom-center; auto-hides after 3s idle; reappears on mouse move; `blur(20px)` glass |
| **Loader** | Spinner + "Loading Experience..." — critical for perceived performance |
| **Hotspot marker** | Small pulsing dot → expands + glows on hover → click triggers action. **Luxury minimal — never big ugly icons** |
| **Annotation card** | Floating glass card (Apple-style): title + subtitle + "Read More"; slide + fade animation; only 1 open at a time; closes on outside click |
| **Mini-map** | Floating top-right, semi-transparent floor plan, animated user dot, click-to-teleport |
| **Reticle** | VR center pointer (small ring) |
| **Teleport rings** | VR ground targets with glow |

**XR layout patterns**:
- **Desktop**: fullscreen scene; top-left project name; top-right Share/Info; bottom-center control bar; right-side annotation panel; mini-map overlay
- **Mobile**: fullscreen scene, bottom floating bar (Home/Map/Info), gesture-first — swipe rotate, tap hotspot, pinch zoom; larger tap targets; haptics where possible
- **VR mode**: ultra minimal — center reticle, teleport rings, exit button only

**Transitions & micro-interactions**:
- Scene entry: fade-in + slight zoom
- VR entry: blur screen → zoom forward → enter XR
- Hotspot: scale pulse loop (1 → 1.2 → 1) + opacity fade
- Annotation: scale + fade
- Consistent spacing and depth everywhere

### 17.6 XR UI/UX Polish & Performance Requirements
> **Requirement**: Professional overlay UI, no placeholder logic.

**UI polish**:
- **Theme engine respect** — XR overlays adapt to active theme (light/dark/glass) rather than hardcoded values
- **Glass effect toggle** — user can enable/disable glassmorphism (performance + preference)
- **Elegant loading animations** — skeleton/loader states for every async viewer screen
- **Professional overlay UI** — consistent control bars, tooltips, and status chips across 3D / Panorama / Split modes

**Performance targets**:
| Surface | Target |
|---------|--------|
| Desktop viewer | 60 FPS |
| Mobile viewer | Safe fallback for heavy scenes (reduced LOD, fewer effects) |
| VR session | Stable frame rate with `dpr={[1,1.5]}` |
| Model load | ≤ 10MB compressed, Draco + KTX2 |
| Memory | Cleanup on unmount (dispose geometries/materials) |

### 17.7 Website 3D Theme — "Architectural Intelligence Command Center"
> **Design language**: The public website should feel like a **cinematic 3D architectural shell** — dark luxury UI with **cyan (#00e5ff) and violet (#7c3aed) glow**, glassmorphism cards, floating hotspots, and a 3D wireframe grid. Marketing = the product's XR engine, not just static screenshots.

**Visual style elements**:
- Dark luxury UI — background `#080a0f`, surface `#0d1117`
- Cinematic 3D architectural shell (hero 3D scene, see §17.8)
- Cyan + violet glow (aurora gradient)
- Glassmorphism cards (`.glass` utility ≈ GlassPanel, §17.5)
- Floating hotspots as marketing motif (reuses XR hotspot marker, §17.5)
- 3D wireframe grid overlay (fixed background, masked fade)
- AI command interface aesthetic
- XR service cards (WebXR/WebAR/VR/Virtual Tour/Pixel Streaming)
- Agent dashboard preview on homepage

**Tailwind token additions** (`viz` color scale):
```json
{
  "viz": {
    "bg": "#080a0f", "surface": "#0d1117",
    "cyan": "#00e5ff", "violet": "#7c3aed",
    "muted": "#94a3b8"
  },
  "product": {
    "virtual-tour": "#00e5ff",
    "webar": "#22c55e",
    "virtual-reality": "#7c3aed",
    "webxr": "#f59e0b"
  },
  "aurora": "radial-gradient(circle at 20% 20%, rgba(0,229,255,0.18), transparent 30%), radial-gradient(circle at 80% 10%, rgba(124,58,237,0.18), transparent 30%)"
}
```

**Per-product accent colors** (`product.*` tokens): Virtual Tour = cyan (`#00e5ff`), WebAR = green (`#22c55e`), Virtual Reality = violet (`#7c3aed`), WebXR = amber (`#f59e0b`) — applied to the 2×2 XR World grid (§4.1) and the `/xr/*` product pages (§4.2); the site-wide brand palette (cyan/violet) stays the default.

**Utility classes**:
- `.glass` — translucent surface + `backdrop-blur(20px)` + 1px border + soft shadow (matches GlassPanel)
- `.text-gradient` — white → cyan → violet text gradient (headline accent)
- `bg-aurora` — dual radial cyan/violet gradient background
- Wireframe grid — fixed overlay via `linear-gradient` grid lines (48px cells, `rgba(255,255,255,0.025)`), masked to fade toward bottom

**Marketing copy / taglines**:
- Hero eyebrow: **"VIZTR INTELLIGENCE OS"**
- Hero headline: **"AI-Powered Architecture Visualization & XR Experiences"**
- Hero overlay: **"Live Experience Engine"** + status chip (e.g. "WebXR Ready")
- Services section: **"One studio. Multiple immersive realities."**
- Command Center section: **"Manage VizTR like an AI-operated company."**
- Stats row: "5 XR Modes" / "AI Agent Studio" / "SaaS Ready"

### 17.8 Marketing Hero 3D Component Pattern
> **Pattern** (architecture-level, not code): marketing hero uses a lightweight **Babylon.js scene** produced in the **Babylon.js Editor** and rendered via the Next.js template — grid floor, floating hotspot billboards (pulsing glow + HTML label sprite), `ContactShadows`/soft shadows, environment (skybox/HDR), and orbital auto-rotate camera (limited zoom/pan). Because it's an Editor-produced scene, non-technical designers can author it directly.

**Purpose**: The hero *is* the product demo — it shows the XR engine's rendering quality and "floating hotspots" motif before any login. Must stay lightweight (≥60 FPS, respects `prefers-reduced-motion`, lazy-loads off viewport).

**Service card grid** (ServiceMatrix): 6-card grid — WebXR, WebAR, Virtual Reality, Virtual Tour, Pixel Streaming, Architecture Viz — each with title, description, tech tags. Drives visitors to the corresponding `/services/*` detail page (§4.2).

**Placement**: Hero + Services sections are the first two homepage sections (§4.1); the homepage also includes a **Command Center section** (glass panel introducing the AI-agent operation, CTA → dashboards).

---

## 18. Feature Domain 15 — Security, Compliance & Governance

> **Requirements (SaaS)**: JWT + refresh tokens, Supabase RLS, rate limiting, input validation, CORS, audit logging, GDPR/CCPA, SOC 2 roadmap. Security requirements in §27.7/§27.9.

### 18.1 Authentication
| Method | Description |
|--------|-------------|
| Email/password | Standard signup/login with password hashing |
| Magic link | Passwordless email login |
| Google OAuth | One-click Google login |
| GitHub OAuth | Developer-friendly login |
| MFA | TOTP-based two-factor authentication |
| Session management | JWT access + refresh tokens, session revocation |
| SSO (Enterprise) | SAML/OIDC single sign-on |

**Account management (Supabase Auth — no NextAuth)**:
- **Change email** (with re-authentication)
- **Change / reset password**
- **Active sessions list + revoke** — per-device session management UI
- **Activity log** — login events, security events per account
- **Account deletion UI** (GDPR data erasure)
- **Role-based post-login redirect** — after login, users land on their role's default dashboard: super-admin/admin → admin dashboard, studio → user dashboard, client → client portal
- **Demo accounts seeded per role** (super-admin / admin / studio / client) in local + staging seed scripts for testing (§6.5 seeds)

**Backend stack decision — Auth/DB choice**: Primary stack is **Supabase** (Auth + PostgreSQL + pgvector + RLS + Storage) with Prisma ORM. **Firebase (Auth + Firestore + Storage) is an MVP/alternative option** for the XR engine (`xr.viztr.com`) data layer — see roadmap Phase 4.5. Pick ONE per deployment; do not mix both for the same data.

**Supabase + Google OAuth setup**:
1. Create a Supabase project → **Authentication → Providers** → enable **Google**
2. In Google Cloud Console: create OAuth 2.0 Client ID → add the Supabase redirect URL (`https://<project-ref>.supabase.co/auth/v1/callback`)
3. Copy the Google Client ID + Client Secret into the Supabase provider settings and save

```env
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"   # server-only, never exposed to the client
```

### 18.2 Authorization & Data Isolation
- RBAC roles: super_admin > admin > user > client > public
- Workspace-based isolation
- **RLS on ALL tables** (row-level security enforced at DB layer)
- Per-workspace member roles (owner/admin/member/viewer)
- API key management with scopes

### 18.3 Data Protection
| Layer | Implementation |
|-------|----------------|
| Transit | TLS 1.3 |
| At rest | AES-256 encryption |
| Files | Presigned URLs (15 min), virus scan, 500MB max |
| Backups | Automated, point-in-time recovery |
| Retention | Policy-based cleanup |

### 18.4 Application Security
- Rate limiting on all endpoints (per-role)
- Zod input validation everywhere
- SQL injection prevention (parameterized Prisma/Supabase queries)
- XSS protection (proper escaping, CSP)
- CSRF tokens for forms
- File upload validation (type, size, content, magic bytes)
- Audit logging for sensitive operations
- Agent governance: per-agent tool allowlists, budgets, emergency stop

### 18.5 Compliance (Planned)
- GDPR compliance features
- CCPA/California requirements
- Data processing agreements for enterprise
- SOC 2 roadmap

---

## 19. Feature Domain 16 — Accessibility & Internationalization

> **Requirements (SaaS)**: WCAG 2.1 AA baseline across all apps; i18n ready (locale content in CMS/Content-as-Code, next-intl). Standards in §27.9.

### 19.1 Accessibility (WCAG 2.1 AA)
- Color contrast ≥ 4.5:1 (text), ≥ 3:1 (large text)
- Full keyboard navigation with visible focus
- Screen reader support, ARIA labels, landmarks, live regions
- `prefers-reduced-motion` disables 3D animations
- Modal focus trapping and restoration
- Form labels on all inputs
- Error handling announced and linked to fields
- 3D canvas accessibility: `role="img"`, aria-label, keyboard hotkeys (H, R, F, Escape)
- Skip links
- Alt text for all images

### 19.2 Internationalization
- Multi-language support: English (primary), Spanish, French, German (planned)
- Right-to-left (RTL) layout support
- Locale-aware date, number, currency formatting
- i18n routing (`/es`, `/fr`, `/de`)
- CMS content localization (planned)

### 19.3 Browser Support
Chrome 90+, Firefox 88+, Safari 14+, Edge 90+, Mobile Safari 14+, Chrome Mobile 90+, Quest Browser, Pico Browser, Vision Pro Safari.

---

## 20. Feature Domain 17 — Forms, Bookings & Communication

> **Requirements (SaaS)**: Contact + AI Brief forms (zod validation, honeypot), booking system (schedule studio sessions), in-platform messaging + email/SMS notifications. See §27.3/§27.5.

### 20.1 Contact Form
- Fields: name, email, phone, company, projectType, budget, message, status
- Stored in database (`ContactInquiry` collection/model — §6.4/§6.5)
- Email notifications to admin
- Anti-spam (honeypot + rate limiting)
- Status workflow: new → contacted → qualified → closed (managed in CMS)

### 20.2 Booking System
- Select service
- Choose date and time (calendar availability)
- Enter client details
- Public lead-capture fields: clientName, clientEmail, service, date, time, message, status enum (pending / confirmed / cancelled / completed)
- Admin approval or auto-confirmation
- Email notifications for both user and admin
- Calendar integration (Google Calendar, planned)
- Reschedule/cancel with notifications

### 20.3 AI Brief Form (Lead Capture)
- 4-step wizard
- Uploads reference images and 3D assets
- AI-generated concept renders, timeline estimate, budget range
- Auto-creates draft project in dashboard

### 20.4 Communication Systems
| Channel | Use |
|---------|-----|
| **In-app notifications** | Project updates, approvals, agent events |
| **Email** (Resend) | Notifications, invoices, magic links, booking confirmations |
| **Telegram / Discord / WhatsApp** | Admin alerts, agent notifications (planned) |
| **In-app messaging** | Client ↔ studio conversations |
| **Webhooks** | External service integration |

---

## 21. Technology Stack Matrix

### 21.1 Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15/16 (web, dashboard, xr) — one framework (App Router) |
| Language | TypeScript 5.3 (strict mode) |
| Styling | Tailwind CSS 3.4, Framer Motion 11 |
| Theme | next-themes (light / dark / system, default = system, §17.1) |
| Icons | lucide-react |
| Fonts | `next/font` self-hosted: Bebas Neue/Syne/DM Sans/JetBrains Mono |
| State | Zustand 4.5, TanStack Query 5.56 |
| Forms | React Hook Form + Zod |
| Charts | Recharts 2.12 |
| UI | shadcn/ui + VizTR shared-ui |

### 21.2 Backend
| Layer | Technology |
|-------|-----------|
| API Gateway | Express.js + Fastify 4.28 + Apollo Server (GraphQL) |
| Database | PostgreSQL 16 (Supabase) |
| Cache | Redis 7 |
| ORM | Prisma + Supabase client |
| Serverless | Supabase Edge Functions (auth hooks, webhooks, light compute) |
| Queue | BullMQ 5.15 |
| WebSocket | Socket.io 4.7 |
| Auth | Supabase Auth (single source — @supabase/ssr createServerClient), JWT |

> **Notes (audit 2026-08-05):** Socket.io requires long-lived connections — Vercel serverless limits apply; deploy Socket.io on Railway/Hostinger VPS or use Supabase Realtime instead. Documented before Phase 4. Convention: Prisma = migrations/schema/RLS-aware queries; Supabase client (`getClient`/`getServiceClient` factories) = Auth/Realtime only. No other auth-client pattern.

### 21.3 Infrastructure
| Layer | Technology |
|-------|-----------|
| Hosting | Vercel, Railway, Hostinger VPS |
| Containers | Docker, Kubernetes |
| CI/CD | GitHub Actions (Turborepo pipelines), Vercel Deployments, Supabase Migrations |
| Object Storage | Cloudflare R2 (3D/heavy assets), Supabase Storage (text/documents only), MinIO (local dev) |
| CDN | Cloudflare |
| Monitoring | Prometheus, Grafana (later), Vercel Analytics, Supabase Logs, Sentry (error tracking) |
| Tunnels | Cloudflare Tunnel, Coturn |
| Serverless | Supabase Edge Functions |

**Note:** Kubernetes = post-Series-A; Docker Compose + Railway for MVP.

**Workspace config (pnpm + Turborepo)**:

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// root package.json scripts
{
  "scripts": {
    "dev": "pnpm dev:web",
    "dev:web": "turbo dev --filter=viztr-web",
    "dev:agent": "turbo dev --filter=viztr-agent-server",
    "dev:local": "turbo dev --filter=viztr-local-runner",
    "dev:all": "pnpm -r --parallel dev",
    "build": "turbo build",
    "typecheck": "turbo typecheck",
    "lint": "turbo lint"
  }
}
```

**Recommended packages per app**: `turbo` (root); `@babylonjs/core`, `@babylonjs/gui`, `@babylonjs/materials`, `@babylonjs/loaders`, ``babylonjs-editor compile output → Next.js template``, `framer-motion`, `lucide-react`, `recharts`, `next-themes` (web); `@modelcontextprotocol/sdk`, `express`, `cors`, `dotenv`, `zod` (agent-server); `@modelcontextprotocol/sdk` (mcp package).

### 21.4 AI/ML
| Layer | Technology |
|-------|-----------|
| Providers | OmniRoute, OpenAI, OpenRouter, Groq |
| Models | GPT-4.1, Claude 3, Qwen 2.5 Coder / Qwen 3, LLaVA |
| Agent Frameworks | LangGraph (CEO orchestrator, online/cloud), AgentGPT (12 specialized agents, always-online browser multi-agent, self-hosted GitHub build), AutoGen (multi-agent options) |
| Agent UI / Interface | Open WebUI (self-hosted agent chat), Telegram/Discord/WhatsApp bots, AgentGPT browser UI |
| Local Agent Tools | Hermes Agent (local-runner, §10.1), everything-claude-code (agent tooling) |
| Knowledge | RAG; knowledge-graph layer (Graphify / GraphRAG-style) for Architecture Intelligence |
| Embeddings | nomic-embed-text (768 dims), mxbai-embed-large, bge-small-en |
| Image Gen | Stable Diffusion (16 style presets) |

**Cloud model tiers (API-provider LLMs)**:
- **Coding**: Qwen2.5-Coder, DeepSeek Coder, Code Llama (via API providers)
- **Planning / CEO Agent**: Qwen3, Llama 3.1, Mistral Large (via API providers)
- **Vision / image understanding**: LLaVA, Qwen2.5-VL
- **Chat**: Llama 3.2, Mistral
- **Embeddings / RAG**: nomic-embed-text, mxbai-embed-large, bge-small-en

**Knowledge base (zero-budget vs. production)**:
- **Zero-budget**: ChromaDB + API embeddings
- **Production**: Supabase pgvector (vectors + RLS in one place)
- **Alternative**: Qdrant
- Content list per §10.8 (SOPs, render/camera/lighting/material rules, export rules, WebXR/WebAR/VR/Tour/Pixel Streaming rules, pricing/proposal templates, QA checklists)

> **⚠️ Open-source tool due-diligence rule**: Before adopting any community agent tool (Hermes Agent, AgentGPT, Graphify, everything-claude-code, etc.), verify **license**, **maintenance status**, and **whether it runs without paid API keys**. Only adopt tools that are permissively licensed, actively maintained, and functional on the zero-budget stack.

> **⚠️ Minimal Software Rule (do not stack every framework)**: AutoGen, LangChain, LangGraph, Hermes, AgentGPT, Open WebUI, Graphify, and Everything-CLI must **NOT** all be used at once. Avoid adding too many tools in the beginning — use only what is needed. The recommended minimal subset is exactly **five layers**:
> 1. **LangGraph** — main control flow (CEO workflow, stateful task orchestration, online/cloud)
> 2. **AgentGPT** — the 12 specialized service/internal agents, always-online browser-based multi-agent system (self-hosted GitHub build)
> 3. **Hermes** — local execution (local-runner on the GPU workstation)
> 4. **Universal MCP Connector** — tool connectivity (Dashboard ↔ external systems, §10.4)
> 5. **API-provider LLMs** — model layer (OmniRoute → OpenAI → OpenRouter → Groq)
>
> Everything else (AutoGen, LangChain, Open WebUI, Graphify, Everything-CLI) is **optional / alternative** and is only adopted when a demonstrated gap requires it. Pick ONE orchestration framework per concern — never run two competing frameworks for the same job.

**LLM Smart Routing (task → model)**:
| Task | Model |
|------|-------|
| Simple dashboard tasks (CRUD, status, UI helpers) | gpt-4o-mini (API, fast/cheap) |
| Code generation | Qwen2.5-Coder / DeepSeek Coder (via API) |
| CEO planning & high-level reasoning | OpenAI (gpt-4.1) or Qwen3 |
| Local automation (Hermes) | API-provider small fast models |
| Production QA (final checks) | OpenAI + rule-based checks |
| Embeddings | nomic-embed-text (API) |

**OpenAI model recommendations (cloud tier)**:
- **gpt-4o-mini** — affordable default for planning/chat/agent tasks
- **gpt-4.1** — advanced coding & complex planning (primary cloud model)
- **o3-mini** — complex reasoning / multi-step agent decisions

> **Config shape**: `providers: { planning: 'gpt-4.1', chat: 'gpt-4o-mini', code: 'qwen2.5-coder', embeddings: 'nomic-embed-text' }` — agents pick a model per task via the routing table above.

### 21.5 3D/AR
| Layer | Technology |
|-------|-----------|
| WebGL | Babylon.js 8+ (Editor + Next.js template — core engine), Marzipano (named panorama-layer carve-out — 360° tour viewer only) |
| XR | WebXR API, MindAR, Babylon Native Viewer |
| Formats | GLTF, GLB, USDZ, FBX, OBJ, DAE |
| Compression | Draco, KTX2, Meshopt |
| DCC | Blender headless, Unreal Engine 5, SketchUp (FBX/DAE export), 3ds Max (FBX export) |
| Media | FFmpeg (video transcoding + poster extraction) |

> **Engine policy (§21.5)**: Babylon.js is the **single core 3D/XR engine** (Editor-first for non-technical designers, Next.js template with native hosting/export). Three.js + R3F are **superseded** — no parallel general-purpose 3D stack. Two **named, narrow exceptions** exist: (1) Three.js for a developer-built, code-driven 3D view with no designer touch; (2) **Marzipano** as the 360° panorama-layer viewer, scoped to `TourEngine` only, with Babylon.js `PhotoDome` as the fallback panorama path (see ADR 6.1 / ADR 6.1.1 in `implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md`).

### 21.6 Local Workstation Software (DCC + Production)
> **The local workstation is the heavy production machine** — it runs the 3D pipeline, Unreal Pixel Streaming, local AI agents, and local QA (§12.5).

| Category | Software |
|----------|----------|
| 3D / Modeling | Blender, Autodesk 3ds Max, SketchUp |
| Texturing | Substance 3D Painter, Substance 3D Sampler |
| 2D / Post | Adobe Photoshop, Adobe After Effects |
| Video | DaVinci Resolve (editing/color) |
| Asset Optimization | gltf-transform, Draco, Meshoptimizer, KTX2/BasisU, FFmpeg, Blender Python API |
| Unreal / Pixel Streaming | Unreal Engine 5, Pixel Streaming Plugin, Node.js signaling server, Coturn, Nginx, Cloudflare Tunnel |
| Dev Environment | VS Code / Cursor, GitHub Desktop, Git, Node.js 20/22, pnpm, Docker Desktop, Supabase CLI, Postman/Insomnia |
| Local AI | API LLM providers (models served via OmniRoute/OpenAI/OpenRouter/Groq, §21.4), Open WebUI (optional chat UI) |

**Local launcher** — a `.bat` script starts the full Pixel Streaming stack (see §9.6): Unreal session + signaling server + Cloudflare Tunnel + status reporter to the VizTR dashboard.

**Zero-budget MVP stack note**: free tiers only — Next.js on Vercel free, GitHub, Cloudflare (CDN/Tunnel/R2), Supabase free (Auth/Postgres/Storage/Edge Functions), API LLM providers on free/low-cost tiers (OmniRoute/OpenAI/OpenRouter/Groq). Paid infra (Railway, Hostinger VPS, GPU) added only when needed (see §24 MVP scope).

**MVP minimum tool set** — do not add extra plugins unless required (see Minimal Software Rule, §21.4):
1. VS Code
2. Git + GitHub
3. pnpm
4. Next.js
5. TypeScript
6. Tailwind CSS
7. shadcn/ui
8. Supabase
9. Babylon.js (Editor + Next.js template)
10. LangGraph (CEO workflow, online)
11. AgentGPT (online agent team — 12 specialized agents)
12. Hermes (local runner)
13. API LLM providers (model routing, §21.4)
14. MCP SDK (Universal Connector)
15. Blender
16. Unreal Engine 5
17. Cloudflare Tunnel
18. Vercel

---

## 22. Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse (all categories) | ≥ 90 |
| First Contentful Paint (FCP) | < 1.8s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Total Blocking Time (TBT) | < 200ms |
| Page load (public pages) | < 10s |
| API response time (p95) | < 200ms |
| Time to interactive | < 3s |
| 3D scene init | < 2s desktop, < 3s mobile |
| FPS | 60 desktop / 30 mobile / 90 VR |
| Pixel Streaming latency | < 100ms |

**Fast-loading rules (public website)**:
- App Router + static generation for public pages; server components by default
- Lazy-load Babylon.js and dashboards (import only on the routes that need them)
- `next/image` for all imagery; optimized variable fonts
- **No heavy video in the hero** — use the lightweight Babylon.js scene (§17.8)
- Lightweight 3D scene + compressed GLB (Draco/KTX2, ≤8-10MB, §9.19/§11.5)
- **Load 3D only after user interaction on mobile**
- **3D only on hero + service demo pages** — do not load heavy 3D on every page
| Core Web Vitals | LCP < 2.5s, CLS < 0.1, FID < 100ms, FCP < 1.8s |
| Asset compression ratio | 60-80% size reduction |
| XR model load (WebXR/AR/VR) | ≤ 8–10MB compressed (Draco, PBR, HDR) |

---

## 23. Scalability Model

| Dimension | Capacity |
|-----------|----------|
| Concurrent users | 10,000+ with auto-scaling |
| Concurrent projects | 1,000+ per workspace |
| Asset storage | 100TB+ with compression |
| Processing capacity | 1,000+ CPU hours/day |
| Stream viewers | 100+ concurrent per GPU node |
| CI pipeline | < 15 minutes |
| Selective deploys | Only changed apps deploy |

---

## 24. Development Roadmap

> **⚠️ INTERNAL — Discussion content. NOT for public/client sharing.**

### 24.1 90-Day Solo-Founder Roadmap Mapping
| Sprint | Focus | Deliverables |
|--------|-------|-------------|
| **Week 1-2** | Foundation | Monorepo, design system, GitHub, Supabase + Auth, dashboard shell (see Phase 1) |
| **Week 3-4** | Dashboards | Super Admin + User dashboards (stats, projects, tasks, bookings), CMS |
| **Week 5-6** | Command Center MVP | CEO Agent + LangGraph, Supabase Auth + RLS, chat UI (Open WebUI / custom), task creation, dashboard auto-refresh |
| **Week 7-8** | Asset Pipeline | Blender cleanup, batch GLB optimization, R2 storage, upload UX (see §11) |
| **Week 9-10** | XR Experience Engine | Experience engine + WebXR + Virtual Tour (see Phase 4) |
| **Week 11-12** | Service Agents | Website Dev Agent (auto-deploy pages), WebXR/Tour generators, WhatsApp/Slack/Telegram channel |
| **Week 13-14** | Monetization | Pricing/payments (Razorpay/Stripe), proposal generator |
| **Week 15-16** | Testing & Launch | Test suites, CI/CD, hardening, launch (see Phase 7) |

### 24.2 MVP Scope (Launch Gate)
**Included (must-have)**:
- 3D-first website (5 sections: Hero, About, Services, Portfolio, Contact)
- Supabase Auth (email + magic link), Supabase Postgres
- User dashboard: projects, tasks, client messages, profile
- Admin dashboard: manage users, projects, tasks, website content
- Command Center MVP: CEO Agent + chat, creates projects/tasks
- Website Dev Agent: generates MDX → PR → auto-deploy (see §10.9)
- WebXR + Virtual Tour generators (1 engine, shared experience JSON)
- Asset upload + Blender pipeline + R2
- Booking + proposal + basic payments

**Deferred (post-launch)**: Pixel Streaming scale, native apps, multiuser voice, AR cloud.

**First automated services order** (revenue-first): **Virtual Tour → WebXR → WebAR → VR → Pixel Streaming**. Virtual Tour and WebXR are the easiest to automate and bring revenue fastest. **Pixel Streaming is treated as an enterprise service**, not a free MVP feature (GPU required, see §9.6).

**MVP success criteria ("This MVP will prove")**:
- You can generate website content (Website Dev Agent → MDX → PR → deploy)
- You can manage projects (lifecycle, dashboards)
- You can assign tasks to AI agents (CEO Agent → task board)
- You can create XR demos from templates (WebXR + Virtual Tour generators)
- You can present everything from a command center (single dashboard)

### 24.3 MVP Development Order (18-Step)
**MVP reorder (audit 2026-08-05):** Virtual Tour generator should be executed at Step 7 (after Auth + basic Dashboard, before WebXR/agents), per revenue-first order §24.2 — Virtual Tours have lowest technical complexity and highest architectural-visualization demand. The Virtual Tour plan is `implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md`.

1. Next.js 3D website
2. Supabase Auth (with Google OAuth)
3. **Light/dark/system theme (next-themes, §17.1)**
4. Role-based dashboards
5. Project/task system
6. Command Center
7. **Universal MCP Connector (§10.4)**
8. **LangGraph CEO workflow (§10.7)**
9. **AgentGPT online agents (12 specialized agents, §10.1)**
10. Website Developer Agent
11. **Hermes Agent local runner**
12. WebXR template generator
13. Virtual Tour generator
14. **Pixel Streaming local connection**
15. **[Connect Local Development] button** (§12.5)
16. **QA workflow** (§12)
17. **[Publish] button** (§12.5 — QA-gated)
18. WebAR and VR automation

### Phase 1 — Foundation & Infrastructure (Weeks 1-2)
- [x] Monorepo setup (Turborepo)
- [x] Next.js apps (web, dashboard)
- [ ] TypeScript, ESLint, Prettier
- [ ] Shared packages (types, ui, utils, design-tokens)
- [ ] Database migrations (25 files)
- [ ] Docker Compose local environment
- [ ] Authentication system

### Phase 2 — Core Services (Weeks 3-4)
- [ ] API gateway + GraphQL
- [ ] MCP Server + 30 tools
- [ ] Agent system (13 agents)
- [ ] Queue system (BullMQ)
- [ ] File processing pipeline

### Phase 3 — Frontend Applications (Weeks 5-8)
- [ ] Design system components
- [ ] Public website (12+ marketing pages)
- [ ] Dashboard (25+ pages)
- [ ] Admin panel
- [ ] Client portal

### Phase 4 — XR Viewers (Weeks 9-10)
- [ ] Experience engine core
- [ ] 5 viewer modules
- [ ] Hybrid progressive immersion system (Tour → VR → AR)
- [ ] Mode Manager (tour/vr/ar state controller)
- [ ] 4-layer interaction architecture (Scene/Hotspot/Annotation/Teleport)
- [ ] Annotation system (one-at-a-time popup UX)
- [ ] Teleportation system (comfort-first)
- [ ] Decoupled XR engine (xr.viztr.com) + URL bridge
- [ ] Mini-map navigation overlay
- [ ] Control bar + premium XR UI system
- [ ] Asset pipeline (Draco, KTX2, Meshopt)
- [ ] Blender scripts
- [ ] UE5 Pixel Streaming config
- [ ] USDZ support for iOS AR Quick Look
- [ ] Multiuser (avatars + voice chat via WebRTC)
- [ ] Full Babylon.js WebXR demo (GLB/Draco loader, 8 HDR envs, Desktop/AR/VR)
- [ ] WebGL 360 Panorama viewer (Marzipano primary, Babylon.js PhotoDome fallback, gyroscope, inertia, multi-scene)
- [ ] Unified Viewer `/viewer` (3D + Panorama + Split View modes)
- [ ] GLB optimization pipeline (gltf-transform: validate → analyze → Draco/WebP/KTX2 → LODs)
- [ ] XR engagement analytics events + `/admin/analytics` charts
- [ ] Spatial AI advanced showcase (before/after, render-time chart, pipeline diagram)

### Phase 4.5 — XR MVP Sprint (This Week, no overthinking)
- [ ] Load 1 GLB model in XRCanvas
- [ ] Add 2 hotspots (teleport action)
- [ ] Add 1 annotation (open/close UX)
- [ ] Basic camera + teleport working
- [ ] Connect Firebase/Supabase project data
- [ ] Open from viztr.com → xr.viztr.com bridge
- [ ] Add VR mode (WebXR)
- [ ] UI polish (loader, transitions, mobile)
- [ ] Then go crazy: multiuser, voice chat, analytics

### Phase 5 — Platform Features (Weeks 11-12)
- [ ] Project config
- [ ] Asset upload
- [ ] QA engine
- [ ] Publish engine
- [ ] Interaction editor

### Phase 6 — AI Features (Weeks 13-14)
- [ ] AI Brief form end-to-end
- [ ] Agent-orchestrated scene generation
- [ ] Style presets
- [ ] Automated design suggestions

### Phase 7 — Testing, Deployment & Launch (Weeks 15-16)
- [ ] Unit/integration/E2E suites
- [ ] CI/CD pipelines
- [ ] Production hardening
- [ ] Monitoring + alerting
- [ ] Launch

### Post-Launch Roadmap
| Item | Priority | Status |
|------|----------|--------|
| Mobile apps (iOS/Android) | High | Planned |
| Razorpay / regional payments | Medium | Planned |
| Real-time co-editing | Medium | Planned |
| Multiuser with voice-guided tours | High | Planned |
| AI auto-annotations (property highlights) | Medium | Planned |
| Analytics for clients (hotspot clicks, time per room, drop-off) | High | Planned |
| Cinematic auto tour | Medium | Planned |
| Voice-guided tours | Medium | Planned |
| Metaverse / Web3 integration | Low | Future |
| AI video generation (3D → video) | Medium | Future |
| AR cloud / persistent AR | Medium | Future |
| Referral program | Medium | Planned |
| SOC 2 compliance | High | Planned |
| Spatial AI showcase (in-house Labs capability) | High | Planned |

---

## 25. Feature Status Tracker

> **How to use**: As features are implemented, flip the checkbox. New features are added as new rows/sections. This document is the editable source of truth.

| # | Feature Area | Status |
|---|-------------|--------|
| 01 | Public Marketing Website | Planned |
| 01.1 | Virtual Tour as Marketed Service (homepage + `/services/virtual-tour`) | Planned |
| 01.2 | Auto-Adaptive Section Ordering (segment/device/lead-stage rules) | Planned |
| 02 | Frontend Applications (web + dashboard) | Planned |
| 03 | Backend, API & CMS | Planned |
| 04 | Admin Dashboard & User Dashboards | Planned |
| 05 | Client Portal | Planned |
| 06 | XR Technology & Viewers (5 modes) | Planned |
| 06.1 | Hybrid Progressive Immersion (Tour → VR → AR) | Planned |
| 06.2 | Four-Layer Interaction Architecture | Planned |
| 06.3 | Mode Manager + Smart UX Patterns | Planned |
| 06.4 | Decoupled XR Engine (xr.viztr.com) | Planned |
| 06.5 | Multiuser Collaboration (avatars + voice) | Planned |
| 06.6 | Premium XR UI System | Planned |
| 06.7 | Babylon.js WebXR Demo (Desktop/AR/VR) | Planned |
| 06.8 | WebGL 360 Panorama Viewer | Planned |
| 06.9 | Unified Viewer `/viewer` (3D + Panorama + Split) | Planned |
| 06.10 | GLB Optimization Pipeline (gltf-transform) | Planned |
| 06.11 | XR Engagement Analytics Dashboard | Planned |
| 06.12 | Spatial AI Advanced Showcase | Planned |
| 06.13 | Admin XR Pages (`/admin/models3d`, `/admin/xr-world`) | Planned |
| 06.14 | Camera-Match Transition (Enter VR) | Planned |
| 06.15 | Consolidated UX Flow + Viewer Wireframes | Planned |
| 06.16 | XR Engine Route `/api/project/[id]` | Planned |
| 06.17 | `apps/xr` Monorepo App (xr.viztr.com) | Planned |
| 06.18 | Unified Experience JSON Schema (all 5 modes) | Planned |
| 07 | AI Agent System (13 agents, MCP) | Planned |
| 07.1 | Per-Service Agent Responsibilities (WebXR/WebAR/VR/Tour/Pixel Streaming/Website) | Planned |
| 07.2 | CEO Agent Orchestration Workflow + Guardrails | Planned |
| 07.3 | VizTR Architecture Intelligence (RAG + SOP KB) | Planned |
| 07.4 | Website Auto-Update System (Content-as-Code, MDX → PR → Vercel) | Planned |
| 07.5 | Open-Source Agent Tool Due-Diligence (license/maintenance/no-API-key) | Planned |
| 08 | Asset Management & Processing | Planned |
| 08.1 | Video Assets (MP4/WebM/MOV) + Transcoding Pipeline | Planned |
| 08.2 | SketchUp/3ds Max Sources + Material/Scale Checks | Planned |
| 08.3 | `pipelines/{blender,gltf,texture}` Processing Pipelines | Planned |
| 09 | Quality Assurance & Publishing | Planned |
| 10 | 3D Interaction Editor | Planned |
| 11 | Billing, Subscriptions & Monetization | Planned |
| 12 | Analytics & Observability | Planned |
| 13 | SEO & Growth | Planned |
| 14 | Design System & UX | Planned |
| 14.1 | Website 3D Theme "Architectural Intelligence Command Center" | Planned |
| 14.2 | Marketing Hero 3D Component Pattern (Babylon.js Editor scene) | Planned |
| 14.3 | Public Dashboard (anonymous read-only demo hub) | Planned |
| 14.4 | XR Service Dashboards (WebXR/WebAR/VR/Tour/Pixel Streaming) | Planned |
| 15 | Security, Compliance & Governance | Planned |
| 16 | Accessibility & Internationalization | Planned |
| 17 | Forms, Bookings & Communication | Planned |
| 18 | Connect/Publish Button Logic (hybrid local + cloud) | Planned |
| 19 | Hermes Agent Local Responsibilities (9 steps) | Planned |
| 20 | Local Workstation Software + Pixel Streaming Launcher | Planned |
| 21 | Local AI Models + Zero-Budget Knowledge Base (ChromaDB) | Planned |
| 21.1 | Minimal Software Rule (LangGraph + AgentGPT + Hermes + MCP + API LLM providers only) | Planned |
| 21.2 | LLM Smart Routing (task → model) + OpenAI model tiers (gpt-4o-mini/4.1/o3-mini) | Planned |
| 22 | Theme System (next-themes — light/dark/system, default = system) | Planned |
| 23 | Universal MCP Connector (dashboard ↔ Supabase/GitHub/Vercel/Files/Unreal/API LLMs) | Planned |
| 24 | Fast-Loading Website Rules (FCP <1.8s, TBT <200ms, page load <10s, 3D only hero + demo) | Planned |
| 25 | SaaS Platform Technical Description & Requirements (§27) | Planned |
| 26 | Comprehensive Implementation Plan (§28 — 30-area phased map) | Planned |
| 27 | Phase 0/1 Foundation execution (design system, theme, auth, RBAC) | Planned |
| 28 | Phase 2 Core Platform execution (public site, dashboards, portal) | Planned |
| 29 | Phase 3 Automation execution (agents, queue, publish, QA) | Planned |
| 30 | Phase 4 XR Engine execution (3D, streaming, editor, local, live) | Planned |
| 31 | Phase 5 Monetization execution (analytics, billing, booking, marketplace, API) | Planned |
| 32 | Phase 6 Hardening & Launch execution (security, SEO, perf, deploy) | Planned |
| 33 | XR Link Generator (public/password/token share links, expiry, view counts, revoke) | Planned |
| 34 | Review Viewport (pins + comments on renders, share link, visibility toggle) | Planned |
| 35 | Token-based Delivery Viewers (`/view/{tour,ar,vr,xr,stream}/[token]`) | Planned |
| 36 | Site Settings CMS (key-value store + Website Content CMS tabs) | Planned |
| 37 | Contact Inquiry Storage (`ContactInquiry` model + status workflow) | Planned |
| 38 | Blog Search / Featured Post / Category Filter | Planned |
| 39 | GA4 Analytics Integration | Planned |
| 40 | Demo Account Seeding (per-role) | Planned |

---

## 26. Appendix — Spec References

| Document | Path | Covers |
|----------|------|--------|
| Master Spec | `Dev_Docs/specs/00-MASTER-SPEC.md` | Vision, architecture, agents, contracts |
| Foundation & Infrastructure | `Dev_Docs/specs/01-FOUNDATION-INFRASTRUCTURE.md` | Packages, database, infra, CI/CD |
| Frontend Applications | `Dev_Docs/specs/02-FRONTEND-APPLICATIONS.md` | web, dashboard |
| Backend & Agents | `Dev_Docs/specs/03-BACKEND-AGENTS.md` | agent-server, MCP, 13 agents |
| XR Viewers | `Dev_Docs/specs/04-XR-VIEWERS.md` | 5 viewer modules, experience-engine |
| Platform Features | `Dev_Docs/specs/05-PLATFORM-FEATURES.md` | project-config, asset-upload, qa-engine, publish-engine, interaction-editor |
| SAAS Website Master Prompt | SYSTEM INSTRUCTION (user-provided) | Marketing site, CMS, admin dashboard, SEO |
| Hybrid XR Platform Architecture | User-provided (VR/Tour/XR Engine) | Progressive immersion, 4-layer interaction, mode manager, multiuser, premium XR UI |
| Senior WebXR Engineer / 3D Pipeline / Performance | User-provided spec | Three.js WebXR demo (Desktop/AR/VR), WebGL panorama, Unified Viewer, GLB optimization pipeline, XR analytics, Spatial AI showcase, admin XR pages |
| XR 1.txt (Solo-Founder AI-Operated Studio) | User-provided spec | CEO Agent orchestration workflow, 13-agent service responsibilities, Architecture Intelligence (RAG + SOP KB), unified experience JSON schema, agent-operated DB tables (website_pages, agent_runs), 90-day roadmap + MVP scope, content/prompts/docs folder structure, website auto-update (Content-as-Code) |
| XR 2.txt (Website 3D Theme + Starter Site) | User-provided spec | "Architectural Intelligence Command Center" theme, marketing hero 3D component pattern, marketing copy/taglines, Public Dashboard, open-source tool due-diligence rule, folder alignment (apps/agent-api, xr-runner, tools, pipelines/), first automated services order, MVP proof points |
| XR 3.txt (Software Selection + Hybrid Local/Cloud) | User-provided spec | Hybrid local+cloud architecture, Connect/Publish button workflows, Hermes Agent 9 local responsibilities, updated agent loop, Luxury Villa example, XR Service Dashboards, local workstation software, Pixel Streaming .bat launcher, local AI models, zero-budget vs production KB, monitoring (Vercel Analytics/Supabase Logs), backend decision reconciliation, local/ folder + pipelines/unreal, 15-step MVP order |
| XR 4.txt (Optimized Minimal Stack) | User-provided spec | Minimal Software Rule (no framework stacking), LangGraph (CEO) vs CrewAI (12 agents) ownership split, Universal MCP Connector diagram, LLM Smart Routing table + OpenAI model tiers, next-themes light/dark/system, Supabase Google OAuth setup + env vars, role access matrix (client approve milestones, public dashboard), TBT/page-load targets + fast-loading rules, pnpm workspace scripts + pnpm-workspace.yaml, frontend packages (next-themes/lucide-react), MVP minimum tool set, 18-step MVP order |
| SaaS Platform Technical Requirements (§27) | This document | Multi-tenant SaaS spec: definition/positioning, architecture, backend logic & working functions, data model & storage, connectivity & integrations, API surface, multi-tenancy & RBAC, monetization model, non-functional requirements, SaaS success metrics |
| Comprehensive Implementation Plan (§28) | This document | 30-area phased build map (Phase 0/1–6), milestones M0–M6, dependencies & critical path, execution plan file references |
| Phase Plan Files (execution) | `implementation-plans/` | 6 executable plans (Phase 0/1–6) — TDD tasks, acceptance criteria, checkpoints per area |
| Technical Decision Log (v1.2.0) | `implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md` | Authoritative tech decisions: Postgres/Supabase, Prisma, Cloudflare R2 + Supabase Storage split, Resend, Next.js single framework, LangGraph (online) + AgentGPT (online) + Hermes (local) + API LLMs routing, Babylon.js (Editor) XR engine, MonoRepo decisions, alternatives/scores, revisit schedule |

## 27. SaaS Platform — Technical Description & Requirements

> This section is the SaaS-mode technical specification of the VizTR platform. It is **additive** to the domain sections above (§4–§20) and defines the platform as a multi-tenant SaaS + managed service: architecture, backend logic, data model, connectivity, API surface, multi-tenancy/RBAC, monetization, non-functional requirements, and business metrics. Where a requirement here extends an earlier section, the earlier section remains authoritative; this section adds the SaaS-level technical depth.

### 27.1 Definition & Positioning
- **Product type**: Hybrid **SaaS + managed service**. Self-serve SaaS (project creation, AI-assisted generation, publishing, client portals, billing) plus a managed studio service (XR production, QA, delivery).
- **Tenant model**: Multi-tenant, single codebase; organization (tenant) scoping enforced at the database row level; per-tenant branding (white-label) at the theme level.
- **Core product loop**: **Upload once → Generate everywhere → Connect locally → QA automatically → Publish after approval.** Every feature below serves one step of this loop.
- **Service + SaaS boundaries**: Self-serve features are fully automated (agents + pipelines); service features are agent-assisted with human QA gates (§12).

### 27.2 System Architecture
- **Monorepo** (Turborepo + pnpm workspace, §21.3): `apps/web` (public Next.js), `apps/admin` (admin dashboard), `apps/client-portal` (client portal), `apps/api` (Express + GraphQL gateway — post-MVP), `apps/agent-api`; `packages/ui` (design system), `packages/database` (Prisma client), `packages/utils` (shared schemas/utilities), `packages/types`.
- **MVP constraint** (§24.2): frontend uses **Next.js API Routes + Supabase only**; the standalone `agent-server`/GraphQL layer is post-MVP (when agent scale demands it).
- **Hybrid local + cloud** (§10.7/§12.5): cloud hosts SaaS, public XR, orchestration; the local workstation (Hermes Agent) runs Unreal Engine rendering, heavy compute, and the Pixel Streaming source.
- **Microservices** (post-MVP, §23): `rendering-service`, `file-processor`, `notification-service`.
- **Decoupled XR engine**: `xr.viztr.com` serves viewers/engine independently of the marketing site (§9.13).

### 27.3 Backend Logic & Working Functions
Functional spec of each working module (each maps to a domain section):

| # | Module | Logic & Working Functions | Section |
|---|---|---|---|
| 1 | Authentication | Supabase Auth — email/password + Google OAuth; JWT access + refresh; session mgmt; password reset; account deletion (GDPR). | §18.1 |
| 2 | Authorization / RBAC | Roles → permissions → RLS policies; middleware/route guards; server-side enforcement on every API call. | §3.2, §27.7 |
| 3 | Projects & Versions | Lifecycle draft → in-progress → review → approved → published → archived; project versions; client-visible milestones with approval state. | §7, §8 |
| 4 | Upload Pipeline | Resumable multipart upload → validation (type/size/content scan) → object storage → queue job. | §11.2 |
| 5 | Job Queue | BullMQ + Redis — processing, rendering, optimization, notification jobs; retries, dead-letter queue, priority lanes. | §6.1, §11 |
| 6 | Optimization Pipeline | GLB Draco/KTX2, texture resize, LOD generation, video transcode (H.264/WebM), image AVIF/WebP. | §11.5 |
| 7 | AI Brief → Project | Form submit → agent-generated brief → auto-created project + agent task board entry. | §4, §20 |
| 8 | Agent Orchestration | CEO Agent (LangGraph, online) plans; AgentGPT executes the 12 specialized agents online; Hermes Agent runs local tasks; every run recorded in `agent_runs`; LLM Smart Routing selects the API-provider model per task. | §10 |
| 9 | Content-as-Code Auto-Update | Agents edit `website_pages` + repo content → CI build → deploy; human approval gate before publish. | §10.9 |
| 10 | QA Engine | Automated checks (render correctness, links/assets, performance) → QA report → publish gate decision. | §12 |
| 11 | Connect / Publish | Local ↔ cloud sync; publish button pushes to hosting (Vercel/GitHub); status reporter updates dashboard. | §12.5 |
| 12 | Interaction Editor | Persists interaction/config JSON per project version; event-driven model consumed by the XR engine. | §13 |
| 13 | Pixel Streaming | WebRTC session broker; local Unreal Engine streams via `.bat` launcher; session auth + analytics. | §9.6 |
| 14 | Multi-User Live Sessions | Presence, avatars, voice (WebRTC), scene-state sync. | §9.14 |
| 15 | Booking | Availability, scheduling, reminders (email/SMS). | §20 |
| 16 | Billing | Stripe checkout; subscription lifecycle; usage metering (render credits); invoices; signature-verified webhooks. | §14, §27.8 |
| 17 | Notifications | Email (Resend), SMS (Twilio), in-app; per-role notification rules. | §6.6, §20 |
| 18 | Audit Logging | Immutable audit events for sensitive operations (auth, publish, billing, permissions). | §18 |

### 27.4 Data Model & Storage
- **PostgreSQL 16 + Prisma** — 100 models (§6.5) grouped by domain:
  - *Identity & orgs*: User, Client, Admin, Staff, Organization
  - *Projects*: Project, ProjectVersion, ProjectAsset
  - *Marketing/CMS*: website_pages, Portfolio, PortfolioImage, Service, ServicePricing, Blog, BlogCategory, Faq, ContactInquiry, Testimonial, NavigationItem, Settings
  - *Commerce*: Order, Invoice, Payment, Subscription, Plan, UsageMeter
  - *Communication*: Message, Thread, Notification
  - *XR*: Experience, ExperienceMode, Session, ViewerConfig, XrShareLink
  - *Analytics*: Analytics, Metric, Report
  - *Themes*: Theme, ThemeTemplate, StylePreset
  - *Agents*: agent_runs, website_pages (Content-as-Code)
- **Redis 7** — queue (BullMQ), API cache, session store, rate-limit counters.
- **Object storage (split by content type)**:
  - **Supabase Storage** — client text data, internal text data, and documents only (no heavy/binary content): contracts, briefs, messages, invoices, spec files, small media. Kept on the Postgres-backed store for RLS/access control and text-indexability.
  - **Cloudflare R2 (S3-compatible)** — all 3D/heavy assets: source assets, optimized GLB, video (MP4/WebM), images (AVIF/WebP), AI-generated content (no egress fees, CDN-backed).
- **Vector DB** — ChromaDB (zero-budget) / Supabase pgvector (production) for Architecture Intelligence RAG (§10.8).
- **Backups** — daily automated + point-in-time recovery; 30-day retention; DR region plan (§23).

### 27.5 Connectivity & Integrations
| System | Integration | Purpose |
|---|---|---|
| Supabase | SDK + RLS + Edge Functions | Auth, Postgres, RLS, Storage (text/docs only), auth hooks, webhooks |
| GitHub | REST + webhooks | Content-as-Code repo, CI triggers, preview deploys |
| Vercel | REST + webhooks | Deploys, preview URLs, Vercel Analytics |
| Stripe | API + webhooks | Subscriptions, payments, invoices, refunds |
| Resend / Twilio | API | Email + SMS notifications |
| Unreal Engine (local) | Hermes MCP + `.bat` launcher | Local rendering + Pixel Streaming source |
| OpenAI / OpenRouter / OmniRoute / Groq | API | Cloud LLM providers (smart routing, §21.4) |
| Supabase Storage | SDK + RLS | Client text data, internal text, documents (no heavy data) |
| Cloudflare R2 + Cloudflare CDN | S3 API + CDN | 3D assets + heavy media delivery (no egress fees) |

### 27.6 API Surface
- **MVP**: Next.js API Routes under `/api/v1/*` (§6.2 map — 115+ endpoints across public/admin/client/internal/auth).
- **Post-MVP**: Express `agent-server` gateway + optional GraphQL layer (§6.3).
- **Auth**: Supabase JWT verification on every request; public endpoints on an allowlist.
- **Rate limiting**: per-IP + per-user tiers; counters in Redis.
- **Validation**: zod schemas shared between server and client (`packages/utils`).
- **Webhooks**: Stripe, GitHub, Vercel — signature verification + idempotency keys.
- **File endpoints**: presigned upload/download URLs for object storage.

### 27.7 Multi-tenancy & RBAC
- **Roles** (§3.2): Public, Client, Staff, Admin, Super Admin + system/service roles.
- **RLS**: every tenant-owned table carries `org_id`; Postgres RLS enforces tenant isolation; service-role key is server-side only.
- **Role access matrix** (XR 4 reconciliation): client approves milestones; public = website + Public Dashboard; staff = assigned projects; admin = org-wide; super admin = platform-wide.
- **White-label**: per-org theme-token overrides; optional per-org domain (CNAME) and branding.

### 27.8 Monetization Model
- **Tiers**: Free / Pro / Studio / Enterprise — feature limits in §11.4/§14.
- **Usage-based**: rendering credits, Pixel Streaming minutes, AI generation credits.
- **Service fees**: managed XR production, per-deliverable pricing.
- **Marketplace**: asset + theme marketplace with platform fee.
- **White-label SaaS**: reseller pricing — per-seat or revenue share.
- **Entitlements**: subscription state + usage cached in Redis; refreshed on Stripe webhooks; enforced at the API boundary.

### 27.9 Non-Functional Requirements
- **Performance** (§22): API p95 < 200ms; LCP < 2.5s; TBT < 200ms; public page load < 10s; Lighthouse ≥ 90.
- **Availability**: 99.9% target; graceful degradation when a local workstation is offline.
- **Scalability** (§23): stateless API scale-out; queue-based async processing; CDN for static/media; DB read-replicas at scale.
- **Security** (§18): HTTPS everywhere; JWT + refresh; RLS; rate limiting; input validation/sanitization; CORS; CSRF tokens; XSS protection; file validation; audit logging.
- **Compliance**: GDPR/CCPA (data export + deletion); SOC 2 Type II roadmap; WCAG 2.1 AA.
- **Observability**: Vercel Analytics, Supabase Logs, Sentry, structured logs; infra + business dashboards.
- **Localization**: i18n-ready content (CMS + Content-as-Code); RTL-ready layout tokens.

### 27.10 SaaS Success Metrics
| Metric | Target |
|---|---|
| Time to first interactive XR demo | ≤ 3 min from project creation |
| Activation (signup → first publish) | ≥ 30% |
| Client approval cycle reduction | ≥ 60% vs. traditional renders |
| Lead conversion (site visitor → lead) | ≥ 5% |
| Paid churn | < 3% monthly |
| Lighthouse | ≥ 90 all categories |
| API response | < 200ms p95 |

---

## 28. Comprehensive Implementation Plan

> Covers every platform area as a phased build map. Execution detail (TDD tasks, acceptance criteria, checkpoints) lives in the plan files under `implementation-plans/` (§26). Status mirrors the §25 tracker; all items start **Planned**.

### 28.1 Phase Map
| Phase | Focus | Areas |
|---|---|---|
| Phase 0/1 — Foundation | Monorepo, database, auth, design system | 1–5 |
| Phase 2 — Core Platform | Public site, dashboards, client portal | 6–12 |
| Phase 3 — Automation | Agents, queue, publish, QA | 13–18, 23 |
| Phase 4 — XR Engine | 3D engine, streaming, editor, local, live | 21–22, 24–26 |
| Phase 5 — Monetization | Analytics, billing, booking, marketplace, API | 19–20, 27–30 |
| Phase 6 — Hardening & Launch | Security, SEO, design polish, performance, deploy | 31–34 |

> Note: "Design System" appears twice in the source list — folded into Area 1 (Phase 0/1) with a Phase 6 polish pass (Area 33).

### 28.2 Phase 0/1 — Foundation (Areas 1–5)
| # | Area | Key deliverables | Status |
|---|---|---|---|
| 1 | Design System & Shared UI Library | `packages/ui` tokens, primitives, docs | Planned |
| 2 | Theme Provider (next-themes) | light/dark/system, default = system | Planned |
| 3 | Authentication System (Supabase Auth) | email + Google OAuth, sessions, refresh | Planned |
| 4 | Basic Authentication UI | login/signup/forgot/reset, route guards | Planned |
| 5 | Role-Based Access Control (RBAC) | roles, RLS policies, guards, access matrix | Planned |

### 28.3 Phase 2 — Core Platform (Areas 6–12)
| # | Area | Key deliverables | Status |
|---|---|---|---|
| 6 | Website Public Pages (Marketing) | SSR/SSG pages, §4 route map | Planned |
| 7 | Hero Section (3D + Marketing Copy) | lightweight Babylon.js hero (§17.8) | Planned |
| 8 | Service Pages | Virtual Tour, WebXR, WebAR, VR, Pixel Streaming | Planned |
| 9 | AI Brief Submission Form | zod validation, honeypot, → project | Planned |
| 10 | Project Dashboard (User Portal) | project list, status, uploads, activity | Planned |
| 11 | Admin Panel (Project Management) | project CRUD, staff assignment, analytics | Planned |
| 11b | Super Admin Panel (§7.1) | users/orgs/platform health, role assignment, feature flags, audit browser, agent governance — Phase 2 Task 6b | Planned |
| 12 | Client Portal (Approval & Downloads) | milestone approvals, file downloads, feedback | Planned |

### 28.4 Phase 3 — Automation (Areas 13–18, 23)
| # | Area | Key deliverables | Status |
|---|---|---|---|
| 13 | Website Auto-Update System | Content-as-Code, `website_pages`, CI deploy | Planned |
| 14 | AI Agent System (13 Agents, MCP) | LangGraph (online) + AgentGPT (online) + Hermes (local) + API LLMs, Universal MCP Connector | Planned |
| 15 | Hermes Agent (Local Runner) | local orchestration, `.bat` launcher | Planned |
| 16 | Connect / Publish Workflow | local↔cloud sync, publish button, status | Planned |
| 17 | Upload Pipeline | resumable upload, validation, storage | Planned |
| 18 | Job Queue System | BullMQ + Redis, retries, DLQ | Planned |
| 23 | Quality Assurance & Publishing | QA checks, report, publish gates | Planned |

### 28.5 Phase 4 — XR Engine (Areas 21–22, 24–26)
| # | Area | Key deliverables | Status |
|---|---|---|---|
| 21 | 3D Experience Engine | WebGL/WebXR/AR/VR/Tour, Unified Viewer | Planned |
| 22 | Pixel Streaming | WebRTC broker, session auth, analytics | Planned |
| 24 | Interaction Editor | interaction/config JSON editor | Planned |
| 25 | Local Workstation Software | Unreal + streaming setup, tooling | Planned |
| 26 | Multi-User Live Sessions | presence, avatars, voice, scene sync | Planned |

### 28.6 Phase 5 — Monetization (Areas 19–20, 27–30)
| # | Area | Key deliverables | Status |
|---|---|---|---|
| 19 | Analytics & Observability | XR engagement, funnels, Sentry, Vercel/Supabase logs | Planned |
| 20 | Billing & Subscriptions | Stripe tiers, usage metering, webhooks | Planned |
| 27 | Booking System | availability, scheduling, reminders | Planned |
| 28 | Marketplace | asset/theme listing, fees, payouts | Planned |
| 29 | White-Label SaaS | per-org themes, domains, reseller plans | Planned |
| 30 | API Access | public API keys, scopes, docs, rate limits | Planned |

### 28.7 Phase 6 — Hardening & Launch (Areas 31–34)
| # | Area | Key deliverables | Status |
|---|---|---|---|
| 31 | Security & Permissions | penetration pass, RLS audit, compliance docs | Planned |
| 32 | SEO & Growth | sitemap, structured data, OG, agent content | Planned |
| 33 | Design System Polish | accessibility pass, RTL, final tokens | Planned |
| 34 | Performance Optimization | bundle budgets, Core Web Vitals, CDN | Planned |
| + | Production Launch | envs, backups, monitoring, runbooks | Planned |

### 28.8 Milestones
| Milestone | Definition of Done |
|---|---|
| M0 | Monorepo + packages + DB schema + CI skeleton |
| M1 | Design system, theme, auth, RBAC complete (Phase 0/1) |
| M2 | Public site, dashboards, client portal live (Phase 2) |
| M3 | Agents, queue, publish, QA path operational (Phase 3) |
| M4 | XR engine, streaming, editor, local, live sessions (Phase 4) |
| M5 | Billing, booking, marketplace, API, white-label (Phase 5) |
| M6 | Hardening, SEO, performance, production deploy (Phase 6) |

### 28.9 Dependencies & Critical Path
- **Design system (1)** blocks all frontend work (6–12).
- **Auth (3) + RBAC (5)** block dashboards, client portal, publish, and billing.
- **Queue (18)** blocks upload (17), optimization, rendering, and agent jobs.
- **DB schema (M0)** precedes every module.
- **Agents (14)** depend on queue (18) + auth; **auto-update (13)** depends on agents + CI.
- **Pixel Streaming (22)** depends on 3D engine (21) + local workstation software (25).
- **Billing (20)** precedes booking (27), marketplace (28), and white-label (29).
- **QA (23)** gates publish (16) — non-negotiable.
- **Security (31) + Performance (34)** are cross-cutting: iterate throughout, final pass in Phase 6.

---

## How to Edit This Document

1. **Add a new feature**: Insert a new subsection under the relevant Feature Domain (numbered 4-20), or add a new Feature Domain before the Technology Stack section.
2. **Update status**: Flip checkboxes in Section 25 and the roadmap.
3. **Add roadmap items**: Append rows to the Post-Launch Roadmap table.
4. **Add spec references**: Append rows to Section 26.
5. **Keep consistency**: Any new feature should also be reflected in: the status tracker (25), the relevant domain section, and any API/database implications.

---

*This is a living document. Version bumps on meaningful changes. Maintained by the VizTR Architecture Team.*
*Version 1.7.0 — Gap-analysis feature additions (2026-08-05): XR World homepage section (2×2 product cards, per-card brand colors) + `/xr/*` product-page namespace + `/team` + `/careers` + inner-page breadcrumbs (§4); blog featured-post hero / category filter / search (§4.2); per-product accent tokens (§17.7); CMS collections + models ContactInquiry, Settings, Faq, Blog, BlogCategory, Testimonial, NavigationItem (menus persisted via Settings JSON), XrShareLink + Booking public lead-capture fields (§6.4/§6.5 — 100 models, §27.4); token-based public delivery viewers for all 5 XR modes (§9.13); WebAR custom markers + matrix-code fallback + fullscreen + device-orientation (§9.4); VR gaze cursor with dwell-timer selection (§9.17); WebXR AR shadows/anchors/occlusion (§9.4/§9.19); Pixel Streaming screenshot capture (§9.6); ExperienceConfig `devices` device matrix (§9.12); Supabase Auth account management + role-based post-login redirect + per-role demo account seeding (§18.1); Super Admin/Admin/Studio/Client dashboard breadth with built-vs-spec status tags (§7.1/§7.2/§7.3/§7.7/§8.2); Website Content CMS tabs + theme customization (§5.3); Review Viewport QA note (§12); GA4 analytics injection (§16.3); tracker rows (§25).*
*Version 1.6.0 — Audit remediation (2026-08-05): MVP reorder note (Virtual Tour to Step 7); Socket.io deployment constraint; K8s deferred post-Series-A; dual-ORM convention documented (Prisma + Supabase client); NextAuth.js removed from §21.2 (Supabase Auth single source); Phase 0/1 schema + package stubs + apps/agent-api scaffold added; marzipano cross-review fixes.*
*Last updated: August 5, 2026 | Version 1.5.0 — Marzipano 360° Virtual Tour integration (ADR 6.1.1): Marzipano adopted as named panorama-layer carve-out (Apache 2.0) for the 360° tour viewer only, Babylon.js stays core engine with PhotoDome as fallback (§9.1/§21.5); full 44-feature reference (Categories A–F) added to §9.2 with Phase 1→2→3 priority; View Modes #8 hybrid = Marzipano ⇄ Babylon.js dollhouse via ModeManager (§9.13); TechStack Virtual Tour row + Decision Log ADR 6.1.1 updated; dedicated plan at implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md.*

*Previous: Version 1.4.0 — 3D/XR engine pivot to Babylon.js: Babylon.js 8+ (Editor + Next.js template) adopted as the single core 3D/XR engine, superseding Three.js + React Three Fiber (ADR 6.1 Revised) (§5.1/§21.5); removed R3F/drei/@react-three-xr from core role — named narrow Three.js exception only for developer-built non-editor data-viz views; migrated Virtual Tour → PhotoDome, WebXR/AR/VR → Babylon.js WebXR, §9.17/§9.19/§9.20, §13.2 viewport, §17.8 hero, tool set, tracker + §28 rows; verified no parallel 3D stacks (§21.5).*

*Previous: Version 1.3.0 — Agent & storage stack refinement: dropped CrewAI and Ollama; agent stack now LangGraph (CEO, online/cloud) + AgentGPT (12 specialized agents, online browser multi-agent) + Hermes (local) + API-provider LLMs (OmniRoute/OpenAI/OpenRouter/Groq) (§10.1/§10.2/§21.4); Minimal Software Rule back to five layers (§21.4); object storage split by content — Supabase Storage (client text/internal text/documents only) + Cloudflare R2 (3D/heavy assets) (§21.3/§27.4/§27.5); email Resend retained (§27.3/§27.5); smart-routing/zero-budget/config notes aligned to API models (§21.4/§21.6); Hermes sync responsibility split (text→Supabase, 3D→R2) (§10.3).*

*Previous: Version 1.2.9 — Decision reconciliation (aligns feature doc with VIZTR-TECHNICAL-DECISION-LOG.md): object storage → Cloudflare R2 (§27.4/§27.5/§21.4), dashboard → Next.js 15/16 single framework (§5.2/§21.1), email → Resend (§27.3/§27.5), added AgentGPT (always-online browser-based multi-agent, self-hosted GitHub build) to agent stack (§10/§21.1/§21.4/§27.3/§28.4), Minimal Software Rule five→six layers (§21.4).*

*Previous: Version 1.2.5 — Enhanced XR 3.txt (Software Selection + Hybrid Local/Cloud) coverage: Connect/Publish button logic (§12.5), Hermes Agent 9 local responsibilities (§10.3), agent loop with Hermes/Connect/Publish steps + Luxury Villa example (§10.7), XR Service Dashboards (§7.7), dashboard route-map additions (§5.3), local workstation software (§21.6), Pixel Streaming .bat launcher + status reporter (§9.6), local AI models + use-category split (§21.4), zero-budget vs production KB (ChromaDB/Qdrant) (§10.8/§21.4), Vercel Analytics + Supabase Logs (§15.2/§21.3), backend decision reconciliation (§6.1), local/ folder + pipelines/unreal + hermes-agent.md (§2.1), 15-step MVP dev order (§24.3), header version sync.*
