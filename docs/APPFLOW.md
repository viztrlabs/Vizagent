# VizTR — Application Flow (AppFlow)
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Locked

> Flow descriptions assume the FINAL tech stack (Supabase Auth, Babylon/Marzipano/MindAR, R2, Resend). Additions covered: **Local GPU/CPU connection** and **Cookie consent gate before demo**.

---

## 1. Information Architecture (routes)

**Public (marketing)** — `app/(marketing)/`: `/`, `/about`, `/services`, `/services/[slug]`, `/xr/virtual-tour`, `/xr/webar`, `/xr/virtual-reality`, `/xr/webxr`, `/xr/pixel-streaming`, `/portfolio`, `/portfolio/[slug]`, `/blog`, `/blog/[slug]`, `/contact`, `/book`, `/pricing`, `/privacy-policy`, `/terms-of-service`.

**Auth** — `/auth/login`, `/auth/register`, `/auth/client-access`.

**App** — `/dashboard` (super-admin) · `/dashboard/admin` · `/dashboard/studio` · `/dashboard/client`; plus `studio/xr/console`, `studio/xr/links`, `studio/xr/{mode}/new`, `studio/pixel-streaming`, `studio/review/[projectId]`, `cms`, `audit`, `settings`, `health`.

**Public share (open, token-gated)** — `/view/tour/[token]`, `/view/ar/[token]`, `/view/vr/[token]`, `/view/xr/[token]`, `/view/stream/[token]`.

**API** — `/api/*` (see TECHSPEC §3).

---

## 2. Consent Flow (cookie gate — F19)
```
First visit → ConsentModal shows (blocker, non-dismissible-until-chosen)
   ├─ Accept all        → set consent cookie + load analytics/non-essential
   ├─ Reject non-ess.   → set consent cookie (essential only) + skip analytics
   └─ Manage preferences → toggles (functional/analytics/preferences) → Save
Demo CTA (header + home) = disabled (locked 🔒) until a consent choice is stored.
On revisit: consent cookie exists → modal not shown (or small revocable link in footer).
Consent choice stored anonymously; revocable anytime (footer → manage).
```

## 3. Onboarding / Auth Flow (F1)
```
Visitor → `/auth/register` (email/pw | Google | magic link) → Supabase Auth
  → set app_metadata.role
  → if first project-less user → onboarding wizard: role (studio/client), workspace, name
  → redirect: studio → /dashboard/studio ; client → /dashboard/client ; admin → /dashboard/admin
Protected routes gated by middleware.ts (session + role). Unauthenticated → redirect to /auth/login.
```

## 4. Project Lifecycle (core — M2–M8)
```
Create project (studio) → Upload asset (3D/360 via presigned chunked R2)
  → Validate + store (Asset) → "Generate XR modes" (agents enqueue)
      ├─ WebXR / WebAR / VR / Virtual Tour / Pixel Streaming generation (workers)
      └─ optionallocal CPU/GPU workstation when connected (F18)
  → QA engine runs checks → report (Pass/Fail per mode)
      └─ FAIL → back to studio to fix (re-upload / re-optimize) → re-run QA
  → PASS → "Approval required" (admin/studio owner approves, or client approves in portal)
  → Publish (Vercel) → version tagged → share link(s) via `/api/xr/links`
  → Notify client + store/portfolio (optional) → analytics tracked
Publish is BLOCKED unless QA=PASSED and approval given.
```

## 5. XR Share / Viewer Flow (M8/M10/M11)
```
Studio or client opens a shareable token link:
  /view/tour/[token] (Marzipano) | /view/ar/[token] (MindAR/WebXR hit-test)
  /view/vr/[token] (Babylon VR) | /view/xr/[token] (Babylon WebXR)
  /view/stream/[token] (Pixel Streaming WebRTC)
API validates token (not expired, not revoked) → serves viewer (no auth).
Client adds annotations/comments → flow back to studio via API → portal threads.
```

## 6. Client Portal Flow (F10)
```
Client log in → /dashboard/client → timeline (progress) + deliverables list
  → open deliverable (share link) → approve / request changes / add annotation
  → approval recorded → unblocks Publish; changes → notification to studio.
```

## 7. Admin / Super-admin Flow (F11)
```
Admin overview (revenue, activity, health) → manage users (roles) → audit log viewer
  → CMS (edit content engine page/section/block; draft→publish/version) → env-settings (encrypted)
  → workstations (pair/revoke Hermes) → live task board (BullMQ jobs)
```

## 8. Billing Flow (M14)
```
Studio selects tier (Free/Pro/Studio) → Stripe/Razorpay checkout → webhook → Subscription + tier
  → usage metering (storage, GPU minutes, bandwidth) → limit enforcement per tier
  → invoice → dunning on failed payment → proration on upgrade.
```

## 9. Marketing / Demo / Booking Flow
```
Visitor → consent gate (F19) → browse site (content-engine pages)
  → click "View Demo" (enabled after consent) → demo XR experience loads
  → "Book" → BookingForm → calendar availability → confirm booking + confirmation email (Resend)
  → contact form → ContactInquiry → notification email.
```

## 10. Agent Command Flow (M15)
```
Studio types natural-language task ("Create WebXR project for ABC, 14 days, $5k")
  → CEO Agent decomposes → assigns sub-tasks to service/internal agents (BullMQ)
  → agents execute via MCP tools (area-scoped; guardrails)
  → QA → propose → approval required for any spend/deploy/share
  → on approve → execute → report back in-console.
```

## 11. Hermes Local GPU/CPU Connection Flow (F18)
```
Admin (super_admin) → Settings → Workstations → Add workstation
  → pair (short-TTL secret) → choose AREA SCOPE (portfolio, webxr, webar, vr, virtual-tour, pixel-streaming, content, design)
  → Hermes installs & opens outbound Cloudflare Tunnel → registers device + scope token
  → Dashboard shows "Local Development: ● Connected"
  → Heavy jobs (Blender optimize, UE5 stream, 360 tiling, Ollama) route to workstation when available
  → Hermes proposes change (dry-run) → policy gateway (scope) → admin approves (OTP) → snapshot → apply → ledger → version
  → On error: admin Undo → restore snapshot/redeploy prior tag
  → Emergency stop revokes device within one heartbeat; audit logged.
```

## 12. Edge Cases
- QA fail → block publish; show actionable report.
- Pixel streaming GPU busy → queue with priority; fallback to WebXR.
- Hermes offline → heavy jobs fall back to cloud (graceful degradation); no silent partial state.
- Upload interrupted → resumable chunk resume.
- Token expired/revoked → 404/410 on viewer.
- Consent not set → analytics off; demo locked.
- Rate limit exceeded → 429 with retry-after.