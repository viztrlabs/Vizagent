# Virtual Tour Marzipano Viewer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Babylon.js PhotoDome tour viewer with a Marzipano-based viewer that renders equirectangular panoramas, provides Play/Pause auto-rotate + prev/next navigation + fullscreen, and navigates multiple scenes ordered from asset metadata.

**Architecture:** A client-only `MarzipanoTourViewer` component owns a `Marzipano.Viewer` through the imperative `useMarzipanoTour` hook. Scenes are built from a new multi-scene `TourConfig` (`TourScene[]`) mapped from image assets' `metadata` in `lib/tour/map-tour-config.ts`, served by the existing `GET /api/tours/[id]` route. Pure navigation math (`components/marzipano/navigation.ts`) and the Marzipano yaw-offset mapping (`lib/tour/view-angle.ts`) are unit-tested with Vitest. The Babylon tour viewer components (`components/viewer/*`) are removed.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5.6 (strict), `marzipano@0.10.2`, `lucide-react` (already a dep), styled-jsx (`<style jsx>`), Vitest, Supabase (via `@/lib/supabase/admin`).

## Global Constraints

- **Marzipano is pinned to `marzipano@0.10.2`.** The 0.10.2 API was verified against package source; there is NO `Source.fromImage`, `setAutorotateEnabled`, `dispose`, or Scene `complete` event. Use the real API: `ImageUrlSource.fromString(url)`, `EquirectGeometry([{ width }])`, `RectilinearView` + `RectilinearView.limit.traditional(maxResolution, maxFov)`, `viewer.createScene`, `scene.switchTo({ transitionDuration })`, `scene.lookTo`, `viewer.setIdleMovement(timeout, movement)` + `Marzipano.autorotate`, `scene.hotspotContainer().createHotspot(el, { yaw, pitch })`, Layer `renderComplete` / TextureStore `textureError`, `viewer.destroy()`.
- **Marzipano loads client-only.** `next/dynamic(..., { ssr: false })` in `TourPageClient`. No `marzipano` import may appear in a server component or the server bundle (verified by `pnpm build`).
- **No new runtime dependencies beyond `marzipano`.** Reuse `lucide-react` (Play, Pause, ChevronLeft, ChevronRight, Maximize2, Minimize2).
- **Do not touch excluded folders:** `babylon_XR_World/`, `components/configurator/`, `lib/xr/` (excluded in `tsconfig.json`). Keep `@babylonjs/*` deps in `package.json` (other features use them).
- **Component CSS uses styled-jsx** (`<style jsx>{`...`}`) matching existing components. Colors: background `#080a0f`, cyan accent `#0d9488` / `#06b6d4`.
- **Data model per design spec** (`lib/tour/types.ts`): `TourView` (yaw/pitch radians, optional fov), `TourHotspot` (+ optional `targetSceneId`), `TourScene`, `TourSettings` (`autoRotate`, `autoRotateSpeed`, `hotspotStyle: 'pin' | 'minimal'`, optional `startSceneId`), `TourConfig` with `scenes: TourScene[]`.
- **Yaw-offset mapping is isolated in one pure function** (`lib/tour/view-angle.ts`) with a unit test; the offset constant lives in exactly one place.
- **Gates:** `pnpm test` (Vitest), `pnpm typecheck` (`tsc --noEmit`), `pnpm build` (`next build`). Every task ends green on its gate(s).

---

### Task 1: Add `marzipano` dependency and type declarations

**Files:**
- Modify: `package.json` (add dependency)
- Create: `types/marzipano.d.ts`
- Test: (none — gate is `pnpm typecheck`; the declaration is exercised by Task 6)

**Interfaces:**
- Consumes: nothing (setup task).
- Produces: a `types/marzipano.d.ts` that declares module `'marzipano'` with an `export =` shape so that `import Marzipano from 'marzipano'` (esModuleInterop) yields typed `Marzipano.Viewer`, `Marzipano.Scene`, `Marzipano.ImageUrlSource`, `Marzipano.EquirectGeometry`, `Marzipano.RectilinearView`, and `Marzipano.autorotate`. `tsconfig.json` already includes `**/*.ts`, so `types/` is picked up.

- [ ] **Step 1: Install the pinned dependency**

Run: `pnpm add marzipano@0.10.2`
Expected: `package.json` gains `"marzipano": "^0.10.2"` under `dependencies`.

- [ ] **Step 2: Create `types/marzipano.d.ts`**

```ts
declare namespace Marzipano {
  interface ViewParameters {
    yaw: number;
    pitch: number;
    fov: number;
  }

  class View {
    constructor(parameters?: Partial<ViewParameters>, limiter?: unknown);
    parameters(): ViewParameters;
    yaw(): number;
    pitch(): number;
    fov(): number;
    setYaw(yaw: number): void;
    setPitch(pitch: number): void;
    setFov(fov: number): void;
    setParameters(parameters: Partial<ViewParameters>): void;
  }

  class RectilinearView extends View {
    static limit: {
      traditional(maxResolution: number, maxFov: number): unknown;
    };
  }

  interface Source {
    loadAsset(
      stage: unknown,
      tile: unknown,
      done: (err: unknown, tile?: unknown, asset?: unknown) => void
    ): () => void;
  }

  interface Geometry {}

  class HotspotContainer {
    createHotspot(domElement: HTMLElement, coords: { yaw: number; pitch: number }): unknown;
    destroyHotspot(hotspot: unknown): void;
    hide(): void;
    show(): void;
  }

  class TextureStore {
    addEventListener(type: string, handler: () => void): void;
    removeEventListener(type: string, handler: () => void): void;
  }

  class Layer {
    source(): Source;
    geometry(): Geometry;
    textureStore(): TextureStore;
    addEventListener(type: string, handler: (value?: unknown) => void): void;
    removeEventListener(type: string, handler: (value?: unknown) => void): void;
    pinFirstLevel(): void;
  }

  class Scene {
    view(): View;
    listLayers(): Layer[];
    hotspotContainer(): HotspotContainer;
    switchTo(opts?: { transitionDuration?: number }, done?: () => void): void;
    lookTo(
      params: Partial<ViewParameters>,
      opts?: { transitionDuration?: number },
      done?: () => void
    ): void;
    startMovement(
      fn: () => (params: Partial<ViewParameters>, elapsed: number) => Partial<ViewParameters> | null,
      done?: () => void
    ): void;
    stopMovement(): void;
    addEventListener(type: string, handler: () => void): void;
    destroy(): void;
  }

  class Viewer {
    constructor(
      domElement: HTMLElement,
      opts?: { controls?: Record<string, unknown> }
    );
    createScene(opts: {
      source: Source;
      geometry: Geometry;
      view: View;
      pinFirstLevel?: boolean;
    }): Scene;
    switchScene(
      scene: Scene,
      opts?: { transitionDuration?: number },
      done?: () => void
    ): void;
    lookTo(
      params: Partial<ViewParameters>,
      opts?: { transitionDuration?: number },
      done?: () => void
    ): void;
    scene(): Scene | null;
    view(): View | null;
    controls(): unknown;
    startMovement(
      fn: () => (params: Partial<ViewParameters>, elapsed: number) => Partial<ViewParameters> | null,
      done?: () => void
    ): void;
    stopMovement(): void;
    setIdleMovement(
      timeout: number,
      movement?: (() => (params: Partial<ViewParameters>, elapsed: number) => Partial<ViewParameters> | null) | null
    ): void;
    addEventListener(type: string, handler: () => void): void;
    destroy(): void;
    domElement(): HTMLElement;
  }

  const ImageUrlSource: {
    fromString(
      url: string,
      opts?: {
        cubeMapPreviewUrl?: string;
        cubeMapPreviewFaceOrder?: string;
        concurrency?: number;
        retryDelay?: number;
      }
    ): Source;
  };

  const EquirectGeometry: new (levels: Array<{ width: number }>) => Geometry;

  function autorotate(opts?: {
    yawSpeed?: number;
    pitchSpeed?: number;
    fovSpeed?: number;
    yawAccel?: number;
    pitchAccel?: number;
    fovAccel?: number;
    targetPitch?: number | null;
    targetFov?: number | null;
  }): () => (params: Partial<ViewParameters>, elapsed: number) => Partial<ViewParameters> | null;
}

declare module 'marzipano' {
  export = Marzipano;
}
```

