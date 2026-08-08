# Phase 4 — Virtual Tour (Marzipano) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full 44-feature 360° Virtual Tour on the Marzipano viewer (named carve-out, ADR 6.1.1), with hybrid Babylon.js dollhouse View Modes (#8), admin no-code editor, and analytics.

**Architecture:** Marzipano renders the 360° panorama layer inside `TourEngine` / `tour-viewer.tsx`; Babylon.js provides the dollhouse 3D view (View Modes #8) and remains the core engine for other modes. Tour config JSON (#40) drives scenes, hotspots, floors, and branding. Tiles/media served from Cloudflare R2 (#43). ModeManager (§9.13) routes Marzipano ⇄ dollhouse, sharing room/camera state via the tour config.

**Tech Stack:** Marzipano (Apache 2.0), Babylon.js 8+ (dollhouse only), Next.js 15/16, TypeScript strict, Tailwind, TanStack Query, Zustand, Supabase (Postgres + Auth + RLS), Cloudflare R2, BullMQ (§27.3), Vitest, React Testing Library.

**Feature reference:** `VIZTR-COMPLETE-FEATURES.md` §9.2 (44 features, Categories A–F). Engine carve-out: ADR 6.1.1 (`implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md`) and §21.5 policy.

## Global Constraints

- Virtual Tour uses Marzipano for the 360° panorama layer **only**; no other mode may use Marzipano (ADR 6.1.1, §21.5).
- Babylon.js PhotoDome remains the fallback path via the tour config `photoDomeFallback` flag.
- All 44 features from §9.2 must be covered; stage Phase 1 → 2 → 3 (30 days each).
- TDD per repo convention: failing test → minimal implementation → passing test → commit.
- Accessibility (#27): ARIA labels, keyboard navigation, WCAG 2.1 AA, `prefers-reduced-motion`.
- SEO: semantic HTML, per-tour metadata + structured data (Tour schema), clean URLs + deep links (#21).
- Performance: multi-res tile pyramid with LRU cache (max 200MB), Cloudflare R2 CDN (#43), code-split Marzipano vs Babylon.
- Security: access control (#35) — password, expiry, view limits; input validation on all editor writes.
- SQL/DB: Supabase PostgreSQL via Prisma; storage split — R2 for 3D/heavy media, Supabase Storage for text/documents only (§21.3).

---

## Phase 1 — Core MVP (30 days)

### Task 1: Marzipano viewer integration (`tour-viewer.tsx`)

**Files:**
- Modify: `xr-runner/components/viewers/tour-viewer.tsx`
- Create: `xr-runner/lib/tour/tour-engine.ts`, `xr-runner/lib/tour/sources.ts`
- Test: `xr-runner/test/tour-engine.test.ts`

**Interfaces:**
- Consumes: tour config JSON (#40), `@viztr/types`.
- Produces: `createTourViewer(config: TourConfig): TourEngine`, `loadScene(roomId: string): Promise<void>`, `setScene(roomId: string, transition?: Transition): void`, `getCurrentRoom(): string`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createTourEngine } from "../lib/tour/tour-engine";
const config = { id: "t1", scenes: [{ id: "living", image: "/tiles/living/{z}/{x}/{y}.jpg" }] };
describe("tour-engine", () => {
  it("loads a scene and reports the current room", async () => {
    const engine = createTourEngine(config);
    await engine.loadScene("living");
    expect(engine.getCurrentRoom()).toBe("living");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL — `createTourEngine` not defined.

- [ ] **Step 3: Write minimal implementation**

`lib/tour/sources.ts`:
```ts
import { Source } from "marzipano";
export function equirectSource(imageUrl: string, tileSize: number, maxLevel: number) {
  return new Source({ url: imageUrl, tileSize: [tileSize, tileSize], maxLevel });
}
export function cubeSource(baseUrl: string) {
  const faces = ["n", "e", "s", "w", "u", "d"];
  return Source.fromEquirectangularLike(
    faces.map((f) => ({ url: `${baseUrl}/${f}/{z}/{x}/{y}.jpg`, tileSize: [256, 256], maxLevel: 4 })),
  );
}
```

`lib/tour/tour-engine.ts`:
```ts
import { Viewer } from "marzipano";
import type { TourConfig, Transition } from "@viztr/types";
export interface TourEngine { loadScene(id: string): Promise<void>; setScene(id: string, t?: Transition): void; getCurrentRoom(): string; destroy(): void; }
export function createTourEngine(config: TourConfig, container: HTMLElement): TourEngine {
  let current = config.startScene ?? config.scenes[0].id;
  const viewer = new Viewer(container, { stageType: "flat", stage: { width: 1280, height: 720 } });
  return {
    async loadScene(id: string) { current = id; },
    setScene(id: string) { current = id; },
    getCurrentRoom: () => current,
    destroy: () => viewer.destroy(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/lib/tour xr-runner/test/tour-engine.test.ts
git commit -m "feat(tour): add Marzipano tour engine with scene loading"
```

---

### Task 2: Bottom-center controls (Play/Pause + arrows)

**Files:**
- Create: `xr-runner/components/tour/ControlsBar.tsx`
- Test: `xr-runner/test/controls-bar.test.tsx`

**Interfaces:**
- Consumes: `TourEngine` (Task 1), `tour-engine.ts` methods.
- Produces: `ControlsBar` — bottom-center Play/Pause (autorotate toggle) + left/right arrows (prev/next scene), bound to `setScene`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ControlsBar } from "../components/tour/ControlsBar";
describe("ControlsBar", () => {
  it("calls onNext when the right arrow is clicked", () => {
    const onNext = vi.fn();
    render(<ControlsBar playing={false} onPlayPause={vi.fn()} onPrev={vi.fn()} onNext={onNext} />);
    fireEvent.click(screen.getByLabelText("Next scene"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL — `ControlsBar` not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function ControlsBar({ playing, onPlayPause, onPrev, onNext }: Props) {
  return (
    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3 z-20" role="toolbar" aria-label="Tour controls">
      <button aria-label="Previous scene" onClick={onPrev}>←</button>
      <button aria-label={playing ? "Pause auto-rotate" : "Play auto-rotate"} onClick={onPlayPause}>{playing ? "⏸" : "▶"}</button>
      <button aria-label="Next scene" onClick={onNext}>→</button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/components/tour/ControlsBar.tsx xr-runner/test/controls-bar.test.tsx
git commit -m "feat(tour): add bottom-center play/pause + nav arrows"
```

---

### Task 3: Floor plan pop-up with scene markers

**Files:**
- Create: `xr-runner/components/tour/FloorPlan.tsx`
- Create: `xr-runner/lib/tour/navigation-graph.ts`
- Test: `xr-runner/test/floor-plan.test.tsx`

**Interfaces:**
- Consumes: tour config floors/scenes, `navigation-graph.ts`.
- Produces: `FloorPlan` SVG overlay with clickable scene markers → `onSceneClick(roomId)` → `setScene`; `buildNavigationGraph(scenes)`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FloorPlan } from "../components/tour/FloorPlan";
describe("FloorPlan", () => {
  it("emits the clicked scene id", () => {
    const onSceneClick = vi.fn();
    render(<FloorPlan scenes={[{ id: "kitchen", x: 10, y: 20 }]} onSceneClick={onSceneClick} />);
    fireEvent.click(screen.getByLabelText("kitchen"));
    expect(onSceneClick).toHaveBeenCalledWith("kitchen");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function FloorPlan({ scenes, onSceneClick }: { scenes: SceneMarker[]; onSceneClick: (id: string) => void }) {
  return (
    <svg role="group" aria-label="Floor plan" viewBox="0 0 100 100">
      {scenes.map((s) => (
        <circle key={s.id} cx={s.x} cy={s.y} r={4} aria-label={s.id}
          role="button" tabIndex={0} onClick={() => onSceneClick(s.id)}
          onKeyDown={(e) => e.key === "Enter" && onSceneClick(s.id)} />
      ))}
    </svg>
  );
}
```

`navigation-graph.ts`: `buildNavigationGraph(scenes)` returns `Map<roomId, roomId[]>` from scene link arrays; `transitionKind(from, to)` returns `"crossfade" | "slide" | "instant"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/components/tour/FloorPlan.tsx xr-runner/lib/tour/navigation-graph.ts xr-runner/test/floor-plan.test.tsx
git commit -m "feat(tour): add floor plan pop-up with clickable scene markers"
```

---

### Task 4: Hotspot placement editor (admin)

**Files:**
- Create: `apps/admin/app/(protected)/tours/[id]/hotspots/page.tsx`
- Create: `apps/admin/lib/hotspot-editor.ts`
- Test: `apps/admin/test/hotspot-editor.test.ts`

**Interfaces:**
- Consumes: tour config schema (#40), authenticated admin session.
- Produces: `createHotspot(sceneId, yaw, pitch, type, payload)`, `listHotspots(sceneId)`, `updateHotspot(id, patch)`, `removeHotspot(id)` — drag-and-drop placement over the Marzipano viewer.
- **Boundary (do not duplicate):** this editor owns **2D panorama hotspots** (`tour_configs.hotspots`, yaw/pitch, Marzipano overlay). The **3D interaction hotspots** (`position: [x,y,z]`, `radius`, §13.3–13.5, dollhouse) belong to `2026-08-05-phase4-xr-engine.md` Task 5. A tour project may have both; the admin surface is shared but the two schemas are separate.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createHotspot, listHotspots } from "../lib/hotspot-editor";
describe("hotspot-editor", () => {
  it("creates and lists a hotspot", () => {
    createHotspot({ id: "h1", sceneId: "living", yaw: 1.2, pitch: -0.1, type: "info", payload: { title: "Fireplace" } });
    expect(listHotspots("living")).toContainEqual(expect.objectContaining({ id: "h1" }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`lib/hotspot-editor.ts` persists hotspots to the tour config JSON via the existing Supabase row (upsert on `tour_configs.hotspots`):
```ts
export interface Hotspot { id: string; sceneId: string; yaw: number; pitch: number; type: "info" | "video" | "image" | "portal"; payload: Record<string, unknown>; }
const store = new Map<string, Hotspot[]>();
export function createHotspot(h: Hotspot) { const arr = store.get(h.sceneId) ?? []; arr.push(h); store.set(h.sceneId, arr); }
export function listHotspots(sceneId: string): Hotspot[] { return store.get(sceneId) ?? []; }
export function updateHotspot(id: string, patch: Partial<Hotspot>) { for (const arr of store.values()) { const h = arr.find((x) => x.id === id); if (h) Object.assign(h, patch); } }
export function removeHotspot(id: string) { for (const [k, arr] of store) { const i = arr.findIndex((x) => x.id === id); if (i >= 0) arr.splice(i, 1); if (!arr.length) store.delete(k); } }
```
Admin page: full-viewport Marzipano viewer; click to drop a marker (raycast yaw/pitch from cursor), drag to reposition, side panel edits type + payload; `zod` validation on writes.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/lib/hotspot-editor.ts apps/admin/test/hotspot-editor.test.ts
git commit -m "feat(admin): add drag-and-drop hotspot placement editor"
```

---

### Task 5: Basic navigation system

**Files:**
- Create: `xr-runner/lib/tour/navigation-graph.ts` (extend Task 3), `xr-runner/lib/tour/transitions.ts`
- Test: `xr-runner/test/navigation-graph.test.ts`

**Interfaces:**
- Consumes: scene registry, Marzipano viewer.
- Produces: `buildNavigationGraph(scenes)`, `getAdjacentRooms(roomId)`, `transitionKind(from, to)` — crossfade/slide/instant room-to-room transitions (#12).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildNavigationGraph, getAdjacentRooms, transitionKind } from "../lib/tour/navigation-graph";
const scenes = [{ id: "a", links: ["b"] }, { id: "b", links: ["a", "c"] }, { id: "c", links: ["b"] }];
describe("navigation-graph", () => {
  it("builds adjacency and transitions", () => {
    const g = buildNavigationGraph(scenes);
    expect(getAdjacentRooms(g, "b")).toEqual(["a", "c"]);
    expect(transitionKind(g, "a", "b")).toBe("crossfade");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
export type NavGraph = Map<string, string[]>;
export function buildNavigationGraph(scenes: Scene[]): NavGraph {
  const g = new Map<string, string[]>();
  for (const s of scenes) g.set(s.id, s.links ?? []);
  return g;
}
export function getAdjacentRooms(g: NavGraph, id: string): string[] { return g.get(id) ?? []; }
export function transitionKind(_g: NavGraph, _from: string, _to: string): Transition { return "crossfade"; }
```
`transitions.ts`: `applyTransition(viewer, kind)` — Marzipano `Effects` fade; slide via animated yaw offset; instant direct `switchScene`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/lib/tour/navigation-graph.ts xr-runner/lib/tour/transitions.ts xr-runner/test/navigation-graph.test.ts
git commit -m "feat(tour): add navigation graph + room transitions"
```

---

## Phase 2 — Enhanced Experience (30 days)

### Task 6: Multi-level floor navigation

**Files:**
- Modify: `xr-runner/lib/tour/tour-engine.ts`, `xr-runner/components/tour/FloorPlan.tsx`
- Create: `xr-runner/lib/tour/floors.ts`
- Test: `xr-runner/test/floors.test.ts`

**Interfaces:**
- Consumes: `TourEngine`.
- Produces: `switchFloor(floorIndex: number)`, `getFloors(): Floor[]`, scene→floor mapping. Up to 4 floors (#6).

- [ ] **Step 1: Write the failing test** — `floors.test.ts` verifies `switchFloor(1)` sets the active floor and returns its scenes.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — `floors.ts` with `Floor { index, label, sceneIds }[]`; `tour-engine.ts` keeps `activeFloor`; `FloorPlan.tsx` adds floor-tab switcher + per-floor markers.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): add up-to-4-floor multi-level navigation"`.

---

### Task 7: Audio system with volume control

**Files:**
- Create: `xr-runner/components/tour/AudioPlayer.tsx`, `xr-runner/lib/tour/audio.ts`
- Test: `xr-runner/test/audio.test.ts`

**Interfaces:**
- Consumes: §9.11 `PLAY_MEDIA` interaction, tour config audio tracks.
- Produces: `playTrack(track: AudioTrack)`, `setVolume(level: number)`, `mute()`, `unmute()` — autoplay-safe (user-gesture gated), auto-pause on tab blur (#25).

- [ ] **Step 1: Write the failing test** — `audio.test.ts` verifies `setVolume(0.5)` sets `audio.volume` and `mute()` mutes.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — `audio.ts` wraps `HTMLAudioElement`; start only after first user gesture; `document.visibilitychange` → pause; reconnect on visibility.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): add ambient audio with volume control + autoplay safety"`.

---

### Task 8: Views counter (analytics)

**Files:**
- Create: `apps/api/routes/tour-stats.ts`
- Test: `apps/api/test/tour-stats.test.ts`

**Interfaces:**
- Consumes: Supabase, auth.
- Produces: `POST /api/v1/public/tours/:id/view` (increment, RLS-safe, 1/min rate limit), `GET /api/v1/public/tours/:id/stats` (total views, views today) — analytics integration (#23/#41).

- [ ] **Step 1: Write the failing test** — `tour-stats.test.ts` POSTs a view then GETs stats and asserts count increments.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — route upserts `tour_views` (tour_id, viewed_at) via Prisma; count query with `COUNT(*)` and `date_trunc('day')` grouping.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): add views counter + stats endpoint"`.

---

### Task 9: Mobile responsive + touch navigation

**Files:**
- Modify: `xr-runner/components/viewers/tour-viewer.tsx`, `xr-runner/components/tour/ControlsBar.tsx`
- Test: `xr-runner/test/mobile-nav.test.tsx`

**Interfaces:**
- Consumes: Marzipano viewer gestures.
- Produces: `onSwipe(dir: "left" | "right")`, `onPinch(scale: number)`; responsive breakpoints + full-height mobile layout (#26/#28).

- [ ] **Step 1: Write the failing test** — `mobile-nav.test.tsx` fires a swipe-left handler and expects `onNext`.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — Marzipano `Viewer` `controlMethod: "drag"` + `Pc`/`Touch` controls; add edge-swipe zones; `100dvh` height on mobile.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): mobile responsive + touch navigation"`.

---

### Task 10: Social sharing + copy URL

**Files:**
- Create: `xr-runner/components/tour/ShareMenu.tsx`
- Test: `xr-runner/test/share-menu.test.tsx`

**Interfaces:**
- Consumes: deep-link format (#21), current position.
- Produces: `shareTo(network: "facebook" | "x" | "whatsapp" | "email", url: string)`, `copyTourUrl(url: string)` via `navigator.clipboard` (#19/#20).

- [ ] **Step 1: Write the failing test** — `share-menu.test.tsx` mocks `navigator.clipboard.writeText` and verifies `copyTourUrl` is called with the shared URL.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — `ShareMenu.tsx` popover with network links (`https://www.facebook.com/sharer/sharer.php?u=`, `https://twitter.com/intent/tweet?url=`, `https://wa.me/?text=`, `mailto:?body=`), copy button with success state + `aria-live`.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): social sharing + copy tour URL"`.

---

## Phase 3 — Advanced Features (30 days)

### Task 11: Photo galleries with lightbox

**Files:**
- Create: `xr-runner/components/tour/PhotoGallery.tsx`, `xr-runner/components/tour/Lightbox.tsx`
- Test: `xr-runner/test/lightbox.test.tsx`

**Interfaces:**
- Consumes: per-room gallery config (#14).
- Produces: `openGallery(sceneId)`, `openLightbox(imageIndex)`, `closeLightbox()` — fullscreen lightbox with keyboard nav + focus trap (#27).

- [ ] **Step 1: Write the failing test** — `lightbox.test.tsx` opens, asserts image `alt`, then Escape closes.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — gallery thumbnail strip bound to Marzipano hotspots (#18); `Lightbox` with `role="dialog"`, arrow-key prev/next, Escape close, focus trap.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): per-room photo galleries with lightbox"`.

---

### Task 12: Visual effects controls

**Files:**
- Create: `xr-runner/components/tour/EffectsPanel.tsx`
- Create: `xr-runner/lib/tour/effects.ts`
- Test: `xr-runner/test/effects.test.ts`

**Interfaces:**
- Consumes: Marzipano shader uniforms.
- Produces: `setBrightness(v)`, `setContrast(v)`, `setSaturation(v)` — effect composer integration (#24/#42).

- [ ] **Step 1: Write the failing test** — `effects.test.ts` verifies `setBrightness(1.2)` updates the uniform value.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — `effects.ts` holds uniform state passed to a Marzipano custom `Effect` (GLSL brightness/contrast/saturation); `EffectsPanel.tsx` sliders with `input[type=range]` + ARIA labels.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): visual effects controls (brightness/contrast/saturation)"`.

---

### Task 13: Deep linking / share current position

**Files:**
- Modify: `xr-runner/components/viewers/tour-viewer.tsx`, `xr-runner/components/tour/ShareMenu.tsx`
- Test: `xr-runner/test/deep-link.test.ts`

**Interfaces:**
- Consumes: `TourEngine`.
- Produces: `encodePosition(roomId, yaw, pitch): string`, `decodePosition(hash): Position`, `syncStateToUrl()` — `#room=` + yaw/pitch deep links (#21).

- [ ] **Step 1: Write the failing test** — `deep-link.test.ts` round-trips `encodePosition` → `decodePosition` and asserts equality.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — `tour-viewer.tsx` reads `location.hash` on mount (`#room=living&yaw=1.2&pitch=-0.1`), `syncStateToUrl` updates hash on scene/view changes; ShareMenu embeds the encoded URL.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): deep-linking + share current position"`.

---

### Task 14: Asset/media library management

**Files:**
- Create: `apps/admin/app/(protected)/assets/page.tsx`, `apps/admin/lib/asset-library.ts`
- Test: `apps/admin/test/asset-library.test.ts`

**Interfaces:**
- Consumes: Cloudflare R2 presigned URLs (#43), Supabase metadata.
- Produces: `uploadAsset(file): Promise<Asset>`, `listAssets({ type }): Promise<Asset[]>`, `reuseAcrossProjects(assetId, projectIds): Promise<void>` — cross-project reuse (#15/#36).

- [ ] **Step 1: Write the failing test** — `asset-library.test.ts` mocks R2 presigned upload and asserts `uploadAsset` returns an `Asset` with a CDN URL.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — admin `GET` presigned PUT via `apps/api`; store metadata (type, size, mime, CDN key) in `assets` table; gallery grid with filters, delete, copy CDN URL.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(admin): asset/media library with R2 uploads"`.

---

### Task 15: Advanced analytics dashboard

**Files:**
- Create: `apps/admin/app/(protected)/tours/[id]/analytics/page.tsx`, `apps/api/routes/tour-analytics.ts`
- Test: `apps/api/test/tour-analytics.test.ts`

**Interfaces:**
- Consumes: `tour_views` + new `tour_events` table.
- Produces: `GET /api/v1/admin/tours/:id/analytics` → heatmap (scene dwell), engagement (interactions per view), views over time (#37/#41).

- [ ] **Step 1: Write the failing test** — `tour-analytics.test.ts` seeds views + events, GETs analytics, asserts heatmap and engagement shape.
- [ ] **Step 2: Run test** — Expected: FAIL.
- [ ] **Step 3: Implement** — `tour-events` table (tour_id, scene_id, event_type, ts); route aggregates: dwell per scene, `events/views` ratio, `date_trunc('day')` series; admin page renders charts (Recharts) + filterable date range.
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(admin): advanced tour analytics dashboard"`.

### Task 16: Token-based tour delivery + access control (#35)

**Files:**
- Modify: `xr-runner/app/view/tour/[token]/page.tsx` (route created in `2026-08-05-phase4-xr-engine.md` Task 8)
- Create: `xr-runner/lib/share/tour-access.ts`
- Test: `xr-runner/test/tour-access.test.ts`

**Interfaces:**
- Consumes: canonical `XrShareLink` model + shared access helpers from `2026-08-05-phase4-xr-engine.md` Task 8 (projectId, mode, accessType `PUBLIC|PASSWORD|TOKEN`, passwordHash, token, expiry, viewCount, revoked, createdBy); `TourEngine` (Task 1); views counter (Task 8).
- Produces: `resolveTourShare(token)` (Supabase `XrShareLink` lookup where `mode = 'tour'`), `checkTourAccess(link, creds)` (password/token/public gates + expiry + revoked), per-link `viewCount` increment — the `/view/tour/[token]` route mounts `tour-viewer.tsx` gated by access control (#35), showing a password gate or 404/expired state otherwise.

- [ ] **Step 1: Write the failing test** — `tour-access.test.ts` asserts `checkTourAccess` allows PUBLIC links, requires the password for PASSWORD links, and blocks expired/revoked links (reusing the Task 8 `ShareLink` shape).
- [ ] **Step 2: Run test** — `pnpm --filter @viztr/xr-runner test`; Expected: FAIL.
- [ ] **Step 3: Implement** — `tour-access.ts` wraps the Task 8 `checkAccess` with a tour-scoped resolver; `page.tsx` resolves the token, gates via `checkTourAccess`, renders `TourEngine` through `tour-viewer.tsx`, and increments `viewCount` once per page-load (rate-limited 1/min to match Task 8).
- [ ] **Step 4: Run test** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tour): add token-based tour delivery with access control"`.

---

## Checkpoint: M4 Definition of Done

- [ ] Phase 1 Tasks 1–5 pass: Marzipano tour viewer renders a 360° panorama from local equirect + cube sources; bottom-center Play/Pause + arrows work; floor plan pop-up shows clickable scene markers; admin can drag-and-drop hotspots; navigation transitions crossfade.
- [ ] Phase 2 Tasks 6–10 pass: multi-level floors, audio with volume + autoplay safety, views counter, mobile/touch navigation, social sharing + copy URL.
- [ ] Phase 3 Tasks 11–16 pass: photo galleries, visual effects, deep-linking, asset library, analytics dashboard, token-based tour delivery with access control (#35) + per-link view counts.
- [ ] Every shipped task has a passing test (`pnpm --filter <app> test`); no `- [ ]` left uncheckable.
- [ ] PhotoDome fallback flag (`photoDomeFallback`) wired in tour config; Babylon stays core for dollhouse/XR (ADR 6.1.1).
- [ ] Update `VIZTR-COMPLETE-FEATURES.md` §28 tracker row: Virtual Tour (Marzipano) shipped.

## Cross-Reference

- Feature reference: `VIZTR-COMPLETE-FEATURES.md` §9.2 (Categories A–F, 44 features).
- Engine carve-out: ADR 6.1.1 (`implementation-plans/VIZTR-TECHNICAL-DECISION-LOG.md`) + §21.5 policy.
- Hybrid View Modes (#8): owned by `2026-08-05-phase4-xr-engine.md` (ModeManager + Babylon dollhouse); tour config `photoDomeFallback` flag.
- 3D interaction hotspots: `2026-08-05-phase4-xr-engine.md` Task 5 (§13.3–13.5) — see Task 4 boundary above.
- 14 features without a task are ownership-mapped in `VIZTR-COMPLETE-FEATURES.md` §9.2 (Wayfinder #7, View Modes #8, Measurement #9, VR Entry #10, Fullscreen #11, Timeline #16, Labels #17, Hamburger #22, Scene Upload #29, Floor Plan Builder #31, Menu Builder #33, Branding #34, Theming #38, Publish/Versioning #39).
- Assets/CDN: §27.3 job queue, §27.4 Cloudflare R2.
- Admin editor patterns: §13; existing plan `implementation-plans/2026-08-05-phase4-xr-engine.md`.
- Viewers baseline: `tour-viewer.tsx` (existing phase4 plan), `TourEngine` (§9.1).
