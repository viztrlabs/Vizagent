# VizTR 360° Virtual Tour — Marzipano Integration Design

**Date:** August 5, 2026
**Status:** Approved for planning
**Scope:** Integrate the 44-feature "VizTR 360° Virtual Tour — Updated Feature Reference" (Categories A–F) into the existing planning documents in a non-destructive, backward-compatible way. This is a **documentation + planning** task — no application code is written here; the output is the updated living feature doc, Decision Log, TechStack, and a dedicated phase plan.

---

## 1. Background & Requirement

The Virtual Tour feature set is being extended from the current documented baseline (existing §9.2 Virtual Tour Features) to a full **44-feature reference across 6 categories**, ranked by **Phase 1 → 2 → 3 priority** (30 days each):

| Category | Features | Count |
|----------|----------|-------|
| A. Core 3D Tour / Navigation ⭐ Marzipano-Powered | #1–12 | 12 |
| B. Media & Content 📸 Marzipano Hotspots | #13–18 | 6 |
| C. Social & Sharing 🔗 Deep Linking | #19–21 | 3 |
| D. Visitor UI/UX 🎨 Marzipano Customization | #22–28 | 7 |
| E. Admin-Facing (Editor/Backend, No-Code) 🛠️ | #29–39 | 11 |
| F. Technical / Architecture Layer 🏗️ | #40–44 | 5 |

**Phases:**
- **Phase 1 — Core MVP (30 days):** 360° panorama (Marzipano), bottom-center Play/Pause + arrows, floor-plan pop-up with scene markers, hotspot placement editor, basic navigation.
- **Phase 2 — Enhanced Experience (30 days):** multi-level floor navigation, audio with volume control, views counter, mobile responsive, social sharing.
- **Phase 3 — Advanced (30 days):** photo galleries w/ lightbox, visual effects, deep linking, asset library, advanced analytics dashboard.

---

## 2. Engine Decision — Marzipano as Named Carve-Out (Hybrid)

### 2.1 Conflict identified

The current architecture (feature doc v1.4.0, ADR 6.1 Revised) adopted **Babylon.js as the single core 3D/XR engine**, with a strict rule: *do not run two full 3D engines in parallel*. The Virtual Tour renderer is currently specified as Babylon.js `PhotoDome` (§9.1/§9.2, Decision Log §6.2, phase4 plan).

The 44-feature reference requires a **Marzipano-powered** panorama viewer, with feature #8 "View Modes" explicitly flagged as **hybrid (Marzipano + Babylon.js dollhouse)**.

### 2.2 Resolution

**Marzipano becomes a named panorama-layer carve-out** — NOT a parallel general-purpose 3D engine:

