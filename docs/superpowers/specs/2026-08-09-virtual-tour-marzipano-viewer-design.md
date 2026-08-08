# VizTR 360° Virtual Tour — Marzipano Viewer Design

**Date:** August 9, 2026
**Status:** Approved for planning
**Scope:** Viewer MVP slice of the Marzipano integration (Phase 1 items 1, 2, 5): Marzipano panorama rendering, bottom-center Play/Pause + navigation arrows, and multi-scene navigation. Replaces the Babylon.js PhotoDome tour viewer as the **only** tour renderer.

**Parent spec:** `2026-08-05-virtual-tour-marzipano-design.md` (44-feature Marzipano reference, ADR 6.1.1). This design implements a concrete first slice of it.

---

## 1. Background & Decisions

- The tour page `app/(public)/tour/[id]` currently renders a **Babylon.js PhotoDome** viewer (`components/viewer/*`, single-equirect `TourConfig`, `GET /api/tours/[id]`).
- **Decision:** Marzipano becomes the **only** tour renderer. The Babylon tour viewer components are removed. `@babylonjs/*` dependencies **remain** in `package.json` because other features use them (`lib/xr/webxr.ts`, `components/configurator/ARPanel.tsx`, `babylon_XR_World/*`).
- **Decision:** This slice covers panorama + controls + multi-scene navigation. The admin hotspot-placement editor, floor-plan pop-up, VR entry, and everything else from the 44-feature reference are separate later slices.
- **Decision:** Scenes are modeled as **asset-as-scene via metadata** — each `image/jpeg|png` asset becomes a scene; per-scene data lives in `assets.metadata` (jsonb); global settings stay in `projects.settings` (jsonb). No schema migration.
- **Decision:** Navigation is **ordered prev/next arrows** (by scene order) plus **optional link hotspots** (`targetSceneId` on a hotspot renders a Marzipano link hotspot).
- **Decision:** Use Marzipano `Source.fromImage(url)` (in-browser equirect source, works with existing JPEG/PNG assets). No tile pyramid in this slice.

## 2. Data Model

New shapes in `lib/tour/types.ts`:

```ts
interface TourView {
  yaw: number;   // radians
  pitch: number; // radians
  fov: number;   // radians
}

interface TourHotspot {
  id: string;
  label: string;
  description?: string;
  url?: string;          // http/https only (validated in mapper)
  targetSceneId?: string; // if present and valid → Marzipano link hotspot
  yaw: number;
  pitch: number;
}

interface TourScene {
  id: string;
  title: string;
  equirectangularUrl: string;
  initialView?: TourView;
  hotspots: TourHotspot[];
}

interface TourSettings {
  autoRotate: boolean;
  autoRotateSpeed: number; // radians/second
  hotspotStyle: 'pin' | 'minimal';
  startSceneId?: string;   // scene to open on; default: first scene
}

interface TourConfig {
  id: string;
  title: string;
  scenes: TourScene[];
  settings: TourSettings;
}
```

### Mapping (`lib/tour/map-tour-config.ts`)

