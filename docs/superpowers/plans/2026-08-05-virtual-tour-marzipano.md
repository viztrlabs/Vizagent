# VizTR 360° Virtual Tour — Marzipano Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the 44-feature Marzipano Virtual Tour reference into the existing planning docs (feature doc, Decision Log, TechStack) and create a dedicated phase4-marzipano implementation plan — additive, non-destructive, backward-compatible.

**Architecture:** Marzipano (Apache 2.0) is added as a **named panorama-layer carve-out** — the 360° tour viewer only. Babylon.js remains the single core 3D/XR engine (WebXR/AR/VR, dollhouse, hero). Babylon `PhotoDome` remains the fallback panorama path. This mirrors the existing Three.js "named narrow exception" pattern in ADR 6.1 Revised.

**Tech Stack:** Marzipano (panorama viewer), Babylon.js 8+ (core engine), existing docs tooling (markdown, grep/rg verification). This plan edits `.md` files only — no application code.

**Spec:** `docs/superpowers/specs/2026-08-05-virtual-tour-marzipano-design.md`

## Global Constraints

- **Documentation-only task** — never write application code; only edit markdown files in `C:\Users\Arch_Viz\Desktop\VizTR\BrainStorming\opencode\`.
- **Additive only** — do not remove, restructure, or reword existing content beyond the exact inline edits specified below.
- Keep the `> **⚠️ INTERNAL — Discussion content. NOT for public/client sharing.**` banner in §24 untouched.
- Do **not** modify files under `implementation-plans/Claude/` (untouched snapshot copies).
- Normalize the source's misspelling "Marpinano" → "Marzipano" in all rows.
- Windows PowerShell 5.1: use `rg` (ripgrep) for verification; PowerShell conditionals `if ($?) { }` for chaining.
- Version bumps: `VIZTR-COMPLETE-FEATURES.md` → v1.5.0; `VIZTR-TECHNICAL-DECISION-LOG.md` → v1.2.1.

---

### Task 1: Update §9.1 Experience Modes table (Virtual Tour row)

**Files:**
- Modify: `VIZTR-COMPLETE-FEATURES.md:576`

**Interfaces:**
- Consumes: nothing.
- Produces: the Virtual Tour row now names Marzipano primary + PhotoDome fallback + dollhouse, which Tasks 2–4 and the phase plan reference.

- [ ] **Step 1: Verify current state**

Run: `rg -n "Babylon.js, equirectangular shader" VIZTR-COMPLETE-FEATURES.md`
Expected: single match at line 576.

- [ ] **Step 2: Apply the edit**

Replace line 576:
```markdown
| **Virtual Tour** | `TourEngine` | `tour.html` + tiles | Babylon.js, equirectangular shader, multi-res tile pyramid |
```
with:
```markdown
| **Virtual Tour** | `TourEngine` | `tour.html` + tiles | Marzipano (primary panorama viewer, Apache 2.0) + Babylon.js PhotoDome (fallback) + Babylon.js (dollhouse) |
```

- [ ] **Step 3: Verify the edit**

Run: `rg -n "Marzipano \(primary panorama viewer" VIZTR-COMPLETE-FEATURES.md`
Expected: one match at line 576.

- [ ] **Step 4: Commit**

```bash
git add VIZTR-COMPLETE-FEATURES.md
git commit -m "docs(features): Virtual Tour row names Marzipano primary viewer (carve-out)"
```
Note: if the folder is not a git repo, skip the commit and note it.

---

### Task 2: Append 44-Feature Reference to §9.2

**Files:**
- Modify: `VIZTR-COMPLETE-FEATURES.md` — insert before line 590 (the `- **Ambient audio / background music**` bullet), after the URL hash bullet at line 589.

**Interfaces:**
- Consumes: Task 1's Virtual Tour row.
- Produces: the full §9.2 reference block (Categories A–F + Phase 1–3) that the phase plan (Task 7) links to.

- [ ] **Step 1: Verify current state**

Run: `rg -n "URL hash navigation" VIZTR-COMPLETE-FEATURES.md`
Expected: match at line 589. The block below inserts **before** the `- **Ambient audio / background music**` bullet.

- [ ] **Step 2: Apply the insert**

Insert this block immediately before the `- **Ambient audio / background music**` bullet (line 590):

```markdown
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
| 35 | Access Control | ✅ | Low | Password, expiry, limits |
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

