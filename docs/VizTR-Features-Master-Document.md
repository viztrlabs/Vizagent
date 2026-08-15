# VizTR Platform: Complete Features Specification
**Version**: 2.1
**Date**: August 10, 2026
**Status**: Master Reference Document
**Purpose**: Comprehensive feature catalog for development, strategy, and future expansion

> **Reconciliation Note (v2.1):** This version reconciles the original spec (v2.0) with the
> locked technical decisions in `VIZTR-TECHNICAL-DECISION-LOG.md` and the planning docs
> (`VIZTR-SAAS-PLATFORM-BLUEPRINT.md`, `VIZTR-UXUI-DESIGN-SYSTEM.md`,
> `VIZTR-PROMPT-ENGINEERING-SYSTEM.md`).
>
> **Primary change:** **Babylon.js is the single core 3D/XR engine**, superseding
> Three.js / React Three Fiber (ADR 6.1 Revised), with **Marzipano** as the virtual-tour
> carve-out (ADR 6.1.1). All other stack conflicts (Next.js 16.2, Vitest, Resend,
> Cloudflare R2, Fastify path, Vercel + Railway, 4-role naming) are resolved to the decision log.

---

## Table of Contents
1. [Core XR Experiences](#core-xr-experiences)
2. [AI Agent System & Architecture](#ai-agent-system--architecture)
3. [Platform Capabilities](#platform-capabilities)
4. [SaaS Structure & Pricing](#saas-structure--pricing)
5. [Asset Pipeline & Automation](#asset-pipeline--automation)
6. [Security & Access Control](#security--access-control)
7. [User Experience Features](#user-experience-features)
8. [Technical Architecture](#technical-architecture)
9. [Integration & APIs](#integration--apis)
10. [Testing, Performance & Optimization](#testing-performance--optimization)
11. [Future Roadmap (Phase 6+)](#future-roadmap-phase-6)
12. [Notes for Contributors](#notes-for-contributors)

---

## Core XR Experiences

### 1. Virtual Tour (360° Panoramic)
**Status**: MVP Core Feature | **Complexity**: Low | **Timeline**: Phase 1

#### Capabilities
- **360-degree Image Processing**: Multi-resolution tile engine (equirectangular), auto-thumbnails, real-time preview.
- **Navigation**: Floor plan view, spatial relationship mapping, click-based navigation, auto-hotspot linking.
- **Interactivity**: Hotspots, multimedia annotations, compass/orientation indicators.
- **Publishing**: One-click CDN publish, shareable links, analytics tracking, custom branding.

**Tech Stack**: Marzipano (360° panorama engine, ADR 6.1.1), Babylon.js (integration), Cloudflare R2 (tiles/CDN)

---

### 2. WebXR (Browser-based Immersive VR)
**Status**: Phase 2 Feature | **Complexity**: Medium | **Timeline**: Phase 2

#### Capabilities
- **3D Assets**: Auto GLB/GLTF conversion, LOD generation, KTX2 compression, mesh decimation.
- **Scene Setup**: Auto camera paths, ambient/directional lighting, material switching, skyboxes.
- **VR Entry**: Browser XR API integration, teleportation, smooth locomotion, fade-to-black comfort mode.
- **Interaction**: Controller input, raycasting, VR hotspots, hand tracking (if supported).
- **Performance**: Dynamic resolution scaling, FPS LOD switching, GPU memory management.

**Tech Stack**: Babylon.js (core engine, ADR 6.1 Revised), WebXR API, react-babylonjs

---

### 3. WebAR (Mobile Augmented Reality)
**Status**: Phase 3 Feature | **Complexity**: Medium | **Timeline**: Phase 3

#### Capabilities
- **AR Detection**: Device checking, web-based polyfill fallbacks.
- **Placement**: Markerless (plane detection) and marker-based (QR). Surface mesh generation.
- **Interaction**: Real-world scale calibration, touch gestures (rotate/scale/move).
- **Environment**: Shadow projection, environment lighting estimation.

**Tech Stack**: Babylon.js WebXR-AR (hit-test, plane detection), MindAR (marker tracking)

---

### 4. Virtual Reality (Native VR)
**Status**: Phase 4 Feature | **Complexity**: High | **Timeline**: Phase 4

#### Capabilities
- **Device Support**: Meta Quest 2/3/Pro, Apple Vision Pro, HTC Vive, Pico.
- **Features**: Full 6DOF tracking, haptics, gesture recognition, comfort options.
- **VR UI**: Floating panels, immersive keyboard, gesture navigation.
- **Engine Metrics**: True 90 FPS target, predictive rendering.

**Tech Stack**: Babylon.js (core engine, ADR 6.1 Revised), WebXR API

---

### 5. Unreal Engine Pixel Streaming
**Status**: Phase 5 Feature | **Complexity**: Very High | **Timeline**: Phase 5

#### Capabilities
- **UE5 Integration**: Unreal 5.3+ Pixel Streaming plugin, raytracing capabilities.
- **Hermes Orchestration**: GPU task queuing, local workstation control.
- **Network**: WebRTC signaling, Cloudflare Tunnels, adaptive bitrate, low-latency (<100ms).
- **UX & Control**: Start/stop controls, FPS/latency/bandwidth monitoring.

**Tech Stack**: Unreal Engine 5.3+, Pixel Streaming, WebRTC, Cloudflare Tunnels, Babylon.js GUI overlay (React-synced)

---

## AI Agent System & Architecture

### Architectural Principles (System Instruction constraints)
- **Agent Orchestration**: LangGraph coordinates all specialized agents. The CEO Agent acts as the central router and planner.
- **Tools via MCP**: Agents utilize the Universal MCP Connector for all external integrations (30+ tools), strictly isolating tool definitions from agent logic.
- **Deterministic Workflows**: Agent pipelines must have predictable state machines.
- **Context Isolation**: No direct context bleeding between specialized agents; communication passes through structured states.

### Core Agents

#### 1. CEO Agent (Master Orchestrator)
- Receives user inputs, translates them into actionable subtasks.
- Routes execution to specialized XR or Service Agents.
- Summarizes outputs and manages error escalation protocols.

#### 2. Hermes Agent (Local Workstation Controller)
- Has direct file system and GPU access on the local machine.
- Orchestrates Pixel Streaming builds and Cloudflare Tunnels.
- Conducts local QA testing automation prior to cloud sync.

#### 3. XR Conversion Agents
- **WebXR Agent**: 3D → GLB conversion, LOD prep.
- **WebAR Agent**: Mobile optimization, marker setup.
- **VR Agent**: VR package creation, safety configuration.
- **Virtual Tour Agent**: 360° image tiles, linking, metadata.
- **Pixel Streaming Agent**: UE5 scene prep, stream encoding optimization.

#### 4. Platform Service Agents
- **Website Developer, Finance, Analytics, QA, Support, and Design Agents**.

---

## Platform Capabilities

### For Clients (Client Portal)
- **Project Dashboard**: Activity feed, view metrics, shortcut access.
- **Asset Management**: Upload 360/3D, versioning, bulk operations.
- **Preview & Testing**: Live multi-XR preview, device compatibility checks.
- **Collaboration**: Pinned 3D annotations, multi-threaded discussions, approval workflows.
- **Deliverables**: Shareable URLs (viztr.io/tour/id), ZIP exports, password protection.

### For Management (Admin Dashboard)
- **User Directory**: RBAC controls, login history, API key issuance.
- **Task Board**: Live view of the LangGraph agent queue and execution status.
- **Server Monitoring**: Real-time CPU/Mem/GPU, API response times.
- **Audit Logs**: Total action history for GDPR/SOC2 compliance.

### For Studio Users (User/Studio Dashboard)
- **XR World Console**: Single dashboard launching all 5 XR services (WebXR, WebAR, VR, Virtual Tour, Pixel Streaming) with project selection and fullscreen simulation.
- **Studio / Portfolio Manager**: Create and manage portfolio projects, upload 3D assets, generate shareable demo links.
- **CRM**: Leads, deals, contacts, tasks (role-scoped).
- **Non-coding Website**: Every public page editable via the admin page builder (content engine).

---

## SaaS Structure & Pricing

### 1. Free/Basic Tier
- **Target**: Hobbyists, students, trial users.
- **Features**: Watermarked exports, standard loading speeds, public community support, limited to basic Virtual Tours (360).
- **Limits**: 3 Active projects, low bandwidth caps.

### 2. Pro Tier (Most Popular)
- **Target**: Freelancers, small studios, real estate agents.
- **Features**: White-label exports (remove VizTR branding), priority rendering queue, basic analytics, email support.
- **Inclusions**: Access to WebXR and WebAR engines.
- **Limits**: Increased bandwidth, up to 15 active projects.

### 3. Studio/Business Tier
- **Target**: Mid-to-large architectural firms, creative agencies.
- **Features**: Custom domain mapping, team collaboration tools (comments/approvals), advanced analytics, priority support, API access (read/write).
- **Inclusions**: Full VR device support, early access to Pixel Streaming, 100+ active projects.

### 4. Enterprise Tier
- **Target**: High-volume enterprises, global brokerages.
- **Features**: Dedicated server instances, SLA guarantees (99.9% uptime), custom integrations (CRM/MLS), dedicated account manager, SSO integration.
- **Inclusions**: Unlimited projects, unlimited bandwidth, dedicated GPU nodes for UE5 streaming.

*(Note: Pricing page architecture utilizes dynamic toggles for Monthly/Annually + 20% discount on annual plans, with bold CTAs for the Pro Tier).*

---

## Asset Pipeline & Automation

### 1. Validation & Normalization Stage
- **Supported**: JPEG, WebP, PNG // FBX, GLB, GLTF // KTX2.
- **Actions**: Dimension validation, auto-scale alignment, coordinate normalization, format verification.

### 2. Optimization Stage
- Mesh decimation and UV optimization.
- KTX2 compression and texture mipmapping.
- **LOD Generation**: Original, 50% reduced, 80% reduced, Mobile-Ultra-Low.

### 3. Generation Stage
- Auto-thumbnailing, metadata extraction, deployment manifest creation.

---

## Security & Access Control

### Auth & RBAC
- **Auth Options**: Email/Password (bcrypt), Google/GitHub OAuth, TOTP MFA. JWT sessions (30m timeout).
- **Roles**:
  - `Super Admin`: Full system, billing, configuration.
  - `Admin`: Project oversight, deployment configs, content management.
  - `User/Studio`: Asset uploader, XR project builder, team management, client management.
  - `Client`: Read/comment/approve, no write privileges.
- **Access Model**: Row Level Security (RLS) on all tables (workspace/tenant isolation). Role claims from JWT enforced at every API boundary.

### Data & API Protection
- **Encryption**: AES-256 (At rest), TLS 1.3/WSS (In transit).
- **Storage Protection**: Signed URLs for assets (24hr expiry), private storage buckets (Cloudflare R2).
- **API Defense**: Zod schema validation, Rate limits (1k/hr/user), CSRF tokens, behavioral bot protection.

---

## User Experience Features

### Site Experience (locked in VIZTR-UXUI-DESIGN-SYSTEM.md)
- **Dual theme**: dark / light / auto (system-follow), glass surfaces throughout.
- **Immersive 3D site**: cinematic 3D hero (dark in both themes), deep-breathing motion, scroll-driven camera, staggered reveals (GSAP + Framer Motion + Lenis).
- **Typography**: Space Grotesk (display), Inter (body), JetBrains Mono (technical).
- **Placeholder-first content**: procedural placeholders tagged `is_placeholder: true`, swapped later via the admin content engine.
- **Performance budget**: 60fps desktop, 30fps mobile; `prefers-reduced-motion` respected; WebGL fallback content always present.

### Dashboard Experience (from VIZTR-SAAS-PLATFORM-BLUEPRINT.md)
- 4-role dashboards (Super Admin / Admin / User-Studio / Client) with full RBAC.
- **XR World Console**: single dashboard launching all 5 XR services on selection.
- **Non-coding website**: every public page, section, and block editable from the admin page builder (draft → publish, version history, rollback).

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 16.2 (App Router).
- **Language/Styling**: TypeScript (Strict), Tailwind CSS, shadcn/ui.
- **XR Engines**: Babylon.js (core engine, ADR 6.1 Revised), Marzipano (virtual tours, ADR 6.1.1), react-babylonjs.
- **State/Fetch**: Zustand, TanStack Query.
- **Motion**: Framer Motion, GSAP + ScrollTrigger, Lenis.
- **Design Tokens**: `packages/design-tokens` (dual-theme semantic tokens — dark/light/auto).

### Backend Stack
- **API Runtime**: Node.js 20+ — Next.js API Routes (MVP) → Fastify (post-MVP).
- **Database**: PostgreSQL (Supabase; migrations tracked in `/database-schema.sql`).
- **Cache/Queue**: Redis + BullMQ.
- **Storage**: Cloudflare R2 (assets, 360° tiles, deliverables).

### Infrastructure & Operations
- **Hosting**: Vercel (Frontend + APIs) + Railway (Backend/AI agents).
- **Orchestration**: Cloudflare (CDN, DNS, Tunnels for local GPUs).
- **Transactional**: Resend (Email), Razorpay/Stripe (Billing).
- **Agent Runtime**: Ollama (local LLMs) + OpenAI-compatible gateway; Hermes Agent on the local GPU workstation.

---

## Integration & APIs

Implementation of full RESTful methodologies with OpenAPI 3.0 specs.
- `/api/projects`: CRUD operations for client projects.
- `/api/assets`: Secure ingest and processing status endpoints.
- `/api/tours`: Delivery engines and analytics streams.
- `/api/xr`: XR generation, demo link issuance, session analytics.
- **Webhook Delivery**: Configurable listeners for `project.deployed`, `asset.processed`, `comment.created`.

---

## Testing, Performance & Optimization

### Testing Framework (Phase 6 Specs)
- **Unit Testing**: Vitest + React Testing Library (Core components & functions).
- **Integration**: Testing API boundaries and Database migrations.
- **E2E Tests**: Playwright covering auth loops, project creation, and XR loading states.
- **Visual Regression**: Chromatic or similar to ensure 3D canvas rendering consistency.
- **Agent Sandbox**: Dedicated mocked tools to test LangGraph orchestration determinism without side-effects.

### Performance Targets
- **Web Load**: < 2s (3G network), < 1.5s FCP.
- **3D Render**: 60 FPS (WebAR/Virtual Tour), 90 FPS (VR). Model load under 3s.
- **Techniques**: Draco compression, KTX2 textures, route-based code splitting, edge-cached APIs.

---

## Future Roadmap (Phase 6+)

### Q4 2026 (Phase 6: Hardening & Compliance)
- [ ] Complete E2E testing framework integration (Playwright & Vitest configurations).
- [ ] Implement API documentation portals (Swagger/OpenAPI UI integration).
- [ ] Finalize SaaS billing hooks with Stripe/Razorpay (Upgrades, downgrades, limits execution).
- [ ] Deploy Project Management Kanban Boards internally.
- [ ] Security audits & SOC2 pre-checks (Penetration testing on Cloudflare tunnels).

### Q1 2027
- [ ] AI-generated floor plans from imagery.
- [ ] Auto lighting optimizations and global illumination baking on the cloud.
- [ ] Real Estate CRM (Zillow/MLS) standard integrations.

### Q2 2027
- [ ] Multi-tenant marketplace (User created 3D templates).
- [ ] White-label enterprise solutions (Custom DNS routing).

### Q3-Q4 2027
- [ ] LLM-driven property description agents.
- [ ] Mobile native applications tapping into ARKit/ARCore for extreme fidelity.

---

## Notes for Contributors
1. **Architectural Code Rules**: Always follow strict TypeScript definitions. Do not bypass Zod validation layers.
2. **LLM Modding**: Any updates to the AI Agent System must respect the LangGraph graph structure. Agents must not execute MCP tools outside of their designated node.
3. **Engine Rule**: All XR work uses Babylon.js (ADR 6.1 Revised); virtual tours use Marzipano (ADR 6.1.1). Do not introduce Three.js / React Three Fiber without a decision-log amendment.
4. **Design Rule**: All UI must use the dual-theme design tokens from `packages/design-tokens` (see VIZTR-UXUI-DESIGN-SYSTEM.md). No hardcoded colors.
5. **Updating this File**: Maintain semantic formatting. Update the version number and date at the top of the file when making structural or pipeline adjustments.