- [ ] **Step 3: Verify the declaration file is valid**

Run: `pnpm typecheck`
Expected: PASS (no errors; the module isn't imported anywhere yet).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml types/marzipano.d.ts
git commit -m "chore: add marzipano dependency and type declarations"
```

---

### Task 2: Multi-scene tour data model + yaw-offset mapping

**Files:**
- Modify: `lib/tour/types.ts` (rewrite)
- Create: `lib/tour/view-angle.ts`
- Test: `lib/tour/view-angle.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `TourView { yaw: number; pitch: number; fov?: number }`
  - `TourHotspot { id: string; label: string; description?: string; url?: string; targetSceneId?: string; yaw: number; pitch: number }`
  - `TourScene { id: string; title: string; equirectangularUrl: string; initialView?: TourView; hotspots: TourHotspot[] }`
  - `TourSettings { autoRotate: boolean; autoRotateSpeed: number; hotspotStyle: 'pin' | 'minimal'; startSceneId?: string }`
  - `TourConfig { id: string; title: string; scenes: TourScene[]; settings: TourSettings }`
  - `MARZIPANO_YAW_OFFSET = Math.PI / 2`
  - `DEFAULT_VIEW_FOV = Math.PI / 2`
  - `MAX_VIEW_FOV = (100 * Math.PI) / 180`
  - `toMarzipanoYaw(yaw: number): number`
  - `toMarzipanoView(yaw: number, pitch: number, fov?: number): { yaw: number; pitch: number; fov: number }`
  - `toMarzipanoHotspotPosition(yaw: number, pitch: number): { yaw: number; pitch: number }`

- [ ] **Step 1: Write the failing test**

Create `lib/tour/view-angle.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  MARZIPANO_YAW_OFFSET,
  DEFAULT_VIEW_FOV,
  toMarzipanoYaw,
  toMarzipanoView,
  toMarzipanoHotspotPosition,
} from './view-angle';

describe('toMarzipanoYaw', () => {
  it('adds the documented offset to the stored yaw', () => {
    expect(toMarzipanoYaw(0)).toBe(MARZIPANO_YAW_OFFSET);
    expect(toMarzipanoYaw(Math.PI / 2)).toBe(Math.PI / 2 + MARZIPANO_YAW_OFFSET);
  });
});

describe('toMarzipanoView', () => {
  it('maps yaw and passes pitch through', () => {
    expect(toMarzipanoView(0.5, -0.2)).toEqual({
      yaw: 0.5 + MARZIPANO_YAW_OFFSET,
      pitch: -0.2,
      fov: DEFAULT_VIEW_FOV,
    });
  });

  it('uses the provided fov when present', () => {
    expect(toMarzipanoView(0, 0, 1.2).fov).toBe(1.2);
  });
});

describe('toMarzipanoHotspotPosition', () => {
  it('maps yaw and keeps pitch', () => {
    expect(toMarzipanoHotspotPosition(1, 0.3)).toEqual({
      yaw: 1 + MARZIPANO_YAW_OFFSET,
      pitch: 0.3,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/tour/view-angle.test.ts`
Expected: FAIL — module `./view-angle` not found / import error.

- [ ] **Step 3: Rewrite `lib/tour/types.ts`**

```ts
export interface TourView {
  yaw: number;
  pitch: number;
  fov?: number;
}

export interface TourHotspot {
  id: string;
  label: string;
  description?: string;
  url?: string;
  targetSceneId?: string;
  yaw: number;
  pitch: number;
}

export interface TourScene {
  id: string;
  title: string;
  equirectangularUrl: string;
  initialView?: TourView;
  hotspots: TourHotspot[];
}

export interface TourSettings {
  autoRotate: boolean;
  autoRotateSpeed: number;
  hotspotStyle: 'pin' | 'minimal';
  startSceneId?: string;
}

export interface TourConfig {
  id: string;
  title: string;
  scenes: TourScene[];
  settings: TourSettings;
}
```

- [ ] **Step 4: Create `lib/tour/view-angle.ts`**

```ts
export const MARZIPANO_YAW_OFFSET = Math.PI / 2;
export const DEFAULT_VIEW_FOV = Math.PI / 2;
export const MAX_VIEW_FOV = (100 * Math.PI) / 180;

export function toMarzipanoYaw(yaw: number): number {
  return yaw + MARZIPANO_YAW_OFFSET;
}

export function toMarzipanoView(
  yaw: number,
  pitch: number,
  fov?: number
): { yaw: number; pitch: number; fov: number } {
  return { yaw: toMarzipanoYaw(yaw), pitch, fov: fov ?? DEFAULT_VIEW_FOV };
}

export function toMarzipanoHotspotPosition(
  yaw: number,
  pitch: number
): { yaw: number; pitch: number } {
  return { yaw: toMarzipanoYaw(yaw), pitch };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test lib/tour/view-angle.test.ts`
Expected: PASS (3 describe blocks).

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/tour/types.ts lib/tour/view-angle.ts lib/tour/view-angle.test.ts
git commit -m "feat: add multi-scene tour data model and view-angle mapping"
```

---

### Task 3: Map multi-scene tour config from asset metadata

**Files:**
- Modify: `lib/tour/map-tour-config.ts` (rewrite)
- Test: `lib/tour/map-tour-config.test.ts` (rewrite)

**Interfaces:**
- Consumes: `TourConfig`, `TourScene`, `TourHotspot`, `TourSettings`, `TourView` from `./types` (Task 2).
- Produces:
  - `MapTourConfigInputAsset { id: string; storage_path: string; file_type: string; file_name?: string; metadata?: unknown }`
  - `MapTourConfigInput { project: { id: string; name: string; settings: unknown }; assets: MapTourConfigInputAsset[]; publicUrlFor: (storagePath: string) => string }`
  - `mapTourConfig(input: MapTourConfigInput): TourConfig | null`
  - Behavior: image assets (`image/jpeg`, `image/png`) ordered by `metadata.order ?? input order` (input order is created_at, then id, from the route); `null` when no image assets; per-scene `title` from `metadata.title ?? file_name` (extension stripped); per-scene `initialView` from `metadata.initialView` (numeric yaw/pitch, optional fov); **first scene only** falls back to legacy `settings.initialYaw` (default `-Math.PI / 2`) / `settings.initialPitch` (default `0`) when no per-scene view; per-scene `hotspots` from `metadata.hotspots` (normalized, http(s) `url` filter, `targetSceneId` kept only when it matches a scene id); when **every** scene has zero hotspots, legacy flat `settings.hotspots` (same normalization) is applied to the first scene; `settings` = `autoRotate` (bool, default false), `autoRotateSpeed` (number, default 0.5), `hotspotStyle` (`'minimal'` → `'minimal'`, else `'pin'`), `startSceneId` (kept only when it matches a scene id).

- [ ] **Step 1: Write the failing tests**

Replace the contents of `lib/tour/map-tour-config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mapTourConfig, type MapTourConfigInputAsset } from './map-tour-config';