> Full execution order for all 44 features is in `implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md`.
```

- [ ] **Step 3: Verify the insert**

Run: `rg -c "Marzipano" VIZTR-COMPLETE-FEATURES.md`
Expected: count increased (≥ 40 occurrences). Also verify `rg -n "44-Feature Reference"` matches once.

- [ ] **Step 4: Commit**

```bash
git add VIZTR-COMPLETE-FEATURES.md
git commit -m "docs(features): add 44-feature Marzipano Virtual Tour reference to §9.2"
```

---

### Task 3: Update §21.5 3D/AR + engine policy

**Files:**
- Modify: `VIZTR-COMPLETE-FEATURES.md:1986` (WebGL row) and `:1993` (engine policy blockquote).

**Interfaces:**
- Consumes: nothing.
- Produces: policy language that ADR 6.1.1 (Task 5) mirrors.

- [ ] **Step 1: Verify current state**

Run: `rg -n "A-Frame \(360 panorama alternative\)" VIZTR-COMPLETE-FEATURES.md`
Expected: match at line 1986.

- [ ] **Step 2: Apply WebGL row edit**

Replace line 1986:
```markdown
| WebGL | Babylon.js 8+ (Editor + Next.js template — core engine), A-Frame (360 panorama alternative) |
```
with:
```markdown
| WebGL | Babylon.js 8+ (Editor + Next.js template — core engine), Marzipano (named panorama-layer carve-out — 360° tour viewer only), A-Frame (360 panorama alternative) |
```

- [ ] **Step 3: Apply engine policy blockquote edit**

Replace line 1993:
```markdown
> **Engine policy (§21.5)**: Babylon.js is the **single core 3D/XR engine** (Editor-first for non-technical designers, Next.js template with native hosting/export). Three.js + R3F are **superseded** — no parallel general-purpose 3D stack. A **named, narrow exception** is allowed only for a developer-built, code-driven 3D view with no designer touch (see ADR 6.1 in `implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md`).
```
with:
```markdown
> **Engine policy (§21.5)**: Babylon.js is the **single core 3D/XR engine** (Editor-first for non-technical designers, Next.js template with native hosting/export). Three.js + R3F are **superseded** — no parallel general-purpose 3D stack. Two **named, narrow exceptions** exist: (1) Three.js for a developer-built, code-driven 3D view with no designer touch; (2) **Marzipano** as the 360° panorama-layer viewer, scoped to `TourEngine` only, with Babylon.js `PhotoDome` as the fallback panorama path (see ADR 6.1 / ADR 6.1.1 in `implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md`).
```

- [ ] **Step 4: Verify the edits**

Run: `rg -n "Marzipano \(named panorama-layer carve-out" VIZTR-COMPLETE-FEATURES.md`
Expected: one match at line 1986. Run: `rg -n "Two \*\*named, narrow exceptions" VIZTR-COMPLETE-FEATURES.md`
Expected: one match at line 1993.

- [ ] **Step 5: Commit**

```bash
git add VIZTR-COMPLETE-FEATURES.md
git commit -m "docs(features): add Marzipano named carve-out to §21.5 engine policy"
```

---

### Task 4: Update footer changelog → v1.5.0

**Files:**
- Modify: `VIZTR-COMPLETE-FEATURES.md:2559` (version line) and `:2561` (previous-version line, append new entry).

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: version-marked doc state consistent with ADR (Task 5).

- [ ] **Step 1: Verify current state**

Run: `rg -n "Version 1.4.0" VIZTR-COMPLETE-FEATURES.md`
Expected: match at line 2559.

- [ ] **Step 2: Update the current-version line**

Replace line 2559:
```markdown
*Last updated: August 5, 2026 | Version 1.4.0 — 3D/XR engine pivot to Babylon.js: Babylon.js 8+ (Editor + Next.js template) adopted as the single core 3D/XR engine, superseding Three.js + React Three Fiber (ADR 6.1 Revised) (§5.1/§21.5); removed R3F/drei/@react-three-xr from core role — named narrow Three.js exception only for developer-built non-editor data-viz views; migrated Virtual Tour → PhotoDome, WebXR/AR/VR → Babylon.js WebXR, §9.17/§9.19/§9.20, §13.2 viewport, §17.8 hero, tool set, tracker + §28 rows; verified no parallel 3D stacks (§21.5).*
```
with:
```markdown
*Last updated: August 5, 2026 | Version 1.5.0 — Marzipano 360° Virtual Tour integration (ADR 6.1.1): Marzipano adopted as named panorama-layer carve-out (Apache 2.0) for the 360° tour viewer only, Babylon.js stays core engine with PhotoDome as fallback (§9.1/§21.5); full 44-feature reference (Categories A–F) added to §9.2 with Phase 1→2→3 priority; View Modes #8 hybrid = Marzipano ⇄ Babylon.js dollhouse via ModeManager (§9.13); TechStack Virtual Tour row + Decision Log ADR 6.1.1 updated; dedicated plan at implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md.*
```

- [ ] **Step 3: Insert the previous-version entry**

Immediately before line 2561 (`*Previous: Version 1.3.0...`), insert:
```markdown
*Previous: Version 1.4.0 — 3D/XR engine pivot to Babylon.js: Babylon.js 8+ (Editor + Next.js template) adopted as the single core 3D/XR engine, superseding Three.js + React Three Fiber (ADR 6.1 Revised) (§5.1/§21.5); removed R3F/drei/@react-three-xr from core role — named narrow Three.js exception only for developer-built non-editor data-viz views; migrated Virtual Tour → PhotoDome, WebXR/AR/VR → Babylon.js WebXR, §9.17/§9.19/§9.20, §13.2 viewport, §17.8 hero, tool set, tracker + §28 rows; verified no parallel 3D stacks (§21.5).*
```

- [ ] **Step 4: Verify the edits**

Run: `rg -n "Version 1.5.0" VIZTR-COMPLETE-FEATURES.md`
Expected: one match. Run: `rg -n "Version 1.4.0" VIZTR-COMPLETE-FEATURES.md`
Expected: exactly one match (now the Previous line).

- [ ] **Step 5: Commit**

```bash
git add VIZTR-COMPLETE-FEATURES.md
git commit -m "docs(features): bump to v1.5.0 — Marzipano Virtual Tour integration"
```

---

### Task 5: Decision Log — add ADR 6.1.1 + update §6.2, §7.1, summary

**Files:**
- Modify: `implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md` — insert ADR 6.1.1 after the §6.1 Revised block (after line 427); update §6.2 table (line 444); update §7.1 audit line (line 417); update summary table (line 631).

**Interfaces:**
- Consumes: Tasks 1–4 (engine resolution language).
- Produces: ADR 6.1.1 referenced by the phase plan (Task 7) and §21.5.

- [ ] **Step 1: Verify current state**

Run: `rg -n "### 6.2 XR Modes Strategy" implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md`
Expected: match at line 429. The new ADR inserts **before** it.

- [ ] **Step 2: Insert ADR 6.1.1**

Insert this block immediately before line 429 (`### 6.2 XR Modes Strategy`):

