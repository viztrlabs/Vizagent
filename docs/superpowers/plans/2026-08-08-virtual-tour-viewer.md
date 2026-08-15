# Virtual Tour Viewer (Babylon.js PhotoDome) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public-facing Virtual Tour viewer — `app/(public)/tour/[id]` — that renders a project's equirectangular panorama with Babylon.js `PhotoDome`, orbit controls, auto-rotate, hotspot markers, fullscreen, and WebXR VR entry.

**Architecture:** A server component page (`app/(public)/tour/[id]/page.tsx`) fetches tour config from a new `GET /api/tours/[id]` route backed by Supabase (`projects` + `assets` tables via `supabaseAdmin`), then hydrates a client-side Babylon scene. The viewer is split per the T-031 design spec into a scene-lifecycle hook (`useVirtualTourScene`), a hotspot marker component, a controls component, and a main `VirtualTourViewer`. Pure logic (config mapping, spherical math) is extracted into `lib/tour/` and unit-tested with vitest.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind, Supabase (`supabaseAdmin`), Babylon.js 9 (`@babylonjs/core`, `@babylonjs/gui`, `@babylonjs/loaders`), vitest.

## Global Constraints

- **Data layer is Supabase, not Prisma.** No `prisma/schema.prisma` exists in this repo. All reads go through `supabaseAdmin` from `@/lib/supabase/admin`.
- Tour data contract: `TourConfig` has a **single** `equirectangularUrl` (one panorama per tour), `hotspots: TourHotspot[]`, `settings: TourSettings` (exact shapes in Task 1).
- Asset rows: `assets` table columns `id`, `project_id`, `file_type`, `storage_path`, `created_at` (see `lib/types.ts` `Asset`). Equirect images are any asset with `file_type` in `['image/jpeg', 'image/png']`; the first (oldest) is the tour panorama. Public URL built via `supabaseAdmin.storage.from('assets').getPublicUrl(storage_path).data.publicUrl`.
- `project.settings` may be a JSON string OR an object (jsonb). Both must be handled in the mapper. Hotspots and tour settings live in `project.settings` (`autoRotate`, `autoRotateSpeed`, `initialYaw`, `initialPitch`, `hotspots[]`).
- API response envelope: `{ success: true, data: tourConfig }` (matches the tour-route convention in `babylon_XR_World/app/api/tours/[id]/route.ts`).
- Viewer is client-only. `VirtualTourViewer`, `useVirtualTourScene`, `HotspotMarker`, `ViewerControls` must be `'use client'` and dynamically imported with `ssr: false` where they touch the DOM (they never render on the server). The route and page are server components.
- New files under `lib/tour/` and `components/viewer/` ARE included in typecheck/build (`tsconfig.json` only excludes `babylon_XR_World`, `components/configurator`, `lib/xr`, `VizAgents(...)`). Babylon imports must never leak into server bundles.
- Camera: `ArcRotateCamera`, target `Vector3.Zero()`, radius fixed at 1, `alpha`/`beta` clamped, no zoom, `allowUpsideDown = true` (PhotoDome renders inside a sphere).
- WebXR: `scene.createDefaultXRExperienceAsync({ optionalFeatures: ["hit-test", "local-floor", "bounded-floor"] })` then `enterXRAsync("immersive-vr", "local-floor")`; graceful fallback when `navigator.xr` unsupported.
- Accessibility: ARIA labels on all controls, keyboard focusable buttons, `@media (prefers-reduced-motion: reduce)` disables transitions, hotkeys `ArrowLeft`/`ArrowRight` for yaw and `ArrowUp`/`ArrowDown` for pitch.
- Dark theme: background `#080a0f`, accent cyan `#0d9488`/`#06b6d4`, fonts Inter/system-ui, per the existing `app/globals.css` tokens.
- Tests use **vitest** (environment `node` — no DOM needed; only pure logic is tested). No other test framework changes.
- Commit after every task with a conventional `feat:`/`chore:` message. Never commit `node_modules`, `.next`, `.env*`.

---

### Task 1: Test infra + tour types + hotspot position math

**Files:**
- Modify: `package.json` (add `test` script + vitest devDependency)
- Create: `vitest.config.ts`
- Create: `lib/tour/types.ts`
- Create: `lib/tour/hotspot-position.ts`
- Create: `lib/tour/hotspot-position.test.ts`

**Interfaces:**
- Consumes: nothing (foundation task).
- Produces:
  - `lib/tour/types.ts` exports `TourHotspot { id; label; description?; url?; yaw; pitch }` (yaw/pitch in radians), `TourSettings { autoRotate; autoRotateSpeed; initialYaw; initialPitch }`, `TourConfig { id; title; equirectangularUrl; hotspots: TourHotspot[]; settings: TourSettings }`.
  - `lib/tour/hotspot-position.ts` exports `hotspotPosition(yaw: number, pitch: number, radius: number): { x: number; y: number; z: number }` — converts spherical (yaw, pitch) on a sphere of `radius` to 3D Cartesian, using the convention `x = sin(yaw)·cos(pitch)`, `y = sin(pitch)`, `z = cos(yaw)·cos(pitch)`.

