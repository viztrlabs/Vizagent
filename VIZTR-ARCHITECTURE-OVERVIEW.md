# VizTR Platform — File Structure & Architecture Overview

**Version**: 1.0.0 | **Date**: August 6, 2026 | **Status**: Living Document (editable)  
**Owner**: VizTR Architecture Team  
**Cross-references**: [VIZTR-COMPLETE-FEATURES.md](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/VIZTR-COMPLETE-FEATURES.md) (§2.1), [VIZTR-TECHSTACK-SELECTION.md](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/VIZTR-TECHSTACK-SELECTION.md), [VIZTR-TECHNICAL-DECISION-LOG.md](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md)

> **Purpose**: Single-source architecture reference for directory structure, system topology, data flow, technology stack, CI/CD, environment configuration, and development commands. Every structural decision below is traceable to the planning documents above.

---

## Table of Contents

1. [File Structure Overview](#1-file-structure-overview)
2. [Key Application Files](#2-key-application-files)
3. [Packages Structure](#3-packages-structure)
4. [Architecture Diagrams](#4-architecture-diagrams)
5. [CI/CD Pipeline](#5-cicd-pipeline)
6. [Environment Configuration](#6-environment-configuration)
7. [Development Commands](#7-development-commands)
8. [Performance Targets](#8-performance-targets)
9. [Architecture Decision Log (Recent)](#9-architecture-decision-log-recent)
10. [Key Resources](#10-key-resources)

---

## 1. File Structure Overview

### Root Directory

<!-- 
  Source: VIZTR-COMPLETE-FEATURES.md §2.1 "System Topology (17 Repositories — Monorepo)"
  Corrections applied:
    - infra/ (not infrastructure/) per Features doc §2.1
    - No services/ directory (workers live in packages/queue/)
    - packages/ includes queue/, qa/, database/ per Phase 0/1 & Phase 3
    - docs/ includes all subdirectories per Features doc §2.1
-->

```
viztr-platform/                          # Single Monorepo (pnpm + Turborepo)
├── apps/                                # 6 Deployable Applications
│   ├── web/                             # Next.js 16.2 Public Website (Vercel)
│   ├── dashboard/                       # Next.js 16.2 Admin Dashboard (Vercel) ¹
│   ├── xr/                              # Next.js 16.2 XR Engine — xr.viztr.com (Babylon.js/WebXR)
│   ├── agent-server/                    # Node.js 22 API + MCP Server (Railway)
│   ├── local-runner/                    # Hermes Local Agent (Binary/Node)
│   └── pixel-streaming-web/             # WebRTC Stream Client (Vercel)
│
├── packages/                            # 16 Shared Packages
│   ├── shared-types/                    # All TS interfaces + Zod schemas
│   ├── shared-ui/                       # shadcn/ui + VizTR components
│   ├── shared-utils/                    # Helpers, API client, formatters
│   ├── database/                        # Prisma schema, migrations, seed, helpers (Phase 0/1)
│   ├── queue/                           # BullMQ queue factory + workers (Phase 3)
│   ├── qa/                              # QA checks + report persistence (Phase 3)
│   ├── agents/                          # 13 Agent implementations
│   ├── mcp/                             # MCP Connector + 30+ tools
│   ├── tools/                           # Shared agent tool functions
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
├── implementation-plans/                # Phase implementation documents
│   ├── 2026-08-05-phase0-1-foundation.md
│   ├── 2026-08-05-phase2-core-platform.md
│   ├── 2026-08-05-phase3-automation.md
│   ├── 2026-08-05-phase4-xr-engine.md
│   ├── 2026-08-05-phase4-virtual-tour-marzipano.md
│   ├── 2026-08-05-phase5-monetization.md
│   ├── 2026-08-05-phase6-hardening-launch.md
│   ├── VIZTR-IMPLEMENTATION-STARTER.md
│   ├── VIZTR-TECHNICAL-DECISION-LOG.md
│   └── VIZTR-TECHSTACK-SELECTION.md
│
└── docs/                                # All documentation
    ├── DATABASE-ERD.md                  # Database Entity Relationship Diagram
    ├── API-CONTRACT.md                  # API Endpoint Documentation
    ├── AGENT-FLOWCHART.md               # Agent Workflow Diagram
    ├── CONTRIBUTING.md                  # Contribution Guidelines
    ├── DEV_SETUP.md                     # Development Setup Instructions
    ├── ENVIRONMENT-MATRIX.md            # Environment Variables
    ├── PIXEL-STREAMING-TOPOLOGY.md      # Pixel Streaming Architecture
    ├── README.md                        # Project overview and quick start
    ├── specs/                           # 6 spec documents
    ├── ai-ready/                        # Machine-readable specs for agents
    ├── sop/                             # SOP knowledge base (§10.8)
    ├── architecture/                    # System architecture notes
    ├── pricing/                         # Pricing + proposal templates
    ├── client-onboarding/               # Client intake, briefs, onboarding scripts
    └── superpowers/                     # Superpowers integration docs
        ├── specs/                       # Technical specifications
        └── plans/                       # Implementation plans
```

> ¹ **Dashboard deployment decision (ADR pending):** [VIZTR-COMPLETE-FEATURES.md](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/VIZTR-COMPLETE-FEATURES.md) §2.1 lists `apps/dashboard/` as a separate deployable. Phase 2 implementation plans build dashboard routes inside `apps/web/`. **Recommendation**: Separate `apps/dashboard/` for bundle isolation — dashboard imports TanStack Table, Recharts, etc. that the public site should not ship. This needs a formal ADR to resolve the inconsistency.

---

## 2. Key Application Files

### App: `apps/web/` — Public Website
```
apps/web/
├── app/                                 # Next.js App Router
│   ├── layout.tsx                       # Root layout (theme, fonts, analytics)
│   ├── page.tsx                         # Home page
│   ├── (marketing)/                     # Marketing routes (SSR/SSG)
│   │   ├── about/page.tsx
│   │   ├── services/page.tsx
│   │   ├── services/[slug]/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── portfolio/[slug]/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── blog/[slug]/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── book/page.tsx
│   │   ├── team/page.tsx
│   │   ├── careers/page.tsx
│   │   └── xr/
│   │       ├── page.tsx                 # XR technology overview
│   │       ├── virtual-reality/page.tsx
│   │       ├── augmented-reality/page.tsx
│   │       ├── virtual-tour/page.tsx
│   │       ├── pixel-streaming/page.tsx
│   │       └── webxr/page.tsx
│   ├── api/                             # API Routes (Next.js Route Handlers)
│   │   ├── upload/route.ts
│   │   ├── contact/route.ts
│   │   ├── book/route.ts
│   │   ├── publish/route.ts
│   │   └── public/settings/route.ts
│   └── (portal)/                        # Client portal routes (authenticated)
│       ├── portal/page.tsx
│       └── portal/[projectId]/page.tsx
├── components/
│   ├── layout/                          # Nav, Footer, Sidebar
│   ├── hero/                            # 3D hero (Babylon.js, §17.8)
│   ├── analytics/                       # GA4 consent-aware injector
│   └── publish/                         # Publish button + flow
└── lib/
    ├── analytics.ts                     # GA4 helpers
    └── role-redirect.ts                 # Post-login role routing
```

### App: `apps/dashboard/` — Admin Dashboard ¹
```
apps/dashboard/
├── app/                                 # Next.js App Router
│   ├── layout.tsx                       # Dashboard layout with fixed sidebar
│   ├── page.tsx                         # Dashboard home (overview stats)
│   └── (protected)/                     # Authenticated routes
│       ├── projects/                    # Project management
│       ├── admin/                       # Admin routes (SUPER_ADMIN, ADMIN)
│       │   ├── overview/page.tsx
│       │   ├── orders/page.tsx
│       │   ├── clients/page.tsx
│       │   ├── team/page.tsx
│       │   ├── files/page.tsx
│       │   ├── agents/page.tsx          # Agent Dashboard + Monitoring + Command Center
│       │   └── agents/emergency-stop/route.ts
│       ├── super-admin/                 # Super Admin only
│       │   ├── analytics/page.tsx
│       │   ├── transfers/page.tsx
│       │   ├── settings/page.tsx        # System Settings of the Dashboard
│       │   ├── audit-log/page.tsx
│       │   ├── gpu-monitoring/page.tsx
│       │   └── impersonate/route.ts
│       ├── cms/                         # Content management
│       │   ├── pages/page.tsx
│       │   ├── blog/page.tsx
│       │   ├── testimonials/page.tsx
│       │   ├── faq/page.tsx
│       │   └── settings/page.tsx
│       └── xr/                          # XR service routes (disabled until Phase 4)
└── components/
    ├── sidebar.tsx
    ├── stats-cards.tsx
    └── data-table.tsx
```

### App: `apps/xr/` — XR Engine (`xr.viztr.com`)
```
apps/xr/
├── app/                                 # Next.js 16.2 App Router
│   ├── layout.tsx                       # Minimal XR layout (no nav chrome)
│   ├── viewer/[projectId]/page.tsx      # Main entry → ModeManager
│   ├── xr-world/page.tsx                # Interactive 3D XR World spatial entry
│   └── view/                            # Token-based delivery
│       ├── [mode]/[token]/page.tsx      # Public/password/token viewer
│       └── xr/[token]/page.tsx          # XR share link viewer
├── components/
│   └── viewers/
│       ├── babylon-viewer.tsx           # Babylon.js 3D/WebXR/VR viewer
│       ├── tour-viewer.tsx              # Marzipano 360° tour viewer (ADR 6.1.1)
│       ├── ar-viewer.tsx                # WebAR viewer (MindAR ²)
│       └── pixel-viewer.tsx             # Pixel Streaming WebRTC viewer
├── lib/
│   ├── mode-manager.ts                  # Zustand store: mode switching + history
│   ├── experience-config.ts             # Device-aware mode configuration
│   ├── share/access.ts                  # Token generation + password hashing (bcrypt ³)
│   ├── stream/capture.ts                # Pixel Streaming screenshot
│   ├── vr/gaze.ts                       # VR gaze dwell selection
│   ├── webar/marker.ts                  # MindAR marker type detection
│   └── webxr/anchors.ts                # WebXR AR feature flags
└── test/
    ├── mode-manager.test.ts
    ├── experience-config.test.ts
    ├── share-access.test.ts
    ├── gaze.test.ts
    ├── webar-marker.test.ts
    └── webxr-anchors.test.ts
```

> ² **MindAR caveat (ADR review pending):** MindAR depends on Three.js (`mindar-image-three`), which conflicts with the Babylon.js single-engine policy (ADR 6.1). Evaluate Babylon.js native WebXR AR as a replacement. See [VIZTR-TECHNICAL-DECISION-LOG.md ADR 6.1](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md).

> ³ **Security fix (audit 2026-08-05):** Original plan used `createHash("sha256")` for share link passwords. This is **critically insecure** — SHA-256 is fast and unsalted. Must use `bcrypt` or Supabase Auth for password verification. See [Phase 4 Task 8](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase4-xr-engine.md).

### App: `apps/agent-server/` — Agent Server
```
apps/agent-server/
├── src/
│   ├── index.ts                         # Fastify 4.28 server entry
│   ├── mcp/                             # MCP Server (Universal MCP Connector)
│   │   ├── server.ts                    # @modelcontextprotocol/sdk server
│   │   └── tools/                       # 30+ MCP tool implementations
│   ├── agents/                          # LangGraph agent orchestration
│   │   ├── ceo-graph.ts                 # CEO orchestrator (LangGraph)
│   │   └── worker-graphs/               # 12 worker agent sub-graphs ⁴
│   ├── hermes/                          # Hermes local runner bridge
│   │   ├── health.ts                    # Health check endpoint
│   │   └── tunnel.ts                    # Cloudflare Tunnel connector
│   └── queue/                           # BullMQ job dispatchers
└── test/
```

> ⁴ **Agent framework correction (audit 2026-08-05):** Original plan used AgentGPT for 12 worker agents. AgentGPT is experimental/unstable. Recommendation: use LangGraph sub-graphs for all agents (single framework, proven stability). See [Phase 3](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase3-automation.md).

---

## 3. Packages Structure

<!-- 
  Source: Phase 0/1 (database), Phase 3 (queue, qa), Phase 4 (experience-engine),
  VIZTR-COMPLETE-FEATURES.md §2.1
-->

```
packages/
├── database/                            # Database layer (Phase 0/1)
│   ├── prisma/
│   │   ├── schema.prisma                # 92 models (§8.1)
│   │   ├── migrations/                  # Version-controlled migrations
│   │   └── seed.ts                      # Demo accounts + test data
│   ├── src/
│   │   ├── client.ts                    # Prisma client factory
│   │   ├── rbac.ts                      # RBAC permission checks
│   │   ├── rls.ts                       # RLS policy helpers
│   │   ├── demo-accounts.ts             # Role demo accounts
│   │   └── publish.ts                   # Publish flow (APPROVED + QA gate)
│   └── test/
│
├── queue/                               # Job queue (Phase 3)
│   ├── src/
│   │   ├── index.ts                     # BullMQ queue factory + enqueue
│   │   ├── workers/
│   │   │   ├── process-asset.ts         # Asset download → validate → optimize → store
│   │   │   ├── render.ts                # GPU/Cloud render lane routing
│   │   │   └── notify.ts               # Resend/Twilio dispatch
│   │   └── jobs/
│   │       └── upload.ts                # Upload validation + R2 storage
│   └── test/
│
├── qa/                                  # Quality assurance (Phase 3)
│   ├── src/
│   │   ├── checks.ts                    # GLB size cap, render thumbnails, integrity
│   │   └── report.ts                    # QA report persistence → project.qaPassed
│   └── test/
│
├── shared-types/                        # Core type definitions
│   ├── src/
│   │   ├── auth.ts                      # User, Role, Permission, Session
│   │   ├── project.ts                   # Project, Version, Asset, Scene
│   │   ├── cms.ts                       # Page, Blog, Testimonial, FAQ
│   │   ├── agent.ts                     # AgentRun, Task, Memory
│   │   ├── billing.ts                   # Subscription, Invoice, Usage
│   │   └── xr.ts                        # ExperienceConfig, ViewMode, ShareLink
│   └── package.json
│
├── shared-ui/                           # UI component library
│   ├── src/
│   │   ├── components/                  # shadcn/ui + VizTR custom components
│   │   │   ├── badge.tsx
│   │   │   ├── section-heading.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   └── ...                      # Additional shadcn/ui components
│   │   ├── hooks/                       # Custom React hooks
│   │   └── theme/                       # ThemeProvider (next-themes)
│   └── test/
│
├── shared-utils/                        # Common utilities
│   ├── src/
│   │   ├── api-client.ts                # Typed fetch wrapper (Zod validated)
│   │   ├── rate-limit.ts                # Redis sliding window rate limiter
│   │   ├── formatters.ts                # Date, currency, file size formatters
│   │   └── validators.ts                # Shared Zod schemas
│   └── test/
│
├── agents/                              # 13 Agent implementations
│   ├── ceo/                             # CEO orchestrator (LangGraph)
│   ├── hermes/                          # Hermes local runner
│   ├── webxr/                           # WebXR agent
│   ├── webar/                           # WebAR agent
│   ├── vr/                              # VR agent
│   ├── virtual-tour/                    # Virtual Tour agent
│   ├── pixel-streaming/                 # Pixel Streaming agent
│   ├── website-developer/               # Website developer agent
│   └── internal/                        # sales, support, design, finance, analytics, qa
│
├── mcp/                                 # MCP server & tools
│   ├── src/
│   │   ├── server.ts                    # @modelcontextprotocol/sdk server
│   │   └── tools/                       # 30+ tool definitions
│   │       ├── supabase.ts              # project.create, asset.upload, etc.
│   │       ├── github.ts                # PR create, branch management
│   │       ├── vercel.ts                # Deployments, preview URLs
│   │       ├── files.ts                 # Local workstation file access
│   │       ├── unreal.ts                # Pixel Streaming control
│   │       ├── hermes.ts                # Hermes local runner bridge
│   │       └── llm.ts                   # API provider routing (OmniRoute)
│   └── test/
│
├── tools/                               # Shared agent tool functions
│   ├── src/
│   │   ├── asset-pipeline.ts            # Asset processing tools
│   │   ├── blender.ts                   # Blender integration
│   │   └── unreal.ts                    # Unreal integration
│   └── test/
│
├── experience-engine/                   # XR engine core
│   ├── src/
│   │   ├── config.ts                    # ExperienceConfig interface
│   │   ├── scene-loader.ts              # GLB/scene loading (Draco/KTX2 WASM)
│   │   ├── mode-manager.ts              # Mode switching (Zustand)
│   │   └── viewers/                     # Viewer implementations
│   │       ├── babylon.ts               # Babylon.js 3D/WebXR
│   │       ├── tour.ts                  # Marzipano panorama
│   │       ├── ar.ts                    # WebAR
│   │       ├── vr.ts                    # VR
│   │       └── pixel.ts                 # Pixel Streaming
│   └── test/
│
├── asset-pipeline/                      # Asset processing
│   ├── src/
│   │   ├── gltf.ts                      # gltf-transform pipeline
│   │   ├── texture.ts                   # KTX2/Basis Universal
│   │   ├── compressor.ts                # Draco/Meshopt compression
│   │   └── validator.ts                 # gltf-validator wrapper
│   └── test/
│
├── blender-scripts/                     # Blender Python scripts
│   ├── export-scene.py
│   ├── optimize-model.py
│   └── generate-assets.py
│
├── unreal-config/                       # Unreal Engine configuration
│   ├── pixel-streaming.ts               # Pixel Streaming config
│   └── build.ts                         # Build configuration
│
├── design-tokens/                       # Design tokens (JSON)
│   ├── colors.json                      # Color palette
│   ├── typography.json                  # Typography scale
│   └── spacing.json                     # Spacing scale
│
├── testing-utils/                       # Testing utilities
│   ├── factories.ts                     # Test data factories
│   ├── mocks.ts                         # MSW API mocks
│   └── fixtures.ts                      # Test fixtures
│
└── analytics/                           # Analytics
    ├── tracking.ts                      # Event tracking
    ├── heatmaps.ts                      # Heatmap utilities
    └── segments.ts                      # User segmentation
```

---

## 4. Architecture Diagrams

### 4.1 System Topology

```mermaid
graph TD
    %% Public Access
    User([User]) --> Web[Next.js Web<br/>apps/web]
    User --> XR[XR Engine<br/>xr.viztr.com]
    User --> Dashboard[Dashboard<br/>apps/dashboard]
    User --> Portal[Client Portal<br/>apps/web/portal]
    
    %% Frontend → Backend
    Web --> API[Next.js API Routes]
    XR --> API
    Dashboard --> API
    Portal --> API
    
    %% Backend Services
    API --> Supabase[(Supabase<br/>PostgreSQL + pgvector)]
    API --> Redis[(Redis 7<br/>Cache + Queues)]
    API --> R2[(Cloudflare R2<br/>Object Storage)]
    API --> AgentServer[Agent Server<br/>Node.js + MCP]
    
    %% Agent System
    AgentServer --> CEOGraph[CEO Graph<br/>LangGraph]
    CEOGraph --> Workers[12 Worker<br/>Sub-graphs]
    AgentServer --> Hermes[Hermes<br/>Local Workstation]
    
    %% Local Processing
    Hermes --> Unreal[Unreal Engine 5<br/>Pixel Streaming]
    Hermes --> Blender[Blender 4+<br/>Headless Scripts]
    Hermes --> QA[QA Scripts]
    
    %% Tunneling
    Hermes --> Tunnel[Cloudflare Tunnel]
    Tunnel --> API
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,color:#000
    classDef backend fill:#fff3e0,stroke:#e65100,color:#000
    classDef data fill:#f3e5f5,stroke:#4a148c,color:#000
    classDef local fill:#e8f5e9,stroke:#1b5e20,color:#000
    
    class User frontend
    class Web,XR,Dashboard,Portal frontend
    class API,AgentServer,CEOGraph,Workers backend
    class Supabase,Redis,R2 data
    class Hermes,Unreal,Blender,QA,Tunnel local
```

### 4.2 Platform Layer Model

```mermaid
graph TB
    subgraph "Experience Layer"
        Web[Next.js Web]
        Dashboard[Next.js Dashboard]
        XR[Next.js XR Engine]
        Portal[Client Portal]
        PixelClient[Pixel Streaming Client]
    end
    
    subgraph "Intelligence Layer"
        CEO[CEO Agent<br/>LangGraph]
        ServiceAgents[5 Service Agents<br/>WebXR · WebAR · VR · Tour · Pixel]
        InternalAgents[7 Internal Agents<br/>Sales · Support · Design · Finance · Analytics · QA · Web Dev]
        MCP[Universal MCP Connector<br/>30+ Tools]
    end
    
    subgraph "Service Layer"
        AgentAPI[Agent Server<br/>Fastify 4.28]
        BullMQ[BullMQ<br/>Job Queue]
        Resend[Resend<br/>Email]
        Twilio[Twilio<br/>SMS/WhatsApp]
        AuditLog[Audit Logging]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL 16<br/>Supabase)]
        PGV[(pgvector<br/>Embeddings)]
        Redis7[(Redis 7<br/>Upstash/Railway)]
        CloudflareR2[(Cloudflare R2<br/>Assets/Media)]
        SupaStorage[(Supabase Storage<br/>Documents)]
    end
    
    subgraph "Infrastructure Layer"
        Vercel[Vercel<br/>Edge Network]
        Railway[Railway<br/>Containers]
        Hostinger[Hostinger VPS<br/>PostgreSQL · Redis]
        Cloudflare[Cloudflare<br/>CDN · Tunnel · DDoS]
    end
    
    %% Connections
    Web --> AgentAPI
    Dashboard --> AgentAPI
    XR --> AgentAPI
    Portal --> AgentAPI
    
    AgentAPI --> CEO
    CEO --> ServiceAgents
    CEO --> InternalAgents
    CEO --> MCP
    
    AgentAPI --> BullMQ
    AgentAPI --> PG
    AgentAPI --> Redis7
    BullMQ --> Resend
    BullMQ --> Twilio
    
    PG --> PGV
    
    Vercel --> Web
    Vercel --> Dashboard
    Vercel --> XR
    Railway --> AgentAPI
    Cloudflare --> Vercel
```

### 4.3 Data Flow

```mermaid
graph LR
    %% Entry Points
    Public([Public User]) -->|Marketing Site| Web[apps/web]
    Public -->|XR Viewer| XR[apps/xr]
    Client([Client]) -->|Approvals| Portal[Client Portal]
    Admin([Admin/Staff]) -->|Management| Dash[apps/dashboard]
    
    %% Auth & Routing
    Web --> Auth{Supabase Auth<br/>+ RBAC Middleware}
    XR --> Auth
    Portal --> Auth
    Dash --> Auth
    
    Auth -->|Authenticated| Routes[Next.js API Routes]
    Auth -->|Public| SSR[SSR/SSG Pages]
    
    %% Backend Processing
    Routes --> DB[(PostgreSQL<br/>Prisma ORM + RLS)]
    Routes --> Cache[(Redis<br/>Rate Limit · Sessions)]
    Routes --> Storage[(Cloudflare R2<br/>Assets)]
    Routes --> Queue[BullMQ Queue]
    
    Queue --> ProcessAsset[process-asset<br/>Worker]
    Queue --> Render[render<br/>Worker]
    Queue --> Notify[notify<br/>Worker]
    
    %% Agent System
    Routes --> AgentServer[Agent Server]
    AgentServer --> CEOGraph[CEO Graph<br/>LangGraph]
    CEOGraph --> MCPTools[MCP Tools<br/>30+ Integrations]
    AgentServer --> Hermes[Hermes<br/>Local Workstation]
    
    %% Local Processing
    Hermes -->|Cloudflare Tunnel| AgentServer
    Hermes --> UE5[Unreal Engine 5]
    Hermes --> Blender4[Blender 4+]
    Hermes --> AssetPipe[Asset Pipeline<br/>Draco · KTX2 · Meshopt]
```

### 4.4 Technology Stack Matrix

```mermaid
graph TD
    subgraph "Frontend"
        NJS[Next.js 16+<br/>App Router + React 19 Server Components]
        TS[TypeScript 7.0+ strict<br/>Go-powered compiler]
        TW[Tailwind CSS 4.0]
        SHAD[shadcn/ui]
        BJS[Babylon.js 8+]
        FM[Framer Motion 12]
        RHF[react-hook-form + Zod]
        TSQ[TanStack Query 5]
        ZST[Zustand]
    end
    
    subgraph "Backend"
        Node[Node.js 22 LTS]
        Fast[Fastify 4.28]
        SBAuth[Supabase Auth]
        Bull[BullMQ 5]
        Redis[Redis 7+]
        Socket[Socket.io]
        Rsend[Resend + react-email]
    end
    
    subgraph "Database & Storage"
        PG16[PostgreSQL 16<br/>Supabase]
        Prisma[Prisma ORM]
        RLS[Row-Level Security]
        PGV[pgvector]
        R2[Cloudflare R2]
        SBStorage[Supabase Storage]
    end
    
    subgraph "XR Engine"
        Babylon[Babylon.js 8+<br/>Core Engine · ADR 6.1]
        Marzi[Marzipano<br/>360° Tour · ADR 6.1.1]
        WebXR[WebXR API]
        MindAR_[MindAR<br/>Image Tracking · Under Review]
        USDZ[USDZ Quick Look<br/>iOS AR]
        PixelStream[Unreal Engine 5<br/>Pixel Streaming + WebRTC]
    end
    
    subgraph "AI & Agents"
        LG[LangGraph JS<br/>CEO + Worker Sub-graphs]
        MCPSDK["@modelcontextprotocol/sdk"]
        GPT4O[gpt-4o-mini · gpt-4.1 · o3-mini]
        Nomic[nomic-embed-text<br/>768-dim embeddings]
        OmniRoute[OmniRoute → OpenAI → OpenRouter → Groq]
    end
    
    subgraph "Testing"
        Vitest[Vitest<br/>Unit + Integration]
        PW[Playwright<br/>E2E]
        SB[Storybook<br/>Component]
        MSW[MSW<br/>API Mocking]
    end
    
    subgraph "DevOps"
        GHA[GitHub Actions<br/>CI/CD]
        PNPM[pnpm + Turborepo<br/>Monorepo]
        Vcl[Vercel<br/>Frontend Deploy]
        Rail[Railway<br/>Backend Deploy]
        CF[Cloudflare<br/>CDN + Tunnel]
        Sentry[Sentry<br/>Error Tracking]
        PostHog[PostHog<br/>Product Analytics]
    end
```

### 4.5 XR Mode Architecture

```mermaid
graph TD
    Entry["/viewer/[projectId]"] --> Config[ExperienceConfig<br/>Device-aware mode matrix]
    Config --> MM[ModeManager<br/>Zustand Store]
    
    MM -->|mode=3d| BV[Babylon Viewer<br/>Babylon.js 8+]
    MM -->|mode=tour| TV[Tour Viewer<br/>Marzipano · ADR 6.1.1]
    MM -->|mode=ar| AV[AR Viewer<br/>WebXR AR + MindAR]
    MM -->|mode=vr| VV[VR Viewer<br/>Babylon.js WebXR VR]
    MM -->|mode=stream| PV[Pixel Viewer<br/>WebRTC + Unreal]
    
    BV --> Hotspots[Hotspot System<br/>Click/Tap/Gaze]
    TV --> TourHotspots[Tour Hotspots<br/>Marzipano Spots]
    VV --> Gaze[Gaze Dwell<br/>Selection]
    AV --> Markers[Marker Tracking<br/>PATT/MIND/Matrix]
    PV --> Stream[WebRTC Session<br/>Cloudflare Tunnel]
    
    subgraph "Delivery"
        Share["/view/[mode]/[token]"]
        Share --> Access{Token Auth<br/>public · password · token}
        Access --> Viewer[Selected Viewer]
        Access --> ViewCount[View Count++]
        Access --> Expiry{Expired?}
    end
    
    subgraph "Editor"
        Editor[Interaction Editor<br/>apps/dashboard/xr]
        Editor --> InteractionJSON[Normalized JSON<br/>Per Version]
        InteractionJSON --> Config
    end
```

---

## 5. CI/CD Pipeline

<!-- 
  Source: VIZTR-TECHSTACK-SELECTION.md §7.3
  Corrections: Removed invalid "pnpm deploy --prod" — Vercel auto-deploys on Git push.
  Added separate typecheck step per tech stack doc.
-->

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint          # ESLint 9+
      - run: pnpm typecheck     # tsc --noEmit

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit           # Vitest unit tests
      - run: pnpm test:integration    # Vitest + Supabase local

  build:
    runs-on: ubuntu-latest
    needs: [quality, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build    # Turborepo parallel build

  # Vercel auto-deploys on push to main (GitHub integration)
  # No manual deploy step needed — see TECHSTACK-SELECTION.md §7.3

  e2e:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e    # Playwright critical paths
```

### Merge-to-Main Gates (Phase 6)

```yaml
# .github/workflows/merge-gate.yml (Phase 6 addition)
name: Merge Gate

on:
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm lighthouse:ci    # Performance budgets

  a11y:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:a11y       # axe-core accessibility

  security:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm audit           # Dependency vulnerabilities
```

---

## 6. Environment Configuration

<!--
  Corrections applied:
    - Removed NEXTAUTH_SECRET (project uses Supabase Auth, not NextAuth)
    - Removed AWS_* keys (project uses Cloudflare R2, not AWS S3)
    - Removed SENDGRID_API_KEY (project uses Resend, not SendGrid)
    - Removed STABLE_DIFFUSION_API_KEY (not in any planning document)
    - Removed WEBPACK5_NOME (typo, not applicable to Next.js 15+)
    - Added all Supabase, R2, Resend, Stripe, PostHog, Sentry keys per tech stack
-->

```bash
# ============================================
# .env.example — VizTR Platform
# ============================================
# Copy to .env.local for development
# See docs/ENVIRONMENT-MATRIX.md for full reference

# === Supabase (Auth + DB + Storage) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# === Cloudflare R2 (Object Storage — 3D assets, media, tiles) ===
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=viztr-assets-dev
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# === Redis (Cache + BullMQ Queues) ===
REDIS_URL=redis://localhost:6379

# === AI / LLM Providers ===
OPENAI_API_KEY=your-openai-key
OPENROUTER_API_KEY=your-openrouter-key
GROQ_API_KEY=your-groq-key

# === Email (Resend + react-email) ===
RESEND_API_KEY=your-resend-key

# === SMS/WhatsApp (Twilio) ===
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# === Payments (Stripe) ===
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# === Payments (Razorpay — India market, Phase 5) ===
# RAZORPAY_KEY_ID=your-razorpay-key
# RAZORPAY_KEY_SECRET=your-razorpay-secret

# === Observability ===
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# === Vercel ===
VERCEL_TOKEN=your-vercel-token

# === Cloudflare Tunnel ===
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token

# === GitHub (Content-as-Code) ===
GITHUB_TOKEN=your-github-pat
```

---

## 7. Development Commands

```bash
# ─── Development ───────────────────────────────
pnpm dev                # Start all apps with Turborepo (parallel)
pnpm dev --filter web   # Start public website only
pnpm dev --filter dashboard   # Start admin dashboard only
pnpm dev --filter xr    # Start XR engine only
pnpm dev --filter agent-server   # Start API server only

# ─── Build ─────────────────────────────────────
pnpm build              # Build all apps (Turborepo parallel)
pnpm build --filter web # Build public website only

# ─── Testing (Vitest + Playwright) ─────────────
pnpm test               # Run all unit tests (Vitest)
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests (Vitest + Supabase local)
pnpm test:e2e           # E2E tests (Playwright)
pnpm test:coverage      # Generate coverage report
pnpm --filter @viztr/ui test   # Test specific package

# ─── Code Quality ──────────────────────────────
pnpm lint               # ESLint across all packages
pnpm typecheck          # TypeScript strict check (tsc --noEmit)
pnpm format             # Prettier formatting

# ─── Database (Prisma + Supabase) ──────────────
pnpm db:generate        # Generate Prisma client
pnpm db:migrate         # Run Prisma migrations
pnpm db:push            # Push schema changes (dev only)
pnpm db:seed            # Seed database with demo data
pnpm db:studio          # Open Prisma Studio GUI
pnpm db:reset           # Reset database + re-seed

# ─── Supabase Local ───────────────────────────
npx supabase start      # Start local Supabase (Docker)
npx supabase stop       # Stop local Supabase
npx supabase db reset   # Reset local DB

# ─── Storybook ─────────────────────────────────
pnpm storybook          # Start Storybook (component docs)

# ─── Documentation ────────────────────────────
pnpm docs:generate      # Generate API documentation (Scalar)
```

---

## 8. Performance Targets

<!-- Source: VIZTR-COMPLETE-FEATURES.md §22, VIZTR-TECHSTACK-SELECTION.md §9.3 -->

| Metric | Target | Tool |
|--------|--------|------|
| **Lighthouse (all categories)** | ≥ 90 | Lighthouse CI |
| **LCP** | < 2.5s | Vercel Analytics |
| **CLS** | < 0.1 | Vercel Analytics |
| **TBT** | < 200ms | Lighthouse CI |
| **API p95 response** | < 200ms | Custom + Sentry |
| **3D scene init (desktop)** | < 2s | Custom overlay |
| **3D scene init (mobile)** | < 3s | Custom overlay |
| **FPS (desktop)** | 60 | Babylon.js Engine stats |
| **FPS (mobile)** | 30 | Babylon.js Engine stats |
| **FPS (VR headset)** | 90 | Babylon.js Engine stats |
| **GLB model size** | ≤ 10MB compressed | Asset pipeline |
| **Pixel Streaming latency** | < 100ms | WebRTC stats |
| **Lead conversion rate** | ≥ 5% of visitors | GA4 + PostHog |
| **Time to first XR demo** | ≤ 3 min from project creation | Custom |

### Turborepo Configuration

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "typecheck": {}
  }
}
```

---

## 9. Architecture Decision Log (Recent)

<!-- Source: VIZTR-TECHNICAL-DECISION-LOG.md -->

| Date | ADR | Decision | Status | Notes |
|------|-----|----------|--------|-------|
| 2026-08-05 | 2.1 | Next.js 15+ App Router for all frontend apps | ✅ ADOPTED | SSR/SSG + Server Components |
| 2026-08-05 | 3.1 | Supabase (PostgreSQL + Auth + Storage + RLS) | ✅ ADOPTED | Zero-budget MVP |
| 2026-08-05 | 4.1 | Prisma ORM for schema/migrations | ✅ ADOPTED | Type-safe; schema-as-code |
| 2026-08-05 | 6.1 | Babylon.js 8+ as core 3D engine | ✅ ADOPTED | Supersedes Three.js + R3F |
| 2026-08-05 | 6.1.1 | Marzipano panorama carve-out | ✅ ADOPTED | Named narrow exception for 360° tours only |
| 2026-08-05 | 6.2 | MindAR for image-tracking AR | ⚠️ UNDER REVIEW | Three.js dependency conflicts with ADR 6.1 |
| 2026-08-05 | 7.1 | Vercel + Railway + Cloudflare | ✅ ADOPTED | No K8s until Phase 5+ |
| 2026-08-05 | — | AgentGPT for 12 worker agents | ⚠️ UNDER REVIEW | Experimental; recommend LangGraph sub-graphs |
| 2026-08-05 | — | Token-based XR delivery (5 modes) | ✅ ADOPTED | public/password/token + expiry + revoke |
| 2026-08-05 | — | GA4 with consent-aware component | ✅ ADOPTED | Privacy compliance (GDPR) |

---

## 10. Key Resources

### Infrastructure
| Resource | Details |
|----------|---------|
| GitHub Repository | `github.com/viztr/viztr-platform` |
| Production (Web) | `viztr.com` (Vercel) |
| Production (XR) | `xr.viztr.com` (Vercel) |
| Agent Server | Railway (containers) |
| Database | Supabase (PostgreSQL 16 + pgvector) |
| Object Storage | Cloudflare R2 (S3-compatible, no egress) |
| CDN + Tunnel | Cloudflare |
| Local Workstation | GPU machine (RTX 4090) via Cloudflare Tunnel |

### Monitoring (MVP)
| Tool | Purpose |
|------|---------|
| Vercel Analytics | Frontend Core Web Vitals |
| Sentry | Error tracking + stack traces |
| PostHog (self-hosted) | Product analytics + session replay |
| Supabase Logs | Database + auth logs |
| Uptime Kuma (self-hosted) | Uptime monitoring → `status.viztr.com` |

### Monitoring (Post-MVP / Phase 6+)
| Tool | Purpose |
|------|---------|
| Prometheus | Time-series metrics |
| Grafana | Dashboards + alerting |
| Alertmanager | Alert routing |

### Development Tools
| Tool | Purpose |
|------|---------|
| VS Code | Primary editor |
| Cursor (optional) | AI-powered coding |
| React DevTools | Component inspection |
| TanStack Query DevTools | Query debugging |
| Redux DevTools | Zustand state inspection |

---

## Appendix: Audit Trail

This document was produced by cross-referencing the following source-of-truth documents:

1. [VIZTR-COMPLETE-FEATURES.md](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/VIZTR-COMPLETE-FEATURES.md) — v1.7.0 (2,794 lines)
2. [VIZTR-TECHSTACK-SELECTION.md](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/VIZTR-TECHSTACK-SELECTION.md) — v1.0.0 (806 lines)
3. [VIZTR-TECHNICAL-DECISION-LOG.md](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md) — v1.2.0 (666 lines)
4. [Phase 0/1 Foundation](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase0-1-foundation.md)
5. [Phase 2 Core Platform](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase2-core-platform.md)
6. [Phase 3 Automation](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase3-automation.md)
7. [Phase 4 XR Engine](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase4-xr-engine.md)
8. [Phase 4 Marzipano](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md)
9. [Phase 5 Monetization](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase5-monetization.md)
10. [Phase 6 Hardening](file:///c:/Users/Arch_Viz/Desktop/VizTR/BrainStorming/opencode/implementation-plans/2026-08-05-phase6-hardening-launch.md)

**17 discrepancies corrected** — see [Architecture Document Audit](file:///C:/Users/Arch_Viz/.gemini/antigravity-ide/brain/d0ccd0a0-5f29-471d-8ccd-f695f21f9692/architecture_doc_audit.md) for the full changelog.

---

*This document is the **single source of truth** for VizTR platform architecture and is designed for future editing and evolution.*