```markdown
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

```

- [ ] **Step 3: Update §6.2 XR Modes table**

Replace line 444:
```markdown
| **Virtual Tour** | Babylon.js PhotoDome | Static images |
```
with:
```markdown
| **Virtual Tour** | Marzipano (primary) / Babylon.js PhotoDome (fallback) | Static images |
```

- [ ] **Step 4: Update §7.1/Audit line 417**

Replace line 417:
```markdown
- **Remove Three.js/R3F core role** — `@react-three/xr`, `drei`, and `@react-three/fiber` are removed from the main app once migration is confirmed (§7.1/Audit). Virtual Tour, WebXR/AR, and VR all use Babylon.js.
```
with:
```markdown
- **Remove Three.js/R3F core role** — `@react-three/xr`, `drei`, and `@react-three/fiber` are removed from the main app once migration is confirmed (§7.1/Audit). WebXR/AR and VR all use Babylon.js; Virtual Tour uses Marzipano for the 360° panorama layer with Babylon.js PhotoDome as fallback (except Marzipano carve-out, §6.1.1).
```

- [ ] **Step 5: Update summary table**

Replace line 631:
```markdown
| **XR Engine** | Babylon.js (Editor + Next.js template) | ✅ ADOPTED (supersedes Three.js + R3F) |
```
with:
```markdown
| **XR Engine** | Babylon.js (Editor + Next.js template) + Marzipano (360° tour viewer carve-out, §6.1.1) | ✅ ADOPTED (supersedes Three.js + R3F) |
```