- Scenes = image assets (`image/jpeg`, `image/png`) ordered by `assets.metadata.order ?? assets.created_at` (stable tiebreak: created_at, then id).
- Per-scene `id` = asset `id`. `title` = `assets.metadata.title ?? file_name` (extension stripped). `equirectangularUrl` = public URL of the asset (existing `publicUrlFor`).
- Per-scene `hotspots` = `assets.metadata.hotspots` (array, normalized: valid `id`, `label`, numeric `yaw`/`pitch`; `url` kept only when http(s); `targetSceneId` kept only when it references an existing scene id in the tour, otherwise dropped to a plain info hotspot).
- Per-scene `initialView` = `assets.metadata.initialView` if it has numeric `yaw`/`pitch` (and optional `fov`). Otherwise the scene starts at Marzipano's built-in default view. For backward compatibility, the **first** scene additionally honors legacy `projects.settings.initialYaw`/`initialPitch` when no per-scene view is set.
- `settings` from `projects.settings`: `autoRotate` (boolean, default false), `autoRotateSpeed` (number, default 0.5), `hotspotStyle` (`'pin' | 'minimal'`, default `'pin'`), `startSceneId` (string, optional — ignored if it doesn't match a scene id).
- **Backward compatibility:** tours with assets but no per-asset metadata still produce one scene per image. When no scene defines hotspots, the legacy flat `projects.settings.hotspots` (existing normalization + http(s) URL filter) is applied to the first scene.
- Returns `null` (→ not-found state) when the project has no image assets.

### Coordinate note (for the plan)

Marzipano's yaw convention differs from Babylon's `ArcRotateCamera.alpha`. The mapper or viewer will apply a **documented yaw offset constant** so stored hotspot/view angles point the same direction as before. The exact constant is determined during implementation by comparing Marzipano's yaw origin with the previous PhotoDome origin; the mapping is isolated in one pure function with a unit test.

## 3. Architecture & Components

**New dependency:** `marzipano` (Apache-2.0). The npm package ships a UMD build and **no TypeScript types** → add a local declaration file `types/marzipano.d.ts` covering the APIs used (Viewer, Source.fromImage, Scene, createScene, switchScene, setAutorotateEnabled, lookTo, viewport events, dispose). Loaded client-only via `next/dynamic` `ssr: false` so Marzipano never enters a server bundle.

**Components:**

- `components/marzipano/MarzipanoTourViewer.tsx` (`'use client'`) — owner component. Owns the `Marzipano.Viewer` lifecycle (create on mount, dispose on unmount), builds scenes from `TourConfig`, renders overlays: bottom-center controls (Play/Pause + prev/next arrows), fullscreen, loading state, and error surface. Replaces the removed `components/viewer/*`.
- `components/marzipano/useMarzipanoTour.ts` (`'use client'`) — the imperative seam: `{ containerRef, goToScene(id), goNext(), goPrev(), toggleAutorotate, isPlaying, currentSceneIndex, isLoading, error }`. Wraps `Marzipano.Viewer` (create, `createScene` per scene with `Equirect` geometry + initial view, `switchScene` transitions, `setAutorotateEnabled`, lookTo). Includes the load-callback/error plumbing and cleanup.
- `components/marzipano/navigation.ts` (pure, no DOM) — scene-order navigation math: `nextIndex(current, length)` / `prevIndex(current, length)` with wraparound, and scene resolution (`resolveStartScene(scenes, startSceneId)`). Unit-testable.
- `app/(public)/tour/[id]/page.tsx` — unchanged shape: server component fetches `TourConfig` (reworked for multi-scene), renders the client component; not-found state on fetch failure.
- `app/(public)/tour/[id]/TourPageClient.tsx` — renders `MarzipanoTourViewer` instead of the Babylon viewer (keeps `dynamic(..., { ssr: false })`).
- `app/api/tours/[id]/route.ts` — reworked to return the multi-scene `TourConfig`; response envelope `{ success, data }` / 404 / 500 unchanged.
- `lib/tour/types.ts`, `lib/tour/map-tour-config.ts` — reworked per Section 2.

**Removed:** `components/viewer/{VirtualTourViewer, ViewerControls, HotspotMarker, useVirtualTourScene}.tsx`. `@babylonjs/*` deps stay in package.json.

**Rendering path:** `page.tsx` (server fetch) → `TourPageClient` (dynamic, ssr:false) → `MarzipanoTourViewer` → `useMarzipanoTour` → `Marzipano.Viewer` mounted on a container `<div>`.

## 4. Controls & Interaction

- **Play/Pause (bottom-center, left):** toggles `viewer.setAutorotateEnabled(isPlaying, autoRotateSpeed)`. Icon swaps between play/pause; `aria-pressed` reflects state; Marzipano stops auto-rotate on user drag natively.
- **Prev/Next arrows (bottom-center, right):** `goPrev()`/`goNext()` step through ordered scenes with smooth `switchScene` cross-fade transitions. **Hidden when the tour has ≤ 1 scene.** Navigation wraps around the list.
- **Fullscreen:** one button toggling the browser Fullscreen API on the viewer container (controls are descendants, so they stay visible). `fullscreenchange` listener syncs state; promise rejections caught.
- **Link hotspots:** click → `switchScene` to the target scene. Regular hotspots with `url` → `window.open(url, '_blank', 'noopener,noreferrer')`. Info-only hotspots (no url/target) → no action in this slice.
- **Hotspot markers:** Marzipano renders hotspots as **DOM elements** overlaid on the viewport via each scene's `hotspotContainer` (`scene.hotspotContainer().createHotspot(el, { yaw, pitch })`). The viewer creates a small marker element per hotspot whose appearance follows `settings.hotspotStyle` (`pin` vs `minimal`). Markers are `pointer-events: auto`, focusable, and `aria-label`-labelled.
- **Loading state:** spinner overlay while the first scene's texture loads; a 15s timeout guarantees the overlay clears. Texture **load failure** → error state.
- **Idle fade:** controls hide after ~3s inactivity, reappear on `pointermove`/`keydown` (timer ref cleared on each event).
- **Accessibility:** `prefers-reduced-motion` → auto-rotate defaults off and CSS transitions disabled; arrow keys navigate scenes when the viewer container is focused; ARIA labels + `role="status"` on loading/error; touch swipe/pinch from Marzipano natively.
- **Responsive/dark:** full-screen on mobile, centered `max-w-4xl` on desktop, `#080a0f` background, cyan accent (`#0d9488`/`#06b6d4`) — consistent with the current page.

## 5. Error Handling & Edge Cases

- Fetch failure / unknown id → not-found state (existing).
- No image assets → mapper returns `null` → not-found.
- Scene texture load failure → error state; 15s spinner timeout prevents a hung overlay.
- Unmount mid-load → dispose the Viewer, cancel timers/rAF, remove listeners, clear hide-timer.
- Single-scene tour → arrows hidden; no wrap-around UI needed.
- `targetSceneId` missing/unresolvable → demoted to info hotspot (mapper).
- Hotspot yaw/pitch out of range → Marzipano clamps pitch natively; mapper passes values through.
- No hotspots → no markers rendered.
- Fullscreen promise rejection → caught; state re-synced from `fullscreenchange`.

## 6. Testing

- Vitest (pure logic only, consistent with prior plan):
  - `map-tour-config` — asset→scene ordering (metadata order vs created_at), metadata hotspots (normalization, http(s) URL filter, `targetSceneId` validation/demotion), backward-compat flat-hotspots fallback, settings defaults, startScene resolution, `null` for no image assets, yaw-offset mapping function.
  - `navigation` — `nextIndex`/`prevIndex` wraparound, `resolveStartScene`.
- `pnpm typecheck` + `pnpm build` as integration gates (Marzipano import must not leak into server bundle — verified via build).
- Manual smoke checklist for the plan (dev server): multi-scene tour renders, arrows navigate with transitions, link hotspots work, single-scene hides arrows, auto-rotate toggle, fullscreen, responsive layout, dark theme, 404 state.

## 7. Scope Boundaries

**In this slice:**
- Marzipano panorama rendering via `Source.fromImage`.
- Bottom-center controls: Play/Pause, prev/next arrows, fullscreen.
- Multi-scene navigation: ordered arrows + optional link hotspots.
- Data model (`TourConfig` scenes), mapper, `GET /api/tours/[id]`, tour page rework.
- Removal of the Babylon tour viewer (`components/viewer/*`).
- Loading/error states, idle fade, responsive/dark/accessibility.

**Deferred (separate later slices):**
- VR entry (Marzipano WebXR) — Phase 1 #10.
- Hotspot placement editor, floor-plan pop-up, multi-level floor navigation.
- Tile pyramid (`Source.fromTile` + server-side tiling).
- Info panels on hotspots, audio, views counter, social sharing, visual effects, deep-linking/share-position, asset library, analytics.

## 8. Non-Functional Requirements

- **Backward compatibility:** existing single-image tours still render (one scene). `@babylonjs/*` deps untouched for other features. API envelope unchanged.
- **Performance:** Marzipano loads only on the tour page (code-split, `ssr: false`); `Source.fromImage` auto-tiles in-browser; no server-side tile pipeline in this slice.
- **Security:** hotspot `url` restricted to http(s) in the mapper (stored-script protection); `noopener,noreferrer` on `window.open`; no auth required for the public viewer.
- **Accessibility:** ARIA labels, keyboard navigation, `prefers-reduced-motion` support, `role="status"` on loading/error surfaces.
- **SEO:** static `metadata` on the tour page (unchanged); per-tour `generateMetadata` deferred.