- [ ] **Step 1: Install vitest and add the test script**

```bash
pnpm add -D vitest
```

Add to `package.json` `scripts`:
```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing test**

`lib/tour/hotspot-position.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { hotspotPosition } from './hotspot-position';

describe('hotspotPosition', () => {
  it('places a hotspot at the forward direction for yaw=0, pitch=0', () => {
    expect(hotspotPosition(0, 0, 1)).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('rotates +90° around Y for yaw=PI/2', () => {
    const p = hotspotPosition(Math.PI / 2, 0, 1);
    expect(p.x).toBeCloseTo(1, 5);
    expect(p.y).toBeCloseTo(0, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it('points up for pitch=PI/2', () => {
    const p = hotspotPosition(0, Math.PI / 2, 1);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBeCloseTo(1, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it('scales by radius', () => {
    const p = hotspotPosition(0, 0, 500);
    expect(p.z).toBe(500);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `hotspot-position` module not found.

- [ ] **Step 4: Write implementation**

`lib/tour/types.ts`:
```ts
export interface TourHotspot {
  id: string;
  label: string;
  description?: string;
  url?: string;
  yaw: number;
  pitch: number;
}

export interface TourSettings {
  autoRotate: boolean;
  autoRotateSpeed: number;
  initialYaw: number;
  initialPitch: number;
}

export interface TourConfig {
  id: string;
  title: string;
  equirectangularUrl: string;
  hotspots: TourHotspot[];
  settings: TourSettings;
}
```

`lib/tour/hotspot-position.ts`:
```ts
export function hotspotPosition(
  yaw: number,
  pitch: number,
  radius: number
): { x: number; y: number; z: number } {
  return {
    x: Math.sin(yaw) * Math.cos(pitch) * radius,
    y: Math.sin(pitch) * radius,
    z: Math.cos(yaw) * Math.cos(pitch) * radius,
  };
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts lib/tour/types.ts lib/tour/hotspot-position.ts lib/tour/hotspot-position.test.ts
git commit -m "feat: add tour types and hotspot position math with vitest infra"
```

---

### Task 2: Tour config mapper (pure function)

**Files:**
- Create: `lib/tour/map-tour-config.ts`
- Create: `lib/tour/map-tour-config.test.ts`

**Interfaces:**
- Consumes: `TourConfig`, `TourHotspot`, `TourSettings` from `lib/tour/types.ts`.
- Produces: `mapTourConfig(input: MapTourConfigInput): TourConfig | null` where
  ```ts
  interface MapTourConfigInput {
    project: {
      id: string;
      name: string;
      settings: unknown; // object OR JSON string
    };
    assets: Array<{ id: string; storage_path: string; file_type: string }>;
    publicUrlFor: (storagePath: string) => string;
  }
  ```
  Returns `null` when there are no image assets (`file_type` is `image/jpeg` or `image/png`). Otherwise returns `TourConfig` with:
  - `id` = `project.id`, `title` = `project.name`
  - `equirectangularUrl` = `publicUrlFor(firstImageAsset.storage_path)` (first image asset in array order)
  - `hotspots` = normalized `settings.hotspots` (filtered to valid entries; defaults `[]`)
  - `settings` = `{ autoRotate: settings.autoRotate ?? false, autoRotateSpeed: settings.autoRotateSpeed ?? 0.5, initialYaw: settings.initialYaw ?? -Math.PI / 2, initialPitch: settings.initialPitch ?? 0 }`

- [ ] **Step 1: Write the failing test**

`lib/tour/map-tour-config.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { mapTourConfig } from './map-tour-config';

const urlFor = (path: string) => `https://cdn.example/${path}`;

const imageAsset = { id: 'a1', storage_path: 'p1/a1.jpg', file_type: 'image/jpeg' };

describe('mapTourConfig', () => {
  const project = {
    id: 'p1',
    name: 'Sunset Villa',
    settings: {},
  };

  it('returns null when there are no image assets', () => {
    expect(
      mapTourConfig({
        project,
        assets: [{ id: 'a1', storage_path: 'p1/a1.glb', file_type: 'model/gltf-binary' }],
        publicUrlFor: urlFor,
      })
    ).toBeNull();
    expect(mapTourConfig({ project, assets: [], publicUrlFor: urlFor })).toBeNull();
  });

  it('maps the first image asset to the equirectangular URL', () => {
    const config = mapTourConfig({
      project,
      assets: [imageAsset],
      publicUrlFor: urlFor,
    });
    expect(config).not.toBeNull();
    expect(config!.title).toBe('Sunset Villa');
    expect(config!.equirectangularUrl).toBe('https://cdn.example/p1/a1.jpg');
    expect(config!.id).toBe('p1');
  });

  it('picks the first image asset even when GLB files come first', () => {
    const config = mapTourConfig({
      project,
      assets: [
        { id: 'a0', storage_path: 'p1/scene.glb', file_type: 'model/gltf-binary' },
        imageAsset,
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.equirectangularUrl).toBe('https://cdn.example/p1/a1.jpg');
  });

  it('applies default settings when settings are empty', () => {
    const config = mapTourConfig({
      project,
      assets: [imageAsset],
      publicUrlFor: urlFor,
    });
    expect(config!.settings).toEqual({
      autoRotate: false,
      autoRotateSpeed: 0.5,
      initialYaw: -Math.PI / 2,
      initialPitch: 0,
    });
  });

  it('parses settings stored as a JSON string', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: JSON.stringify({ autoRotate: true, autoRotateSpeed: 1.2, initialYaw: 0, initialPitch: 0.1 }),
      },
      assets: [imageAsset],
      publicUrlFor: urlFor,
    });
    expect(config!.settings.autoRotate).toBe(true);
    expect(config!.settings.autoRotateSpeed).toBe(1.2);
    expect(config!.settings.initialPitch).toBe(0.1);
  });

  it('normalizes hotspots and drops malformed entries', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: {
          hotspots: [
            { id: 'h1', label: 'Kitchen', yaw: 0, pitch: 0, description: 'Full remodel' },
            { id: 'bad' },
            { id: 'h2', label: 'Garden', yaw: 1.2, pitch: -0.3, url: 'https://example.com' },
          ],
        },
      },
      assets: [imageAsset],
      publicUrlFor: urlFor,
    });
    expect(config!.hotspots).toHaveLength(2);
    expect(config!.hotspots[0]).toEqual({
      id: 'h1',
      label: 'Kitchen',
      yaw: 0,
      pitch: 0,
      description: 'Full remodel',
    });
    expect(config!.hotspots[1].url).toBe('https://example.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `map-tour-config` module not found.

- [ ] **Step 3: Write implementation**

`lib/tour/map-tour-config.ts`:
```ts
import type { TourConfig, TourHotspot, TourSettings } from './types';

export interface MapTourConfigInput {
  project: {
    id: string;
    name: string;
    settings: unknown;
  };
  assets: Array<{ id: string; storage_path: string; file_type: string }>;
  publicUrlFor: (storagePath: string) => string;
}

const IMAGE_FILE_TYPES = new Set(['image/jpeg', 'image/png']);

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

function normalizeHotspots(raw: unknown): TourHotspot[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (h): h is Record<string, unknown> =>
      !!h &&
      typeof h === 'object' &&
      typeof (h as Record<string, unknown>).id === 'string' &&
      typeof (h as Record<string, unknown>).label === 'string' &&
      typeof (h as Record<string, unknown>).yaw === 'number' &&
      typeof (h as Record<string, unknown>).pitch === 'number'
  ).map((h) => ({
    id: h.id as string,
    label: h.label as string,
    description: typeof h.description === 'string' ? h.description : undefined,
    url: typeof h.url === 'string' ? h.url : undefined,
    yaw: h.yaw as number,
    pitch: h.pitch as number,
  }));
}

function normalizeSettings(settings: Record<string, unknown>): TourSettings {
  return {
    autoRotate: typeof settings.autoRotate === 'boolean' ? settings.autoRotate : false,
    autoRotateSpeed: typeof settings.autoRotateSpeed === 'number' ? settings.autoRotateSpeed : 0.5,
    initialYaw: typeof settings.initialYaw === 'number' ? settings.initialYaw : -Math.PI / 2,
    initialPitch: typeof settings.initialPitch === 'number' ? settings.initialPitch : 0,
  };
}

export function mapTourConfig(input: MapTourConfigInput): TourConfig | null {
  const imageAssets = input.assets.filter((a) => IMAGE_FILE_TYPES.has(a.file_type));
  if (imageAssets.length === 0) return null;

  const settings = parseSettings(input.project.settings);
  const firstAsset = imageAssets[0];

  return {
    id: input.project.id,
    title: input.project.name,
    equirectangularUrl: input.publicUrlFor(firstAsset.storage_path),
    hotspots: normalizeHotspots(settings.hotspots),
    settings: normalizeSettings(settings),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/tour/map-tour-config.ts lib/tour/map-tour-config.test.ts
git commit -m "feat: add tour config mapper from supabase project/assets"
```

---

### Task 3: GET /api/tours/[id] route

**Files:**
- Create: `app/api/tours/[id]/route.ts`

**Interfaces:**
- Consumes: `supabaseAdmin` (`@/lib/supabase/admin`), `mapTourConfig` + `MapTourConfigInput` (`@/lib/tour/map-tour-config`).
- Produces: `GET /api/tours/[id]` → `200 { success: true, data: TourConfig }` | `404 { success: false, error: { code: 'NOT_FOUND', message: 'Tour not found' } }` | `500 { success: false, error: { code: 'INTERNAL', message: 'Failed to fetch tour data' } }`. Uses `export const dynamic = 'force-dynamic'`.

- [ ] **Step 1: Write the route**

`app/api/tours/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { mapTourConfig } from '@/lib/tour/map-tour-config';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, name, settings')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tour not found' } },
        { status: 404 }
      );
    }

    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('id, storage_path, file_type')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (assetsError) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL', message: 'Failed to fetch tour data' } },
        { status: 500 }
      );
    }

    const publicUrlFor = (storagePath: string) =>
      supabaseAdmin.storage.from('assets').getPublicUrl(storagePath).data.publicUrl;

    const tourConfig = mapTourConfig({
      project: {
        id: project.id,
        name: project.name,
        settings: project.settings,
      },
      assets: assets ?? [],
      publicUrlFor,
    });

    if (!tourConfig) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No equirectangular assets for this tour' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tourConfig });
  } catch (error) {
    console.error('Failed to fetch tour data:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to fetch tour data' } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify types and build**

Run: `pnpm typecheck` then `pnpm build`
Expected: both pass, `/api/tours/[id]` appears in build output as a dynamic route.

- [ ] **Step 3: Commit**

```bash
git add app/api/tours/[id]/route.ts
git commit -m "feat: add GET /api/tours/[id] route backed by supabase"
```

---

### Task 4: Babylon scene hook (useVirtualTourScene)

**Files:**
- Modify: `package.json` (add `@babylonjs/gui` dependency)
- Create: `components/viewer/useVirtualTourScene.ts`

**Interfaces:**
- Consumes: `@babylonjs/core` (already a dependency), `@babylonjs/gui` (added here), `TourConfig` from `@/lib/tour/types`.
- Produces:
  ```ts
  useVirtualTourScene(config: TourConfig, autoRotate: boolean): {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    getScene: () => Scene | null;
    getGuiManager: () => GUI3DManager | null;
    isLoading: boolean;
    error: string | null;
    isVRSupported: boolean;
    isInVR: boolean;
    enterVR: () => Promise<void>;
    exitVR: () => Promise<void>;
  }
  ```
  `autoRotate` is passed as a **separate argument** and read via a ref inside the render loop, so toggling it re-renders React but does **not** re-run the scene-creation effect (the effect depends only on `config.equirectangularUrl`, `config.settings.initialYaw`, `config.settings.initialPitch`). The hook owns `Engine`, `Scene`, `ArcRotateCamera`, `PhotoDome`, and a single shared `GUI3DManager` lifecycle: creates the dome from `config.equirectangularUrl`, applies initial alpha/beta from `initialYaw`/`initialPitch`, attaches pointer/orbit controls, handles arrow-key yaw/pitch navigation, checks WebXR support, and disposes everything on unmount. `getScene()` returns the live `Scene` (or `null` before init / after dispose) and `getGuiManager()` returns the shared `GUI3DManager` (or `null`) so `HotspotMarker` components can attach their buttons to the same manager. `isLoading` resolves when the dome texture is ready or after a 15s timeout (image failure still renders, matching the spec's "error overlay" behavior via the `error` state).

- [ ] **Step 1: Install the GUI dependency**

```bash
pnpm add @babylonjs/gui
```

- [ ] **Step 2: Write the hook**

`components/viewer/useVirtualTourScene.ts`:
```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color4,
  PhotoDome,
  Constants,
} from '@babylonjs/core';
import { GUI3DManager } from '@babylonjs/gui';
import type { TourConfig } from '@/lib/tour/types';

export function useVirtualTourScene(config: TourConfig, autoRotate: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const photoDomeRef = useRef<PhotoDome | null>(null);
  const guiManagerRef = useRef<GUI3DManager | null>(null);
  const autoRotateRef = useRef(autoRotate);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const disposeScene = useCallback(() => {
    if (guiManagerRef.current) {
      guiManagerRef.current.dispose();
      guiManagerRef.current = null;
    }
    if (photoDomeRef.current) {
      photoDomeRef.current.dispose();
      photoDomeRef.current = null;
    }
    if (sceneRef.current) {
      sceneRef.current.dispose();
      sceneRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
  }, []);

  const checkVRSupport = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.xr) {
      setIsVRSupported(false);
      return;
    }
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      setIsVRSupported(supported);
    } catch {
      setIsVRSupported(false);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setError(null);

    try {
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
      });
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0, 0, 0, 0);

      const camera = new ArcRotateCamera(
        'tourCamera',
        config.settings.initialYaw,
        config.settings.initialPitch,
        1,
        Vector3.Zero(),
        scene
      );
      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 1;
      camera.upperRadiusLimit = 1;
      camera.wheelDeltaPercentage = 0.01;
      camera.panningSensibility = 0;
      camera.allowUpsideDown = true;
      camera.minZ = 0.1;
      camera.maxZ = 2000;

      const photoDome = new PhotoDome(
        'photoDome',
        config.equirectangularUrl,
        {
          resolution: 32,
          size: 1000,
          useDirectMapping: false,
        },
        scene
      );
      photoDome.imageMode = Constants.TEXTURE_EQUIRECTANGULAR_FIXED;

      const guiManager = new GUI3DManager(scene);

      engineRef.current = engine;
      sceneRef.current = scene;
      cameraRef.current = camera;
      photoDomeRef.current = photoDome;
      guiManagerRef.current = guiManager;

      const resize = () => engine.resize();
      window.addEventListener('resize', resize);

      engine.runRenderLoop(() => {
        if (autoRotateRef.current && cameraRef.current && !isInVR) {
          cameraRef.current.alpha += config.settings.autoRotateSpeed * 0.001;
        }
        scene.render();
      });

      const onKey = (e: KeyboardEvent) => {
        const cam = cameraRef.current;
        if (!cam) return;
        const step = 0.05;
        if (e.key === 'ArrowLeft') cam.alpha -= step;
        if (e.key === 'ArrowRight') cam.alpha += step;
        if (e.key === 'ArrowUp') cam.beta = Math.max(0.1, cam.beta - step);
        if (e.key === 'ArrowDown') cam.beta = Math.min(Math.PI - 0.1, cam.beta + step);
      };
      window.addEventListener('keydown', onKey);

      void checkVRSupport();

      let settled = false;
      const finishLoading = () => {
        if (!settled) {
          settled = true;
          setIsLoading(false);
        }
      };

      const timer = window.setTimeout(finishLoading, 15000);

      const awaitDome = () => {
        if (photoDome.texture.isReady()) {
          window.clearTimeout(timer);
          finishLoading();
        } else {
          requestAnimationFrame(awaitDome);
        }
      };
      awaitDome();

      return () => {
        window.clearTimeout(timer);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKey);
        disposeScene();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.equirectangularUrl, config.settings.initialYaw, config.settings.initialPitch, disposeScene, checkVRSupport]);

  const enterVR = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene) return;
    try {
      const xr = await scene.createDefaultXRExperienceAsync({
        optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor'],
      });
      xr.baseExperience.sessionManager.onXRSessionInit.add(() => setIsInVR(true));
      await xr.baseExperience.enterXRAsync('immersive-vr', 'local-floor', {
        optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor'],
      });
    } catch (err) {
      console.error('Failed to enter VR:', err);
      setError('Failed to enter VR mode');
    }
  }, []);

  const exitVR = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene) return;
    try {
      await scene.exitXRAsync();
      setIsInVR(false);
    } catch (err) {
      console.error('Failed to exit VR:', err);
    }
  }, []);

  const getScene = useCallback(() => sceneRef.current, []);
  const getGuiManager = useCallback(() => guiManagerRef.current, []);

  return {
    canvasRef,
    getScene,
    getGuiManager,
    isLoading,
    error,
    isVRSupported,
    isInVR,
    enterVR,
    exitVR,
  };
}
```

- [ ] **Step 3: Verify types and build**

Run: `pnpm typecheck` then `pnpm build`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml components/viewer/useVirtualTourScene.ts
git commit -m "feat: add useVirtualTourScene Babylon lifecycle hook"
```