- [ ] **Step 6: Verify the edits**

Run: `rg -n "6.1.1|Marzipano" implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md`
Expected: multiple matches (ADR header, §6.2 row, §7.1 line, summary table).

- [ ] **Step 7: Commit**

```bash
git add implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md
git commit -m "docs(decision-log): add ADR 6.1.1 Marzipano carve-out, update §6.2/§7.1/summary"
```

---

### Task 6: TechStack — Virtual Tour row, §5.1/5.2, key decisions

**Files:**
- Modify: `implementation-plans/VIZTR-TECHSTACK-SELECTION.md:231` (Virtual Tour row), `:210` (§5.1 WebGL row), `:763` (summary table), `:778-779` (key decisions 8–9 → add 10).

**Interfaces:**
- Consumes: ADR 6.1.1 language (Task 5).
- Produces: TechStack records consistent with the feature doc + Decision Log.

- [ ] **Step 1: Verify current state**

Run: `rg -n "Virtual Tour.*PhotoDome" implementation-plans/VIZTR-TECHSTACK-SELECTION.md`
Expected: match at line 231.

- [ ] **Step 2: Update §5.1 WebGL row**

Replace line 210:
```markdown
| **WebGL** | **Babylon.js 8+** | Visual editor for non-technical designers; scene-graph; WebXR support; Next.js template with native hosting/export |
```
with:
```markdown
| **WebGL** | **Babylon.js 8+** + Marzipano (360° tour viewer carve-out) | Babylon.js: visual editor for non-technical designers; scene-graph; WebXR support; Next.js template. Marzipano (Apache 2.0): 360° panorama-layer viewer, TourEngine only |
```

- [ ] **Step 3: Update Virtual Tour row (§5.2)**

Replace line 231:
```markdown
| **Virtual Tour** | **Babylon.js PhotoDome** | Equirectangular panorama; hotspots; transitions |
```
with:
```markdown
| **Virtual Tour** | **Marzipano** (viewer) + **Babylon.js PhotoDome** (fallback) + **Babylon.js** (dollhouse) | Equirectangular panorama; hotspots; transitions; hybrid View Modes (ADR 6.1.1) |
```

- [ ] **Step 4: Update summary table**

Replace line 763:
```markdown
| **XR Engine** | Babylon.js (Editor + Next.js template) |
```
with:
```markdown
| **XR Engine** | Babylon.js (Editor + Next.js template) + Marzipano (360° tour viewer carve-out) |
```

- [ ] **Step 5: Add key decision #10**

After line 778 (decision 9), insert:
```markdown
10. **Marzipano (360° tour viewer) over Babylon PhotoDome-only** — Apache 2.0 panorama layer for Virtual Tour; named carve-out scoped to TourEngine; Babylon.js PhotoDome retained as fallback (ADR 6.1.1; 2026-08-05)
```

- [ ] **Step 6: Verify the edits**

Run: `rg -n "Marzipano" implementation-plans/VIZTR-TECHSTACK-SELECTION.md`
Expected: matches at §5.1 row, §5.2 row, summary table, key decisions.

- [ ] **Step 7: Commit**

```bash
git add implementation-plans/VIZTR-TECHSTACK-SELECTION.md
git commit -m "docs(techstack): add Marzipano 360° tour viewer carve-out (ADR 6.1.1)"
```

---

### Task 7: Create the phase4-virtual-tour-marzipano implementation plan

**Files:**
- Create: `implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md`

**Interfaces:**
- Consumes: §9.2 reference (Task 2), ADR 6.1.1 (Task 5), existing `tour-viewer.tsx`/`TourEngine` (phase4 plan), §9.13 ModeManager, §27.3 job queue, §27.4 Cloudflare R2, admin editor patterns (§13).
- Produces: the executable plan for all 44 features staged Phase 1 → 2 → 3.

- [ ] **Step 1: Write the plan file**

Create `implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md` with this structure (write actual content per the outline; no placeholders):

