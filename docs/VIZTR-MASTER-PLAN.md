# VizTR Platform — Master Implementation Plan
**Modules · Features · Sprints · Risks · Costs · Build Scope**

> **Version:** 1.1 · **Date:** August 10, 2026 · **Status:** Working master reference (synthesis)
>
> **Purpose:** One consolidated plan synthesized from all 12 planning documents (executive summaries, tech specs, sprint plans, risk matrix, cost model, MVP scope lock, master features doc, context, database schema). Covers **modules, features, sprints, risks, costs, and build scope** — the shared factual backbone the team plans against.
>
> **Execution-path decision (LOCKED 2026-08-10):** The owner has directed a **complete build** — the full VizTR website and platform: all 18 module groups, all 5 XR modes, all 13 agents, all dashboards and roles, the non-coding content engine, billing, and full security. A lean "waitlist-first, Virtual-Tour-only" MVP proposal from an earlier draft has been **rejected and removed** from this plan.
>
> **Tech stacks intentionally excluded.** Per owner instruction, no engine/framework/vendor names from the source documents are carried into this document. Our finalized stack is governed by the separate technical decision log and the existing blueprint; **the "which technology and why" discussion happens in a dedicated session.**
>
> **Relationship to other documents:**
> | Document | Role |
> |---|---|
> | `VIZTR-SAAS-PLATFORM-BLUEPRINT.md` | Page map, 4-role RBAC, XR World Console, content engine, build order, wow-motion playbook |
> | `VIZTR-UXUI-DESIGN-SYSTEM.md` | Locked dual-theme design language (dark/light/auto, glass, tokens) |
> | `VIZTR-PROMPT-ENGINEERING-SYSTEM.md` | How we build: brief-driven, Claude-led multi-tool pipeline |
> | `VIZTR-TECHNICAL-DECISION-LOG.md` | Locked technical decisions (the "reconcile-to" reference) |
> | **`VIZTR-MASTER-PLAN.md` (this file)** | The single planning surface: modules, features, sprints, risks, costs, build scope |

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Execution Strategy — Locked: Complete Build](#2-execution-strategy--locked-complete-build)
3. [Module & Feature Catalog](#3-module--feature-catalog)
4. [Data Model (Table Groups)](#4-data-model-table-groups)
5. [API Surface](#5-api-surface)
6. [Role & Access Model](#6-role--access-model)
7. [Build Roadmap — Complete Build](#7-build-roadmap--complete-build)
8. [Build Scope — Complete Platform](#8-build-scope--complete-platform)
9. [Risk Register](#9-risk-register)
10. [Cost Model](#10-cost-model)
11. [Launch Gates & Success Metrics](#11-launch-gates--success-metrics)
12. [Open Decisions](#12-open-decisions)
13. [Contributor Rules](#13-contributor-rules)

---

## 1. Executive Summary

**What VizTR is.** An AI-agent-powered architectural-visualization platform that takes **one uploaded asset** (a 360° image or a 3D model) and turns it into **five XR experiences**: Virtual Tour (360°), WebXR (browser walkthroughs), WebAR (mobile augmented reality), VR (headset-native), and Pixel Streaming (photoreal remote-rendered sessions driven by a local GPU). A non-technical website + dashboards means the whole public site and every project are editable without code, from admin pages.

**The value claim.** What takes a studio 40+ hours and manual per-mode production today becomes a few hours: upload once → automated processing → QA gate → human approval → one-click publish → shareable link.

**Who it serves.** ArchViz studios (primary), independent architects, real-estate developers, interior designers, and their clients (viewers/approvers).

**What this plan locks for planning purposes:**
- **One locked execution path: the complete build.** Every module, XR mode, agent, dashboard, and platform feature ships in the first full release (§2, §7). No validation-first MVP.
- **18 module groups** that together cover the full platform (§3).
- **Five XR experiences** as the core product surface; Virtual Tour is the cheapest, fastest mode and therefore **first in the build order** — not the only thing built.
- **Four platform roles** (Super Admin, Admin, User/Studio, Client) with a read-only viewer surface for the public.
- **A complete build scope** — every feature in the catalog has a scheduled home; requests beyond the catalog are governed by a change protocol (§8).
- **A consolidated risk register** with the top risks quantified and mitigated (§9).
- **A 16-month cost model** with breakeven math in Indian Rupees (§10).

**The remaining open planning decisions** are the technology stack (§12) and cost reconciliation. Everything else in this document is consensus content extracted from the source docs.

---

## 2. Execution Strategy — Locked: Complete Build

**We build the complete VizTR website and platform.** The owner reviewed the lean "waitlist-first, Virtual-Tour-only MVP" proposal and rejected it: VizTR is a complete platform build — every public page (Home, Studio, XR World, About, Contact), all 5 XR modes, the non-coding content engine, all 4-role dashboards, CRM/Analytics/AI access, billing, and the 13-agent AI system. Nothing is deferred pending a validation experiment.

**Why lean was rejected.** It contradicts the product vision (a complete, immersive, non-coding platform) and the market need (studios need the full multi-mode workflow, not a single tour link). The earlier draft's "nothing ships until a customer pays" core idea has been removed.

**What the complete build means for planning:**
- **Scope:** all 18 module groups (§3) ship in the first full release — nothing in the catalog is optional.
- **Order:** a phased internal build sequence (§7). Everything is in scope; phases are sequenced by dependency, not by market gating.
- **Risk stance:** the accepted trade-off is building before product-market fit is proven. Mitigations exist — validation activities run **in parallel** while we build: a public waitlist, demo content, and beta-partner outreach from day one. See §9.
- **Website experience:** the public site is immersive and 3D with real motion (per `VIZTR-UXUI-DESIGN-SYSTEM.md`), and every page is editable later from the admin content engine (Blueprint B/C).

---

## 3. Module & Feature Catalog

The full platform decomposed into **18 module groups**. Priority P0 = build in Phases 0–1, P1 = Phases 2–4, P2 = Phases 5–6 (all in scope for the first release). "Phase" references map to the build roadmap in §7.

### M1 · Foundation & Shared Building Blocks
**Priority: P0 | Phase 0**
- Shared type definitions + validation schemas for every entity (70% test coverage target).
- Shared UI component kit (buttons, inputs, cards, dialogs, tables, forms, badges, avatars, status indicators).
- Shared utilities (date/string/number helpers, API client, validation helpers).
- Design tokens package (dual-theme dark/light/auto semantic tokens) — from `VIZTR-UXUI-DESIGN-SYSTEM.md`.
- Monorepo scaffolding + CI baseline (lint, test, type-check on every push).

### M2 · Identity & Access Control
**Priority: P0 (auth core) / P1 (full) | Phase 1 / Phase 4**
- Email/password authentication with session tokens (short-lived access + refresh).
- Optional providers: Google/GitHub OAuth, magic link.
- Multi-factor authentication (TOTP).
- **4 roles:** Super Admin, Admin, User/Studio, Client (+ public viewer surface). RBAC enforced at every boundary.
- Workspaces & memberships (multi-tenant container with per-member workspace role).
- Row-level data isolation on every table (workspace/tenant isolation).
- API keys for programmatic access (Studio tier+).
- Audit logging of all actions (admin + agent actions) for compliance.

### M3 · Project & Workspace Management
**Priority: P0 | Phase 1**
- Projects as the core entity: every XR experience is a project.
- Create / read / update / delete, duplicate, archive, and per-project settings.
- Project status lifecycle: draft → uploaded → processing → QA pending → QA passed → connected locally → ready to publish → published → archived.
- Multiple service types per project (a project can hold tour + webxr + vr outputs).
- Budget, deadline, and progress tracking fields.
- Activity feed + shortcut access on the project dashboard.

### M4 · Asset Pipeline
**Priority: P0 (ingest) / P1 (full pipeline) | Phase 1 / Phase 2**
- **Ingest:** multi-file upload (360° images; 3D formats), presigned-URL direct upload, progress bars, resumable/large-file handling.
- **Validation:** file type, size, dimension (min 4096×2048 for 360°), aspect ratio (~2:1), EXIF metadata, corruption check.
- **Optimization:** mesh decimation, UV optimization, texture compression + mipmaps, LOD generation (original / 50% / 80% / mobile-ultra-low).
- **Generation:** auto-thumbnailing, metadata extraction (triangle counts, bounding box, materials, animations), deployment manifest creation.
- **360° tiling:** multi-resolution tile engine for fast loading on slow connections.

### M5 · XR Experience Engines — the five core products
**Priority: Virtual Tour P0; WebXR/WebAR P1; VR/Streaming P2 | Phase 1 / 2**

**5.1 Virtual Tour (360° panoramic)**
- Load + render equirectangular 360° imagery, inside-out.
- Orbit (mouse), touch (swipe), gyroscope, fullscreen, share link.
- Hotspots with tooltips, portal navigation between scenes/rooms, floor-plan mini-map, compass/orientation.
- Multi-scene tours with scene ordering and auto-hotspot linking.
- One-click CDN publish, shareable URLs, view analytics, custom branding (paid tiers).

**5.2 WebXR (browser immersive VR)**
- Auto conversion of 3D models to web-optimized format, LODs, compression, mesh decimation.
- Scene setup: auto camera paths, lighting, material switching, skyboxes.
- VR entry from browser: teleportation, smooth locomotion, comfort modes (fade-to-black).
- Controller input, raycasting, VR hotspots, hand tracking where supported.
- Dynamic resolution scaling, FPS-driven LOD switching, GPU memory management.

**5.3 WebAR (mobile augmented reality)**
- Device capability detection + graceful fallback for unsupported browsers.
- Markerless placement (plane/surface detection) and marker-based (QR/pattern).
- Real-world scale calibration; touch rotate/scale/move.
- Shadow projection and environment lighting estimation.

**5.4 VR (native headset)**
- Device targets: Quest family, Vision Pro, Vive, Pico.
- Full 6DOF tracking, haptics, gesture recognition, comfort options.
- Floating panels, immersive keyboard, gesture navigation.
- True 90 FPS target with predictive rendering.

**5.5 Pixel Streaming (photoreal remote rendering)**
- Server-side render of a high-fidelity scene, streamed to any device.
- Local GPU workstation orchestration (task queue, start/stop, monitoring) with cloud fallback.
- WebRTC low-latency (<100 ms), adaptive bitrate, quality controls.
- Live FPS / latency / bandwidth indicators and viewer controls.

### M6 · Interaction & Scene Editor (no-code)
**Priority: P1 | Phase 3**
- Hotspot placement editor (position, label, description, icon, media attachments).
- Animation timeline + keyframes.
- Branching logic / conditional navigation.
- Multi-mode preview inside the editor.
- Camera-path authoring (cinematic auto-paths).

### M7 · QA Engine (pre-publish gate)
**Priority: P0 | Phase 1**
- Automated checks (5 core): file size, dimensions, aspect ratio, EXIF, corruption.
- Extended checks: triangle budget, texture budget, mobile score, VR comfort score, FPS estimate.
- QA report persisted per project (check results, issues, automated score).
- Manual override with approver identity + notes.
- **Rule: publish is blocked unless QA passes.**

### M8 · Publish & Deployment Engine
**Priority: P0 | Phase 1**
- Preview deploy → production deploy with status polling.
- Public shareable URL per mode (e.g., /tour/:id).
- Publish gate: QA passed AND human approval token.
- Deployment history per project with rollback.
- Webhooks out: `project.deployed`, `asset.processed`, `comment.created`.
- Password-protected links (client tier) and white-label/custom-domain (studio+).

### M9 · Content Engine — the non-coding website
**Priority: P1 | Phase 3**
- Every public page, section, and block editable from the admin page builder.
- **Page → Section → Block** content model with `is_placeholder: true` flags for placeholder-first content.
- Visual block editor: drag/drop blocks, per-block properties, block palette.
- Draft → publish workflow, version history, rollback, scheduled publication.
- SEO metadata editing, blog engine, portfolio page generator.
- Agent-generated content (website-developer agent) lands here for human approval.

### M10 · XR World Console (User/Studio dashboard)
**Priority: P2 | Phase 6**
- Single dashboard that launches **all five XR services** from one place: pick a project → choose mode → preview → simulate → publish.
- Live multi-XR preview, device-compatibility checks.
- Project dashboard with activity feed, view metrics, shortcuts.
- Asset management: upload, versioning, bulk operations.
- Studio/portfolio manager: create portfolio projects, generate shareable demo links.
- CRM (leads, deals, contacts, tasks — role-scoped).

### M11 · Client Portal & Collaboration
**Priority: P2 | Phase 6**
- Client sees only their projects: status, public URLs, shared previews.
- Pinned 3D annotations, threaded comments, @mentions.
- Approval workflows (request → approve/reject with notes).
- Deliverables: shareable URLs, ZIP exports, password protection.
- Version history and feedback collection.

### M12 · Admin & Super Admin Console
**Priority: P1 | Phase 3**
- User directory: RBAC controls, login history, API-key issuance, suspension.
- Live agent task board: view of the orchestration queue and execution status.
- Server/usage monitoring: CPU/memory/GPU, API response times, error rates.
- Audit logs viewer; billing & subscription administration.
- Full content-engine access to edit every public page.

### M13 · CRM, Analytics & AI Access
**Priority: P2 | Phase 5**
- **CRM:** leads, deals, contacts, tasks, pipeline (role-scoped visibility).
- **Analytics:** view counts, unique visitors, session duration, per-mode and per-project stats, conversion funnels, export (PDF/CSV).
- **AI by API access:** natural-language commands routed to the agent system; dashboard widget for issuing commands and reviewing results.

### M14 · Billing & Subscriptions
**Priority: P1 | Phase 6**
- Four tiers: Free, Pro, Studio, Enterprise with feature entitlements and limits.
- Monthly/annually toggle with annual discount (20%), bold Pro-tier CTA on pricing page.
- Upgrade/downgrade, proration, dunning, refunds, invoice generation, usage metering (processing minutes, storage, GPU hours).
- Payment providers (domestic + international) wired behind one billing service.

### M15 · AI Agent System (13 agents)
**Priority: P2 | Phase 5**
- **Orchestration:** CEO Agent routes and plans all work; deterministic state machines; context isolation between agents; communication only via structured state.
- **Local controller:** Hermes Agent — direct file-system + GPU access on the local workstation; runs asset processing, 3D pipelines, local QA, Pixel Streaming builds, tunnels.
- **XR conversion agents:** WebXR, WebAR, VR, Virtual Tour, Pixel Streaming — each turns an asset into its mode.
- **Platform service agents:** Website Developer, Finance, Analytics, QA, Support, Design, Sales, Content.
- **Tool access via connector:** 30+ tools exposed through a uniform tool interface; per-agent tool allowlist; budget limits; approval gates; emergency stop.
- **Guardrails:** never auto-execute spend, never deploy production without approval, never send contracts/invoices without human sign-off, private data never shared.

### M16 · Communication & Notifications
**Priority: P2 | Phase 6**
- Transactional email: project uploaded, QA finished, published (with link), invoice issued.
- In-app messaging / client-portal conversations.
- Multi-channel (Telegram/Discord/WhatsApp) notifications and support-agent help desk with FAQ generation.

### M17 · Enterprise & Marketplace
**Priority: P2 | Phase 6**
- White-label branding, custom domains per project, SSO/SAML.
- Public API access with keys, webhooks, custom integrations (CRM/MLS).
- Dedicated server instances, SLAs, dedicated GPU nodes for streaming.
- Multi-tenant marketplace: user-created templates, material packs, lighting presets, furniture packs, camera presets — creator payouts + platform commission.

### M18 · Infrastructure & Operations
**Priority: P0 (baseline) / P1 (full) | Phase 0 / 4**
- Hosting for frontend + APIs; managed or self-hosted database; object storage for assets + 360° tiles; cache + queue for background jobs.
- CI/CD: lint → test → type-check → build → preview deploy → production deploy.
- Monitoring: error tracking, performance monitoring, uptime alerts, log aggregation.
- Backup/restore tested regularly; security review before each major release.
- Environments: local → preview → production; secrets management.

---

## 4. Data Model (Table Groups)

Consolidated from the source schema docs. Table names are the entity contract; the underlying database technology is a tech-stack decision (deferred). All multi-tenant tables enforce workspace-based row isolation; all tables use UUID primary keys, JSONB for flexible config, and created/updated timestamps.

| Group | Tables | Notes |
|---|---|---|
| **Identity & workspace** | users, workspaces, workspace_members | users extend auth with role (`super_admin`, `admin`, `user`, `client`); members carry per-workspace role (`owner`/`admin`/`member`/`viewer`) |
| **Projects** | projects, scenes, interactions | projects hold service types + status lifecycle + 3D/XR settings; scenes are per-mode outputs; interactions are hotspots/nav/materials/animations |
| **Assets** | assets | file metadata, storage path, versioning, optimization flag, rich metadata JSONB (triangles, bounding box, materials, animations) |
| **Jobs & processing** | jobs | background work: convert, optimize, generate each mode, QA check, deploy; progress tracking, worker id, error messages |
| **QA** | qa_reports | checks, issues, automated score, FPS estimate, triangle/texture budgets, mobile + VR scores |
| **Deployments** | deployments, local_sync | environments (preview/production), commit sha, build logs, rollback; local_sync tracks Hermes connection + tunnel status |
| **Agent system** | tasks, agent_runs, agent_logs, tool_usage_logs | work items, execution runs (tokens + cost), structured logs, tool invocation audit |
| **Communication** | conversations, messages | multi-platform threading (web/telegram/discord/whatsapp), sender types (user/agent/system) |
| **Approvals** | approvals | human-in-the-loop gates: requester, approver, status, notes |
| **Financial** | invoices, expenses, usage_records | billing + metering |
| **Analytics** | analytics_events | custom business/agent metrics |
| **Website content** | website_pages | slug, title, content, SEO, status, agent-created flag, approver |
| **Pixel streaming** | pixel_streams | stream status, signaling/tunnel URLs, fps, latency, bitrate, viewer count, GPU usage |
| **Bookings** | bookings | demo / design review / VR walkthrough / WebXR session / streaming sessions |
| **Enterprise** | sso_configurations, tenants, marketplace_items, marketplace_purchases | SAML/OIDC configs, tenant isolation, marketplace catalog + transactions |
| **Audit & RAG** | audit_logs, embeddings | admin/agent action audit; vector store for agent knowledge (RAG) |

**Cross-cutting:** triggers maintain `updated_at`; job timestamps auto-update on status transitions; indexes exist on all foreign keys + status columns + date columns; storage is organized in typed buckets (originals, optimized, textures, lightmaps, thumbnails, previews, 360 tiles, invoices, QA reports, proposals).

---

## 5. API Surface

Consolidated REST endpoint groups. Full OpenAPI specs are a launch-phase deliverable. All endpoints enforce role claims at the boundary.

| Group | Endpoints (pattern) | Notes |
|---|---|---|
| **Auth** | `/auth/signup · login · logout · refresh · me · mfa/enable · mfa/verify · password/reset` | session + MFA |
| **Workspaces** | `/workspaces` CRUD + `/workspaces/:id/members` manage | |
| **Projects** | `/projects` CRUD, `/projects/:id/timeline`, duplicate, archive | |
| **Assets** | `/assets/upload-url` (presigned), `/assets/:id`, `/projects/:id/assets`, metadata patch | |
| **Scenes** | `/projects/:id/scenes` CRUD + reorder | |
| **Interactions** | `/scenes/:id/interactions` CRUD | hotspot/nav data |
| **XR generation** | `/xr/generate` per mode, `/xr/demo-link`, session analytics | WebXR/WebAR/VR/Tour/Stream |
| **QA** | `/qa/run`, `/qa/:job/status`, `/projects/:id/qa-reports`, manual override | |
| **Deployments** | `/deployments/preview · publish · :id/status · rollback`, `/projects/:id/deployments` | publish blocked unless QA passed + approved |
| **Agents** | `/agents/ceo/run`, `/agents/hermes/task`, `/agents/runs`, `/agents/runs/:id/logs`, cancel | |
| **Analytics** | `/analytics/usage · views · projects/:id/stats · dashboard` | |
| **Billing** | `/billing/invoices · payment-method · usage · upgrade` | |
| **Webhooks** | listeners for `project.deployed`, `asset.processed`, `comment.created`; outbound configurable | |

---

## 6. Role & Access Model

| Role | Scope | Can do | Cannot do |
|---|---|---|---|
| **Super Admin** | Whole platform | Billing, configuration, user management, everything an Admin can | — (top of hierarchy) |
| **Admin** | Workspace/all projects | Project oversight, deployment configs, content management, audit views | Billing config, system settings |
| **User / Studio** | Own workspace + client projects | Upload assets, build XR projects, manage team + clients, portfolio, CRM (own scope), API keys | Billing config, system settings |
| **Client** | Own projects only | Read, comment, annotate, approve/reject | Write/upload, see other tenants |
| **Public** | Public pages + shared viewer links | View published experiences, submit lead/waitlist | Anything authenticated |

Enforcement model: row-level isolation on all tables (workspace/tenant scoped), role claims verified at every API boundary, signed short-expiry asset URLs, private storage by default.

---

## 7. Build Roadmap — Complete Build

All modules are in scope; this is the internal build sequence ordered by dependency. Phases can be parallelized where dependencies allow (especially Phases 3–6); the base plan runs sequentially with a per-module rhythm of **develop → test → finalize** before the next module.

| Phase | Weeks (approx) | Modules | Deliverable |
|---|---|---|---|
| **0 — Foundation** | 1–2 | M1 | Shared types, UI kit, utils, design tokens, monorepo, CI baseline |
| **1 — Core Platform** | 3–10 | M2 (auth core), M3, M4 (ingest + validation), M5.1 (Virtual Tour), M7, M8 | Upload → preview → QA → publish loop for Virtual Tour, public viewer live |
| **2 — All XR Modes** | 11–18 | M5.2 (WebXR), M5.3 (WebAR), M5.4 (VR), M5.5 (Pixel Streaming) | All 5 XR mode engines operational |
| **3 — Interactivity, Content Engine & Public Site** | 19–22 | M6, M9, M12, immersive public website | Interaction editor; non-coding content engine + admin page builder; admin console; cinematic 3D public site |
| **4 — Infrastructure & Security** | 23–28 | M18, M2 (full: RLS/MFA/OAuth/API keys/audit), M16 | Production-grade infra, full security, CI/CD, monitoring, communications |
| **5 — AI Agent System** | 29–44 | M15, M13 | CEO/Hermes + XR + service + support agents (13 total), tool connector, CRM/analytics/AI access |
| **6 — Console, Portal, Billing & Enterprise** | 45–52 | M10, M11, M14, M17 | XR World Console, client portal, billing, enterprise + marketplace features |
| **7 — Testing, Security & Launch** | 53–56 | M18 hardening | Integration/E2E/load, security audit (penetration + vulnerability), docs, marketing site polish, launch |

**Build principles:**
- **Sequential module completion by default:** each module is developed → tested → finalized before the next starts. Parallelize only where dependency analysis proves it safe.
- **Per-module rhythm (source):** Days 1–8 develop, 9–12 test, 13–14 finalize.
- **Quality is non-negotiable:** tests are part of Definition of Done; no merge without tests; lint + type-check in CI.
- **Preview-first:** every phase ships a preview deployment so internal stakeholders and design partners can react early — this is how the complete build stays honest about product direction (see §9 risk mitigations).

---

## 8. Build Scope — Complete Platform

**Everything in the catalog ships in the first full release.** All 18 module groups (§3) are in scope. The earlier lean draft listed most of the platform as "locked until Phase 2" — that deferral is removed.

**What this means:**
- All 5 XR modes are in scope (Virtual Tour builds first, then WebXR, WebAR, VR, Pixel Streaming).
- The non-coding content engine and immersive public website are in scope (Phase 3).
- Full security (RLS, MFA, OAuth, API keys, audit) is in scope (Phase 4).
- All 13 AI agents are in scope (Phase 5).
- XR World Console, client portal, CRM/analytics/AI access, billing, and enterprise features are in scope (Phases 5–6).

**Change control.** Any request beyond the §3 catalog (a genuinely new module or feature) follows the formal protocol: written justification → Tech Lead + Product Owner approval → **+1 week per feature** to the roadmap → re-communicate to the team. The default is "schedule it," not "reject it" — but never silently.

---

## 9. Risk Register

Consolidated from `4-VizTR-Risk-Matrix`. Scoring: Probability × Impact. Review weekly during sprints; convert to issues when materialized.

### Top risks (all-time watch list)

| Rank | ID | Risk | Score | Primary mitigation |
|---|---|---|---|---|
| 1 | R001 | Market doesn't want the product | **70** | Run validation **in parallel with the build**: waitlist + demo content + beta-partner outreach from Week 1; interview signups as they arrive |
| 2 | R003 | WebGL/XR rendering fails or underperforms on iOS Safari | **64** | Real-device testing from Phase 1; graceful fallback path; test across browser versions |
| 3 | R002 | First customer doesn't convert after launch | **60** | Design-partner program during build; early-adopter pricing; feedback-driven iteration before full GA |
| 4 | R004 | Asset upload too slow (>5 min for 50MB) | **30** | Presigned direct uploads, chunked upload, real-file load tests |
| 5 | R005 | Hosting tier limits hit during growth | **28** | Usage monitoring + alerts; staged upgrade plan; keep backup provider |
| 6 | R006 | Storage limits hit | **28** | Image compression pre-upload, cleanup policy, upgrade when needed |
| 7 | R007 | Team member leaves mid-project | **27** | Docs in code, ADRs, pair programming, cross-training |
| 8 | R008 | QA checks produce false results | **24** | Manual verification of first 10 runs; adjustable thresholds; override with audit |

### Category register (summary)

| Category | Key risks | Mitigations |
|---|---|---|
| **Technical (XR/WebGL)** | WebGL unsupported; low FPS on older devices; memory leaks in long sessions; texture load failures | Capability detection + auto quality reduction; scene/texture disposal on unmount; retry with backoff; loading states |
| **Technical (data)** | Connection pool exhaustion; storage CORS; token expiry mid-session; RLS blocking legit access | Connection pooling; origin allowlists; silent refresh; test queries per real role |
| **Technical (platform)** | Edge timeout on long ops; build/bundle size; env-var leakage | Move long ops to background jobs; analyze + lazy-load; encrypted secrets, never in git |
| **Market** | Competitor launches; studios prefer manual workflow; clients won't share 3D models; price sensitivity | Differentiate on agents/local-GPU/one-click; show 40h→2h math; privacy emphasis; price in USD globally + India later |
| **Financial** | Runway exhausted; payment-provider suspension; currency fluctuation | Keep burn at §10 levels, 6-month runway; ToS discipline + backup provider; USD pricing converted monthly |
| **Team/process** | Illness (2+ weeks); knowledge silos; burnout; scope creep; skipped tests; rushed code | Documentation + backups; ADRs + pairing; sustainable 40–50h weeks; change control (§8); tests in DoD; PR review + lint in CI |
| **Security** | Weak passwords; token theft (XSS); session hijacking; malicious uploads; data breach; accidental deletion | Min password policy; HttpOnly cookies; short-lived tokens + refresh; scan uploads; backups + point-in-time recovery; test restore weekly |
| **External** | Third-party outages; API rate limits; dependency breakage | Status pages; preview-first deploys; authenticated/cached API calls; pinned versions + lockfiles |

### Accepted risk of the complete-build strategy
Building for many months before broad customer feedback. **Mitigations:** (1) validation runs in parallel — waitlist, demo content, design-partner outreach from Week 1; (2) every phase ships a preview deployment that design partners can react to; (3) commit to the shortest honest launch date and avoid scope bloat beyond the §3 catalog; (4) keep monthly burn at the §10 levels so runway survives an extended build.

### Contingency plans (trigger → action)
1. **Poor early product feedback during build** → interview design partners monthly; adjust roadmap priorities within the catalog; re-sequence phases, never drop scope silently.
2. **Critical infra outage >2 h post-launch** → notify via status page, read-only mode with cache, vendor support, migrate to self-hosted fallback.
3. **Key developer leaves** → 2-week handoff, document unfinished work, pair with replacement, hire (2–4 wk), re-sequence to capacity.

---

## 10. Cost Model

Consolidated from `5-VizTR-Cost-Model` (INR, $1 ≈ ₹83). The build is the full platform (≈56 weeks / 13–16 months), which matches the model's 16-month horizon. **Note:** the source exec summaries cite slightly different totals (₹91,299 SaaS / ₹60,000 Hostinger) than the detailed tables below (₹1,07,799 / ₹30,993) — spread/timing assumptions differ; reconcile in the cost session, not here.

### Phase costs (monthly burn)

| Phase | Months | Cost (INR) | What's running |
|---|---|---|---|
| Phase 0 — validation | 1–2 | ₹799 (domain) | Free tiers |
| Phase 1 — core platform | 3–6 | ₹8,400 | Database upgrade mid-phase |
| Phase 2 — automation | 7–10 | ₹17,600 | Background jobs + higher hosting tier |
| Phase 3 — full platform | 11–16 | ₹81,000 (SaaS stack) **or** ₹4,194 (self-hosted) | Full platform vs VPS |
| **16-month total** | | **₹1,07,799 (SaaS)** / **₹30,993 (self-hosted)** | |

### Breakeven (monthly fixed vs required subscribers)

| Month | Fixed cost (INR) | Required paying clients | Notes |
|---|---|---|---|
| Month 4 | ₹2,100 | 1 Pro | 1 Pro ($49) covers costs |
| Month 7 | ₹4,400 | 2 Pro | |
| Month 11 (SaaS) | ₹13,500 | 4 Pro (or 1 Studio) | |
| Month 11 (self-hosted) | ₹699 | 1 Pro | Recommended migration point |

### Payment processing
- Domestic provider ~2% + ₹2/txn; international ~2.9% + flat. Fees only bite when revenue exists.

### One-time & contingency
- One-time: domain ₹799; everything else ₹0 at MVP-equivalent.
- Recommended reserve: ₹10K–15K (3–4 months runway).

### Cost optimization playbook (from source)
1. Stay on free tiers as long as possible; delete test data; compress before upload.
2. Free email tier until volume requires an upgrade.
3. Replace paid background-job service with cron where jobs are simple.
4. **Month 11 migration decision:** SaaS vs self-hosted, executed over 2–3 weeks; saves ~₹76K/yr at the cost of 2–4 h/mo maintenance.

### ROI scenarios (self-hosted path, from source)
- Conservative: ~₹2,00,000 cumulative profit by month 16 (12 Pro by M16).
- Aggressive: ~₹5,00,000 cumulative profit by month 16 (24 Pro by M16).

---

## 11. Launch Gates & Success Metrics

### Launch readiness (all must be true)
- [ ] All 18 module groups feature-complete per §3.
- [ ] All 5 XR modes working (Virtual Tour, WebXR, WebAR, VR, Pixel Streaming).
- [ ] Non-coding content engine live: every public page editable from admin.
- [ ] All 13 agents operational; QA gate + human approval enforced on publish.
- [ ] Full security: RLS verified with real role tests, penetration pass, zero critical vulnerabilities.
- [ ] Performance budgets met (see below); zero critical bugs open.
- [ ] Documentation + onboarding ready; marketing site polished; demo content live.

### Post-launch traction targets
- [ ] 1st paying customer within 30 days of launch; 5+ design-partner studios using the platform.
- [ ] Time to publish <2 h (vs 40+ h manual) · Agent success rate >85% · Client NPS >50.
- [ ] WebXR 60 fps desktop / 30 fps mobile · VR 90 fps standalone / 72 fps mobile · Streaming latency <100 ms · Uptime 99.9%.
- [ ] Retention >50% (clients active after 30 days).

### Engineering gates (every sprint)
- Lint + type-check + unit tests pass in CI; no merge without tests; performance budget respected (fast first load, ≤60 fps interactions, `prefers-reduced-motion` respected); preview deploy before production.

---

## 12. Open Decisions

| # | Decision | Status | Recommended default |
|---|---|---|---|
| 1 | **Execution path** — complete build vs lean MVP | **RESOLVED (2026-08-10): complete build.** | All 18 modules, all 5 XR modes, all 13 agents ship |
| 2 | **Technology stack** — which engines/frameworks/vendors and why | Pending — dedicated tech-stack session | Existing locked decisions (decision log) govern until revisited |
| 3 | Cost-model reconciliation (₹91K vs ₹1.08L; ₹31K vs ₹60K figures) | Pending | Rebuild the cost table against the chosen stack and roadmap |
| 4 | XR mode scope in build order | **RESOLVED:** all 5 modes in scope; Virtual Tour first (Phase 1) | Follow §7 ordering |
| 5 | Security posture | **RESOLVED:** full security (RLS/MFA/OAuth/audit/API keys) in scope at Phase 4 | Follow §7 ordering |
| 6 | Team size & who executes each sprint (Claude-led pipeline vs external tools) | Pending — owner + Prompt Engineering System §6 | Brief-driven pipeline; switch executors per scenario |
| 7 | Timeline commitment for Phases 2–6 | Pending | Lock dates after Phase 1 completes |

---

## 13. Contributor Rules

1. **Scope discipline.** Everything in the §3 catalog ships. New requests go through change control (§8) — justification, approval, +1 week.
2. **Tech-stack discipline.** This document intentionally carries no tech stack. Do not add engine/framework/vendor names to it; that lives in the technical decision log and the dedicated tech-stack session.
3. **Module naming.** Use the M1–M18 module identifiers and the §4 table-group names so every document maps 1:1 to this plan.
4. **Single planning surface.** This file is the master; sprint plans, the blueprint, and the design system must reference it, not fork it.
5. **Updating this file.** Bump version + date at the top for any structural change; mark decisions as resolved in §12 when the owner decides; keep resolved decisions recorded, not silently edited away.

---

*Version 1.1 — August 10, 2026 · Synthesized from all 12 uploaded planning documents · Execution path locked: COMPLETE BUILD · Tech stacks deferred per owner instruction.*