- **Marzipano** (Apache 2.0) renders **only** the 360° equirectangular panorama layer + its native features: rotate/touch, autorotate toggle, compass/wayfinder, hotspot overlays, floor navigation, smooth transitions, WebXR entry, deep-linking. It is purpose-built for 360° photo tours and does not render GLB models, dollhouse scenes, or general 3D content.
- **Babylon.js remains the core 3D/XR engine**: WebXR/WebAR/VR scenes, dollhouse 3D view (View Modes #8), hero scene (§17.8), and all 3D model rendering.
- **Babylon.js `PhotoDome` remains as the fallback/alternative panorama path** for tours needing Babylon-native integration.
- **View Modes #8 (Hybrid):** ModeManager (§9.13) routes the user between `Marzipano viewer` ⇄ `Babylon.js dollhouse`; position/room state is shared via the tour config JSON so mode switching preserves current scene/camera.

This mirrors the **"named narrow exception"** pattern the ADR already established for Three.js (§6.1 Revised): Marzipano is an explicit, scoped carve-out, not a default parallel stack.

### 2.3 Scope guard

Marzipano is used **only** inside `TourEngine` / `tour-viewer.tsx` and the tour admin editor. No other experience mode may use it. Bundle/GPU isolation is preserved via the decoupled engine's code splitting (§9.13): Marzipano loads on the tour page; Babylon.js loads for other modes.

---

## 3. Document Changes

### 3.1 `VIZTR-COMPLETE-FEATURES.md` → v1.5.0

All changes additive — no removal, no restructure.

1. **§9.1 Experience Modes table** — Virtual Tour row: add `Marzipano (primary panorama viewer) + Babylon.js PhotoDome (fallback) + dollhouse` to Output/Key Tech.
2. **§9.2 Virtual Tour Features** — append after the existing bullets:
   - **"44-Feature Reference (Categories A–F)"** — the full tables verbatim from the reference (A: 12, B: 6, C: 3, D: 7, E: 11, F: 5), each row with #, Open-Source status, Engineering Effort, Notes.
   - **"Implementation Priority (Phase 1 → 2 → 3)"** — the three phase blocks verbatim, plus a note that full execution order lives in the dedicated phase plan.
3. **§21.5 3D/AR**:
   - WebGL row: add `Marzipano (named panorama-layer carve-out — 360° tour viewer only)`.
   - Engine policy blockquote: extend with a sentence naming Marzipano as the second named carve-out, scoped to `TourEngine` only, Babylon.js `PhotoDome` as fallback.
4. **Footer changelog** — update to v1.5.0 describing: Marzipano carve-out for 360° tours, 44-feature reference in §9.2, hybrid View Modes with Babylon dollhouse, ADR entry, TechStack row, dedicated phase plan.

### 3.2 `implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md` → v1.2.1

1. **New ADR 6.1.1 — Virtual Tour 360° Renderer: Marzipano (named carve-out)**, placed after §6.1 Revised:
   - **Status:** ✅ ADOPTED
   - **Decision Date:** August 5, 2026
   - **Context:** 44-feature Virtual Tour reference requires a purpose-built 360° panorama viewer (autorotate, compass, floor nav, hotspots, WebXR entry, deep-linking) with minimal engineering effort.
   - **Rationale:** Marzipano is Apache-2.0 and purpose-built for 360° photo tours — not a general-purpose 3D engine — so it does not violate the single-engine rule; it extends the existing "named narrow exception" pattern used for Three.js. Babylon.js remains the core engine; `PhotoDome` remains the fallback panorama path. Scope is locked to `TourEngine` / `tour-viewer.tsx` only.
   - **Migration path:** add `marzipano` dependency to `xr-runner`; `tour-viewer.tsx` becomes a Marzipano `Viewer` + Babylon dollhouse layer for View Modes #8; keep a `PhotoDome` fallback flag in the tour config.
2. **§6.2 XR Modes table** — Virtual Tour row → `Marzipano (primary) / Babylon.js PhotoDome (fallback)`.
3. **§7.1/Audit line 417** — add `(except Marzipano carve-out, §6.1.1)` qualifier to the "Virtual Tour uses Babylon.js" statement.
4. **Summary table** — Virtual Tour/XR Engine row updated; version bump.

### 3.3 `implementation-plans/VIZTR-TECHSTACK-SELECTION.md`

1. Virtual Tour row (line 231): `Babylon.js PhotoDome` → `Marzipano (viewer) + Babylon.js PhotoDome (fallback) + Babylon.js (dollhouse)`.
2. §5.1/§5.2 stack tables: add Marzipano under the XR/3D renderer row with Apache-2.0 license note.
3. Key decisions list (line ~773): add item for the Marzipano carve-out decision.

### 3.4 New file: `implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md`

Mirrors existing phase-plan conventions (Tasks → Steps → Tests → Commits), staging all 44 features across 3 phases:

- **Phase 1 — Core MVP (30 days)** — Tasks 1–5, **full implementation detail** (files, interfaces, tests, commits):
  1. Marzipano viewer integration (`tour-viewer.tsx` rework, `marzipano` dep, tile pyramid via `Marzipano.Source.fromImage` or cube/equirect sources, LRU cache).
  2. Bottom-center controls (Play/Pause + left/right arrows).
  3. Floor-plan pop-up with scene markers.
  4. Hotspot placement editor (admin, drag-and-drop).
  5. Basic navigation system (navigation graph, room-to-room transitions).
- **Phase 2 — Enhanced Experience (30 days)** — Tasks 6–10, **task breakdown** (files/interfaces, lighter detail):
  6. Multi-level floor navigation (up to 4 floors).
  7. Audio system with volume control + autoplay safety.
  8. Views counter (analytics integration).
  9. Mobile responsive design + touch navigation.
  10. Social sharing + copy tour URL.
- **Phase 3 — Advanced (30 days)** — Tasks 11–15, **task breakdown**:
  11. Photo galleries with lightbox.
  12. Visual effects controls (brightness/contrast/saturation).
  13. Deep linking / share current position.
  14. Asset/media library management.
  15. Advanced analytics dashboard (heatmap, engagement tracking).

Cross-links: `TourEngine` (§9.1), §9.2 reference, ADR 6.1.1, `tour-viewer.tsx` (existing phase4 plan), §9.13 ModeManager (View Modes #8 hybrid), §27.3 job queue (asset processing), Cloudflare R2 (§27.4) tile/media delivery, admin no-code editor patterns (§13).

Each task follows the repo TDD convention (test-first, verify, commit) and includes files, interfaces, error/loading/empty states, security (access control #35), accessibility (#27), SEO (semantic HTML/metadata/structured data for shareable tours), and performance (LRU cache, CDN).

---

## 4. Full 44-Feature Reference (verbatim source for §9.2)

> Source: user-provided "VizTR 360° Virtual Tour - Updated Feature Reference" (August 5, 2026). Copy into §9.2 with the same content; the source's misspelling "Marpinano" is normalized to "Marzipano" in all rows.

### A. Core 3D Tour / Navigation ⭐ Marzipano-Powered

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

### B. Media & Content 📸 Marzipano Hotspots

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 13 | Panoramic Images | ✅ Marzipano | Low | Core Marzipano functionality |
| 14 | Photo Galleries per Room | ✅ | Low | Lightbox integration with Marzipano hotspots |
| 15 | Asset Management | ✅ | Medium | Organized media with CDN caching |
| 16 | Timeline/Sweep | ✅ | Medium | Guided walkthrough with floor-specific paths |
| 17 | Room/Location Labels | ✅ Marzipano hotspots | Low | Scene labeling system |
| 18 | Clickable Hotspots | ✅ Marzipano | Low | Info, video, image overlays |

### C. Social & Sharing 🔗 Deep Linking

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 19 | Social Sharing | ✅ | Low | Facebook, X, WhatsApp, Email |
| 20 | Copy Tour URL | ✅ | Low | Clipboard integration |
| 21 | Share Current Position | ✅ | Medium | Marzipano deep linking |

### D. Visitor UI/UX 🎨 Marzipano Customization

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 22 | Responsive Hamburger Menu | ✅ | Low | Mobile navigation with project info |
| 23 | Views Counter | ✅ | Low | Analytics integration |
| 24 | Visual Effects | ✅ Marzipano shaders | Low | Brightness/contrast/saturation |
| 25 | Audio/Background Music | ✅ | Low | Volume control with autoplay safety |
| 26 | Mobile Touch Navigation | ✅ Marzipano | Low | Swipe/pinch gestures |
| 27 | Accessibility | ✅ | Low | ARIA labels, keyboard navigation |
| 28 | Responsive Design | ✅ | Low | Adaptive layout for all screens |

### E. Admin-Facing (Editor / Backend, No-Code) 🛠️

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 29 | Scene/Panorama Upload | ✅ | Low | Marzipano scene management |
| 30 | Hotspot Placement | ✅ Marzipano | Low | Drag-and-drop editor |
| 31 | Floor Plan Builder | ✅ | Medium | Upload + Marzipano marker placement |
| 32 | Photo Gallery Manager | ✅ | Low | Multiple image sets per scene |
| 33 | Menu Builder | ✅ | Low | Logo, nav links, language toggles |
| 34 | Branding Config | ✅ | Low | Colors, cover images, start scene |
| 35 | Access Control | ✅ | Low | Password, expiry, limits |
| 36 | Asset/Media Library | ✅ | Medium | Cross-project reuse |
| 37 | Analytics Dashboard | ✅ | High | Heatmap, engagement tracking |
| 38 | Theming System | ✅ | Low | CSS custom properties |
| 39 | Publish/Versioning | ✅ | Low | Draft vs. live state |

### F. Technical / Architecture Layer 🏗️

| # | Feature | Open-Source | Engineering Effort | Notes |
|---|---------|-------------|--------------------|-------|
| 40 | Tour Config Schema | ✅ | Medium | JSON with Marzipano extensions |
| 41 | Stats API Endpoint | ✅ | Medium | Real-time analytics |
| 42 | WebGL Rendering | ✅ Marzipano | Built-in | Effect composer integration |
| 43 | Asset CDN/Caching | ✅ | High | Optimized media delivery |
| 44 | Rendering Engine | ✅ Marzipano | Built-in | Apache 2.0 licensed |

### Implementation Priority (Phase-Based)

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

---

## 5. Non-Functional Requirements

- **Backward compatibility:** No existing pages, components, APIs, DB models, or flows are modified or removed. All changes are additive.
- **Performance:** tile pyramid with LRU cache (existing §9.2, max 200MB), CDN caching via Cloudflare R2 (§27.4), code-split Marzipano vs Babylon.js.
- **Security:** tour access control (#35), input validation, existing auth.
- **Accessibility:** ARIA labels, keyboard navigation (#27), WCAG 2.1 AA.
- **SEO:** semantic HTML, metadata, structured data (Tour schema), crawlable tour landing routes, clean URLs + deep links (#21).
- **Testing:** TDD per phase-plan convention; coverage for tour config validation, navigation graph, editor persistence, stats API.

## 6. Out of Scope

- No application code is written as part of this design; it produces documentation + a plan.
- No changes to other experience modes (WebXR/WebAR/VR/Pixel Streaming) beyond the Virtual Tour row updates above.
- No rebuild or restructure of the existing app architecture.