```markdown
# VizTR 360° Virtual Tour — Marzipano Implementation Plan (Phase 1–3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the full 44-feature 360° Virtual Tour on the Marzipano viewer (named carve-out, ADR 6.1.1), with hybrid Babylon.js dollhouse View Modes, admin no-code editor, and analytics.

**Architecture:** Marzipano renders the 360° panorama layer inside `TourEngine`/`tour-viewer.tsx`; Babylon.js provides the dollhouse 3D view (View Modes #8) and remains the core engine for other modes. Tour config JSON (#40) drives scenes, hotspots, floors, and branding. Tiles/media served from Cloudflare R2 (#43). ModeManager (§9.13) routes Marzipano ⇄ dollhouse.

**Tech Stack:** Marzipano (Apache 2.0), Babylon.js 8+, Next.js 15/16, TypeScript strict, Tailwind, TanStack Query, Zustand, Supabase (Postgres + Auth + RLS), Cloudflare R2, BullMQ (§27.3).

## Global Constraints
- Virtual Tour uses Marzipano for the 360° panorama layer ONLY; no other mode may use Marzipano (ADR 6.1.1, §21.5).
- Babylon.js PhotoDome remains the fallback path via the tour config `photoDomeFallback` flag.
- All 44 features from §9.2 reference must be covered; stage Phase 1 → 2 → 3.
- TDD per repo convention: failing test → minimal implementation → passing test → commit.
- Accessibility (#27), SEO (semantic HTML/metadata/structured data), performance (LRU cache, CDN), security (access control #35).

---

### Phase 1 — Core MVP (30 days) [Tasks 1–5, full detail]
### Task 1: Marzipano viewer integration (`tour-viewer.tsx`)
**Files:**
- Modify: `xr-runner/components/viewers/tour-viewer.tsx`
- Create: `xr-runner/lib/tour/tour-engine.ts`, `xr-runner/lib/tour/sources.ts`, `xr-runner/test/tour-engine.test.ts`

**Interfaces:**
- Consumes: tour config JSON (#40).
- Produces: `createTourViewer(config): MarzipanoViewer`, `loadScene(roomId)`, `setScene(roomId, transition)`, `getCurrentRoom()`.

- [ ] **Step 1: Write failing test** — `tour-engine.test.ts` verifies `createTourViewer` builds a Marzipano `Viewer` from a config with one scene; `setScene` transitions and updates `getCurrentRoom()`.
- [ ] **Step 2: Run test** — `pnpm --filter @viztr/xr-runner test`; Expected: FAIL.
- [ ] **Step 3: Implement** — add `marzipano` dep; `sources.ts` builds `Marzipano.Source.fromImage` (equirectangular) or cube-face sources with multi-res pyramid; `tour-engine.ts` wraps `Viewer`, holds scene registry + LRU tile cache (max 200MB).
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(tour): add Marzipano tour engine with scene loading`.

### Task 2: Bottom-center controls (Play/Pause + arrows)
**Files:** Create `xr-runner/components/tour/ControlsBar.tsx`, `xr-runner/test/controls-bar.test.tsx`.
**Interfaces:** Consumes `tour-engine.ts`; produces `onPlayPause`, `onPrev`, `onNext` bound to `setScene`.
Steps: TDD (fails → implements → passes → commit `feat(tour): add bottom-center play/pause + nav arrows`).

### Task 3: Floor plan pop-up with scene markers
**Files:** Create `xr-runner/components/tour/FloorPlan.tsx` (SVG overlay, clickable markers, navigation graph), `xr-runner/test/floor-plan.test.tsx`.
**Interfaces:** Consumes tour config floors/scenes; produces `onSceneClick(roomId)` → `setScene`.
Steps: TDD; commit `feat(tour): add floor plan pop-up with clickable scene markers`.

### Task 4: Hotspot placement editor (admin)
**Files:** Create `apps/admin/app/(protected)/tours/[id]/hotspots/page.tsx` (drag-and-drop placement over Marzipano viewer, persists to tour config JSON), `apps/admin/lib/hotspot-editor.ts`, `apps/admin/test/hotspot-editor.test.ts`.
**Interfaces:** Consumes tour config schema; produces `createHotspot(sceneId, yaw, pitch, type, payload)`, `listHotspots(sceneId)`, `updateHotspot(id, patch)`, `removeHotspot(id)`.
Steps: TDD; commit `feat(admin): add drag-and-drop hotspot placement editor`.