const urlFor = (path: string) => `https://cdn.example/${path}`;

const asset = (overrides: Partial<MapTourConfigInputAsset> = {}): MapTourConfigInputAsset => ({
  id: 'a1',
  storage_path: 'p1/a1.jpg',
  file_type: 'image/jpeg',
  file_name: 'a1.jpg',
  ...overrides,
});

const project = {
  id: 'p1',
  name: 'Sunset Villa',
  settings: {},
};

describe('mapTourConfig', () => {
  it('returns null when there are no image assets', () => {
    expect(
      mapTourConfig({
        project,
        assets: [asset({ file_type: 'model/gltf-binary', storage_path: 'p1/s.glb' })],
        publicUrlFor: urlFor,
      })
    ).toBeNull();
    expect(mapTourConfig({ project, assets: [], publicUrlFor: urlFor })).toBeNull();
  });

  it('maps a single image asset to one scene using file_name for the title', () => {
    const config = mapTourConfig({ project, assets: [asset()], publicUrlFor: urlFor });
    expect(config).not.toBeNull();
    expect(config!.title).toBe('Sunset Villa');
    expect(config!.scenes).toHaveLength(1);
    expect(config!.scenes[0]).toMatchObject({
      id: 'a1',
      title: 'a1',
      equirectangularUrl: 'https://cdn.example/p1/a1.jpg',
      hotspots: [],
    });
  });

  it('prefers metadata.title over file_name and strips the extension from file_name', () => {
    const config = mapTourConfig({
      project,
      assets: [
        asset({
          file_name: 'living-room.jpg',
          metadata: { title: 'Open Living Room' },
        }),
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].title).toBe('Open Living Room');

    const fallback = mapTourConfig({
      project,
      assets: [asset({ file_name: 'living-room.jpg' })],
      publicUrlFor: urlFor,
    });
    expect(fallback!.scenes[0].title).toBe('living-room');
  });

  it('orders scenes by metadata.order and falls back to the input (created_at/id) order', () => {
    const config = mapTourConfig({
      project,
      assets: [
        asset({ id: 'kitchen', metadata: { order: 2 } }),
        asset({ id: 'bedroom', metadata: { order: 0 } }),
        asset({ id: 'garden' }),
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes.map((s) => s.id)).toEqual(['bedroom', 'kitchen', 'garden']);
  });

  it('reads initialView from asset metadata', () => {
    const config = mapTourConfig({
      project,
      assets: [asset({ metadata: { initialView: { yaw: 1.2, pitch: -0.4, fov: 0.8 } } })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].initialView).toEqual({ yaw: 1.2, pitch: -0.4, fov: 0.8 });
  });

  it('drops a malformed initialView (missing numeric yaw/pitch)', () => {
    const config = mapTourConfig({
      project,
      assets: [asset({ metadata: { initialView: { yaw: 'x' } } })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].initialView).toBeUndefined();
  });

  it('applies legacy initialYaw/initialPitch to the first scene only', () => {
    const config = mapTourConfig({
      project,
      assets: [asset({ id: 'a' }), asset({ id: 'b' })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].initialView).toEqual({
      yaw: -Math.PI / 2,
      pitch: 0,
    });
    expect(config!.scenes[1].initialView).toBeUndefined();
  });

  it('lets per-scene initialView win over the legacy fallback on the first scene', () => {
    const config = mapTourConfig({
      project,
      assets: [asset({ metadata: { initialView: { yaw: 0, pitch: 0.1 } } })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].initialView).toEqual({ yaw: 0, pitch: 0.1 });
  });

  it('normalizes metadata hotspots, filters unsafe urls, and validates targetSceneId', () => {
    const config = mapTourConfig({
      project,
      assets: [
        asset({
          id: 'a',
          metadata: {
            hotspots: [
              { id: 'h1', label: 'Kitchen', yaw: 0, pitch: 0, description: 'Remodel' },
              { id: 'bad' },
              { id: 'h2', label: 'Garden', yaw: 1, pitch: 0.2, url: 'javascript:alert(1)', targetSceneId: 'b' },
              { id: 'h3', label: 'Hall', yaw: 2, pitch: 0.1, url: 'https://ok.example', targetSceneId: 'nope' },
            ],
          },
        }),
        asset({ id: 'b' }),
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].hotspots).toHaveLength(3);
    expect(config!.scenes[0].hotspots[0]).toEqual({
      id: 'h1',
      label: 'Kitchen',
      yaw: 0,
      pitch: 0,
      description: 'Remodel',
    });
    expect(config!.scenes[0].hotspots[1].url).toBeUndefined();
    expect(config!.scenes[0].hotspots[1].targetSceneId).toBe('b');
    expect(config!.scenes[0].hotspots[2].url).toBe('https://ok.example');
    expect(config!.scenes[0].hotspots[2].targetSceneId).toBeUndefined();
  });

  it('applies legacy flat settings.hotspots to the first scene when no scene defines hotspots', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: {
          hotspots: [
            { id: 'legacy1', label: 'Pool', yaw: 0.5, pitch: -0.1, url: 'https://pool.example' },
          ],
        },
      },
      assets: [asset({ id: 'a' }), asset({ id: 'b' })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].hotspots).toHaveLength(1);
    expect(config!.scenes[0].hotspots[0].id).toBe('legacy1');
    expect(config!.scenes[1].hotspots).toHaveLength(0);
  });

  it('does not apply legacy flat hotspots when a scene already has hotspots', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: { hotspots: [{ id: 'legacy1', label: 'Pool', yaw: 0, pitch: 0 }] },
      },
      assets: [asset({ metadata: { hotspots: [{ id: 'own', label: 'Own', yaw: 0, pitch: 0 }] } })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].hotspots.map((h) => h.id)).toEqual(['own']);
  });

  it('applies settings defaults', () => {
    const config = mapTourConfig({ project, assets: [asset()], publicUrlFor: urlFor });
    expect(config!.settings).toEqual({
      autoRotate: false,
      autoRotateSpeed: 0.5,
      hotspotStyle: 'pin',
      startSceneId: undefined,
    });
  });

  it('parses settings from a JSON string and honors hotspotStyle/startSceneId', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: JSON.stringify({
          autoRotate: true,
          autoRotateSpeed: 1.2,
          hotspotStyle: 'minimal',
          startSceneId: 'b',
        }),
      },
      assets: [asset({ id: 'a' }), asset({ id: 'b' })],
      publicUrlFor: urlFor,
    });
    expect(config!.settings.autoRotate).toBe(true);
    expect(config!.settings.autoRotateSpeed).toBe(1.2);
    expect(config!.settings.hotspotStyle).toBe('minimal');
    expect(config!.settings.startSceneId).toBe('b');
  });

  it('drops startSceneId that does not match any scene', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: { startSceneId: 'missing' },
      },
      assets: [asset({ id: 'a' })],
      publicUrlFor: urlFor,
    });
    expect(config!.settings.startSceneId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test lib/tour/map-tour-config.test.ts`
Expected: FAIL — type errors and/or assertions fail against the old single-scene mapper.

- [ ] **Step 3: Rewrite `lib/tour/map-tour-config.ts`**

```ts
import type { TourConfig, TourHotspot, TourScene, TourSettings, TourView } from './types';

export interface MapTourConfigInputAsset {
  id: string;
  storage_path: string;
  file_type: string;
  file_name?: string;
  metadata?: unknown;
}

export interface MapTourConfigInput {
  project: {
    id: string;
    name: string;
    settings: unknown;
  };
  assets: MapTourConfigInputAsset[];
  publicUrlFor: (storagePath: string) => string;
}

const IMAGE_FILE_TYPES = new Set(['image/jpeg', 'image/png']);
const LEGACY_DEFAULT_YAW = -Math.PI / 2;
const LEGACY_DEFAULT_PITCH = 0;

function parseSettings(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  return {};
}

function isSafeUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

function metadataOrder(asset: MapTourConfigInputAsset): number | null {
  const meta = parseSettings(asset.metadata);
  return typeof meta.order === 'number' && Number.isFinite(meta.order) ? meta.order : null;
}

function normalizeInitialView(raw: unknown): TourView | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const view = raw as Record<string, unknown>;
  if (typeof view.yaw !== 'number' || typeof view.pitch !== 'number') return undefined;
  return {
    yaw: view.yaw,
    pitch: view.pitch,
    ...(typeof view.fov === 'number' ? { fov: view.fov } : {}),
  };
}

