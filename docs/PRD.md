# VizTR — Product Requirements Document (PRD)
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Locked scope (Complete Build)

> Tech stack in this document is informational context only. The authoritative, FINAL tech stack is in `TECHSPEC.md`.

---

## 1. Overview

**VizTR** is an AI-agent-powered Architectural Visualization XR platform. It converts a single 3D model or 360° image into **five XR experiences**: WebXR, WebAR, VR, Virtual Tour, and Pixel Streaming — from one upload, with automated QA, human-approval gating, and one-click publishing.

**Target users:** ArchViz Studios (primary), Independent Architects, Real Estate Developers, Interior Designers.

**Core promise:** reduce time-to-publish from 40+ hours (manual) to under 2 hours, using the studio's own local GPU/CPU workstation for heavy processing where possible.

---

## 2. Goals & Success Metrics

| Metric | Target |
|---|---|
| Time to publish (upload → shareable link) | < 2 hours |
| Concurrent XR modes from one asset | 5 |
| Agent task success rate | > 85% |
| Client NPS | > 50 |
| WebXR performance | 60 fps desktop / 30 fps mobile |
| VR performance | 90 fps standalone / 72 fps mobile |
| Pixel Streaming latency | < 100 ms |
| Platform uptime | 99.9% |

---

## 3. User Personas

| Persona | Role | Needs |
|---|---|---|
| **Studio Owner** | `super_admin` / `admin` | Manage projects, users, revenue, health; control Hermes workstation; approve deploys |
| **Studio Member** | `user` (studio) | Upload assets, generate XR modes, edit interactions, run QA, publish, manage XR links |
| **Client** | `client` | Review deliverables, approve versions, view timeline, access shared XR links |
| **Prospect / Visitor** | `public` | Browse site, view demos (after consent), book a call, request pricing |
| **Hermes Agent** | (service) | Local workstation controller — super-admin-authorized, area-scoped, rollback-safe |

---

## 4. Functional Requirements

### F1. Identity & Access (M2)
- FR-1.1 Email/password, Google OAuth, magic-link sign-in (Supabase Auth).
- FR-1.2 Roles: `super_admin`, `admin`, `user (studio)`, `client`, `public`.
- FR-1.3 Route-level + API-level authorization; RBAC enforced server-side; RLS on all tables.
- FR-1.4 Audit log of admin/agent actions.

### F2. Projects (M3)
- FR-2.1 CRUD projects with name, description, deadline, budget, team, status.
- FR-2.2 Tenancy isolation (each workspace sees only its own data).

### F3. Asset Pipeline (M4)
- FR-3.1 Upload 3D (GLB/fbx) and 360° equirectangular images; chunked/resumable, presigned to R2.
- FR-3.2 Validate size/type/dimensions; QA checks (triangle count, texture budget, aspect ratio).
- FR-3.3 Optimize: Blender headless; Draco/KTX2/meshopt; LOD; multi-res 360 tiling; thumbnails.

### F4. XR Engines (M5) — all five from one asset
- FR-4.1 **WebXR** — Babylon.js immersive browser walkthrough (60/30 fps).
- FR-4.2 **WebAR** — MindAR marker-based + WebXR hit-test markerless.
- FR-4.3 **VR** — standalone builds for Quest/Pico/Vision Pro (OpenXR).
- FR-4.4 **Virtual Tour** — Marzipano 360° tours; multi-scene; hotspot navigation.
- FR-4.5 **Pixel Streaming** — UE5.3 streaming from local GPU; WebRTC; latency <100 ms.

### F5. Interaction Editor (M6)
- FR-5.1 No-code hotspot placement, lighting, materials, camera animation, branching.

### F6. QA Engine (M7)
- FR-6.1 Automated checks per mode (asset, scene, performance, correctness).
- FR-6.2 **Publish blocked until QA passes**; per-project report; CI gate.

### F7. Publish Engine (M8)
- FR-7.1 Preview → QA gate → human approval → production deploy → share link (Vercel).
- FR-7.2 Version tracking + rollback of published experiences.

### F8. Content Engine (M9)
- FR-8.1 Page → Section → Block model; admin visual builder.
- FR-8.2 Draft / publish / version / rollback; `is_placeholder` content; per-page SEO.