---

### Task 5: Hotspot markers component

**Files:**
- Create: `components/viewer/HotspotMarker.tsx`

**Interfaces:**
- Consumes: `useVirtualTourScene`'s shared manager via a `getGuiManager: () => GUI3DManager | null` prop, `hotspotPosition` from `@/lib/tour/hotspot-position`, `TourHotspot` from `@/lib/tour/types`, `@babylonjs/gui`.
- Produces: `HotspotMarker({ hotspot, getGuiManager, onSelect }: { hotspot: TourHotspot; getGuiManager: () => GUI3DManager | null; onSelect: (hotspot: TourHotspot) => void })` — a React component that, on mount, waits until `getGuiManager()` returns a manager (polling with `requestAnimationFrame`), then creates a `HolographicButton` at `hotspotPosition(hotspot.yaw, hotspot.pitch, 350)`, billboards it, shows `hotspot.label`, and wires `onPointerUpObservable` → `onSelect(hotspot)`. Disposes the button on unmount.

- [ ] **Step 1: Write the component**

`components/viewer/HotspotMarker.tsx`:
```ts
'use client';

import { useEffect } from 'react';
import { Mesh } from '@babylonjs/core';
import type { GUI3DManager } from '@babylonjs/core';
import { HolographicButton, AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';
import { hotspotPosition } from '@/lib/tour/hotspot-position';
import type { TourHotspot } from '@/lib/tour/types';

interface HotspotMarkerProps {
  hotspot: TourHotspot;
  getGuiManager: () => GUI3DManager | null;
  onSelect: (hotspot: TourHotspot) => void;
}

export function HotspotMarker({ hotspot, getGuiManager, onSelect }: HotspotMarkerProps) {
  useEffect(() => {
    let button: HolographicButton | null = null;
    let disposed = false;

    const create = () => {
      if (disposed) return;
      const manager = getGuiManager();
      if (!manager) {
        requestAnimationFrame(create);
        return;
      }

      button = new HolographicButton(`hotspot-${hotspot.id}`);
      button.mesh.scaling.setAll(0.15);
      const pos = hotspotPosition(hotspot.yaw, hotspot.pitch, 350);
      button.mesh.position.set(pos.x, pos.y, pos.z);
      button.mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;

      const texture = AdvancedDynamicTexture.CreateForMesh(button.mesh, 256, 256);
      const label = new TextBlock();
      label.text = hotspot.label;
      label.color = 'white';
      label.fontSize = 24;
      label.textWrapping = true;
      texture.addControl(label);

      const onPointer = () => onSelect(hotspot);
      button!.onPointerUpObservable.add(onPointer);
      manager.addControl(button);
    };

    create();

    return () => {
      disposed = true;
      if (button) {
        button.dispose();
      }
    };
  }, [hotspot, getGuiManager, onSelect]);

  return null;
}
```