function normalizeHotspots(raw: unknown, sceneIds: Set<string>): TourHotspot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (h): h is Record<string, unknown> =>
        !!h &&
        typeof h === 'object' &&
        typeof (h as Record<string, unknown>).id === 'string' &&
        typeof (h as Record<string, unknown>).label === 'string' &&
        typeof (h as Record<string, unknown>).yaw === 'number' &&
        typeof (h as Record<string, unknown>).pitch === 'number'
    )
    .map((h) => ({
      id: h.id as string,
      label: h.label as string,
      description: typeof h.description === 'string' ? h.description : undefined,
      url: isSafeUrl(h.url) ? h.url : undefined,
      targetSceneId:
        typeof h.targetSceneId === 'string' && sceneIds.has(h.targetSceneId)
          ? h.targetSceneId
          : undefined,
      yaw: h.yaw as number,
      pitch: h.pitch as number,
    }));
}

function normalizeSettings(
  settings: Record<string, unknown>,
  sceneIds: Set<string>
): TourSettings {
  return {
    autoRotate: typeof settings.autoRotate === 'boolean' ? settings.autoRotate : false,
    autoRotateSpeed: typeof settings.autoRotateSpeed === 'number' ? settings.autoRotateSpeed : 0.5,
    hotspotStyle: settings.hotspotStyle === 'minimal' ? 'minimal' : 'pin',
    startSceneId:
      typeof settings.startSceneId === 'string' && sceneIds.has(settings.startSceneId)
        ? settings.startSceneId
        : undefined,
  };
}

