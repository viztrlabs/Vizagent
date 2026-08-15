# VizTR Platform — Technical Decision Log

**Version**: 1.2.0 | **Date**: August 5, 2026 | **Status**: Authoritative Reference
**Purpose**: Document all technical decisions with rationale, trade-offs, and alternatives considered

---

## Table of Contents

1. [Decision Framework](#1-decision-framework)
2. [Frontend Framework Decisions](#2-frontend-framework-decisions)
3. [Backend Architecture Decisions](#3-backend-architecture-decisions)
4. [Database & Storage Decisions](#4-database--storage-decisions)
5. [AI & Agent Stack Decisions](#5-ai--agent-stack-decisions)
6. [XR & 3D Engine Decisions](#6-xr--3d-engine-decisions)
7. [Infrastructure & Deployment Decisions](#7-infrastructure--deployment-decisions)
8. [Security & Compliance Decisions](#8-security--compliance-decisions)
9. [Integration & Ecosystem Decisions](#9-integration--ecosystem-decisions)
10. [Decision Timeline & Revisit Schedule](#10-decision-timeline--revisit-schedule)

---

## 1. Decision Framework

### 1.1 Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **MVP Speed** | 30% | How fast can we ship the first version? |
| **Zero-Budget Friendly** | 25% | Can we start for free and scale later? |
| **Team Scalability** | 15% | Can we hire developers easily? |
| **Long-Term Maintenance** | 15% | Will this be maintainable in 5 years? |
| **Performance** | 10% | Does it meet performance targets? |
| **Ecosystem** | 5% | Is there active community support? |

### 1.2 Decision Process

```
Requirement → Research Alternatives → Evaluate Trade-offs → Prototype → Decide → Document → Revisit (6 months)
```

### 1.3 Decision Status Legend

| Status | Meaning |
|--------|---------|
| ✅ **ADOPTED** | Decision made, implementing |
| 🔄 **EXPERIMENTING** | Testing in prototype |
| ⏸️ **DEFERRED** | Decision postponed to later phase |
| ❌ **REJECTED** | Considered and rejected |

---

## 2. Frontend Framework Decisions

### 2.1 Framework: Next.js 15+ (App Router)

> **⚠️ Rationale partially superseded (2026-08-05, see §6.1 Revised):** This framework decision itself stands (Next.js 15+ remains adopted). However, rationale points referencing "R3F / Three.js / React XR stack as the 3D product core" are **superseded** by ADR 6.1 Revised (Babylon.js + Editor, single core engine) and ADR 6.1.1 (Marzipano panorama carve-out). The 3D/XR claim below should be read as historical; current engine policy is §6.1/§6.1.1.

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: VizTR requires three frontend applications (web, dashboard, xr) with SSR for SEO, client-side 3D rendering, and a monorepo architecture.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **Next.js 15+** | SSR/SSG built-in; Server Components; native R3F support; one framework for all apps; API Routes | Heavier than Vite; learning curve for RSC | 92/100 | ✅ ADOPTED |
| **Vite + React Router** | Faster dev server; lighter bundle | No SSR (fails SEO); extra tooling needed (violates Minimal Software Rule) | 65/100 | ❌ REJECTED |
| **Remix** | Excellent data loading; progressive enhancement | Smaller XR ecosystem; no Server Components | 70/100 | ❌ REJECTED |
| **Astro** | Best for content sites; islands architecture | Wrong fit for interactive dashboards; limited 3D support | 55/100 | ❌ REJECTED |
| **Nuxt (Vue)** | Good DX; SSR built-in | Vue ecosystem; smaller React XR community | 60/100 | ❌ REJECTED |

#### Detailed Rationale

**Why Next.js 15+ was chosen:**

1. **Single codebase for three apps** — `apps/web`, `apps/dashboard`, `apps/xr` all use Next.js. One framework across the monorepo means shared components, shared types, and one mental model. Vite/Remix/Astro/Nuxt would each introduce a different paradigm per app.

2. **SSR + SSG built-in (critical for SEO goals)** — Marketing platform has a hard requirement of *Lighthouse ≥ 90, structured data, dynamic sitemaps, OG images* (§16/§4.5). Next.js gives you SSG for marketing pages and SSR where needed *out of the box*. With **Vite + React Router**, SEO is manual — no server-side rendering unless you add a separate SSR framework, which is exactly the "extra tooling" your **Minimal Software Rule (§21.4)** forbids.

3. **App Router server components** — Lets you keep the heavy 3D (R3F) client-side only while rendering marketing copy on the server. This is how the platform satisfies *"3D only on hero + service demo pages"* (§22/§5.4) without shipping Three.js to every page.

4. **Native R3F / XR support** — Core product is the 3D Experience Engine (§9) with Three.js, WebXR, AR/VR. React Three Fiber integrates cleanly with Next.js Server Components + dynamic imports. **Nuxt (Vue)** and **Remix** have far smaller React-XR ecosystems.

5. **Route Handlers for API** — Next.js API Routes host the MVP backend (§24.2: "no separate backend first"). So the frontend *and* backend logic live in one deployable.

#### Why Alternatives Were Rejected

**Vite + React Router:**
- Great dev speed, but no SSR/client-server boundary → fails SEO + Lighthouse targets
- Would push toward extra tooling (conflicts with Minimal Software Rule §21.4)
- Manual setup for everything Next.js provides out of the box

**Remix:**
- Excellent data loading, but requires Server Components + vast XR tooling
- Remix's ecosystem is smaller for Three.js/WebXR
- Not optimized for the hybrid static/dynamic pattern VizTR needs

**Astro:**
- Islands are perfect for content sites, but dashboards need dense client interactivity (3D, real-time, editors)
- Astro's "mostly static" model is the wrong fit for interactive 3D applications
- Would require a separate framework for dashboard/XR apps (violates single-framework principle)

**Nuxt (Vue):**
- Good DX, but locks you into Vue
- The entire R3F/Three.js/XR stack (VizTR's differentiator) is React-first
- Smaller community for React XR tools

#### Trade-offs Accepted

| Trade-off | Mitigation |
|-----------|------------|
| Heavier bundle size vs Vite | Use dynamic imports for 3D; Server Components reduce client JS |
| Learning curve for RSC | Team training; documentation in `docs/architecture/` |
| Vercel "lock-in" | Deploy to any Node.js host; Vercel is optional (but recommended) |

#### Constraints Satisfied

- ✅ **SEO performance targets** (Lighthouse ≥ 90, SSR/SSG)
- ✅ **3D/XR product core** (R3F integration)
- ✅ **Minimal Software Rule** (one framework for all apps)
- ✅ **Zero-budget MVP** (Vercel free tier)

---

### 2.2 UI Library: shadcn/ui + Tailwind CSS

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need a component library that is accessible, customizable, and works with dark luxury UI aesthetic.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **shadcn/ui** | Accessible; customizable; no lock-in; Radix primitives; Tailwind-native | Manual updates; smaller community | 90/100 | ✅ ADOPTED |
| **Material UI** | Mature; large community | Opinionated design; hard to customize for dark luxury | 65/100 | ❌ REJECTED |
| **Chakra UI** | Accessible; good DX | Different styling paradigm; bundle size | 70/100 | ❌ REJECTED |
| **Ant Design** | Enterprise-ready | Too opinionated; Chinese-centric; heavy | 60/100 | ❌ REJECTED |
| **Headless UI** | Unstyled; accessible | More work to style from scratch | 75/100 | ❌ REJECTED |

#### Rationale

- **Accessible by default** (WCAG 2.1 AA compliance requirement)
- **Full customization** for VizTR's dark luxury aesthetic (cyan/violet on near-black)
- **Radix primitives** ensure accessibility without sacrificing design flexibility
- **No lock-in** — components live in your codebase, not a dependency
- **Tailwind-native** — works seamlessly with design tokens

---

### 2.3 State Management: TanStack Query + Zustand

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need state management for server data (API/Supabase) and client UI state.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **TanStack Query + Zustand** | Perfect separation (server vs client); minimal boilerplate; excellent DX | Two libraries | 95/100 | ✅ ADOPTED |
| **Redux Toolkit** | Mature; single solution | Overkill; boilerplate; TanStack Query covers server state | 60/100 | ❌ REJECTED |
| **Jotai / Recoil** | Atomic state; fine-grained | Smaller ecosystem; Zustand is simpler | 70/100 | ❌ REJECTED |
| **React Context only** | No dependencies | Performance issues; prop drilling | 50/100 | ❌ REJECTED |

#### Rationale

- **TanStack Query** handles all server state (Supabase data, API calls)
- **Zustand** handles all client UI state (sidebar, filters, theme)
- **No Redux** — TanStack Query covers 90% of state needs; Zustand covers the rest
- **Minimal boilerplate** — no actions/reducers/selectors

---

## 3. Backend Architecture Decisions

### 3.1 Backend Strategy: Next.js API Routes (MVP) → Express + Fastify (Post-MVP)

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need to ship MVP fast without premature optimization for agent orchestration scale.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **Next.js API Routes (MVP)** | Zero ops; auto-scaling; fastest to ship | Not ideal for heavy agent orchestration | 90/100 (MVP) | ✅ ADOPTED |
| **Express + Fastify (Phase 3+)** | Better for agents; WebSocket support; queue workers | More ops; requires Railway/containers | 85/100 (Post-MVP) | ⏸️ DEFERRED |
| **FastAPI (Python)** | Great for ML/AI | Different language; split codebase | 65/100 | ❌ REJECTED |
| **tRPC** | Type-safe end-to-end | Locks you into TypeScript backend; less flexible | 70/100 | ❌ REJECTED |
| **GraphQL-first** | Flexible queries | Overkill for MVP; N+1 problems | 60/100 | ❌ REJECTED |

#### Rationale

**MVP (Phase 1-2): Next.js API Routes**
- Zero infrastructure management
- Built-in API routes in Next.js App Router
- Sufficient for 115+ endpoints (§6.2)
- Deploy to Vercel free tier

**Post-MVP (Phase 3+): Express + Fastify**
- Agent orchestration at scale
- WebSocket fan-out (Socket.io)
- BullMQ queue workers
- Deploy to Railway (containers)

This follows the **"Minimal Software Rule"** (§21.4) — start simple, add complexity only when needed.

---

### 3.2 Database: Supabase (PostgreSQL 15+)

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need a database with auth, RLS, storage, real-time, and vector support.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **Supabase (PostgreSQL)** | Auth + DB + Storage + RLS + pgvector in one; free tier; zero ops | Vendor lock-in; PostgreSQL-only | 95/100 | ✅ ADOPTED |
| **Firebase** | Real-time; easy start | NoSQL (harder for relational data); no RLS; expensive at scale | 70/100 | ❌ REJECTED |
| **PlanetScale** | MySQL branching; scale | No auth; no storage; no vectors | 65/100 | ❌ REJECTED |
| **Neon** | Serverless Postgres; branching | No auth; no storage | 75/100 | ❌ REJECTED |
| **Self-hosted Postgres** | Full control | Ops overhead; no managed auth | 60/100 | ❌ REJECTED |

#### Rationale

- **All-in-one** — Auth, Database, Storage, Edge Functions, Real-time, Vectors
- **RLS (Row-Level Security)** — Tenant isolation enforced at database layer
- **pgvector** — Vector embeddings for Architecture Intelligence RAG (§10.8)
- **Free tier** — 500MB database, 1GB storage, 50GB bandwidth
- **Zero ops** — Managed backups, point-in-time recovery

---

## 4. Database & Storage Decisions

### 4.1 ORM: Prisma

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need type-safe database access with migrations and schema-as-code.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **Prisma** | Type-safe; migrations; schema-as-code; excellent DX | Runtime overhead; limited raw SQL | 90/100 | ✅ ADOPTED |
| **Drizzle ORM** | Lightweight; SQL-like; faster | Newer; smaller community; less tooling | 80/100 | 🔄 EXPERIMENTING |
| **Supabase client only** | No ORM overhead | No migrations; manual type safety | 65/100 | ❌ REJECTED |
| **TypeORM** | Mature; decorator-based | Heavier; complex setup | 70/100 | ❌ REJECTED |
| **Kysely** | Type-safe SQL builder | No migrations; manual schema | 75/100 | ❌ REJECTED |

#### Rationale

- **Type-safe queries** — Auto-generated TypeScript types from schema
- **Migrations** — Version-controlled database schema (25 migrations, §6.5)
- **Schema-as-code** — Single source of truth in `schema.prisma`
- **Excellent DX** — VS Code extension, Prisma Studio

---

### 4.2 Object Storage: Cloudflare R2 (3D/heavy) + Supabase Storage (text/documents)

**Status**: ✅ ADOPTED (revised Aug 5, 2026 — storage split by content type)

**Decision Date**: August 4, 2026 (revised August 5, 2026)

**Context**: Need S3-compatible storage for GLB files, videos, and images without egress fees. Text/documents stay on Supabase Storage.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **Cloudflare R2** | No egress fees; S3-compatible; global CDN; free tier | Newer; smaller community | 95/100 | ✅ ADOPTED (3D/heavy assets) |
| **AWS S3** | Industry standard; mature | Expensive egress; complex pricing | 70/100 | ❌ REJECTED |
| **Supabase Storage** | Integrated; easy start; RLS on text/docs | 5GB limit (free); not for heavy data | 85/100 | ✅ ADOPTED (text/documents only) |
| **Google Cloud Storage** | Good CDN | Expensive egress; complex | 65/100 | ❌ REJECTED |
| **Backblaze B2** | Cheap; good for backups | Smaller CDN; less integrated | 75/100 | ❌ REJECTED |

#### Rationale

- **Zero egress fees** — Critical for streaming GLB files and videos
- **S3-compatible API** — Works with existing tools (AWS SDK, presigned URLs)
- **Global CDN** — Fast asset delivery worldwide
- **Free tier** — 10GB storage, 1M Class A operations, 10M Class B operations/month
- **Content split**: 3D assets, video, images, AI-generated content → **Cloudflare R2**; client text data, internal text data, documents (contracts, briefs, messages, invoices, spec files) → **Supabase Storage** (RLS + text-indexable). No heavy data on Supabase Storage.

---

## 5. AI & Agent Stack Decisions

### 5.1 Agent Framework: LangGraph (CEO, Online) + AgentGPT (Service Agents, Online) + Hermes (Local)

**Status**: ✅ ADOPTED (revised Aug 5, 2026 — CrewAI/Ollama dropped)

**Decision Date**: August 4, 2026 (revised August 5, 2026)

**Context**: Need agent orchestration for 13 agents with different roles and capabilities.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **LangGraph (online) + AgentGPT (online) + Hermes (local) + API LLMs** | Best-in-class for each concern; clear separation; cloud-native | Multiple frameworks | 96/100 | ✅ ADOPTED |
| **LangGraph + CrewAI + Hermes** | Best-in-class for each concern | CrewAI adds an extra orchestration layer; overlaps AgentGPT | 88/100 | ⏸️ SUPERSEDED |
| **AutoGen** | Multi-agent; Microsoft-backed | Complex setup; heavy | 70/100 | ❌ REJECTED |
| **LangChain only** | Popular; many integrations | Too generic; not workflow-focused | 65/100 | ❌ REJECTED |
| **CrewAI only** | Simple multi-agent | No CEO-level orchestration | 75/100 | ❌ REJECTED |
| **Custom from scratch** | Full control | Too much work; reinventing the wheel | 40/100 | ❌ REJECTED |

#### Rationale

**Framework Ownership Split (per §10.1):**

| Framework | Owns | Why |
|-----------|------|-----|
| **LangGraph** | CEO Agent workflow (online/cloud) | Stateful workflows; approval gates; conditional routing; publish controls |
| **AgentGPT** | 12 specialized agents (online, browser multi-agent) | Always-online browser-based multi-agent; self-hosted GitHub build; long-running cloud tasks |
| **Hermes** | Local execution | GPU workstation control; Unreal integration; file operations |
| **API LLMs** | Model layer | OmniRoute → OpenAI → OpenRouter → Groq for all cloud model work |

This follows the **Minimal Software Rule** (§21.4) — each framework owns one concern, no overlap.

---

### 5.2 LLM Strategy: API-Provider Models (Cloud) — OmniRoute → OpenAI → OpenRouter → Groq

**Status**: ✅ ADOPTED (revised Aug 5, 2026 — local Ollama dropped)

**Decision Date**: August 4, 2026 (revised August 5, 2026)

**Context**: Need LLMs for all cloud/work tasks; API-provider models replace local Ollama inference.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **API providers (OmniRoute/OpenAI/OpenRouter/Groq)** | Best models; no local GPU required; routing flexibility | Per-token cost | 94/100 | ✅ ADOPTED |
| **Ollama + OpenAI** | Zero-cost local; cloud fallback | Requires GPU; SUPERSEDED per user stack decision | 85/100 | ⏸️ SUPERSEDED |
| **OpenAI only** | Best models; simple | Expensive; privacy concerns | 70/100 | ❌ REJECTED |
| **Anthropic Claude** | Excellent reasoning | Expensive; no local option | 75/100 | ❌ REJECTED |
| **Together AI** | Open-source models; cheaper | Smaller community | 70/100 | ❌ REJECTED |
| **Groq only** | Fast inference | Limited model selection | 65/100 | ❌ REJECTED |

#### Rationale

**Model Selection Matrix (per §21.4):**

| Task | Model | Reason |
|------|-------|--------|
| Dashboard CRUD/status | gpt-4o-mini (API) | Fast, cheap |
| Code generation | Qwen2.5-Coder / DeepSeek Coder (via API) | Code-specialized |
| CEO planning | OpenAI (gpt-4.1) | Complex reasoning |
| Complex reasoning | OpenAI (o3-mini) | Multi-step decisions |
| Local automation (Hermes) | API small fast models | Routed via OmniRoute |
| Embeddings/RAG | nomic-embed-text (API) | 768-dim vectors |

---

## 6. XR & 3D Engine Decisions

### 6.1 3D Engine: Three.js + React Three Fiber

**Status**: ⏸️ **SUPERSEDED** (August 5, 2026) — see *6.1 Revised* below

**Original Decision Date**: August 4, 2026

**Context**: Need a WebGL engine that works with React and supports WebXR/AR/VR.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **Three.js + R3F** | Industry standard; React-native; vast ecosystem | Learning curve | 95/100 | ✅ ADOPTED (superseded 2026-08-05) |
| **Babylon.js** | Better editor; built-in physics | Smaller React ecosystem | 80/100 | ⏸️ DEFERRED → ✅ ADOPTED (2026-08-05) |
| **A-Frame** | Declarative HTML | Less control; performance overhead | 60/100 | ❌ REJECTED |
| **PlayCanvas** | Great editor | Proprietary; lock-in | 55/100 | ❌ REJECTED |
| **Deck.gl** | Great for data viz | Not for architectural 3D | 50/100 | ❌ REJECTED |

#### Original Rationale (archived)

- **Industry standard** — Most widely used WebGL library
- **React Three Fiber** — Declarative 3D with React semantics
- **Drei** — Pre-built components (OrbitControls, Environment, Grid)
- **WebXR support** — `@react-three/xr` for VR/AR
- **Massive ecosystem** — Examples, tutorials, StackOverflow answers

---

### 6.1 Revised — 3D Engine: Babylon.js (Editor + Next.js template)

**Status**: ✅ **ADOPTED — supersedes prior Three.js + R3F decision**

**Decision Date**: August 5, 2026

**Superseded Decision**: Three.js + R3F (August 4, 2026) — see archived *6.1* above

**Reason for change**: Non-technical designer/artist workflow requirement; need for a **visual editor + native project export pipeline**, not code-first React composition. The team cannot author Three.js/R3F scenes without a developer, which contradicts the goal of letting designers produce XR scenes directly.

#### Rationale

- **Babylon.js Editor** — Non-technical designers can author scenes visually (grid floor, hotspots, lighting, camera paths) and export to the Next.js template for native hosting/export.
- **Single 3D engine** — Do **not** run Three.js + R3F in parallel as general-purpose engines (two WebGL contexts compete for GPU; bundle size doubles; team context-switches between declarative R3F and scene-graph Babylon authoring).
- **Remove Three.js/R3F core role** — `@react-three/xr`, `drei`, and `@react-three/fiber` are removed from the main app once migration is confirmed (§7.1/Audit). WebXR/AR and VR all use Babylon.js; Virtual Tour uses Marzipano for the 360° panorama layer with Babylon.js PhotoDome as fallback (except Marzipano carve-out, §6.1.1).
- **Named narrow exception**: Three.js may be used **only** for a developer-built, code-driven, non-editor 3D view (e.g. custom data-visualization) that no designer touches. This is an explicit carve-out, not a default — no implicit parallel stacks.

#### Migration path

1. Audit existing Three.js/R3F scenes/components; rebuild them in the Babylon.js Editor.
2. If the codebase is still early (nothing shipped depends on it), do the cutover directly during Phase 2/4.
 3. Remove `@react-three/xr`, `drei`, `@react-three/fiber` dependencies once migration is confirmed.
4. Document the current Babylon.js hero scene (§17.8) and XR viewers (§9) as Editorial-produced.

---

### 6.1.1 Virtual Tour 360° Renderer: Marzipano (named carve-out)

**Status**: ✅ ADOPTED

**Decision Date**: August 5, 2026

**Context**: The 44-feature Virtual Tour reference (Categories A–F, §9.2) requires a purpose-built 360° panorama viewer — autorotate, compass/wayfinder, floor navigation, hotspots, smooth transitions, WebXR entry, deep-linking — with minimal engineering effort. Babylon.js `PhotoDome` covers the equirectangular surface but not the tour-native feature set.

#### Rationale

- **Marzipano is purpose-built** — Apache 2.0, designed for 360° photo tours (multi-resolution tiles, hotspots, floor scenes, WebXR entry, URL deep-linking). It is **not** a general-purpose 3D engine (no GLB/3D-model rendering), so it does **not** violate the single-core-engine rule in §6.1 Revised.
- **Named carve-out, not a default** — Marzipano is restricted to `TourEngine` / `tour-viewer.tsx` and the tour admin editor only. Other modes (WebXR/AR/VR/Pixel Streaming) continue to use Babylon.js exclusively. This extends the existing "named narrow exception" pattern already applied to Three.js (§6.1 Revised).
- **Babylon.js remains the core engine** — WebXR/AR/VR scenes, dollhouse 3D view (View Modes #8), hero scene (§17.8), and all 3D model rendering stay on Babylon.js. `PhotoDome` remains the fallback panorama path via a tour-config flag.
- **Hybrid View Modes (#8)** — ModeManager (§9.13) routes between `Marzipano viewer` ⇄ `Babylon.js dollhouse`; room/camera state is shared via the tour config JSON so switching modes preserves position.

#### Migration path

1. Add `marzipano` dependency to the `xr-runner` package (tour page only, code-split from Babylon).
2. Rework `tour-viewer.tsx` to a Marzipano `Viewer` (equirectangular or cube sources, multi-res tile pyramid, LRU cache) + a Babylon dollhouse layer for View Modes #8.
3. Keep a `photoDomeFallback` flag in the tour config JSON so PhotoDome remains available per tour.
4. Add the tour admin editor (scene upload, hotspot placement, floor-plan builder) against the tour config schema (#40).

---

### 6.2 XR Modes Strategy: WebXR + Fallbacks

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need XR support across devices with graceful degradation.

#### XR Mode Stack

| Mode | Primary Tech | Fallback |
|------|--------------|----------|
| **WebXR** | Babylon.js WebXR | USDZ (iOS) / Scene Viewer (Android) |
| **WebAR** | MindAR (image tracking) | 3D viewer fallback |
| **VR** | Babylon.js WebXR immersive-vr | Desktop 3D viewer |
| **Virtual Tour** | Marzipano (primary) / Babylon.js PhotoDome (fallback) | Static images |
| **Pixel Streaming** | Unreal Engine + WebRTC | Recorded video |

#### Rationale

- **WebXR-first** — Native browser support, no apps required
- **USDZ for iOS** — AR Quick Look without WebXR
- **Scene Viewer for Android** — Native AR intent
- **Progressive enhancement** — Works everywhere, enhanced on XR devices

---

## 7. Infrastructure & Deployment Decisions

### 7.1 Hosting: Vercel (Frontend) + Railway (Backend) + Cloudflare (CDN)

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need zero-ops deployment for MVP with scale path for production.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **Vercel + Railway + Cloudflare** | Zero ops; free tier; auto-scale; CDN | Vendor lock-in | 95/100 | ✅ ADOPTED |
| **AWS (ECS/Fargate)** | Full control; enterprise-ready | High ops; expensive; complex | 60/100 | ❌ REJECTED |
| **Google Cloud Run** | Serverless containers | Less integrated; complex | 70/100 | ❌ REJECTED |
| **DigitalOcean App Platform** | Simple; predictable pricing | Smaller ecosystem | 75/100 | ❌ REJECTED |
| **Self-hosted (VPS)** | Full control; cheap | High ops; no auto-scale | 50/100 | ❌ REJECTED |

#### Rationale

- **Vercel** — Perfect for Next.js; zero-config; preview deploys; analytics
- **Railway** — Container hosting for agent-server (Phase 3+)
- **Cloudflare** — CDN + R2 + Tunnel + DDoS protection
- **Zero ops** — Focus on product, not infrastructure

---

### 7.2 CI/CD: GitHub Actions + Turborepo

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need fast CI for monorepo with selective builds.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **GitHub Actions + Turborepo** | Integrated; caching; parallel builds | Limited to GitHub | 95/100 | ✅ ADOPTED |
| **CircleCI** | Mature; flexible | Separate service; pricing | 70/100 | ❌ REJECTED |
| **GitLab CI** | Integrated; Docker-first | Requires GitLab migration | 65/100 | ❌ REJECTED |
| **Jenkins** | Full control; plugin ecosystem | High ops; outdated UX | 50/100 | ❌ REJECTED |
| **Nx Cloud** | Great for monorepos | Expensive; overkill | 75/100 | ❌ REJECTED |

#### Rationale

- **GitHub Actions** — Free tier; integrated with GitHub; matrix builds
- **Turborepo** — Remote caching; parallel builds; selective deploys
- **Zero cost** — Free tier sufficient for MVP

---

## 8. Security & Compliance Decisions

### 8.1 Authentication: Supabase Auth

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need auth with email, OAuth, magic links, and JWT tokens.

#### Alternatives Considered

| Alternative | Pros | Cons | Score | Decision |
|-------------|------|------|-------|----------|
| **Supabase Auth** | Integrated with DB; RLS; free tier | Vendor lock-in | 95/100 | ✅ ADOPTED |
| **Auth0** | Enterprise features; social logins | Expensive; separate service | 70/100 | ❌ REJECTED |
| **Clerk** | Modern; good DX | Expensive; newer | 75/100 | ❌ REJECTED |
| **NextAuth.js** | Flexible; self-hosted | Manual setup; no managed UI | 80/100 | ⏸️ DEFERRED (alternative) |
| **Firebase Auth** | Mature; easy start | Different database; Google lock-in | 65/100 | ❌ REJECTED |

#### Rationale

- **Integrated** — Same platform as database and storage
- **RLS integration** — JWT tokens work with Row-Level Security
- **OAuth providers** — Google, GitHub built-in
- **Magic links** — Passwordless auth
- **Free tier** — 50,000 MAU

---

### 8.2 Authorization: RLS + Custom RBAC Middleware

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need multi-tenant authorization with org-based isolation.

#### Rationale

- **RLS (Row-Level Security)** — Tenant isolation enforced at database layer
- **RBAC middleware** — Role checks in Next.js middleware
- **Server-side enforcement** — Never trust client-side checks
- **Audit logging** — All sensitive operations logged

---

## 9. Integration & Ecosystem Decisions

### 9.1 Payment: Stripe + Razorpay

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need international payments (Stripe) and India-specific payments (Razorpay).

#### Rationale

- **Stripe** — Global; subscriptions; webhooks; invoices
- **Razorpay** — INR support; UPI; local cards; GST compliance

---

### 9.2 Communication: Resend (Email) + Twilio (SMS)

**Status**: ✅ ADOPTED

**Decision Date**: August 4, 2026

**Context**: Need transactional emails and SMS notifications.

#### Rationale

- **Resend** — Modern; developer-friendly; React Email support
- **Twilio** — Industry standard; global SMS; WhatsApp support

---

## 10. Decision Timeline & Revisit Schedule

### 10.1 Decision Log

| Date | Decision | Status | Revisit Date |
|------|----------|--------|--------------|
| 2026-08-04 | Next.js 15+ for all frontend apps | ✅ ADOPTED | 2027-02-04 |
| 2026-08-04 | Supabase for database + auth | ✅ ADOPTED | 2027-02-04 |
| 2026-08-04 | TanStack Query + Zustand | ✅ ADOPTED | 2027-02-04 |
| 2026-08-04 | LangGraph + CrewAI + Hermes | ⏸️ SUPERSEDED (2026-08-05) | — |
| 2026-08-05 | LangGraph (online) + AgentGPT (online) + Hermes (local) + API LLMs | ✅ ADOPTED | 2027-02-05 |
| 2026-08-05 | Storage split: R2 (3D/heavy) + Supabase Storage (text/docs) | ✅ ADOPTED | 2027-02-05 |
| 2026-08-05 | API-provider LLMs only (Ollama dropped) | ✅ ADOPTED | 2027-02-05 |
| 2026-08-04 | Three.js + R3F for XR | ⏸️ SUPERSEDED (2026-08-05) | — |
| 2026-08-05 | Babylon.js (Editor + Next.js) core XR engine | ✅ ADOPTED | 2027-02-05 |
| 2026-08-04 | Vercel + Railway + Cloudflare | ✅ ADOPTED | 2027-02-04 |
| 2026-08-04 | Next.js API Routes (MVP) | ✅ ADOPTED | Phase 3 (agent-server) |

### 10.2 Revisit Triggers

Revisit a decision if:
- Technology becomes unmaintained
- Better alternative emerges with 20%+ improvement
- Scaling bottleneck is identified
- Security vulnerability is discovered
- Team skillset changes significantly

---

## Summary: Adopted Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Language** | TypeScript 5.3+ | ✅ ADOPTED |
| **Runtime** | Node.js 20 LTS | ✅ ADOPTED |
| **Frontend** | Next.js 15+ | ✅ ADOPTED |
| **UI** | shadcn/ui + Tailwind | ✅ ADOPTED |
| **State** | TanStack Query + Zustand | ✅ ADOPTED |
| **Database** | Supabase (PostgreSQL) | ✅ ADOPTED |
| **Auth** | Supabase Auth | ✅ ADOPTED |
| **Storage** | Cloudflare R2 (3D/heavy) + Supabase Storage (text/docs) | ✅ ADOPTED |
| **XR Engine** | Babylon.js (Editor + Next.js template) + Marzipano (360° tour viewer carve-out, §6.1.1) | ✅ ADOPTED (supersedes Three.js + R3F) |
| **Agent Framework** | LangGraph (online) + AgentGPT (online) + Hermes (local) | ✅ ADOPTED |
| **LLM** | API providers (OmniRoute/OpenAI/OpenRouter/Groq) | ✅ ADOPTED |
| **Hosting** | Vercel + Railway | ✅ ADOPTED |
| **CI/CD** | GitHub Actions + Turborepo | ✅ ADOPTED |

---

*This document serves as the authoritative reference for all technical decisions in the VizTR platform.*