- [ ] **Step 2: Verify types and build**

Run: `pnpm typecheck` then `pnpm build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add components/viewer/HotspotMarker.tsx
git commit -m "feat: add billboarded hotspot markers for the tour viewer"
```

---

### Task 6: Viewer controls component

**Files:**
- Create: `components/viewer/ViewerControls.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond types (`isFullscreen`, `isVRSupported`, `isInVR`, `isLoading`, `title`, and callbacks `onToggleFullscreen`, `onToggleVR`, `onToggleAutoRotate`, `autoRotate`).
- Produces: `ViewerControls(props)` — the overlay toolbar with: fullscreen toggle, tour title, auto-rotate toggle, and VR button (only rendered when `isVRSupported`). All buttons have ARIA labels. Fade-out after 3s of inactivity via pointer/keyboard events is handled in `VirtualTourViewer` (Task 7), not here — this component is purely presentational given the booleans.

- [ ] **Step 1: Write the component**

`components/viewer/ViewerControls.tsx`:
```ts
'use client';

import { Maximize, Minimize, RotateCw, Pause, Headset, Loader2 } from 'lucide-react';

interface ViewerControlsProps {
  title: string;
  isLoading: boolean;
  isFullscreen: boolean;
  isVRSupported: boolean;
  isInVR: boolean;
  autoRotate: boolean;
  onToggleFullscreen: () => void;
  onToggleVR: () => void;
  onToggleAutoRotate: () => void;
}