export function mapTourConfig(input: MapTourConfigInput): TourConfig | null {
  const imageAssets = input.assets
    .filter((a) => IMAGE_FILE_TYPES.has(a.file_type))
    .slice()
    .sort((a, b) => {
      const aOrder = metadataOrder(a);
      const bOrder = metadataOrder(b);
      if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
      if (aOrder !== null) return -1;
      if (bOrder !== null) return 1;
      return 0;
    });

  if (imageAssets.length === 0) return null;

  const settings = parseSettings(input.project.settings);
  const sceneIds = new Set(imageAssets.map((a) => a.id));

  const scenes: TourScene[] = imageAssets.map((asset, index) => {
    const meta = parseSettings(asset.metadata);
    const title =
      typeof meta.title === 'string' && meta.title.trim()
        ? meta.title.trim()
        : stripExtension(asset.file_name ?? asset.storage_path.split('/').pop() ?? '');

    let initialView = normalizeInitialView(meta.initialView);
    if (index === 0 && !initialView) {
      initialView = {
        yaw: typeof settings.initialYaw === 'number' ? settings.initialYaw : LEGACY_DEFAULT_YAW,
        pitch:
          typeof settings.initialPitch === 'number' ? settings.initialPitch : LEGACY_DEFAULT_PITCH,
      };
    }

    return {
      id: asset.id,
      title,
      equirectangularUrl: input.publicUrlFor(asset.storage_path),
      ...(initialView ? { initialView } : {}),
      hotspots: normalizeHotspots(meta.hotspots, sceneIds),
    };
  });

  if (scenes.every((scene) => scene.hotspots.length === 0)) {
    const legacyHotspots = normalizeHotspots(settings.hotspots, sceneIds);
    if (legacyHotspots.length > 0) {
      scenes[0] = { ...scenes[0], hotspots: legacyHotspots };
    }
  }

  return {
    id: input.project.id,
    title: input.project.name,
    scenes,
    settings: normalizeSettings(settings, sceneIds),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test lib/tour/map-tour-config.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/tour/map-tour-config.ts lib/tour/map-tour-config.test.ts
git commit -m "feat: map multi-scene tour config from asset metadata"
```

---

### Task 4: Expose scene metadata in the tour API route

**Files:**
- Modify: `app/api/tours/[id]/route.ts:27-31`

**Interfaces:**
- Consumes: `mapTourConfig` + `MapTourConfigInput` from Task 3.
- Produces: `GET /api/tours/[id]` now selects `file_name` and `metadata` for assets and returns the multi-scene `TourConfig`. Response envelope `{ success, data }` / `{ success, error }` unchanged.

- [ ] **Step 1: Add `file_name`/`metadata` to the asset select and a stable id tiebreak**

Replace the assets query in `app/api/tours/[id]/route.ts`:

```ts
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('id, storage_path, file_type, file_name, metadata')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/api/tours/[id]/route.ts"
git commit -m "feat: expose scene metadata in tour API route"
```

---

### Task 5: Tour scene navigation helpers

**Files:**
- Create: `components/marzipano/navigation.ts`
- Test: `components/marzipano/navigation.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `nextIndex(current: number, length: number): number` — `(current + 1) % length`, `0` when `length <= 0`.
  - `prevIndex(current: number, length: number): number` — `(current - 1 + length) % length`, `0` when `length <= 0`.
  - `resolveStartScene(scenes: Array<{ id: string }>, startSceneId?: string): number` — index of `startSceneId`, else `0`; `0` when the list is empty.

- [ ] **Step 1: Write the failing test**

Create `components/marzipano/navigation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { nextIndex, prevIndex, resolveStartScene } from './navigation';

describe('nextIndex', () => {
  it('advances within range', () => {
    expect(nextIndex(0, 3)).toBe(1);
  });

  it('wraps around at the end', () => {
    expect(nextIndex(2, 3)).toBe(0);
  });

  it('is safe for a single scene', () => {
    expect(nextIndex(0, 1)).toBe(0);
  });

  it('handles an empty list', () => {
    expect(nextIndex(0, 0)).toBe(0);
  });
});

describe('prevIndex', () => {
  it('steps back within range', () => {
    expect(prevIndex(2, 3)).toBe(1);
  });

  it('wraps around at the start', () => {
    expect(prevIndex(0, 3)).toBe(2);
  });

  it('is safe for a single scene', () => {
    expect(prevIndex(0, 1)).toBe(0);
  });

  it('handles an empty list', () => {
    expect(prevIndex(0, 0)).toBe(0);
  });
});

describe('resolveStartScene', () => {
  const scenes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('defaults to the first scene', () => {
    expect(resolveStartScene(scenes)).toBe(0);
  });

  it('resolves a matching startSceneId', () => {
    expect(resolveStartScene(scenes, 'b')).toBe(1);
  });

  it('falls back to the first scene for an unknown id', () => {
    expect(resolveStartScene(scenes, 'nope')).toBe(0);
  });

  it('is safe for an empty scene list', () => {
    expect(resolveStartScene([], 'a')).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/marzipano/navigation.test.ts`
Expected: FAIL — module `./navigation` not found.

- [ ] **Step 3: Create `components/marzipano/navigation.ts`**

```ts
export function nextIndex(current: number, length: number): number {
  if (length <= 0) return 0;
  return (current + 1) % length;
}

export function prevIndex(current: number, length: number): number {
  if (length <= 0) return 0;
  return (current - 1 + length) % length;
}

export function resolveStartScene(
  scenes: Array<{ id: string }>,
  startSceneId?: string
): number {
  if (scenes.length === 0) return 0;
  if (!startSceneId) return 0;
  const index = scenes.findIndex((scene) => scene.id === startSceneId);
  return index >= 0 ? index : 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/marzipano/navigation.test.ts`
Expected: PASS (3 describe blocks).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/marzipano/navigation.ts components/marzipano/navigation.test.ts
git commit -m "feat: add tour scene navigation helpers"
```

---

### Task 6: `useMarzipanoTour` hook (imperative viewer seam)

**Files:**
- Create: `components/marzipano/useMarzipanoTour.ts`
- Test: (none — gate is `pnpm typecheck`; DOM/WebGL logic is verified by build + the Task 9 smoke test)

**Interfaces:**
- Consumes:
  - `TourConfig`, `TourScene`, `TourHotspot` from `@/lib/tour/types` (Task 2)
  - `nextIndex`, `prevIndex`, `resolveStartScene` from `./navigation` (Task 5)
  - `MARZIPANO_YAW_OFFSET`-based `toMarzipanoView`, `toMarzipanoHotspotPosition`, `DEFAULT_VIEW_FOV`, `MAX_VIEW_FOV` from `@/lib/tour/view-angle` (Task 2)
  - `import Marzipano from 'marzipano'` (typed by Task 1)
- Produces:
  - `UseMarzipanoTourResult { containerRef: React.RefObject<HTMLDivElement | null>; isLoading: boolean; error: string | null; currentSceneIndex: number; isPlaying: boolean; goToScene: (sceneId: string) => void; goNext: () => void; goPrev: () => void; toggleAutorotate: () => void }`
  - `useMarzipanoTour(config: TourConfig): UseMarzipanoTourResult`
  - Behavior: creates the `Marzipano.Viewer` on the container once; preloads each image width via `Image`, builds one scene per `TourScene` (`ImageUrlSource.fromString(url)` + `EquirectGeometry([{ width }])` + `RectilinearView` with `limit.traditional(width, MAX_VIEW_FOV)` + `toMarzipanoView`), renders hotspot marker DOM via `scene.hotspotContainer().createHotspot`; switches to the resolved start scene (`resolveStartScene`) and clears the loading overlay on its first Layer `renderComplete`; shows an error on image-load failure or TextureStore `textureError`, with a 15s loading timeout; `toggleAutorotate` toggles `viewer.setIdleMovement(0, Marzipano.autorotate({ yawSpeed }))` / `viewer.setIdleMovement(Infinity)`; auto-rotate starts paused (unless `settings.autoRotate` and no `prefers-reduced-motion`); `viewer.destroy()` on unmount.

- [ ] **Step 1: Create `components/marzipano/useMarzipanoTour.ts`**

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Marzipano from 'marzipano';
import { nextIndex, prevIndex, resolveStartScene } from './navigation';
import {
  DEFAULT_VIEW_FOV,
  MAX_VIEW_FOV,
  toMarzipanoHotspotPosition,
  toMarzipanoView,
} from '@/lib/tour/view-angle';
import type { TourConfig, TourHotspot, TourScene } from '@/lib/tour/types';

const LOAD_TIMEOUT_MS = 15000;
const SWITCH_DURATION_MS = 800;

export interface UseMarzipanoTourResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  error: string | null;
  currentSceneIndex: number;
  isPlaying: boolean;
  goToScene: (sceneId: string) => void;
  goNext: () => void;
  goPrev: () => void;
  toggleAutorotate: () => void;
}

function loadImageWidth(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth || img.width);
    img.onerror = () => reject(new Error('Failed to load panorama image'));
    img.src = url;
  });
}

export function useMarzipanoTour(config: TourConfig): UseMarzipanoTourResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);
  const sceneMapRef = useRef<Map<string, Marzipano.Scene>>(new Map());
  const switchSceneRef = useRef<(sceneId: string) => void>(() => {});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(() =>
    resolveStartScene(config.scenes, config.settings.startSceneId)
  );

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [isPlaying, setIsPlaying] = useState(
    () => config.settings.autoRotate && !prefersReducedMotion
  );

  const switchToScene = useCallback(
    (sceneId: string) => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      const scene = sceneMapRef.current.get(sceneId);
      if (!scene) return;
      const index = config.scenes.findIndex((s) => s.id === sceneId);
      if (index >= 0) setCurrentSceneIndex(index);
      scene.switchTo({ transitionDuration: SWITCH_DURATION_MS });
    },
    [config.scenes]
  );

  useEffect(() => {
    switchSceneRef.current = switchToScene;
  }, [switchToScene]);

  const goNext = useCallback(() => {
    const index = nextIndex(currentSceneIndex, config.scenes.length);
    const scene = config.scenes[index];
    if (scene) switchSceneRef.current(scene.id);
  }, [currentSceneIndex, config.scenes]);

  const goPrev = useCallback(() => {
    const index = prevIndex(currentSceneIndex, config.scenes.length);
    const scene = config.scenes[index];
    if (scene) switchSceneRef.current(scene.id);
  }, [currentSceneIndex, config.scenes]);

  const toggleAutorotate = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      const viewer = viewerRef.current;
      if (viewer) {
        if (next) {
          viewer.setIdleMovement(
            0,
            Marzipano.autorotate({ yawSpeed: config.settings.autoRotateSpeed })
          );
        } else {
          viewer.setIdleMovement(Infinity, null);
        }
      }
      return next;
    });
  }, [config.settings.autoRotateSpeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const timers: number[] = [];
    const sceneMap = new Map<string, Marzipano.Scene>();
    sceneMapRef.current = sceneMap;

    const handleLoadError = () => {
      if (!cancelled) setError('Failed to load the panorama. Please try again.');
    };

    let viewer: Marzipano.Viewer;
    try {
      viewer = new Marzipano.Viewer(container, { controls: { mouseViewMode: 'drag' } });
    } catch {
      setError('Your browser does not support WebGL, which is required for the tour.');
      return;
    }
    viewerRef.current = viewer;

    timers.push(window.setTimeout(() => setIsLoading(false), LOAD_TIMEOUT_MS));

    const startIndex = resolveStartScene(config.scenes, config.settings.startSceneId);
    const startSceneId = config.scenes[startIndex]?.id;

    const createHotspotElement = (hotspot: TourHotspot): HTMLElement => {
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', hotspot.label);
      el.style.position = 'absolute';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = 'none';
      el.style.padding = '0';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.5)';
      if (config.settings.hotspotStyle === 'minimal') {
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.background = '#06b6d4';
      } else {
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.background = '#0d9488';
        el.style.border = '3px solid rgba(255, 255, 255, 0.9)';
      }
      el.addEventListener('click', () => {
        if (hotspot.targetSceneId) {
          switchSceneRef.current(hotspot.targetSceneId);
        } else if (hotspot.url) {
          window.open(hotspot.url, '_blank', 'noopener,noreferrer');
        }
      });
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          el.click();
        }
      });
      return el;
    };

    const createHotspots = (scene: Marzipano.Scene, hotspots: TourHotspot[]) => {
      const hotspotContainer = scene.hotspotContainer();
      for (const hotspot of hotspots) {
        const position = toMarzipanoHotspotPosition(hotspot.yaw, hotspot.pitch);
        hotspotContainer.createHotspot(createHotspotElement(hotspot), position);
      }
    };

    const createSceneFor = async (tourScene: TourScene) => {
      const isStart = tourScene.id === startSceneId;

      let width: number;
      try {
        width = await loadImageWidth(tourScene.equirectangularUrl);
      } catch {
        handleLoadError();
        return;
      }
      if (cancelled) return;

      const source = Marzipano.ImageUrlSource.fromString(tourScene.equirectangularUrl);
      const geometry = new Marzipano.EquirectGeometry([{ width }]);
      const initialView = toMarzipanoView(
        tourScene.initialView?.yaw ?? 0,
        tourScene.initialView?.pitch ?? 0,
        tourScene.initialView?.fov
      );
      const limiter = Marzipano.RectilinearView.limit.traditional(width, MAX_VIEW_FOV);
      const view = new Marzipano.RectilinearView(initialView, limiter);
      const scene = viewer.createScene({ source, geometry, view, pinFirstLevel: true });

      sceneMap.set(tourScene.id, scene);

      const layer = scene.listLayers()[0];
      layer?.textureStore().addEventListener('textureError', handleLoadError);
      if (isStart) {
        layer?.addEventListener('renderComplete', () => {
          if (!cancelled) setIsLoading(false);
        });
        scene.switchTo({ transitionDuration: 0 });
      }

      createHotspots(scene, tourScene.hotspots);
    };

    config.scenes.forEach((tourScene) => {
      void createSceneFor(tourScene);
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      viewer.destroy();
      viewerRef.current = null;
      sceneMapRef.current = new Map();
    };
  }, [config]);

  return {
    containerRef,
    isLoading,
    error,
    currentSceneIndex,
    isPlaying,
    goToScene: switchToScene,
    goNext,
    goPrev,
    toggleAutorotate,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/marzipano/useMarzipanoTour.ts
git commit -m "feat: add Marzipano tour viewer hook"
```

---

### Task 7: `MarzipanoTourViewer` component

**Files:**
- Create: `components/marzipano/MarzipanoTourViewer.tsx`
- Test: (none — gate is `pnpm typecheck` + `pnpm build`; rendered behaviour verified in Task 9)

**Interfaces:**
- Consumes: `useMarzipanoTour` from `./useMarzipanoTour` (Task 6), `TourConfig` from `@/lib/tour/types`, `lucide-react` icons.
- Produces: `MarzipanoTourViewer({ config: TourConfig; className?: string })` — the container div (ref from the hook) that hosts the Marzipano stage, loading overlay (`role="status"`), error surface, idle-fading bottom-center control bar (Play/Pause `aria-pressed`, prev/next arrows + scene label hidden for ≤1 scene, fullscreen), keyboard arrow navigation on the container, fullscreen promise rejection handling.

- [ ] **Step 1: Create `components/marzipano/MarzipanoTourViewer.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
} from 'lucide-react';
import { useMarzipanoTour } from './useMarzipanoTour';
import type { TourConfig } from '@/lib/tour/types';

interface MarzipanoTourViewerProps {
  config: TourConfig;
  className?: string;
}

export function MarzipanoTourViewer({ config, className = '' }: MarzipanoTourViewerProps) {
  const {
    containerRef,
    isLoading,
    error,
    currentSceneIndex,
    isPlaying,
    goNext,
    goPrev,
    toggleAutorotate,
  } = useMarzipanoTour(config);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<number>(0);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const show = () => {
      setShowControls(true);
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
    };
    hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
    window.addEventListener('pointermove', show);
    window.addEventListener('keydown', show);
    return () => {
      window.clearTimeout(hideTimerRef.current);
      window.removeEventListener('pointermove', show);
      window.removeEventListener('keydown', show);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => setIsFullscreen(!!document.fullscreenElement));
    } else {
      document.exitFullscreen().catch(() => setIsFullscreen(!!document.fullscreenElement));
    }
  }, [containerRef]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (config.scenes.length <= 1) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
    },
    [config.scenes.length, goNext, goPrev]
  );

  const hasMultipleScenes = config.scenes.length > 1;
  const currentScene = config.scenes[currentSceneIndex];

  return (
    <div
      ref={containerRef}
      className={`viztr-marzipano-viewer ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`${config.title} — virtual tour`}
    >
      {isLoading && (
        <div className="viztr-marzipano-loading" role="status" aria-label="Loading tour">
          <div className="viztr-spinner" />
        </div>
      )}

      {error && (
        <div className="viztr-marzipano-error" role="status">
          Couldn&apos;t load this tour. {error}
        </div>
      )}

      {showControls && !error && (
        <div className="viztr-marzipano-controls">
          <button
            type="button"
            className="viztr-marzipano-btn"
            onClick={toggleAutorotate}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'Pause auto-rotate' : 'Play auto-rotate'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {hasMultipleScenes && (
            <div className="viztr-marzipano-nav">
              <button
                type="button"
                className="viztr-marzipano-btn"
                onClick={goPrev}
                aria-label="Previous scene"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="viztr-marzipano-scene-label">
                {currentScene?.title ?? ''}
              </span>
              <button
                type="button"
                className="viztr-marzipano-btn"
                onClick={goNext}
                aria-label="Next scene"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="viztr-marzipano-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      )}

      <style jsx>{`
        .viztr-marzipano-viewer {
          position: relative;
          width: 100%;
          height: 100%;
          background: #080a0f;
          border-radius: 12px;
          overflow: hidden;
          outline: none;
        }
        .viztr-marzipano-viewer :global(canvas) {
          width: 100%;
          height: 100%;
          display: block;
          touch-action: none;
        }
        .viztr-marzipano-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080a0f;
          z-index: 10;
          pointer-events: none;
        }
        .viztr-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(13, 148, 136, 0.25);
          border-top-color: #0d9488;
          animation: viztr-spin 0.8s linear infinite;
        }
        @keyframes viztr-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .viztr-marzipano-error {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          padding: 12px 16px;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(220, 38, 38, 0.4);
          color: #fca5a5;
          font-size: 14px;
          border-radius: 8px;
          z-index: 20;
        }
        .viztr-marzipano-controls {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(13, 17, 23, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          backdrop-filter: blur(8px);
          z-index: 30;
        }
        .viztr-marzipano-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .viztr-marzipano-btn:hover {
          background: rgba(13, 148, 136, 0.4);
          color: #fff;
        }
        .viztr-marzipano-btn:focus-visible {
          outline: 2px solid #06b6d4;
          outline-offset: 2px;
        }
        .viztr-marzipano-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .viztr-marzipano-scene-label {
          min-width: 120px;
          text-align: center;
          color: #cbd5e1;
          font-size: 13px;
          font-family: Inter, system-ui, sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (prefers-reduced-motion: reduce) {
          .viztr-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

MarzipanoTourViewer.displayName = 'MarzipanoTourViewer';
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Build to confirm the Marzipano import is client-only**

Run: `pnpm build`
Expected: SUCCESS — no server-bundle errors referencing `marzipano`, no webpack bundling failures for the CommonJS module.

- [ ] **Step 4: Commit**

```bash
git add components/marzipano/MarzipanoTourViewer.tsx
git commit -m "feat: add Marzipano tour viewer component"
```

---

### Task 8: Switch the tour page to Marzipano and remove the Babylon viewer

**Files:**
- Modify: `app/(public)/tour/[id]/TourPageClient.tsx`
- Delete: `components/viewer/VirtualTourViewer.tsx`, `components/viewer/ViewerControls.tsx`, `components/viewer/HotspotMarker.tsx`, `components/viewer/useVirtualTourScene.ts`
- Delete: `lib/tour/hotspot-position.ts`, `lib/tour/hotspot-position.test.ts`
- Test: (none — gate is `pnpm typecheck` + `pnpm build`; nothing else imports the deleted files)

**Interfaces:**
- Consumes: `MarzipanoTourViewer` (Task 7), `TourConfig`.
- Produces: `TourPageClient({ config })` renders `MarzipanoTourViewer` via `dynamic(..., { ssr: false })`; `components/viewer/*` and `hotspot-position.*` no longer exist.

- [ ] **Step 1: Rework `TourPageClient.tsx` to use the Marzipano viewer**

Replace the dynamic import block:

```tsx
const MarzipanoTourViewer = dynamic(
  () => import('@/components/marzipano/MarzipanoTourViewer').then((m) => m.MarzipanoTourViewer),
  { ssr: false }
);
```

And replace the render usage:

```tsx
          <MarzipanoTourViewer config={config} />
```

Keep the not-found branch, the `Suspense` fallback, and all existing styled-jsx CSS unchanged.

- [ ] **Step 2: Delete the Babylon tour viewer and the old hotspot math**

```bash
git rm components/viewer/VirtualTourViewer.tsx components/viewer/ViewerControls.tsx components/viewer/HotspotMarker.tsx components/viewer/useVirtualTourScene.ts
git rm lib/tour/hotspot-position.ts lib/tour/hotspot-position.test.ts
```

- [ ] **Step 3: Verify nothing still references the deleted modules**

Run: `rg "components/viewer|hotspot-position|hotspotPosition|VirtualTourViewer|useVirtualTourScene" --glob "!babylon_XR_World/**" --glob "*.ts" --glob "*.tsx"`
Expected: no matches (the only remaining hits are inside the excluded `babylon_XR_World/` folder).

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Build**

Run: `pnpm build`
Expected: SUCCESS.

- [ ] **Step 6: Commit**

```bash
git add "app/(public)/tour/[id]/TourPageClient.tsx"
git commit -m "refactor: use Marzipano viewer on tour page, remove Babylon viewer"
```

---

### Task 9: Final verification, smoke checklist, and spec status

**Files:**
- Modify: `docs/superpowers/specs/2026-08-09-virtual-tour-marzipano-viewer-design.md` (status note)
- Test: full suite + build + manual smoke

**Interfaces:**
- Consumes: everything from Tasks 1-8.
- Produces: a verified, committed viewer MVP.

- [ ] **Step 1: Run the full unit test suite**

Run: `pnpm test`
Expected: PASS (view-angle, navigation, map-tour-config, and all pre-existing tests).

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: SUCCESS. Confirm the output does not contain a `marzipano` chunk in the server build (Marzipano stays client-side).

- [ ] **Step 4: Manual smoke test (requires env)**

The live smoke test needs a configured `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (see `.env.example`). If env is unavailable, note the deferral and rely on Steps 1-3.

With env configured, run `pnpm dev` and check:
- [ ] A single-image tour renders an interactive 360° panorama (drag to look, scroll/pinch to zoom).
- [ ] A multi-scene tour shows the scene title; prev/next arrows cross-fade between scenes and wrap around.
- [ ] Link hotspots (`targetSceneId`) switch scenes; URL hotspots open in a new tab; markers match `hotspotStyle` (`pin` vs `minimal`).
- [ ] Single-scene tours hide the arrows.
- [ ] Play/Pause toggles continuous auto-rotate; the icon and `aria-pressed` update; auto-rotate starts off under `prefers-reduced-motion`.
- [ ] Fullscreen button enters/exits fullscreen; controls remain visible.
- [ ] Loading spinner shows then clears; a broken image URL surfaces the error state.
- [ ] Controls fade after ~3s idle and reappear on pointer/key.
- [ ] Arrow keys navigate scenes when the container is focused.
- [ ] Dark `#080a0f` theme and centered desktop layout match the current page; 404 state for unknown ids.
- [ ] **Yaw orientation check:** hotspot/view directions match the previous Babylon renderer's facing for the same stored angles. If rotation is off, change only the `MARZIPANO_YAW_OFFSET` constant in `lib/tour/view-angle.ts` (the mapper/viewer consumers stay untouched).

- [ ] **Step 5: Update the design spec status**

In `docs/superpowers/specs/2026-08-09-virtual-tour-marzipano-viewer-design.md`, change line 4 `**Status:** Approved for planning` to `**Status:** Implemented (viewer MVP) — see docs/superpowers/plans/2026-08-09-virtual-tour-marzipano-viewer.md`.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-08-09-virtual-tour-marzipano-viewer-design.md
git commit -m "docs: mark Marzipano viewer MVP implemented"
```

---

## Self-Review Notes

- **Spec coverage:** Data model (spec §2) → Task 2/3; mapper incl. legacy fallback + yaw offset (spec §2) → Task 3 + Task 2; API route (spec §3) → Task 4; navigation helpers (spec §3) → Task 5; hook + component (spec §3/§4) → Task 6/7; page rework + Babylon removal (spec §3) → Task 8; loading/error/idle-fade/fullscreen/accessibility (spec §4/§5) → Task 6/7; tests (spec §6) → Tasks 2/3/5 + Task 9.
- **API corrections vs. original spec draft:** the draft referenced `Source.fromImage`, `setAutorotateEnabled`, `dispose`, and Scene `complete`; the verified marzipano@0.10.2 API uses `ImageUrlSource.fromString` + `EquirectGeometry([{ width }])`, `setIdleMovement` + `autorotate`, `destroy`, and Layer `renderComplete` / TextureStore `textureError`. The design spec and this plan use the verified API.
- **Type consistency:** `TourView.fov` is optional end-to-end (types → mapper → hook); `toMarzipanoView` supplies `DEFAULT_VIEW_FOV` when absent; `resolveStartScene`/`nextIndex`/`prevIndex` signatures match across Task 5 and Task 6.
