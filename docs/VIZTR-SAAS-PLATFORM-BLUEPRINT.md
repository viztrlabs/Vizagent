# VizTR SaaS Platform — Complete Build Blueprint

> **Purpose:** Master plan for building the entire VizTR SaaS platform — public 3D immersive website, service hubs (Studio + XR World), 4-role dashboard system, CRM, Analytics, AI, and the "non-coding website" content engine.
>
> **Companion docs:** `VIZTR-COMPLETE-FEATURES.md` (source of truth), `VIZTR-TECHSTACK-SELECTION.md`, `VIZTR-TECHNICAL-DECISION-LOG.md`, `VIZTR-IMPLEMENTATION-STARTER.md`, `VIZTR-BABYLON-VS-PLAYCANVAS.md`.

---

## 1. The Vision — What "Wow" Means

The user must feel awe the moment the site loads. Three layers of "wow":

| Layer | Effect | Technology |
|---|---|---|
| **1. Site-level immersion** | Live 3D hero, deep-breathing motion, scroll-driven camera, glowing cyan/violet atmosphere | WebGL scene (Babylon.js), Lenis smooth scroll, GSAP, Framer Motion |
| **2. Content animation** | Every section breathes, fades, and reacts as the user scrolls | Scroll-triggered reveal system, spring physics, parallax |
| **3. Product-level demo** | XR World services launch in-dashboard with real simulations | Babylon.js XR engine + Marzipano tours + Unreal pixel streaming |