### F9. XR World Console (M10)
- FR-9.1 Single dashboard launching all five services; live status; project overview.

### F10. Client Portal (M11)
- FR-10.1 Deliverables, approvals, pinned 3D annotations, threaded comments, version history, shared token links.

### F11. Admin Console (M12)
- FR-11.1 User directory, audit log viewer, live task board, API keys, feature toggles, env-settings (encrypted), system health.

### F12. CRM / Analytics / AI (M13)
- FR-12.1 CRM (leads, pipeline, activities); analytics dashboards (usage, performance, conversion, ROI).

### F13. Billing (M14)
- FR-13.1 Stripe/Razorpay; tiers Free / Pro / Studio / Enterprise; usage metering; webhooks; invoices; dunning.

### F14. AI Agents (M15)
- FR-14.1 13-agent system: **CEO** (orchestrator), **Hermes** (local), 5 service agents (one per XR mode), internal agents (website dev, design, content, QA, finance, analytics, support, sales).
- FR-14.2 Natural-language create/publish workflow; MCP connector; RAG memory.
- FR-14.3 Guardrails: NEVER auto-execute spend/deploy/share/contracts; per-agent budget; approval gates; emergency stop.

### F15. Communications (M16)
- FR-15.1 Email (Resend), in-app notifications, optional multi-channel (Telegram/WhatsApp later).

### F16. Enterprise / Marketplace (M17)
- FR-16.1 White-label, custom domain, SSO/SAML, multi-tenant, API access, marketplace (post-launch).

### F17. Infrastructure (M18)
- FR-17.1 CI/CD, Vercel + Railway, monitoring, backups, DR, observability.

### F18.  LOCAL GPU / CPU CONNECTION (NEW FEATURE)
- FR-18.1 Studio connects their local workstation (GPU/CPU) to VizTR for **faster, better experience** — heavy processing (Blender optimization, UE5 Pixel Streaming, 360 tiling, local LLMs via Ollama) runs locally instead of cloud.
- FR-18.2 Connection is **super-admin-only, password/OTP-protected**, initiated outbound (Cloudflare Tunnel).
- FR-18.3 **Area control** — Hermes only changes modules the admin selects (portfolio, webxr, webar, vr, virtual-tour, pixel-streaming, content, design). Deny-by-default.
- FR-18.4 Every local change is **versioned + rollback/undo-able**.
- FR-18.5 Status surfaced in dashboard: `Local Development: ● Connected | QA: Passed | Ready to Publish: Yes`.
- FR-18.6 Emergency stop + audit.

### F19.  COOKIE / CONSENT GATE (NEW FEATURE)
- FR-19.1 A cookie/preferences consent popup appears on first visit.
- FR-19.2 **The user must accept (or choose) before they can click the demo CTA** (and before marketing/analytics cookies load).
- FR-19.3 Options: Accept all / Reject non-essential / Manage preferences.
- FR-19.4 Consent stored (anon, no PII) and respected across sessions; revocation supported.
- FR-19.5 Privacy policy + terms accessible from the popup.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | WebXR 60/30/90 fps budgets; pixel latency<100ms; Lighthouse ≥90; font/vendor optimized; immutable cache on static assets only |
| Security | Supabase Auth; RLS on all tables; encrypted secrets (Supabase Vault); rate limiting; CSP + security headers; presigned uploads; secret scanning in CI; never log secrets |
| Privacy | Cookie consent gate (F19); GDPR-style; analytics consent; minimal PII |
| Reliability | 99.9% uptime; BullMQ retries; backups; monitoring + alerting |
| Accessibility | WCAG 2.1 AA; keyboard nav; reduced-motion support |
| Maintainability | Repo/queue/worker layering; typed Prisma schema; design-token single source; Storybook |

---

## 6. Out of Scope (now)

- Native mobile apps (web-first).
- SSO/SAML + marketplace (post-launch, M17).
- Multi-channel bots beyond email/in-app (M16, later).
- Full on-prem enterprise infra.

---

## 7. Priority & Phasing

Complete Build locked. Execution order (detailed in `IMPLEMENTATIONPLAN.md`): Foundation & Identity → Core Platform (projects/assets/XR/editor/QA/publish) → All XR Modes → Content + Console + Public Site → Infra/Security → AI Agents → Portal/Admin/Billing/Enterprise → Test & Launch.