### Task 5: Basic navigation system
**Files:** Create `xr-runner/lib/tour/navigation-graph.ts` (graph + room-to-room transitions crossfade/slide/instant), `xr-runner/test/navigation-graph.test.ts`.
**Interfaces:** Consumes scene registry; produces `buildNavigationGraph(scenes)`, `getAdjacentRooms(roomId)`, `transitionKind(from, to)`.
Steps: TDD; commit `feat(tour): add navigation graph + room transitions`.

### Phase 2 — Enhanced Experience (30 days) [Tasks 6–10, task breakdown]
### Task 6: Multi-level floor navigation
**Files:** Modify `tour-engine.ts`, `FloorPlan.tsx`; Create `xr-runner/lib/tour/floors.ts`.
**Interfaces:** `switchFloor(floorIndex)`, `getFloors()`, scene→floor mapping. Up to 4 floors.
Steps: TDD; commit `feat(tour): add up-to-4-floor multi-level navigation`.

### Task 7: Audio system with volume control
**Files:** Create `xr-runner/components/tour/AudioPlayer.tsx`, `xr-runner/lib/tour/audio.ts`; consume §9.11 `PLAY_MEDIA` interaction.
**Interfaces:** `playTrack(track)`, `setVolume(level)`, `mute()`, autoplay-safe (user-gesture gated, auto-pause on tab blur).
Steps: TDD; commit `feat(tour): add ambient audio with volume control + autoplay safety`.

### Task 8: Views counter (analytics)
**Files:** Create `apps/api/routes/tour-stats.ts` (increment + read), consume §41; admin dashboard card.
**Interfaces:** `POST /api/v1/public/tours/:id/view`, `GET /api/v1/public/tours/:id/stats`.
Steps: TDD; commit `feat(tour): add views counter + stats endpoint`.

### Task 9: Mobile responsive + touch navigation
**Files:** Modify `tour-viewer.tsx`, `ControlsBar.tsx`; create mobile styles + swipe/pinch handling.
**Interfaces:** `onSwipe(dir)`, `onPinch(scale)`; responsive breakpoints.
Steps: manual + component tests; commit `feat(tour): mobile responsive + touch navigation`.

### Task 10: Social sharing + copy URL
**Files:** Create `xr-runner/components/tour/ShareMenu.tsx`.
**Interfaces:** `shareTo(network, url)`, `copyTourUrl(url)`; deep-link format from #21.
Steps: TDD; commit `feat(tour): social sharing + copy tour URL`.

