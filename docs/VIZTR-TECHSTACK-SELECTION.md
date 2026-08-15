# VizTR Platform — Techstack Selection Guide

**Version**: 1.0.0 | **Date**: August 4, 2026 | **Status**: Pre-Implementation Decision Document
**Purpose**: Strategic techstack selection for VizTR platform before development kickoff

---

## Table of Contents

1. [Decision Framework](#1-decision-framework)
2. [Core Stack Selection](#2-core-stack-selection)
3. [Frontend Stack](#3-frontend-stack)
4. [Backend Stack](#4-backend-stack)
5. [XR & 3D Stack](#5-xr--3d-stack)
6. [AI & Agent Stack](#6-ai--agent-stack)
7. [Infrastructure Stack](#7-infrastructure-stack)
8. [Database & Storage](#8-database--storage)
9. [Observability & Monitoring](#9-observability--monitoring)
10. [Testing Stack](#10-testing-stack)
11. [Security Stack](#11-security-stack)
12. [Development Tools](#12-development-tools)
13. [Integration Ecosystem](#13-integration-ecosystem)
14. [Cost Analysis](#14-cost-analysis)
15. [Migration Path](#15-migration-path)

---

## 1. Decision Framework

### 1.1 Selection Principles

| Principle | Description |
|-----------|-------------|
| **Zero-budget MVP first** | Start with free tiers; upgrade only when needed |
| **Production-ready defaults** | Choose battle-tested tech over bleeding-edge |
| **Single source of truth** | One tool per concern (no duplication) |
| **Community support** | Active ecosystem, documentation, StackOverflow answers |
| **Hiring-friendly** | Skills available in market (important for scaling) |
| **Future-proof** | Tech should scale 10x without rewrite |

### 1.2 Constraint Matrix

| Constraint | Impact |
|------------|--------|
| **Solo founder (MVP)** | Simplicity > features; low ops overhead |
| **Local GPU workstation** | Hybrid cloud/local architecture |
| **XR-focused** | WebXR surgery/expertise; Babylon.js Editor authoring |
| **AI-agent operated** | LLM integration + orchestration tools |
| **Multi-tenant SaaS** | RLS + org isolation from Day 1 |
| **INR pricing** | Stripe/Razorpay integration needed |

---

## 2. Core Stack Selection

### 2.1 Language & Runtime

| Choice | Rationale |
|--------|-----------|
| **TypeScript 7.0+ (strict mode)** | Type safety across full stack; native Go-powered compiler (8-12x build speedup); shared types |
| **Node.js 22 LTS** | Current active LTS; native ESM; enhanced WebSocket/Fetch; same language as frontend |
| **Python 3.12+ (optional)** | For Blender scripts, Unreal automation, ML pipelines (not for web backend) |

**Why not alternatives:**
- **Go/Rust**: Overkill for MVP; steeper learning curve; harder to hire
- **Java/Kotlin**: Heavier ops; less natural for XR frontend
- **PHP**: Not suited for real-time XR + agent orchestration

---

## 3. Frontend Stack

### 3.1 Framework Decision

| App | Framework | Rationale |
|-----|-----------|-----------|
| **Public Website** (`apps/web`) | **Next.js 16.2 (App Router)** | SSR/SSG for SEO; server components for performance; native Babylon.js embedding |
| **Dashboard** (`apps/dashboard`) | **Next.js 16.2 (App Router)** | Shared code with web; SSR for fast initial load; route handlers for API |
| **XR Engine** (`apps/xr`) | **Next.js 16.2 (App Router)** | Decoupled engine (xr.viztr.com); Babylon.js Editor scene server rendering + URL bridge |

**Why Next.js 16.2 over alternatives:**

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Vite + React Router** | Faster dev server | No SSR; manual setup for SEO; no server components | ❌ Reject |
| **Remix** | Excellent data loading | Smaller ecosystem; less XR tooling | ❌ Reject |
| **Astro** | Best for content sites | Limited interactivity for 3D dashboards | ❌ Reject |
| **Nuxt (Vue)** | Great DX | Smaller React XR ecosystem | ❌ Reject |

### 3.2 UI & Styling

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Component Library** | **shadcn/ui** (radix primitives) | Accessible by default; customizable; no lock-in; Tailwind-native |
| **Styling** | **Tailwind CSS 4.0+** | High-performance CSS engine; CSS-first config; design token integration |
| **Theming** | **next-themes 0.4+** | Light/dark/system; zero-flash; localStorage persistence |
| **Animations** | **Framer Motion 12+** | React 19 layout animations; spring physics; gesture support; XR-friendly |
| **Icons** | **lucide-react** | Consistent; tree-shakeable; matches VizTR luxury aesthetic |
| **Fonts** | **next/font** (self-hosted) | Zero layout shift; subset optimization; privacy-compliant |

**Font Stack:**
```typescript
const fonts = {
  display: 'Bebas Neue',     // Hero headlines
  heading: 'Syne',           // Section titles
  body: 'DM Sans',           // Body text
  mono: 'JetBrains Mono'     // Code/technical
}
```

### 3.3 State Management

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Server State** | **TanStack Query 5.56+** | Caching; deduplication; optimistic updates; perfect for Supabase |
| **Client State** | **Zustand 4.5+** | Minimal boilerplate; middleware support; devtools |
| **Form State** | **React Hook Form 7.51+** | Performance; validation integration; complex forms (AI Brief) |
| **URL State** | **nuqs 2.0+** | Type-safe search params; works with Next.js App Router |

**Why this combo:**
- TanStack Query handles all API/Supabase data (no Redux needed)
- Zustand handles UI state (sidebar open/close, theme, filters)
- React Hook Form handles complex multi-step forms
- nuqs handles URL-driven state (filters, pagination, search)

### 3.4 Data Visualization

| Use Case | Choice | Rationale |
|----------|--------|-----------|
| **Charts** | **Recharts 2.12+** | React-native; responsive; composable; good docs |
| **3D Charts (optional)** | **Deck.gl** | Map/large data visualization; WebGL-powered |

**Why Recharts over alternatives:**
- **Chart.js**: Imperative API; harder to customize
- **Victory**: Slower; larger bundle
- **Tremor**: Opinionated; less flexible for custom XR metrics

---

## 4. Backend Stack

### 4.1 API Architecture Decision

| Phase | Stack | Rationale |
|-------|-------|-----------|
| **MVP** | **Next.js API Routes + Supabase** | Zero ops; auto-scaling; built-in auth; fastest to ship |
| **Post-MVP** | **Express + Fastify (agent-server)** | Agent orchestration; heavy compute; WebSocket fan-out |

**MVP Backend Stack:**
```
Next.js App Router
├── Route Handlers (/api/*)
│   ├── Public endpoints (no auth)
│   ├── Client endpoints (client role)
│   ├── Admin endpoints (admin role)
│   └── Webhooks (Stripe, GitHub, Vercel)
├── Server Actions (form mutations)
└── Middleware (auth, RLS, rate limiting)
```

**Post-MVP Agent Server:**
```
agent-server (Express + Fastify)
├── REST API (115+ endpoints)
├── GraphQL Layer (Apollo Server)
├── WebSocket Server (Socket.io)
├── MCP Server (Model Context Protocol)
└── Queue Workers (BullMQ)
```

**Why this hybrid approach:**
- Start with Next.js API Routes (fastest path to production)
- Add agent-server when agent scale demands it (Phase 3)
- No premature optimization; defer infrastructure complexity

### 4.2 Queue System

| Choice | Rationale |
|--------|-----------|
| **BullMQ 5.15+** | Redis-backed; job scheduling; retries; rate limiting; UI dashboard |
| **Redis 7+** | In-memory; pub/sub; caching; session store; queue backend |

**Queue Jobs:**
```
Queues:
├── asset-processing    (GLB optimization, video transcoding)
├── xr-generation      (WebXR, Tour, VR scene creation)
├── agent-tasks        (CEO Agent, Hermes Agent jobs)
├── notifications      (Email, SMS, in-app)
└── deployments        (Preview, production deploys)
```

### 4.3 Background Processing

| Task | Tool | Rationale |
|------|------|-----------|
| **Asset Optimization** | **gltf-transform** (Node API) | Draco/KTX2/Meshopt; programmatic; CI-friendly |
| **Video Transcoding** | **FFmpeg** (via fluent-ffmpeg) | Industry standard; H.264/WebM; poster extraction |
| **Blender Automation** | **Blender Python API** (headless) | DCC automation; FBX → GLB; cleanup scripts |
| **Unreal Automation** | **Unreal Python API** | Pixel Streaming session control; project setup |

---

## 5. XR & 3D Stack

### 5.1 Core 3D Engine

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **WebGL** | **Babylon.js 8+** + Marzipano (360° tour viewer carve-out) | Babylon.js: visual editor for non-technical designers; scene-graph; WebXR support; Next.js template. Marzipano (Apache 2.0): 360° panorama-layer viewer, TourEngine only |
| **Editor** | **Babylon.js Editor** | Non-technical designer/artist authoring; project export to Next.js template |
| **Helpers** | Babylon.js GUI, Materials, Loaders, Post-Process pipeline | Pre-built UI/effects/loaders; standard Babylon tooling |
| **Post-processing** | Babylon.js `PostProcessRenderPipeline` | Bloom; glow; SSAO; DOF; performance-friendly |

**Why Babylon.js over alternatives (supersedes Three.js + R3F, 2026-08-05):**

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Three.js + R3F** | Industry standard; React-native; vast ecosystem | Code-first — needs a developer for every scene; two engines = GPU/bundle/mental-model conflicts | ❌ Superseded (narrow named exception only) |
| **A-Frame** | Declarative HTML | Less control; performance overhead | ❌ Reject |
| **PlayCanvas** | Great editor | Proprietary; lock-in; harder to customize | ❌ Reject |

### 5.2 XR Modes

| Mode | Tech | Rationale |
|------|------|-----------|
| **WebXR** | **Babylon.js WebXR** (`WebXRDefaultExperience`) | Native WebXR VR/AR; controller + hand tracking |
| **WebAR (iOS)** | **USDZ Quick Look** | Native iOS AR; no app required |
| **WebAR (Android)** | **Scene Viewer intent** | Native Android AR; fallback for non-WebXR |
| **Image Tracking AR** | **MindAR** | iOS/Android image tracking; WebXR AR fallback |
| **Virtual Tour** | **Marzipano** (viewer) + **Babylon.js PhotoDome** (fallback) + **Babylon.js** (dollhouse) | Equirectangular panorama; hotspots; transitions; hybrid View Modes (ADR 6.1.1) |
| **Pixel Streaming** | **Unreal Engine 5 + WebRTC** | Photorealistic; Cloudflare Tunnel; local GPU |

**VR-Specific Stack:**
```
VR Engine (apps/xr/vr)
├── Babylon.js 8+ (core renderer + WebXR)
├── Babylon.js WebXR features (controllers, hands, teleport)
├── Babylon.js Editor (scene authoring) + Next.js template export
├── Teleport System (custom, comfort-first)
└── Controller Profiles (Quest, Pico, Vision Pro)
```

### 5.3 3D Asset Pipeline

| Stage | Tool | Output |
|-------|------|--------|
| **Validation** | **gltf-validator** | JSON report (errors, warnings) |
| **Optimization** | **gltf-transform** | Draco compression; WebP/KTX2 textures |
| **LOD Generation** | **gltf-transform + Blender** | LOD0/1/2 variants |
| **Texture Processing** | **KTX2/Basis Universal** | GPU-native textures; mipmaps |
| **Video Transcoding** | **FFmpeg** | H.264/WebM; resolution ladder |

**Asset Pipeline Automation:**
```bash
# Upload flow
upload → validate → convert → optimize → LODs → store → queue done
```

---

## 6. AI & Agent Stack

### 6.1 Agent Frameworks

| Framework | Role | Rationale |
|-----------|------|-----------|
| **LangGraph** | CEO Agent orchestration (online/cloud) | Stateful workflows; conditional routing; approval gates |
| **AgentGPT** | 12 specialized agents (online, browser multi-agent) | Always-online browser-based multi-agent; self-hosted GitHub build; long-running cloud tasks |
| **Hermes** (custom) | Local runner | GPU workstation control; Unreal integration; file ops |

**Why this combo:**
- LangGraph owns the CEO workflow (planning, approvals, publish gates), running online/cloud
- AgentGPT owns the 12 service agents (WebXR, VR, Finance, etc.), running always-online in the browser
- Hermes bridges cloud ↔ local workstation
- All model work uses API-provider LLMs (OmniRoute → OpenAI → OpenRouter → Groq)

### 6.2 LLM Providers

| Provider | Use Case | Rationale |
|----------|----------|-----------|
| **OmniRoute** (primary router) | Model routing | Routes to best/cheapest provider per task |
| **OpenAI** (primary) | Complex reasoning; cloud | gpt-4o-mini (affordable); gpt-4.1 (advanced); o3-mini (reasoning) |
| **OpenRouter** (multi) | Multi-model access | Access to Claude, Mistral, Gemini via one API |
| **Groq** (fast) | Low-latency inference | LPU-powered; sub-100ms latency |

**Model Selection Matrix:**
```
Task                      → Model
─────────────────────────────────────
Dashboard CRUD/status     → gpt-4o-mini (API)
Code generation           → Qwen2.5-Coder / DeepSeek Coder (API)
CEO planning              → OpenAI (gpt-4.1)
Complex reasoning         → OpenAI (o3-mini)
Local automation (Hermes) → API small fast models
Embeddings/RAG            → nomic-embed-text (API)
```

### 6.3 Knowledge Base (RAG)

| Phase | Choice | Rationale |
|-------|--------|-----------|
| **MVP** | **ChromaDB + API embeddings** | Low-cost; sufficient for SOP docs |
| **Production** | **Supabase pgvector** | One database; RLS on vectors; no extra infra |

**Knowledge Base Contents:**
- Architecture visualization SOPs
- Render/camera/lighting/material rules
- DCC export rules (SketchUp, 3ds Max, Blender)
- WebXR/WebAR/VR/Tour/Pixel Streaming rules
- Pricing/proposal templates
- QA checklists

### 6.4 MCP (Model Context Protocol)

| Choice | Rationale |
|--------|-----------|
| **@modelcontextprotocol/sdk** | Official implementation; tool calling; stdio + HTTP transport |

**MCP Server Tools (30+):**
```
Universal MCP Connector
├── Supabase tools (project.create, asset.upload, etc.)
├── GitHub tools (PR create, branch management)
├── Vercel tools (deployments, preview URLs)
├── File tools (local workstation access)
├── Unreal tools (Pixel Streaming control)
└── LLM tools (API provider routing — OmniRoute/OpenAI/OpenRouter/Groq)
```

---

## 7. Infrastructure Stack

### 7.1 Hosting & Deployment

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | **Vercel** (Hobby → Pro) | Zero-config; edge network; preview deploys; analytics |
| **Backend (MVP)** | **Vercel Serverless Functions** | Auto-scaling; built-in API routes; zero ops |
| **Backend (Post-MVP)** | **Railway** (agent-server) | Containers; auto-scale; Redis; background workers |
| **Database** | **Supabase** (Free → Pro) | Postgres + Auth + Storage + Edge Functions; RLS |
| **Object Storage** | **Cloudflare R2** | S3-compatible; no egress fees; global CDN |
| **CDN** | **Cloudflare** | DDoS protection; caching; tunnel; analytics |

**Why Vercel + Supabase for MVP:**
- Vercel handles Next.js deployment perfectly
- Supabase provides database + auth + storage in one
- No Docker/K8s needed until scaling (Phase 5+)
- Total cost for MVP: $0-25/month

### 7.2 Local Infrastructure

| Component | Tool | Purpose |
|-----------|------|---------|
| **GPU Workstation** | Windows/Linux PC (RTX 4090) | Unreal rendering; local AI; Pixel Streaming |
| **Tunneling** | **Cloudflare Tunnel** | Secure local ↔ cloud connection |
| **Signaling Server** | Node.js (Cirrus) | Pixel Streaming WebRTC signaling |
| **STUN/TURN** | **Coturn** | NAT traversal for WebRTC |

**Local Launcher Script (.bat):**
```batch
@echo off
echo Starting VizTR Pixel Streaming...
start "" UnrealEditor-Cmd.exe Project.uproject -run=game -PixelStreamingIP=0.0.0.0
start cmd /k "node signaling_server.js"
start cmd /k "cloudflared tunnel --url http://localhost:8866"
echo VizTR Pixel Streaming started.
pause
```

### 7.3 CI/CD Pipeline

| Stage | Tool | Rationale |
|-------|------|-----------|
| **Version Control** | **GitHub** | Industry standard; Actions; PR reviews |
| **CI** | **GitHub Actions** | Free tier; matrix builds; caching |
| **Monorepo** | **pnpm + Turborepo** | Fast installs; parallel builds; cache sharing |
| **Preview Deploys** | **Vercel** | Auto-deploy on PR; unique URLs; smoke tests |
| **Production Deploy** | **Vercel** | Merge to main → deploy; zero-downtime |
| **Database Migrations** | **Supabase CLI** | Version-controlled migrations; local preview |

**CI Pipeline:**
```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [pnpm lint, pnpm typecheck]
  
  test:
    runs-on: ubuntu-latest
    steps: [pnpm test:unit, pnpm test:integration]
  
  build:
    runs-on: ubuntu-latest
    steps: [pnpm build]
  
  e2e:
    runs-on: ubuntu-latest
    steps: [pnpm test:e2e]  # Playwright
```

---

## 8. Database & Storage

### 8.1 Primary Database

| Choice | Rationale |
|--------|-----------|
| **PostgreSQL 16 (via Supabase)** | ACID; JSONB; full-text search; extensions (pgvector, pg_cron) |
| **Prisma ORM** | Type-safe; migrations; schema-as-code; excellent DX |

**Database Schema Groups (92 models):**
```
Identity     → users, roles, sessions, workspaces
Projects     → projects, versions, assets, scenes
Agents       → agent_runs, tasks, memory
CMS          → pages, blogs, services, media
Financials   → invoices, subscriptions, usage
Analytics    → events, heatmaps, reports
```

### 8.2 Vector Database

| Phase | Choice | Rationale |
|-------|--------|-----------|
| **MVP** | **ChromaDB** (local) | Zero-cost; Python-native; sufficient for < 100K vectors |
| **Production** | **pgvector** (Supabase) | Same DB as application data; RLS on vectors; 768-dim embeddings |

**Embedding Model:**
```
nomic-embed-text (768 dims)
├── Architecture SOPs
├── Client briefs
├── Agent memory
└── Project context
```

### 8.3 Object Storage

| Storage | Provider | Use Case |
|---------|----------|----------|
| **Source Assets (3D/heavy)** | Cloudflare R2 | GLB/OBJ/FBX source uploads; validation; CDN-backed; no egress fees |
| **Optimized Assets** | Cloudflare R2 | GLB files; videos; images; no egress fees |
| **XR Scenes** | Cloudflare R2 | 360 panoramas; 3D models; tiles |
| **Client text data / internal text / documents** | Supabase Storage | Contracts, briefs, messages, invoices, spec files, small media (RLS-protected) |
| **Backups** | Supabase Storage | Daily backups; point-in-time recovery |

> **Note**: Supabase Storage holds text/documents only — no heavy data. All 3D/heavy media lives on Cloudflare R2.

**Storage Structure:**
```
R2 Bucket: viztr-assets
├── projects/{id}/
│   ├── source/       (original uploads)
│   ├── optimized/    (GLB, compressed)
│   ├── lods/         (LOD0/1/2 variants)
│   └── videos/       (MP4, WebM)
└── xr-scenes/
    ├── webxr/
    ├── tour/
    └── vr/
```

### 8.4 Caching Layer

| Choice | Rationale |
|--------|-----------|
| **Redis 7+** (Upstash or Railway) | In-memory; sub-ms latency; pub/sub; queues |

**Cache Strategy:**
```
API responses    → 5 min TTL (project list, dashboards)
User sessions    → 30 min TTL (JWT validation)
Rate limits      → Sliding window counters
Feature flags    → 1 min TTL (entitlement checks)
Agent status     → Real-time (WebSocket pub/sub)
```

---

## 9. Observability & Monitoring

### 9.1 Application Monitoring

| Layer | Tool | Rationale |
|-------|------|-----------|
| **Frontend Analytics** | **Vercel Analytics** | Free; Core Web Vitals; audience insights |
| **Error Tracking** | **Sentry** | Stack traces; release tracking; performance |
| **User Analytics** | **PostHog** (self-hosted) | Event tracking; funnels; session replay; feature flags |
| **Custom Events** | Custom (Supabase + PostHog) | XR engagement; agent events; business metrics |

### 9.2 Infrastructure Monitoring

| Layer | Tool | Rationale |
|-------|------|-----------|
| **Logs** | **Supabase Logs** | Database; auth; edge functions; structured JSON |
| **Metrics** | **Prometheus** (self-hosted) | Time-series; alerting; Grafana dashboards |
| **Uptime** | **Uptime Kuma** (self-hosted) | Simple; multi-location; status page |
| **Status Page** | **status.viztr.com** (custom) | Transparency; trust-building |

### 9.3 XR Performance Monitoring

| Metric | Tool | Target |
|--------|------|--------|
| **FPS** | Babylon.js `Engine` stats / custom overlay | 60 desktop / 30 mobile / 90 VR |
| **Load time** | Custom + Vercel Analytics | < 2s desktop / < 3s mobile |
| **Model size** | Asset pipeline logs | < 10MB compressed |
| **Streaming latency** | Custom (WebRTC stats) | < 100ms Pixel Streaming |
| **GPU usage** | NVML (local) | Monitor on workstation |

---

## 10. Testing Stack

### 10.1 Testing Pyramid

| Type | Tool | Coverage |
|------|------|----------|
| **Unit Tests** | **Vitest** | Business logic; utilities; hooks; agents |
| **Integration Tests** | **Vitest + Supabase local** | API routes; database; queues |
| **E2E Tests** | **Playwright** | Critical user flows; auth; payments |
| **Component Tests** | **Storybook** | UI components; visual regression |
| **API Mocking** | **MSW (Mock Service Worker)** | Frontend development; testing |

### 10.2 Test Infrastructure

```typescript
// Test structure
tests/
├── unit/           (Vitest)
│   ├── agents/     (CEO, Hermes, service agents)
│   ├── utils/      (helpers, formatters)
│   └── hooks/      (custom React hooks)
├── integration/    (Vitest + Supabase local)
│   ├── api/        (route handlers)
│   ├── db/         (RLS, migrations)
│   └── queue/      (BullMQ jobs)
└── e2e/            (Playwright)
    ├── auth/       (login, signup, OAuth)
    ├── projects/   (create, upload, publish)
    └── xr/         (viewer, interactions)
```

### 10.3 CI Testing Gates

```yaml
# CI pipeline gates
Pull Request:
  - Unit tests (must pass)
  - Integration tests (must pass)
  - Lint + typecheck (must pass)
  - Build (must succeed)
  - E2E smoke (critical paths)

Merge to main:
  - Full E2E suite
  - Lighthouse CI (performance budget)
  - Accessibility audit (axe-core)
  - Security scan (OWASP)
```

---

## 11. Security Stack

### 11.1 Authentication

| Method | Tool | Rationale |
|--------|------|-----------|
| **Email/Password** | Supabase Auth | Built-in; bcrypt; password policies |
| **Magic Link** | Supabase Auth | Passwordless; better UX; security-friendly |
| **Google OAuth** | Supabase Auth | Most popular; enterprise-friendly |
| **GitHub OAuth** | Supabase Auth | Developer-friendly; team collaboration |
| **WebAuthn/Passkeys** | Supabase Auth (future) | Passwordless; hardware keys; enterprise |

### 11.2 Authorization

| Layer | Tool | Rationale |
|-------|------|-----------|
| **RBAC** | Custom + Supabase RLS | Roles → permissions → DB policies |
| **Row-Level Security** | PostgreSQL RLS | Tenant isolation at DB layer; unbreachable |
| **API Middleware** | Custom (Next.js middleware) | Route guards; rate limiting; JWT verification |
| **Feature Gates** | Custom + PostHog | Tier-based feature access |

### 11.3 Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict | XSS protection |
| `X-Frame-Options` | DENY | Clickjacking protection |
| `X-Content-Type-Options` | nosniff | MIME sniffing protection |
| `Strict-Transport-Security` | max-age=31536000 | HTTPS enforcement |
| `Referrer-Policy` | strict-origin-when-cross-origin | Privacy |

### 11.4 Security Operations

| Task | Tool | Frequency |
|------|------|-----------|
| **Dependency Audit** | `pnpm audit` + Snyk | Every build |
| **Secrets Rotation** | Custom script | Every 90 days |
| **Penetration Testing** | OWASP ZAP + manual | Quarterly |
| **Backup Testing** | Supabase PITR | Monthly |
| **Access Review** | Custom audit log review | Monthly |

---

## 12. Development Tools

### 12.1 Code Quality

| Tool | Purpose |
|------|---------|
| **ESLint 9+** | Linting; import rules; React hooks |
| **Prettier 3+** | Code formatting; consistent style |
| **Husky** | Git hooks; pre-commit lint |
| **lint-staged** | Run linters on staged files only |
| **TypeScript strict mode** | Type safety; null checks |

### 12.2 Developer Experience

| Tool | Purpose |
|------|---------|
| **VS Code** | Primary editor; extensions; debugging |
| **Cursor** (optional) | AI-powered coding; faster prototyping |
| **GitHub Copilot** | AI pair programming |
| **React DevTools** | Component inspection |
| **TanStack Query DevTools** | Query debugging |
| **Redux DevTools** | Zustand state inspection |

### 12.3 Documentation

| Type | Tool | Purpose |
|------|------|---------|
| **API Docs** | **Scalar** (OpenAPI UI) | Interactive API documentation |
| **Component Docs** | **Storybook** | UI component catalog; visual testing |
| **Architecture Docs** | **Markdown + Mermaid** | System diagrams; living docs |
| **Code Comments** | **TSDoc** | Inline documentation; IDE tooltips |

---

## 13. Integration Ecosystem

### 13.1 Payment Integrations

| Integration | Use Case | Rationale |
|-------------|----------|-----------|
| **Stripe** | International payments | Global; subscriptions; webhooks; invoices |
| **Razorpay** | India payments | INR support; UPI; local cards; GST compliance |

### 13.2 Communication Integrations

| Channel | Tool | Use Case |
|---------|------|----------|
| **Email** | **Resend** | Transactional emails; magic links; notifications |
| **SMS** | **Twilio** | OTP; alerts; booking confirmations |
| **In-App** | Custom (WebSocket) | Real-time notifications; agent events |
| **Telegram/Discord** | Custom bots | Admin alerts; agent notifications (optional) |

### 13.3 Third-Party Integrations

| Service | Integration | Purpose |
|---------|-------------|---------|
| **Google Calendar** | API | Booking system; availability sync |
| **Google Analytics** | Tag | Marketing analytics; conversion tracking |
| **DocuSign/HelloSign** | API | Contract signing (enterprise) |
| **Notion (optional)** | API | Internal knowledge base; SOPs |

---

## 14. Cost Analysis

### 14.1 MVP Stack (Free Tier)

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| Cloudflare (R2 + CDN) | Free | $0 |
| GitHub | Free | $0 |
| Ollama | Local | $0 (removed — API-only) |
| Sentry | Developer | $0 |
| PostHog | Free tier | $0 |
| **Total MVP Cost** | | **$0/month** |

### 14.2 Production Stack (Paid Tiers)

| Service | Tier | Monthly Cost (Est.) |
|---------|------|---------------------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Cloudflare R2 | Pay-as-you-go | $5-20 |
| Railway (agent-server) | Starter | $5-20 |
| Upstash Redis | Pay-as-you-go | $10 |
| Sentry | Team | $26 |
| PostHog | Self-hosted | $0 (or $50 cloud) |
| OpenAI API | Pay-as-you-go | $20-100 |
| **Total Production Cost** | | **$116-281/month** |

### 14.3 Scale Stack (10x Traffic)

| Service | Tier | Monthly Cost (Est.) |
|---------|------|---------------------|
| Vercel | Enterprise | $150+ |
| Supabase | Team | $100+ |
| Railway | Scale | $100+ |
| Redis | Dedicated | $50+ |
| Monitoring | Pro tiers | $100+ |
| LLM API | Scale | $500-2000 |
| **Total Scale Cost** | | **$1000-3500/month** |

---

## 15. Migration Path

### 15.1 Phase Transitions

```
Phase 1 (MVP):
  Next.js API Routes + Supabase
  └── Zero ops; fastest to ship

Phase 3 (Automation):
  Add agent-server (Railway)
  └── Heavy agent orchestration; WebSocket fan-out

Phase 5 (Monetization):
  Add dedicated Redis; database read replicas
  └── Performance optimization; scale-ready

Phase 6 (Scale):
  Kubernetes migration (optional)
  └── Multi-region; high availability; enterprise SLAs
```

### 15.2 Data Migration Strategy

| Migration | Tool | Downtime |
|-----------|------|----------|
| Supabase Free → Pro | Supabase CLI | Zero (in-place upgrade) |
| Supabase → Dedicated Postgres | pg_dump/restore | < 1 hour |
| ChromaDB → pgvector | Custom script | < 1 hour |
| Vercel → Custom infra | Docker + CI/CD | Zero (blue-green) |

---

## Summary: Recommended Stack

### Core Technologies (Non-Negotiable)

| Category | Choice |
|----------|--------|
| **Language** | TypeScript 5.3+ (strict) |
| **Runtime** | Node.js 20 LTS |
| **Frontend** | Next.js 15+ (App Router) |
| **UI** | shadcn/ui + Tailwind CSS |
| **State** | TanStack Query + Zustand |
| **Database** | Supabase (PostgreSQL 16) |
| **Auth** | Supabase Auth + RLS |
| **Storage** | Cloudflare R2 (3D/heavy) + Supabase Storage (text/docs) |
| **XR Engine** | Babylon.js (Editor + Next.js template) + Marzipano (360° tour viewer carve-out) |
| **Agent Framework** | LangGraph (online) + AgentGPT (online) + Hermes (local) |
| **LLM** | API providers (OmniRoute → OpenAI → OpenRouter → Groq) |
| **Hosting** | Vercel + Railway + Cloudflare |

### Key Decisions

1. **Next.js 15+ over Vite** for SSR, SEO, and server components
2. **Supabase over Firebase** for SQL, RLS, and pgvector
3. **LangGraph over AutoGen** for CEO workflow orchestration
4. **Babylon.js (Editor) over Three.js + R3F** for designer-authored XR scenes + native Next.js export (supersedes Three.js+R3F; 2026-08-05)
5. **Vercel over AWS** for zero-ops deployment
6. **API-provider LLMs over Ollama** — cloud model routing; no local GPU requirement
7. **AgentGPT over CrewAI** for the 12 specialized agents — always-online browser multi-agent
8. **Storage split** — R2 for 3D/heavy media, Supabase Storage for text/documents only
9. **Single 3D engine** — no parallel Three.js + Babylon.js stacks; narrow Three.js exception only for developer-built non-editor data-viz views
10. **Marzipano (360° tour viewer) over Babylon PhotoDome-only** — Apache 2.0 panorama layer for Virtual Tour; named carve-out scoped to TourEngine; Babylon.js PhotoDome retained as fallback (ADR 6.1.1; 2026-08-05)

### Avoid These (Anti-Patterns)

| Avoid | Reason |
|-------|--------|
| Redux | TanStack Query + Zustand covers all state needs |
| GraphQL (MVP) | REST is simpler; add GraphQL in Phase 3 |
| AWS (MVP) | Overkill for solo founder; use Vercel |
| Docker/K8s (MVP) | Defer to Phase 6; focus on product first |
| Multiple databases | Supabase covers everything (Postgres, Storage, Auth, Edge Functions) |
| AutoGen + LangChain stacked together | Minimal Software Rule: pick ONE orchestration framework per concern |

---

## Next Steps

1. **Set up monorepo** (pnpm + Turborepo)
2. **Initialize Supabase project** (Auth + Postgres + Storage)
3. **Create design tokens** (colors, typography, spacing)
4. **Build component library** (shadcn/ui customization)
5. **Implement auth flow** (email + Google OAuth)
6. **Start Phase 1 development** (see implementation-plans/)

---

*This techstack selection is optimized for: solo founder MVP → production SaaS → enterprise scale.*