**Design language (locked):** Dark luxury — near-black surfaces, glassmorphism, cyan (#00e5ff) + violet (#7c3aed) accents, architectural-grid typography, cinematic motion.

---

## 2. Complete Page & Feature Map

### 2.1 Public Website (Marketing — no login required)

| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | 3D hero, services teaser, portfolio showcase, stats, testimonials, CTA |
| `/services` | **Services Hub** | Two pillars: Studio + XR World |
| `/services/studio` | **Studio Hub** | Portfolio-style landing for the 4 sub-services |
| `/services/studio/architectural` | Studio service | Architectural visualization showcase |
| `/services/studio/interior` | Studio service | Interior visualization showcase |
| `/services/studio/exterior` | Studio service | Exterior visualization showcase |
| `/services/studio/animation-walkthrough` | Studio service | Animation & walkthrough showcase |
| `/services/xr-world` | **XR World Hub** | Landing page for all 5 XR services with **live demo buttons** |
| `/services/xr-world/webxr` | XR service | WebXR experience + demo |
| `/services/xr-world/webar` | XR service | WebAR experience + demo |
| `/services/xr-world/virtual-reality` | XR service | VR experience + demo |
| `/services/xr-world/virtual-tour` | XR service | 360° virtual tour + demo |
| `/services/xr-world/pixel-streaming` | XR service | Unreal pixel streaming + demo |
| `/about` | About Us | Story, team, process, technology |
| `/contact` | Contact | Form -> CRM lead |
| `/portfolio` | Portfolio | Filterable case studies (Architectural, Interior, etc.) |
| `/demo/:slug` | **Public XR Demo** | Password-free shareable client demos (tour, VR, AR) |
| `/blog` | Blog | Content marketing (optional phase) |

**Key rule:** Every page, section, service card, portfolio item, and demo link is **editable from the admin** (see Section 5 — non-coding website).

### 2.2 Service Hubs (The Two Product Pillars)

**Studio — acts as a portfolio website page.**
Each sub-service (Architectural, Interior, Exterior, Animation/Walkthrough) has its own portfolio grid, filterable by category, populated from the database. Clicking a project opens a case study with images, description, and (if applicable) an XR demo link.

**XR World — landing page + in-dashboard demo launcher.**
The XR World page presents the 5 services. Clicking a **demo link** takes the user into the experience. There are two demo surfaces:

1. **Public demo links** (shareable) — for marketing and clients.
2. **The XR World Console** (in the dashboard) — a single dashboard where all 5 services live: **WebXR, WebAR, Virtual Tour, Virtual Reality, Pixel Streaming**. The user selects a service, and the console simulates/launches it instantly.

### 2.3 Authenticated App (The Dashboard Platform)

| Route | Page | Role(s) |
|---|---|---|
| `/app` | Role-aware dashboard home | All |
| `/app/studio` | Studio / portfolio manager | Admin, User/Studio |
| `/app/xr` | **XR World Console** (5 services in one) | Admin, User/Studio, Client (view) |
| `/app/xr/:service` | Individual XR service console | Admin, User/Studio |
| `/app/crm` | CRM (leads, deals, contacts, tasks) | Admin, User/Studio |
| `/app/analytics` | Analytics dashboard | Super Admin, Admin |
| `/app/ai` | AI tools & API access | Super Admin, Admin |
| `/app/content` | **Page builder / content manager** | Super Admin, Admin |
| `/app/projects` | Project management | Admin, User/Studio, Client |
| `/app/clients` | Client management | Admin, User/Studio |
| `/app/billing` | Invoicing & subscription | Super Admin, Admin |
| `/app/team` | Team & role management | Super Admin, Admin |
| `/app/settings` | Workspace settings | Role-scoped |

---

## 3. The 4-Role System & Access Matrix (RBAC)

One platform, four personas. Every route, API, and UI action is gated by role.

### Role 1 — Super Admin (Platform Owner)
- **Dashboard:** Platform overview — all studios, all users, system health, revenue, global analytics.
- **Can do:** Manage all tenants, create admin accounts, view/edit everything, global content approval, billing configuration, AI API keys, feature flags, system settings.

### Role 2 — Admin (Studio Operator)
- **Dashboard:** Studio operations — project pipeline, team, content, CRM, analytics, AI tools.
- **Can do:** Edit all website content (non-coding), manage studio's portfolio & XR projects, manage clients, create User/Studio accounts, run CRM, view analytics, use AI generation tools, handle billing for their studio.

### Role 3 — User/Studio (Creative Account)
- **Dashboard:** Their work — portfolio, XR projects, demo links, client list.
- **Can do:** Upload 3D assets, build XR experiences in the XR World Console, generate & share demo links, manage their assigned clients, track approvals. **Cannot** edit global site content or see other users' data.

### Role 4 — Client (End Customer)
- **Dashboard:** Their projects only — progress bars, milestone approvals, deliverables, shared XR demos, messaging.
- **Can do:** Approve/reject milestones, view 3D/XR previews, download deliverables, message the studio. **Cannot** see any admin or other-client data.

### Access matrix (summary)

| Capability | Super Admin | Admin | User/Studio | Client |
|---|:---:|:---:|:---:|:---:|
| Edit website content (non-coding) | ✅ | ✅ | — | — |
| Manage all users/tenants | ✅ | — | — | — |
| Create & manage XR projects | ✅ | ✅ | ✅ | — |
| Generate/share demo links | ✅ | ✅ | ✅ | — |
| CRM (leads/deals) | ✅ | ✅ | ✅ | — |
| Analytics | ✅ | ✅ | — | — |
| AI tools / API access | ✅ | ✅ | — | — |
| View own projects | ✅ | ✅ | ✅ | ✅ |
| Approve milestones | — | ✅ | ✅ | ✅ |
| Billing & invoicing | ✅ | ✅ | — | — |

**Implementation:** Supabase Auth + custom `roles` table + Row Level Security (RLS) policies per tenant. Each API call re-checks role claims from the JWT.

---

## 4. The XR World Console (Single Dashboard, 5 Services)

This is the product's showpiece. One dashboard, five services. Selecting a service launches its simulation:

| Service | What the console simulates | Engine |
|---|---|---|
| **WebXR** | Immersive VR/AR session in-browser (controllers, hand tracking) | Babylon.js WebXR |
| **WebAR** | Marker / image-target AR on mobile camera | Babylon.js + MindAR |
| **Virtual Tour** | 360° panorama walkthrough with hotspots | Marzipano (carve-out) |
| **Virtual Reality** | Desktop/mobile VR viewer with gaze interaction | Babylon.js |
| **Pixel Streaming** | Live Unreal Engine stream via WebRTC | Unreal + Pixel Streaming Web |

**User flow:** Select service → see project list → pick a project → simulation launches fullscreen → interaction tracked (session time, hotspots, drops) → analytics recorded.

**Engine decision (from pending comparison):** Babylon.js wins for WebXR, WebAR, VR, and Pixel Streaming UI overlay. Marzipano remains the lightest path for pure 360° tours. See `VIZTR-BABYLON-VS-PLAYCANVAS.md`.

---

## 5. The Non-Coding Website — Content Engine (Critical Architecture)

**Requirement:** After development, *everything* on the website is updated from the dashboards. No developer required for content changes.

### 5.1 Content model (database-driven pages)

```
Page 1──n Section 1──n Block (typed)
```

- **Page** — URL slug, title, SEO meta, layout, published/draft status, updated by.
- **Section** — vertical slice of a page (Hero, Services, Portfolio, Stats, CTA…).
- **Block** — typed content unit with JSON props (heading, body, image, link, media, order).

### 5.2 Block types (the "Lego" of the site)

Hero3D, HeroText, ServicesGrid, PortfolioGrid, XRLauncher, FeatureRow, StatsBar, Testimonials, Process, Team, FAQ, Pricing, RichText, Media, Gallery, CTASection, ContactForm, Embed, Divider, LogoWall.

### 5.3 Page Builder (admin)

- Visual block editor: add, reorder, edit, duplicate, delete blocks.
- Live preview pane + responsive breakpoints (desktop/tablet/mobile).
- Draft → Publish workflow with instant or scheduled publishing.
- **Version history** and **one-click rollback**.
- Content updates render immediately via ISR revalidation — **no redeploy needed**.

### 5.4 Global content sets

Navigation menus, footer, site-wide theme settings, service definitions, portfolio items, XR project metadata, team members, testimonials, contact info — all stored as structured content and editable from admin.

---

## 6. Platform Modules

### 6.1 CRM
- **Leads:** from contact form + demo link captures.
- **Pipeline:** lead → qualified → proposal → won/lost (kanban).
- **Contacts & accounts:** clients, stakeholders, communication history.
- **Tasks & activity log** per lead/client.
- Role-scoped: Admin/User manage; Super Admin sees all.

### 6.2 Analytics
- **Site analytics:** page views, events, demo link clicks, conversion funnels.
- **XR analytics:** VR session duration, tour hotspot heatmaps, AR launch rate, pixel streaming session stats.
- **Business analytics:** pipeline value, win rate, revenue, project status.
- Dashboards differ per role (Super Admin = platform-wide; Admin = studio-wide).

### 6.3 AI (by API access)
- **AI content generation** inside the page builder (headlines, copy, project descriptions).
- **AI image generation** for portfolio covers / service thumbnails.
- **AI chat assistant** on the site and in the dashboard.
- **AI automation:** CRM lead scoring, project brief summaries, milestone drafting.
- **Architecture:** OpenAI-compatible API gateway in `agent-server`, keyed per tenant, usage metered for billing. Connects to the existing 13-agent system (CEO agent, service agents, Hermes).

---

## 7. The 3D "Wow" Website — Motion & Immersion Playbook

### 7.1 Tech
- **WebGL scene:** Babylon.js for the marketing hero and immersive sections (shared engine with the product = one codebase).
- **Motion:** GSAP (ScrollTrigger) + Framer Motion + Lenis smooth scroll.
- **Performance budget:** 60fps, WebGL auto-fallback, `prefers-reduced-motion` support, code-split 3D bundles (only load on demand).

### 7.2 Signature effects
1. **Deep-breathing hero:** 3D scene subtly scales/glows on a 6–8s sine cycle (the "live breathing website").
2. **Scroll-driven camera:** hero camera dollies through an architectural model as the user scrolls.
3. **Section reveals:** staggered fade/rise/tilt on scroll; content "breathes" on hover.
4. **3D service cards:** Studio & XR World cards tilt and glow in 3D as the cursor moves.
5. **Custom preloader:** cinematic logo animation while the 3D scene warms up.
6. **Glassmorphism chrome:** frosted panels over the WebGL canvas for the nav, cards, and CTAs.
7. **XR demo previews:** inline live previews on the XR World page (tour spins, AR mockup, VR window).

### 7.3 Where 3D lives (and where it doesn't)
- **3D/immersive:** home hero, service hubs, portfolio items with 3D models, XR demo pages.
- **Lightweight:** about, contact, blog, legal — fast, text-first, still animated but no heavy WebGL.

---

## 8. Data Model — Key Tables

| Domain | Tables |
|---|---|
| **Identity & roles** | `users`, `roles`, `user_roles`, `tenants`, `tenant_members`, `invitations` |
| **Content** | `pages`, `sections`, `blocks`, `media_assets`, `menus`, `site_settings`, `revisions` |
| **Services & portfolio** | `services`, `portfolio_projects`, `project_categories`, `case_studies` |
| **XR** | `xr_projects`, `xr_services`, `xr_demos`, `xr_sessions`, `demo_links`, `tour_hotspots` |
| **CRM** | `crm_leads`, `crm_deals`, `crm_contacts`, `crm_pipeline_stages`, `crm_tasks`, `crm_activities` |
| **Projects** | `projects`, `milestones`, `deliverables`, `project_comments`, `approvals` |
| **Analytics** | `analytics_events`, `page_views`, `xr_session_events`, `conversion_funnels` |
| **AI** | `ai_configs`, `ai_conversations`, `ai_generation_logs`, `api_keys` |
| **Billing** | `plans`, `subscriptions`, `invoices`, `payments`, `usage_metering` |

---

## 9. Tech Stack Map (Locked)

| Layer | Choice | Note |
|---|---|---|
| Frontend | Next.js 16.2 + React + TypeScript | Apps: `web`, `dashboard`, `xr` |
| UI | Tailwind + shadcn/ui | Dark luxury theme tokens |
| State | Zustand + TanStack Query | |
| 3D/XR | **Babylon.js** (core), Marzipano (tours), Unreal pixel streaming | ADR 6.1 Revised |
| Backend | Next.js API routes (MVP) → Fastify (post-MVP) | `agent-server` |
| Database | Supabase PostgreSQL + Prisma + RLS | |
| Auth | Supabase Auth + JWT + RBAC | 4 roles |
| Storage/CDN | Cloudflare R2 + CDN | 3D assets, panoramas |
| AI | OpenAI-compatible gateway + Ollama | 13-agent system |
| Infra | Vercel + Railway + Cloudflare, GitHub Actions, Turborepo | |

---

## 10. Phased Delivery Roadmap

| Phase | Focus | Deliverables | Duration |
|---|---|---|---|
| **A — Foundation** | Monorepo, DB, auth, RBAC, 4-role scaffolding | Role-aware shell, RLS policies, seed data | Week 1–3 |
| **B — Content Engine** | Page/section/block models, admin page builder | Non-coding website capability | Week 3–5 |
| **C — 3D Wow Website** | Babylon hero, GSAP motion, public pages | Home, Services, Studio, XR World, About, Contact | Week 5–8 |
| **D — XR World Console** | 5-service console, demo launcher, Marzipano tours | In-dashboard XR simulations | Week 8–11 |
| **E — Studio & Portfolio** | Portfolio manager, case studies, filtering | Studio hub live | Week 11–12 |
| **F — CRM + Analytics** | Leads, pipeline, site & XR analytics | CRM & analytics dashboards | Week 12–14 |
| **G — AI Integration** | Page-builder AI, chat assistant, agent wiring | AI tools live | Week 14–16 |
| **H — Client Portal + Billing** | Client dashboard, approvals, invoicing | Full 4-role launch | Week 16–18 |

**MVP milestone = end of Phase D:** public 3D site + XR World Console + admin content editing + 4-role auth. Everything beyond is add-on value.

---

## 11. What We Build First (Day-1 Order)

1. Monorepo scaffold + Supabase + auth + 4 roles.
2. Content model (pages/sections/blocks) + basic admin editor.
3. Dark luxury design system + 3D hero proof-of-concept (Babylon.js).
4. Home page + Services pages from database content.
5. XR World Console v1 (Virtual Tour first — fastest win, then WebXR/WebAR/VR/Pixel Streaming).

---

## 12. The "Wow" Acceptance Checklist

- [ ] Site loads with cinematic preloader, hero "breathes" on a cycle
- [ ] Scroll drives smooth camera + staggered section reveals at 60fps
- [ ] Every public page fully editable from the admin — zero code changes for content
- [ ] 4 roles each see exactly their own dashboard (verified with RLS tests)
- [ ] XR World Console launches all 5 services in-dashboard
- [ ] Demo links shareable, tracked, and analytics visible to the studio
- [ ] Mobile performance holds (WebGL fallback + reduced-motion respected)

---

*Blueprint version 1.0 — August 10, 2026*