export function ViewerControls({
  title,
  isLoading,
  isFullscreen,
  isVRSupported,
  isInVR,
  autoRotate,
  onToggleFullscreen,
  onToggleVR,
  onToggleAutoRotate,
}: ViewerControlsProps) {
  return (
    <div
      className="viztr-tour-controls"
      role="toolbar"
      aria-label="Tour controls"
    >
      <div className="viztr-tour-control-group viztr-tour-control-left">
        <button
          className="viztr-tour-btn"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        <button
          className="viztr-tour-btn"
          onClick={onToggleAutoRotate}
          aria-label={autoRotate ? 'Pause auto-rotate' : 'Start auto-rotate'}
          aria-pressed={autoRotate}
          title={autoRotate ? 'Pause auto-rotate' : 'Start auto-rotate'}
        >
          {autoRotate ? <Pause size={20} /> : <RotateCw size={20} />}
        </button>
      </div>

      <div className="viztr-tour-control-group viztr-tour-control-center">
        <span className="viztr-tour-title">{title}</span>
        {isLoading && <Loader2 className="viztr-tour-spin" size={14} />}
      </div>

      <div className="viztr-tour-control-group viztr-tour-control-right">
        {isVRSupported && (
          <button
            className="viztr-tour-btn viztr-tour-btn-vr"
            onClick={onToggleVR}
            aria-label={isInVR ? 'Exit VR' : 'Enter VR'}
            title={isInVR ? 'Exit VR' : 'Enter VR'}
          >
            <Headset size={20} />
          </button>
        )}
      </div>

      <style jsx>{`
        .viztr-tour-controls {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          pointer-events: none;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 12px 16px;
        }
        .viztr-tour-control-group {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }
        .viztr-tour-title {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          font-family: Inter, system-ui, sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }
        .viztr-tour-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(8px);
          color: #fff;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .viztr-tour-btn:hover {
          background: rgba(13, 17, 23, 0.95);
          transform: scale(1.05);
        }
        .viztr-tour-btn:active {
          transform: scale(0.95);
        }
        .viztr-tour-btn:focus-visible {
          outline: 2px solid #0d9488;
          outline-offset: 2px;
        }
        .viztr-tour-btn-vr {
          background: linear-gradient(135deg, #0d9488, #06b6d4);
        }
        .viztr-tour-btn-vr:hover {
          background: linear-gradient(135deg, #06b6d4, #0d9488);
        }
        .viztr-tour-spin {
          animation: viztr-spin 0.8s linear infinite;
          color: #0d9488;
        }
        @keyframes viztr-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 640px) {
          .viztr-tour-title {
            max-width: 150px;
            font-size: 12px;
          }
          .viztr-tour-btn {
            width: 36px;
            height: 36px;
          }
          .viztr-tour-controls {
            padding: 8px 12px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .viztr-tour-btn {
            transition: none;
          }
          .viztr-tour-spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Verify types and build**

Run: `pnpm typecheck` then `pnpm build`
Expected: both pass. If `lucide-react` is not present, add it: `pnpm add lucide-react` (it is already a dependency per `package.json`).

- [ ] **Step 3: Commit**

```bash
git add components/viewer/ViewerControls.tsx
git commit -m "feat: add tour viewer controls (fullscreen, auto-rotate, VR)"
```

---

### Task 7: Main VirtualTourViewer component

**Files:**
- Create: `components/viewer/VirtualTourViewer.tsx`

**Interfaces:**
- Consumes: `useVirtualTourScene` (Task 4), `HotspotMarker` (Task 5), `ViewerControls` (Task 6), `TourConfig` from `@/lib/tour/types`.
- Produces: `VirtualTourViewer({ config }: { config: TourConfig })` — renders the canvas, mounts `ViewerControls` and one `HotspotMarker` per `config.hotspots` (passing `getGuiManager`), owns fullscreen state, hotspot click → `window.open(hotspot.url)` or no-op for info hotspots, auto-rotate toggle state (defaults to `config.settings.autoRotate`), and a pointer/keyboard show-controls fade. Arrow-key navigation lives inside `useVirtualTourScene` (Task 4).

- [ ] **Step 1: Write the component**

`components/viewer/VirtualTourViewer.tsx`:
```ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useVirtualTourScene } from './useVirtualTourScene';
import { ViewerControls } from './ViewerControls';
import { HotspotMarker } from './HotspotMarker';
import type { TourConfig, TourHotspot } from '@/lib/tour/types';

interface VirtualTourViewerProps {
  config: TourConfig;
  className?: string;
}

export function VirtualTourViewer({ config, className = '' }: VirtualTourViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(config.settings.autoRotate);
  const [showControls, setShowControls] = useState(true);

  const {
    canvasRef,
    getGuiManager,
    isLoading,
    error,
    isVRSupported,
    isInVR,
    enterVR,
    exitVR,
  } = useVirtualTourScene(config, autoRotate);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const show = () => {
      setShowControls(true);
      window.setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('pointermove', show);
    window.addEventListener('keydown', show);
    return () => {
      window.removeEventListener('pointermove', show);
      window.removeEventListener('keydown', show);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, [canvasRef]);

  const handleHotspotSelect = useCallback((hotspot: TourHotspot) => {
    if (hotspot.url) {
      window.open(hotspot.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  if (error) {
    return (
      <div className={`viztr-tour-viewer ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas ref={canvasRef} className="viztr-tour-canvas" />
        <div className="viztr-tour-error">
          Couldn&apos;t load this tour. {error}
        </div>
        <style jsx>{`
          .viztr-tour-viewer {
            position: relative;
            width: 100%;
            height: 100%;
            background: #080a0f;
            border-radius: 12px;
            overflow: hidden;
          }
          .viztr-tour-canvas {
            width: 100%;
            height: 100%;
            display: block;
            outline: none;
            touch-action: none;
          }
          .viztr-tour-error {
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
        `}</style>
      </div>
    );
  }

  return (
    <div className={`viztr-tour-viewer ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} className="viztr-tour-canvas" />

      {isLoading && (
        <div className="viztr-tour-overlay">
          <div className="viztr-spinner" aria-label="Loading tour" />
        </div>
      )}

      {showControls && (
        <ViewerControls
          title={config.title}
          isLoading={isLoading}
          isFullscreen={isFullscreen}
          isVRSupported={isVRSupported}
          isInVR={isInVR}
          autoRotate={autoRotate}
          onToggleFullscreen={toggleFullscreen}
          onToggleVR={isInVR ? exitVR : enterVR}
          onToggleAutoRotate={() => setAutoRotate((v) => !v)}
        />
      )}

      {config.hotspots.map((hotspot) => (
        <HotspotMarker
          key={hotspot.id}
          hotspot={hotspot}
          getGuiManager={getGuiManager}
          onSelect={handleHotspotSelect}
        />
      ))}

      <style jsx>{`
        .viztr-tour-viewer {
          position: relative;
          width: 100%;
          height: 100%;
          background: #080a0f;
          border-radius: 12px;
          overflow: hidden;
        }
        .viztr-tour-canvas {
          width: 100%;
          height: 100%;
          display: block;
          outline: none;
          touch-action: none;
        }
        .viztr-tour-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080a0f;
          z-index: 10;
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
        @media (prefers-reduced-motion: reduce) {
          .viztr-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

VirtualTourViewer.displayName = 'VirtualTourViewer';
```

- [ ] **Step 2: Verify types and build**

Run: `pnpm typecheck` then `pnpm build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add components/viewer/VirtualTourViewer.tsx
git commit -m "feat: add main virtual tour viewer component"
```

---

### Task 8: Public tour page

**Files:**
- Create: `app/(public)/tour/[id]/page.tsx`

**Interfaces:**
- Consumes: `GET /api/tours/[id]` (Task 3), `VirtualTourViewer` (Task 7), `TourConfig` from `@/lib/tour/types`.
- Produces: `app/(public)/tour/[id]/page.tsx` — server component that fetches the tour config server-side (relative URL `http://localhost:3000` dev / `NEXT_PUBLIC_SITE_URL` in prod) and renders a responsive layout: full-screen viewer on mobile, `max-w-4xl` centered on desktop, with a 404/not-found state when fetch fails.

- [ ] **Step 1: Write the page**

`app/(public)/tour/[id]/page.tsx`:
```ts
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { TourConfig } from '@/lib/tour/types';

const VirtualTourViewer = dynamic(
  () => import('@/components/viewer/VirtualTourViewer').then((m) => m.VirtualTourViewer),
  { ssr: false }
);

interface TourPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Virtual Tour | VizTR',
  description: 'Explore immersive 360° virtual tours',
  openGraph: {
    type: 'website',
    title: 'Virtual Tour | VizTR',
    description: 'Explore immersive 360° virtual tours',
  },
};

export default async function TourPage({ params }: TourPageProps) {
  const { id } = await params;
  const tourConfig = await fetchTourConfig(id);

  if (!tourConfig) {
    return (
      <div className="viztr-tour-page">
        <div className="viztr-tour-missing">
          <h1>Tour Not Found</h1>
          <p>The requested virtual tour could not be found.</p>
          <a href="/" className="viztr-tour-back-link">
            ← Back home
          </a>
        </div>
        <style jsx>{`
          .viztr-tour-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #080a0f;
            padding: 24px;
          }
          .viztr-tour-missing {
            text-align: center;
            color: #fff;
            max-width: 400px;
          }
          .viztr-tour-missing h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 12px;
            font-family: Inter, system-ui, sans-serif;
          }
          .viztr-tour-missing p {
            color: #94a3b8;
            margin-bottom: 24px;
            font-family: Inter, system-ui, sans-serif;
          }
          .viztr-tour-back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #0d9488;
            text-decoration: none;
            font-weight: 500;
            font-family: Inter, system-ui, sans-serif;
            transition: color 0.2s;
          }
          .viztr-tour-back-link:hover {
            color: #06b6d4;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="viztr-tour-page">
      <div className="viztr-tour-container">
        <Suspense
          fallback={
            <div className="viztr-tour-fallback">
              <div className="viztr-spinner" aria-label="Loading tour" />
            </div>
          }
        >
          <VirtualTourViewer config={tourConfig} />
        </Suspense>
      </div>
      <style jsx>{`
        .viztr-tour-page {
          min-height: 100vh;
          background: #080a0f;
          padding: 0;
        }
        .viztr-tour-container {
          width: 100%;
          height: 100vh;
          max-width: 100%;
        }
        .viztr-tour-fallback {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080a0f;
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
        @media (min-width: 1024px) {
          .viztr-tour-container {
            max-width: 896px;
            margin: 0 auto;
            height: 100vh;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
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

async function fetchTourConfig(tourId: string): Promise<TourConfig | null> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  try {
    const response = await fetch(`${base}/api/tours/${tourId}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.success && body.data ? (body.data as TourConfig) : null;
  } catch (err) {
    console.error('Failed to fetch tour config:', err);
    return null;
  }
}
```

- [ ] **Step 2: Verify types and build**

Run: `pnpm typecheck` then `pnpm build`
Expected: both pass; `/tour/[id]` appears in the static/dynamic route list.

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/tour/[id]/page.tsx"
git commit -m "feat: add public virtual tour page"
```

---

### Task 9: Final verification pass

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-virtual-tour-viewer-babylon-design.md` (mark implemented requirements `- [x]`)

**Interfaces:**
- Consumes: all completed tasks.
- Produces: a verified, committed, spec-synced feature.

- [ ] **Step 1: Run the full verification suite**

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: tests pass, typecheck clean, build succeeds with all routes.

- [ ] **Step 2: Manual smoke test (if a Supabase project is configured)**

1. `pnpm dev`
2. Visit a tour URL `http://localhost:3000/tour/<project-id>` where the project has at least one `image/jpeg` or `image/png` asset and `service_type = 'tour'`.
3. Confirm: panorama renders, drag rotates, auto-rotate toggle works, fullscreen works, hotspots appear and navigate, VR button present only when WebXR supported.
4. Visit a non-existent id → 404 "Tour Not Found" state.

- [ ] **Step 3: Sync the design spec checkboxes**

In `docs/superpowers/specs/2026-08-07-virtual-tour-viewer-babylon-design.md`, convert the implemented "Core Features (T-031)" bullets 1–9 from plain text to `- [x]` and leave any not-yet-shipped item (e.g. Marzipano) unchecked.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-07-virtual-tour-viewer-babylon-design.md
git commit -m "chore: mark virtual tour viewer spec items as shipped"
```

---

## Definition of Done

- `GET /api/tours/[id]` returns a `TourConfig` from Supabase (`projects` + `assets`), or clean 404/500 envelopes.
- `app/(public)/tour/[id]` renders the viewer; a tour without equirect assets shows the not-found state.
- PhotoDome panorama, orbit controls (mouse/touch), auto-rotate, hotspot markers with labels/links, fullscreen, WebXR VR entry (graceful fallback), responsive layout, dark theme, keyboard navigation, and `prefers-reduced-motion` support all implemented.
- `pnpm test`, `pnpm typecheck`, and `pnpm build` all pass.
- Spec `2026-08-07-virtual-tour-viewer-babylon-design.md` core feature checkboxes marked.
- Out of scope: Marzipano panorama viewer (separate T-plan), multi-asset tour navigation, tour admin editor, real-time collaboration.