### Phase 3 — Advanced (30 days) [Tasks 11–15, task breakdown]
### Task 11: Photo galleries with lightbox
**Files:** Create `xr-runner/components/tour/PhotoGallery.tsx`, `xr-runner/components/tour/Lightbox.tsx`.
**Interfaces:** `openGallery(sceneId)`, `openLightbox(imageIndex)`; gallery per room (#14).
Steps: TDD; commit `feat(tour): per-room photo galleries with lightbox`.

### Task 12: Visual effects controls
**Files:** Create `xr-runner/components/tour/EffectsPanel.tsx` (brightness/contrast/saturation via Marzipano shader uniforms).
**Interfaces:** `setBrightness(v)`, `setContrast(v)`, `setSaturation(v)`.
Steps: TDD; commit `feat(tour): visual effects controls`.

### Task 13: Deep linking / share current position
**Files:** Modify `tour-viewer.tsx` (URL hash `#room=` + yaw/pitch), `ShareMenu.tsx`.
**Interfaces:** `encodePosition(roomId, yaw, pitch)`, `decodePosition(hash)`, `syncStateToUrl()`.
Steps: TDD; commit `feat(tour): deep-linking + share current position`.

### Task 14: Asset/media library management
**Files:** Create `apps/admin/app/(protected)/assets/page.tsx`, `apps/admin/lib/asset-library.ts`; Cloudflare R2 presigned uploads (#43).
**Interfaces:** `uploadAsset(file)`, `listAssets({type})`, `reuseAcrossProjects(assetId)`; cross-project reuse (#36).
Steps: TDD; commit `feat(admin): asset/media library with R2 uploads`.

### Task 15: Advanced analytics dashboard
**Files:** Create `apps/admin/app/(protected)/tours/[id]/analytics/page.tsx`, `apps/api/routes/tour-analytics.ts`.
**Interfaces:** `GET /api/v1/admin/tours/:id/analytics` → heatmap, engagement, views over time (#37/#41).
Steps: TDD; commit `feat(admin): advanced tour analytics dashboard`.

---

## Cross-Reference
- Feature reference: `VIZTR-COMPLETE-FEATURES.md` §9.2 (Categories A–F, 44 features).
- Engine carve-out: ADR 6.1.1 + §21.5 policy.
- Hybrid View Modes: §9.13 ModeManager; tour config `photoDomeFallback` flag.
- Assets/CDN: §27.3 job queue, §27.4 Cloudflare R2.
- Admin editor patterns: §13; existing phase4 plan `2026-08-05-phase4-xr-engine.md`.
```

(Write the file with full prose for each task following the TDD steps — no "TBD"/"TODO" placeholders. The outline above is the skeleton; expand each task's Step 1–5 with concrete test and implementation snippets. Authoritative content sources: spec §3.4 (task/interface layout) + §4 (full 44-feature tables) at `docs/superpowers/specs/2026-08-05-virtual-tour-marzipano-design.md`; document format/tone reference: existing `implementation-plans/2026-08-05-phase4-xr-engine.md`.)

- [ ] **Step 2: Verify the plan file**

Run: `rg -c "Marzipano" implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md`
Expected: > 10 matches. Run: `rg -n "TODO|TBD|placeholder" implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md`
Expected: no matches.

- [ ] **Step 3: Commit**

```bash
git add implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md
git commit -m "docs(plans): add phase4 Marzipano virtual tour implementation plan"
```

---

### Task 8: Cross-document verification

**Files:**
- Verify: all four edited docs + the new plan.

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: confirmation that no stale references remain and all documents are consistent.

- [ ] **Step 1: Verify feature doc consistency**

Run:
```powershell
rg -n "Version 1.5.0" VIZTR-COMPLETE-FEATURES.md
rg -n "Marzipano" VIZTR-COMPLETE-FEATURES.md | Measure-Object | Select-Object -ExpandProperty Count
rg -n "PhotoDome" VIZTR-COMPLETE-FEATURES.md
```
Expected: v1.5.0 present; Marzipano count ≥ 40; PhotoDome still present (fallback role preserved).

- [ ] **Step 2: Verify no stale "Marzi[np]ano" typos in NEW content**

Run: `rg -n "Marpinano" VIZTR-COMPLETE-FEATURES.md implementation-plans/2026-08-05-phase4-virtual-tour-marzipano.md`
Expected: zero matches (normalized to Marzipano).

- [ ] **Step 3: Verify Claude/ snapshot untouched**

Run: `rg -l "Marzipano" implementation-plans/Claude/`
Expected: no output (snapshot copies untouched).

- [ ] **Step 4: Verify decision log + techstack consistency**

Run:
```powershell
rg -n "6.1.1" implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md
rg -n "Marzipano" implementation-plans/VIZTR-TECHSTACK-SELECTION.md
```
Expected: ADR 6.1.1 present in Decision Log; Marzipano present in TechStack §5.1/§5.2/summary/key-decisions.

- [ ] **Step 5: Commit any remaining diff**

```bash
git add -A
git commit -m "docs: cross-document consistency verification for Marzipano tour integration"
```

---

## Self-Review Notes

- **Spec coverage:** all four spec §3.1–§3.4 document changes map to Tasks 1–6; §3.4 (new plan file) maps to Task 7; §4 reference content is embedded in Task 2; §5 non-functional requirements map to Task 8 verification.
- **Placeholder scan:** the only skeleton is Task 7 Step 1, which explicitly instructs the implementer to write full prose per the outline with no placeholders; the outline itself carries concrete interface signatures and commit messages.
- **Type consistency:** `setScene`, `getCurrentRoom`, `onSceneClick`, `photoDomeFallback`, `createHotspot` are defined in the tasks that use them and reused consistently in later tasks.
