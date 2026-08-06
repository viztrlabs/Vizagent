# Implementation Plan: Babylon.js XR Configurator + Pixel Streaming Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the `babylon_XR_World` scaffold into VizTR monorepo with undo/redo, auto-save, AR tab, material presets, AND pixel streaming for remote collaboration.

**Architecture:** Turborepo monorepo — types in `packages/types`, components in `apps/web/components/xr/`, pages in `apps/web/app/`, API in `apps/web/app/api/`, signaling in `apps/xr-runner/src/signaling/`.

**Tech Stack:** Next.js 15 (App Router), React 18, TypeScript 5.3 strict, Tailwind CSS 3.4, Babylon.js 8+, Prisma 5, PostgreSQL 16, zod 3, Vitest, WebRTC (medooze/ion-sfu or node-mediasoup), Socket.io 4.7.

**Decisions Confirmed:**
- Undo/Redo state history (Ctrl+Z / Ctrl+Shift+Z)
- Debounced auto-save (3s)
- AR Tab as 5th tab (preview + launch)
- Material Presets library + manual sliders (both)
- Pixel Streaming for remote configurator collaboration

---

## Global Constraints

- TypeScript strict mode enabled everywhere (no `any`).
- Conventional commits (feat/fix/chore/test).
- Mobile-first responsive; WCAG 2.1 AA.
- All components use Tailwind CSS (no `style jsx`).
- No secrets in code or tests; env via `.env.local`.
- 90%+ test coverage on new code.
- Babylon.js dynamically imported (ssr: false) to keep bundle small.
- WebRTC latency target: < 100ms input-to-render.

---

## Pixel Streaming Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL WORKSTATION                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Babylon.js Engine (GPU-accelerated)                │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  XR Configurator (babylon_XR_World)         │   │   │
│  │  │  - Materials Panel                          │   │   │
│  │  │  - Lighting Panel                           │   │   │
│  │  │  - Hotspots Panel                           │   │   │
│  │  │  - AR Panel                                 │   │   │
│  │  │  - Export Panel                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                    Pixel Streaming Plugin                   │
│                    (H.264 encoding)                         │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ WebRTC (H.264 video + input events)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SFU/BROKER                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  medooze/ion-sfu or node-mediasoup                 │   │
│  │  - Signaling (SDP offer/answer)                    │   │
│  │  - ICE candidates                                 │   │
│  │  - TURN/STUN fallback                             │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    REMOTE CLIENT                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Browser (Next.js App)                             │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  ConfiguratorViewer (read-only)             │   │   │
│  │  │  - Receives video stream                    │   │   │
│  │  │  - Sends input events (mouse, touch, XR)    │   │   │
│  │  │  - AR launch buttons (iOS/Android)          │   │   │
│  │  │  - Latency badge (RTCP stats)               │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Foundation (Prisma + Types)

### Task 0.1: Merge Prisma Schema

**Files:**
- Create: `packages/database/prisma/schema.prisma`

**Steps:**
1. Add `XrAsset` model with relations to `Project`
2. Add `Configuration` model with cascade delete
3. Add `ConfiguratorSession` model for streaming sessions
4. Add `Viewer` model for tracking connected users
5. Add `XrAssetType` and `XrServiceType` enums
6. Add composite unique constraint `[xrAssetId, name]`
7. Add index on `projectId`, `shareToken`, `hostId`
8. Run `pnpm db:migrate` to verify

**Acceptance Criteria:**
- [ ] Schema compiles without errors
- [ ] Migration generates successfully
- [ ] Existing models unaffected

**Schema to Add:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model XrAsset {
  id             String          @id @default(cuid())
  projectId      String
  type           XrAssetType     @default(model3d)
  service        XrServiceType   @default(webXR)
  glbUrl         String?
  equirectUrl    String?
  usdzUrl        String?
  fileSizeBytes  Int?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  configurations Configuration[]
  project        Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

model Configuration {
  id         String   @id @default(cuid())
  xrAssetId  String
  name       String
  data       String   @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  xrAsset XrAsset @relation(fields: [xrAssetId], references: [id], onDelete: Cascade)

  @@unique([xrAssetId, name])
}

model ConfiguratorSession {
  id          String   @id @default(cuid())
  projectId   String
  hostId      String
  config      String   @db.Text
  shareToken  String   @unique
  isActive    Boolean  @default(true)
  permissions Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  viewers     Viewer[]
  
  @@index([shareToken])
  @@index([hostId])
}

model Viewer {
  id          String   @id @default(cuid())
  sessionId   String
  userId      String?
  joinedAt    DateTime @default(now())
  leftAt      DateTime?
  
  session     ConfiguratorSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId])
}

model Project {
  id        String    @id @default(cuid())
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  xrAssets  XrAsset[]
}

enum XrAssetType {
  model3d
  equirect
}

enum XrServiceType {
  vr
  mr
  webAR
  tour
  webXR
}
```

- [ ] **Step 1: Write the failing test (schema validation)**
- [ ] **Step 2: Add schema**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(database): add XrAsset, Configuration, and ConfiguratorSession models"
```

---

### Task 0.2: Create Shared Types Package

**Files:**
- Create: `packages/types/src/xr.ts`
- Create: `packages/types/src/index.ts`

**Steps:**
1. Create `MaterialOverrideSchema` with zod validation
2. Create `MaterialPreset` interface and `MATERIAL_PRESETS` array (8 presets)
3. Create `EnvironmentSettingsSchema` with zod validation
4. Create `HotspotSchema` with type variants (info/media/navigation)
5. Create `DimensionSettingsSchema` with zod validation
6. Create `ARSessionConfig` interface with defaults
7. Create `XRConfigurationSchema` with all nested schemas
8. Create `InputEvent` types for pixel streaming
9. Create `ConfiguratorSession` types
10. Create `DEFAULT_ENVIRONMENT` and `emptyConfiguration` factory
11. Create `packages/types/package.json`
12. Create `packages/types/tsconfig.json`

**Acceptance Criteria:**
- [ ] All schemas validate correctly
- [ ] Types match Prisma models
- [ ] Exported from `@viztr/types`

**Content for `packages/types/src/xr.ts`:**
```typescript
import { z } from "zod";

// --- Material Override ---
export const MaterialOverrideSchema = z.object({
  meshId: z.string(),
  baseColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  metallic: z.number().min(0).max(1).optional(),
  roughness: z.number().min(0).max(1).optional(),
  emissive: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  emissiveIntensity: z.number().min(0).max(10).optional(),
  opacity: z.number().min(0).max(1).optional(),
  textureUrl: z.string().url().optional(),
});
export type MaterialOverride = z.infer<typeof MaterialOverrideSchema>;

// --- Material Preset ---
export interface MaterialPreset {
  id: string;
  name: string;
  thumbnail: string;
  baseColor: string;
  metallic: number;
  roughness: number;
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: "metal-brushed", name: "Brushed Metal", thumbnail: "/presets/metal-brushed.jpg", baseColor: "#C0C0C0", metallic: 0.9, roughness: 0.3 },
  { id: "metal-gold", name: "Gold", thumbnail: "/presets/metal-gold.jpg", baseColor: "#FFD700", metallic: 1.0, roughness: 0.2 },
  { id: "wood-oak", name: "Oak Wood", thumbnail: "/presets/wood-oak.jpg", baseColor: "#8B4513", metallic: 0.0, roughness: 0.8 },
  { id: "wood-walnut", name: "Walnut", thumbnail: "/presets/wood-walnut.jpg", baseColor: "#5C4033", metallic: 0.0, roughness: 0.7 },
  { id: "glass-clear", name: "Clear Glass", thumbnail: "/presets/glass-clear.jpg", baseColor: "#FFFFFF", metallic: 0.0, roughness: 0.0 },
  { id: "plastic-matte", name: "Matte Plastic", thumbnail: "/presets/plastic-matte.jpg", baseColor: "#333333", metallic: 0.0, roughness: 0.9 },
  { id: "ceramic-white", name: "White Ceramic", thumbnail: "/presets/ceramic-white.jpg", baseColor: "#F5F5F5", metallic: 0.0, roughness: 0.4 },
  { id: "fabric-cotton", name: "Cotton Fabric", thumbnail: "/presets/fabric-cotton.jpg", baseColor: "#E8E8E8", metallic: 0.0, roughness: 1.0 },
];

// --- Environment Settings ---
export const EnvironmentSettingsSchema = z.object({
  hdriUrl: z.string(),
  exposure: z.number().min(0.1).max(3),
  background: z.enum(["environment", "color", "transparent"]),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  shadowIntensity: z.number().min(0).max(1),
  shadowBlur: z.number().min(0).max(1),
});
export type EnvironmentSettings = z.infer<typeof EnvironmentSettingsSchema>;

// --- Hotspot ---
export const HotspotSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  url: z.string().url().optional(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  type: z.enum(["info", "media", "navigation"]).default("info"),
  mediaUrl: z.string().url().optional(),
});
export type Hotspot = z.infer<typeof HotspotSchema>;

// --- Dimension Settings ---
export const DimensionSettingsSchema = z.object({
  realWorldSizeCm: z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]),
  scale: z.number().positive(),
});
export type DimensionSettings = z.infer<typeof DimensionSettingsSchema>;

// --- AR Session Config ---
export interface ARSessionConfig {
  anchorType: "floor" | "wall" | "ceiling" | "image";
  hitTest: boolean;
  anchors: boolean;
  occlusion: boolean;
  shadows: boolean;
  lightEstimation: boolean;
}

export const DEFAULT_AR_SESSION: ARSessionConfig = {
  anchorType: "floor",
  hitTest: true,
  anchors: true,
  occlusion: false,
  shadows: true,
  lightEstimation: true,
};

// --- XR Configuration ---
export const XRConfigurationSchema = z.object({
  id: z.string().uuid(),
  xrAssetId: z.string(),
  name: z.string().min(1).max(100),
  materials: z.array(MaterialOverrideSchema),
  environment: EnvironmentSettingsSchema,
  hotspots: z.array(HotspotSchema),
  dimensions: DimensionSettingsSchema,
  visibility: z.object({
    arEnabled: z.boolean(),
    autostartViewer: z.boolean(),
    hotspotsVisibleByDefault: z.boolean(),
    dimensionsVisibleByDefault: z.boolean(),
    placement: z.enum(["floor", "wall"]),
  }),
  posterUrl: z.string().url().optional(),
  glbUrl: z.string().url(),
  usdzUrl: z.string().url().optional(),
  updatedAt: z.string().datetime(),
});
export type XRConfiguration = z.infer<typeof XRConfigurationSchema>;

// --- Pixel Streaming Input Events ---
export type InputEvent =
  | { type: "mouse:down"; x: number; y: number; button: number }
  | { type: "mouse:up"; x: number; y: number; button: number }
  | { type: "mouse:move"; x: number; y: number }
  | { type: "wheel"; delta: number }
  | { type: "touch:start"; x: number; y: number; id: number }
  | { type: "touch:move"; x: number; y: number; id: number }
  | { type: "touch:end"; id: number }
  | { type: "xr:controller"; pose: { position: [number, number, number]; rotation: [number, number, number, number] }; button?: number };

// --- Configurator Session ---
export interface ConfiguratorSession {
  id: string;
  projectId: string;
  hostId: string;
  config: XRConfiguration;
  shareToken: string;
  isActive: boolean;
  permissions: SessionPermissions;
  viewers: Viewer[];
  createdAt: string;
}

export interface SessionPermissions {
  canEdit: string[];
  canView: string[];
  isPublic: boolean;
}

export interface Viewer {
  id: string;
  userId?: string;
  joinedAt: string;
  leftAt?: string;
}

// --- Default Values ---
export const DEFAULT_ENVIRONMENT: EnvironmentSettings = {
  hdriUrl: "/hdri/studio-soft.env",
  exposure: 1.0,
  background: "environment",
  shadowIntensity: 0.6,
  shadowBlur: 0.3,
};

export const emptyConfiguration = (xrAssetId: string, glbUrl: string): XRConfiguration => ({
  id: crypto.randomUUID(),
  xrAssetId,
  name: "default",
  materials: [],
  environment: DEFAULT_ENVIRONMENT,
  hotspots: [],
  dimensions: { realWorldSizeCm: [0, 0, 0], scale: 1 },
  visibility: {
    arEnabled: true,
    autostartViewer: true,
    hotspotsVisibleByDefault: false,
    dimensionsVisibleByDefault: false,
    placement: "floor",
  },
  glbUrl,
  updatedAt: new Date().toISOString(),
});

export const DEFAULT_PERMISSIONS: SessionPermissions = {
  canEdit: [],
  canView: [],
  isPublic: false,
};
```

- [ ] **Step 1: Create packages/types/package.json**
- [ ] **Step 2: Create packages/types/tsconfig.json**
- [ ] **Step 3: Create packages/types/src/xr.ts**
- [ ] **Step 4: Create packages/types/src/index.ts**
- [ ] **Step 5: Verify**
- [ ] **Step 6: Commit**
```bash
git add packages/types/
git commit -m "feat(types): add XR configuration and pixel streaming types with zod validation"
```

---

## Phase 1: Core Engine (useBabylonScene)

### Task 1.1: Enhance useBabylonScene Hook

**Files:**
- Create: `apps/web/components/xr/useBabylonScene.ts`

**Steps:**
1. Add `onLoadingProgress` and `onWebXRStateChanged` callbacks to options
2. Add `webXRRef` for WebXR session management
3. Add `animationPlayerRef` for animation control
4. Implement `startARSession()` with hit-test, anchors, occlusion
5. Implement `stopARSession()` with cleanup
6. Implement `playAnimation(name, loop?)`
7. Implement `setLODLevel(level)` for LOD switching
8. Fix hotspot marker cleanup in useEffect return
9. Add WebGL context loss handling
10. Add loading progress tracking (0-100)

**Acceptance Criteria:**
- [ ] AR session starts/stops without errors
- [ ] Hotspot markers cleanup properly
- [ ] Loading progress reports correctly
- [ ] WebGL context loss handled gracefully

**Key Content:**
```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color4,
  SceneLoader,
  PBRMaterial,
  Color3,
  CubeTexture,
  ShadowGenerator,
  DirectionalLight,
  AbstractMesh,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  PointerEventTypes,
  WebXRDefaultExperience,
  AnimationGroup,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { EnvironmentSettings, MaterialOverride, Hotspot } from "@viztr/types";

interface UseBabylonSceneOptions {
  onMeshPicked?: (meshId: string, point: Vector3) => void;
  onLoadingProgress?: (progress: number) => void;
  onWebXRStateChanged?: (state: "inactive" | "entering" | "active" | "error") => void;
}

export function useBabylonScene(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: UseBabylonSceneOptions = {}
) {
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const rootMeshRef = useRef<AbstractMesh | null>(null);
  const shadowGenRef = useRef<ShadowGenerator | null>(null);
  const hotspotMarkersRef = useRef<Map<string, Mesh>>(new Map());
  const webXRRef = useRef<WebXRDefaultExperience | null>(null);
  const animationPlayerRef = useRef<AnimationGroup | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Engine + scene bootstrap
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2.5,
      Math.PI / 2.5,
      3,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 0.3;
    camera.upperRadiusLimit = 20;
    camera.wheelDeltaPercentage = 0.01;

    const light = new DirectionalLight("mainLight", new Vector3(-1, -2, -1), scene);
    light.intensity = 1.2;
    const shadowGen = new ShadowGenerator(1024, light);
    shadowGen.usePercentageCloserFiltering = true;

    engineRef.current = engine;
    sceneRef.current = scene;
    cameraRef.current = camera;
    shadowGenRef.current = shadowGen;

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;
      const pick = pointerInfo.pickInfo;
      if (pick?.hit && pick.pickedMesh && pick.pickedPoint) {
        options.onMeshPicked?.(pick.pickedMesh.id, pick.pickedPoint);
      }
    });

    // WebGL context loss handling
    canvasRef.current.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.warn("WebGL context lost");
    });

    canvasRef.current.addEventListener("webglcontextrestored", () => {
      console.log("WebGL context restored");
    });

    engine.runRenderLoop(() => scene.render());
    setIsReady(true);

    return () => {
      window.removeEventListener("resize", resize);
      hotspotMarkersRef.current.forEach((mesh) => mesh.dispose());
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // Model loading with progress
  const loadModel = useCallback(async (glbUrl: string) => {
    const scene = sceneRef.current;
    if (!scene) return;
    setIsModelLoading(true);
    setLoadError(null);

    try {
      if (rootMeshRef.current) {
        rootMeshRef.current.dispose(false, true);
      }
      const result = await SceneLoader.ImportMeshAsync("", "", glbUrl, scene);
      const root = result.meshes[0];
      rootMeshRef.current = root;

      result.meshes.forEach((m) => {
        m.receiveShadows = true;
        if (m instanceof Mesh) shadowGenRef.current?.addShadowCaster(m);
      });

      // Frame camera on the loaded bounds
      const { min, max } = root.getHierarchyBoundingVectors();
      const center = min.add(max).scale(0.5);
      const size = max.subtract(min).length();
      if (cameraRef.current) {
        cameraRef.current.setTarget(center);
        cameraRef.current.radius = Math.max(size * 1.6, 1);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load model");
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  // Environment / lighting
  const applyEnvironment = useCallback((env: EnvironmentSettings) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const hdrTexture = CubeTexture.CreateFromPrefilteredData(env.hdriUrl, scene);
    scene.environmentTexture = hdrTexture;
    scene.environmentIntensity = env.exposure;

    if (env.background === "environment") {
      scene.createDefaultSkybox(hdrTexture, true, 1000, 0.3);
    } else if (env.background === "color" && env.backgroundColor) {
      const c = Color3.FromHexString(env.backgroundColor);
      scene.clearColor = new Color4(c.r, c.g, c.b, 1);
    } else {
      scene.clearColor = new Color4(0, 0, 0, 0);
    }

    if (shadowGenRef.current) {
      shadowGenRef.current.setDarkness(1 - env.shadowIntensity);
      shadowGenRef.current.blurKernel = 8 + env.shadowBlur * 32;
    }
  }, []);

  // Material overrides
  const applyMaterialOverride = useCallback((override: MaterialOverride) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const mesh = scene.getMeshById(override.meshId);
    if (!mesh) return;

    let mat = mesh.material as PBRMaterial | null;
    if (!mat || !(mat instanceof PBRMaterial)) {
      mat = new PBRMaterial(`${override.meshId}-mat`, scene);
      mesh.material = mat;
    }
    if (override.baseColor) mat.albedoColor = Color3.FromHexString(override.baseColor);
    if (override.metallic !== undefined) mat.metallic = override.metallic;
    if (override.roughness !== undefined) mat.roughness = override.roughness;
    if (override.emissive) mat.emissiveColor = Color3.FromHexString(override.emissive);
    if (override.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = override.emissiveIntensity;
    }
    if (override.opacity !== undefined) {
      mat.alpha = override.opacity;
      mat.transparencyMode = override.opacity < 1 ? PBRMaterial.PBRMATERIAL_ALPHABLEND : PBRMaterial.PBRMATERIAL_OPAQUE;
    }
  }, []);

  // Hotspots
  const syncHotspotMarkers = useCallback((hotspots: Hotspot[], visible: boolean) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const existing = hotspotMarkersRef.current;

    for (const [id, mesh] of existing) {
      if (!hotspots.find((h) => h.id === id)) {
        mesh.dispose();
        existing.delete(id);
      }
    }

    hotspots.forEach((h) => {
      let marker = existing.get(h.id);
      if (!marker) {
        marker = MeshBuilder.CreateSphere(`hotspot-${h.id}`, { diameter: 0.04 }, scene);
        const mat = new StandardMaterial(`hotspot-mat-${h.id}`, scene);
        mat.emissiveColor = Color3.FromHexString("#0D9488");
        mat.disableLighting = true;
        marker.material = mat;
        existing.set(h.id, marker);
      }
      marker.position = new Vector3(...h.position);
      marker.setEnabled(visible);
    });
  }, []);

  // Dimensions / scale
  const applyScale = useCallback((scale: number) => {
    rootMeshRef.current?.getChildMeshes().forEach((m) => m.scaling.setAll(scale));
    rootMeshRef.current?.scaling.setAll(scale);
  }, []);

  const getBoundingSizeCm = useCallback((): [number, number, number] => {
    const root = rootMeshRef.current;
    if (!root) return [0, 0, 0];
    const { min, max } = root.getHierarchyBoundingVectors();
    const size = max.subtract(min);
    return [size.x * 100, size.y * 100, size.z * 100];
  }, []);

  // Poster capture
  const capturePoster = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const engine = engineRef.current;
      const scene = sceneRef.current;
      if (!engine || !scene) return resolve("");
      scene.render();
      resolve(engine.getRenderingCanvas()!.toDataURL("image/png"));
    });
  }, []);

  // AR Session (placeholder - needs WebXR implementation)
  const startARSession = useCallback(async () => {
    options.onWebXRStateChanged?.("entering");
    // TODO: Implement WebXR AR session
    options.onWebXRStateChanged?.("active");
  }, [options]);

  const stopARSession = useCallback(async () => {
    // TODO: Implement WebXR AR session cleanup
    options.onWebXRStateChanged?.("inactive");
  }, [options]);

  // Animation (placeholder)
  const playAnimation = useCallback((name: string, loop?: boolean) => {
    // TODO: Implement animation playback
  }, []);

  // LOD (placeholder)
  const setLODLevel = useCallback((level: 0 | 1 | 2) => {
    // TODO: Implement LOD switching
  }, []);

  return {
    isReady,
    isModelLoading,
    loadError,
    loadModel,
    applyEnvironment,
    applyMaterialOverride,
    syncHotspotMarkers,
    applyScale,
    getBoundingSizeCm,
    capturePoster,
    startARSession,
    stopARSession,
    playAnimation,
    setLODLevel,
    sceneRef,
  };
}
```

- [ ] **Step 1: Create apps/web directory structure**
- [ ] **Step 2: Create useBabylonScene.ts**
- [ ] **Step 3: Write tests**
- [ ] **Step 4: Verify**
- [ ] **Step 5: Commit**
```bash
git add apps/web/components/xr/useBabylonScene.ts
git commit -m "feat(xr): create useBabylonScene hook with WebXR, LOD, and progress tracking"
```

---

## Phase 2: UI Components (Tailwind + A11y)

### Task 2.1: Create BabylonCanvas

**Files:**
- Create: `apps/web/components/xr/BabylonCanvas.tsx`

**Steps:**
1. Create canvas component with Tailwind CSS
2. Add ARIA labels (`aria-label="3D viewport"`)
3. Add keyboard focus management
4. Use CSS variables for VizTR brand colors
5. Ensure WCAG 2.1 AA contrast ratios

**Acceptance Criteria:**
- [ ] Passes axe accessibility audit
- [ ] Keyboard navigable

**Key Content:**
```tsx
"use client";

import { forwardRef } from "react";

interface BabylonCanvasProps {
  isLoading: boolean;
  error: string | null;
  posterUrl?: string;
}

export const BabylonCanvas = forwardRef<HTMLCanvasElement, BabylonCanvasProps>(
  ({ isLoading, error, posterUrl }, ref) => {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-purple-950/30 to-black rounded-xl overflow-hidden">
        <canvas ref={ref} className="w-full h-full block outline-none" touch-action="none" aria-label="3D viewport" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {posterUrl ? (
              <img src={posterUrl} alt="" className="w-full h-full object-contain opacity-85" />
            ) : (
              <div className="w-[34px] h-[34px] rounded-full border-[3px] border-purple-500/25 border-t-teal-500 animate-spin" aria-label="Loading model" />
            )}
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-500/15 border border-red-500/40 text-red-300 text-sm rounded-lg">
            Couldn&apos;t load this model. {error}
          </div>
        )}
      </div>
    );
  }
);

BabylonCanvas.displayName = "BabylonCanvas";
```

- [ ] **Step 1: Create BabylonCanvas.tsx**
- [ ] **Step 2: Add accessibility**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add apps/web/components/xr/BabylonCanvas.tsx
git commit -m "feat(xr): create BabylonCanvas with Tailwind and accessibility"
```

---

### Task 2.2: Create ARPanel Component

**Files:**
- Create: `apps/web/components/xr/panels/ARPanel.tsx`

**Steps:**
1. Create AR launch/stop button with state management
2. Add anchor type selector (floor/wall/ceiling/image)
3. Add iOS Quick Look link (when USDZ available)
4. Add Android WebXR fallback button
5. Add AR session status indicator
6. Style with Tailwind CSS

**Acceptance Criteria:**
- [ ] AR button reflects session state
- [ ] iOS users see Quick Look when USDZ exists
- [ ] Android users see WebXR option
- [ ] Accessibility compliant

**Key Content:**
```tsx
"use client";

import type { XRConfiguration } from "@viztr/types";

interface ARPanelProps {
  config: XRConfiguration;
  onChange: (patch: Partial<XRConfiguration>) => void;
  onStartAR: () => Promise<void>;
  onStopAR: () => Promise<void>;
  arState: "inactive" | "entering" | "active" | "error";
}

export function ARPanel({ config, onChange, onStartAR, onStopAR, arState }: ARPanelProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={arState === "active" ? onStopAR : onStartAR}
        disabled={arState === "entering"}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          arState === "active"
            ? "bg-red-600 hover:bg-red-700 text-white"
            : arState === "entering"
            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
        }`}
      >
        {arState === "entering" ? "Starting AR..." : arState === "active" ? "Stop AR" : "Launch AR"}
      </button>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Anchor Type</label>
        <select
          value={config.visibility.placement}
          onChange={(e) => onChange({ visibility: { ...config.visibility, placement: e.target.value as "floor" | "wall" } })}
          className="w-full bg-purple-950/50 text-white border border-purple-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="floor">Floor</option>
          <option value="wall">Wall</option>
        </select>
      </div>

      {config.usdzUrl && (
        <a href={config.usdzUrl} className="block">
          <button className="w-full py-2 px-4 rounded-lg border border-purple-700 text-purple-300 hover:bg-purple-900/30 transition-colors">
            View in AR (iOS)
          </button>
        </a>
      )}

      {!config.usdzUrl && (
        <button
          onClick={onStartAR}
          className="w-full py-2 px-4 rounded-lg border border-purple-700 text-purple-300 hover:bg-purple-900/30 transition-colors"
        >
          View in AR (Android)
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Create panels directory**
- [ ] **Step 2: Create ARPanel.tsx**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add apps/web/components/xr/panels/ARPanel.tsx
git commit -m "feat(xr): create ARPanel component for AR preview and launch"
```

---

### Task 2.3: Create MaterialsPanel

**Files:**
- Create: `apps/web/components/xr/panels/MaterialsPanel.tsx`

**Steps:**
1. Create panel with Tailwind CSS
2. Add `onApplyPreset` prop
3. Create preset grid (4 columns, thumbnail + name)
4. Add "Manual" toggle to show/hide sliders
5. Add texture upload button
6. Add ARIA labels on all controls

**Acceptance Criteria:**
- [ ] Presets apply correctly to selected mesh
- [ ] Manual sliders override presets
- [ ] Texture upload works
- [ ] Accessibility compliant

**Key Content:**
```tsx
"use client";

import { useState } from "react";
import type { MaterialOverride, MaterialPreset } from "@viztr/types";
import { MATERIAL_PRESETS } from "@viztr/types";

interface MaterialsPanelProps {
  meshIds: string[];
  selectedMeshId: string | null;
  onSelectMesh: (id: string) => void;
  overrides: Record<string, MaterialOverride>;
  onChange: (meshId: string, patch: Partial<MaterialOverride>) => void;
  onApplyPreset: (meshId: string, preset: MaterialPreset) => void;
}

export function MaterialsPanel({
  meshIds,
  selectedMeshId,
  onSelectMesh,
  overrides,
  onChange,
  onApplyPreset,
}: MaterialsPanelProps) {
  const current = selectedMeshId ? overrides[selectedMeshId] : undefined;
  const [showManual, setShowManual] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Mesh</label>
        <select
          value={selectedMeshId ?? ""}
          onChange={(e) => onSelectMesh(e.target.value)}
          className="w-full bg-purple-950/50 text-white border border-purple-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="" disabled>Select a part...</option>
          {meshIds.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      {selectedMeshId && (
        <>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {MATERIAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(selectedMeshId, preset)}
                  className="aspect-square rounded-lg border border-purple-700 hover:border-teal-500 transition-colors overflow-hidden"
                  aria-label={`Apply ${preset.name} preset`}
                >
                  <img src={preset.thumbnail} alt={preset.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Manual Controls</label>
            <button
              onClick={() => setShowManual(!showManual)}
              className={`w-10 h-5 rounded-full transition-colors ${showManual ? "bg-teal-600" : "bg-gray-600"}`}
              aria-label="Toggle manual controls"
            >
              <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${showManual ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          {showManual && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Base Color</label>
                <input
                  type="color"
                  value={current?.baseColor ?? "#cccccc"}
                  onChange={(e) => onChange(selectedMeshId, { baseColor: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
              <Slider label="Metallic" value={current?.metallic ?? 0} onChange={(v) => onChange(selectedMeshId, { metallic: v })} />
              <Slider label="Roughness" value={current?.roughness ?? 0.5} onChange={(v) => onChange(selectedMeshId, { roughness: v })} />
              <Slider label="Opacity" value={current?.opacity ?? 1} onChange={(v) => onChange(selectedMeshId, { opacity: v })} />
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Emissive</label>
                <input
                  type="color"
                  value={current?.emissive ?? "#000000"}
                  onChange={(e) => onChange(selectedMeshId, { emissive: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
              <Slider label="Emissive Intensity" value={current?.emissiveIntensity ?? 0} onChange={(v) => onChange(selectedMeshId, { emissiveIntensity: v })} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-teal-400 font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-purple-600"
      />
    </div>
  );
}
```

- [ ] **Step 1: Create MaterialsPanel.tsx**
- [ ] **Step 2: Add presets and manual toggle**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add apps/web/components/xr/panels/MaterialsPanel.tsx
git commit -m "feat(xr): create MaterialsPanel with presets and manual controls"
```

---

### Task 2.4: Create LightingPanel

**Files:**
- Create: `apps/web/components/xr/panels/LightingPanel.tsx`

**Steps:**
1. Create panel with Tailwind CSS
2. Add ARIA labels on sliders/selects
3. Add keyboard navigation
4. Use CSS variables for brand colors

**Acceptance Criteria:**
- [ ] Accessibility compliant

**Key Content:**
```tsx
"use client";

import type { EnvironmentSettings } from "@viztr/types";

const HDRI_PRESETS = [
  { label: "Studio - soft", url: "/hdri/studio-soft.env" },
  { label: "Studio - contrast", url: "/hdri/studio-contrast.env" },
  { label: "Outdoor - overcast", url: "/hdri/outdoor-overcast.env" },
  { label: "Outdoor - golden hour", url: "/hdri/outdoor-golden.env" },
];

interface LightingPanelProps {
  env: EnvironmentSettings;
  onChange: (patch: Partial<EnvironmentSettings>) => void;
}

export function LightingPanel({ env, onChange }: LightingPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Environment (HDRI)</label>
        <select
          value={env.hdriUrl}
          onChange={(e) => onChange({ hdriUrl: e.target.value })}
          className="w-full bg-purple-950/50 text-white border border-purple-700 rounded-lg px-3 py-2 text-sm"
        >
          {HDRI_PRESETS.map((p) => (
            <option key={p.url} value={p.url}>{p.label}</option>
          ))}
        </select>
      </div>

      <Slider label="Exposure" value={env.exposure} min={0.1} max={3} onChange={(v) => onChange({ exposure: v })} />

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Background</label>
        <div className="flex gap-2">
          {(["environment", "color", "transparent"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onChange({ background: mode })}
              className={`flex-1 py-2 px-3 rounded-lg text-xs capitalize transition-colors ${
                mode === env.background
                  ? "bg-purple-600 text-white"
                  : "bg-purple-950/50 text-gray-300 hover:bg-purple-900/50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {env.background === "color" && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Color</span>
          <input
            type="color"
            value={env.backgroundColor ?? "#1a1330"}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
      )}

      <Slider label="Shadow Intensity" value={env.shadowIntensity} min={0} max={1} onChange={(v) => onChange({ shadowIntensity: v })} />
      <Slider label="Shadow Softness" value={env.shadowBlur} min={0} max={1} onChange={(v) => onChange({ shadowBlur: v })} />
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-teal-400 font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-purple-600"
      />
    </div>
  );
}
```

- [ ] **Step 1: Create LightingPanel.tsx**
- [ ] **Step 2: Verify**
- [ ] **Step 3: Commit**
```bash
git add apps/web/components/xr/panels/LightingPanel.tsx
git commit -m "feat(xr): create LightingPanel with Tailwind and accessibility"
```

---

### Task 2.5: Create HotspotsPanel

**Files:**
- Create: `apps/web/components/xr/panels/HotspotsPanel.tsx`

**Steps:**
1. Create panel with Tailwind CSS
2. Add hotspot type selector (info/media/navigation)
3. Add media URL field for media hotspots
4. Add ARIA labels
5. Add keyboard navigation for hotspot list

**Acceptance Criteria:**
- [ ] Hotspot types work correctly
- [ ] Media hotspots show URL field
- [ ] Accessibility compliant

**Key Content:**
```tsx
"use client";

import type { Hotspot } from "@viztr/types";

interface HotspotsPanelProps {
  hotspots: Hotspot[];
  isPlacing: boolean;
  onTogglePlacing: () => void;
  onUpdate: (id: string, patch: Partial<Hotspot>) => void;
  onDelete: (id: string) => void;
}

export function HotspotsPanel({ hotspots, isPlacing, onTogglePlacing, onUpdate, onDelete }: HotspotsPanelProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onTogglePlacing}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isPlacing
            ? "bg-teal-600 text-white"
            : "border border-teal-600 text-teal-400 hover:bg-teal-600/20"
        }`}
      >
        {isPlacing ? "Click the model to place..." : "+ Add hotspot"}
      </button>

      {hotspots.length === 0 && <p className="text-xs text-gray-500">No hotspots yet.</p>}

      <div className="space-y-3">
        {hotspots.map((h) => (
          <div key={h.id} className="p-3 border border-purple-700 rounded-lg bg-purple-950/30 space-y-2">
            <input
              placeholder="Label"
              value={h.label}
              onChange={(e) => onUpdate(h.id, { label: e.target.value })}
              className="w-full bg-purple-950/50 border border-purple-700 rounded px-2 py-1 text-sm text-white"
            />
            <textarea
              placeholder="Description (optional)"
              value={h.description ?? ""}
              onChange={(e) => onUpdate(h.id, { description: e.target.value })}
              className="w-full bg-purple-950/50 border border-purple-700 rounded px-2 py-1 text-sm text-white resize-vertical"
              rows={2}
            />
            <input
              placeholder="Link URL (optional)"
              value={h.url ?? ""}
              onChange={(e) => onUpdate(h.id, { url: e.target.value })}
              className="w-full bg-purple-950/50 border border-purple-700 rounded px-2 py-1 text-sm text-white"
            />
            <select
              value={h.type}
              onChange={(e) => onUpdate(h.id, { type: e.target.value as "info" | "media" | "navigation" })}
              className="w-full bg-purple-950/50 border border-purple-700 rounded px-2 py-1 text-sm text-white"
            >
              <option value="info">Info</option>
              <option value="media">Media</option>
              <option value="navigation">Navigation</option>
            </select>
            {h.type === "media" && (
              <input
                placeholder="Media URL"
                value={h.mediaUrl ?? ""}
                onChange={(e) => onUpdate(h.id, { mediaUrl: e.target.value })}
                className="w-full bg-purple-950/50 border border-purple-700 rounded px-2 py-1 text-sm text-white"
              />
            )}
            <button
              onClick={() => onDelete(h.id)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create HotspotsPanel.tsx**
- [ ] **Step 2: Verify**
- [ ] **Step 3: Commit**
```bash
git add apps/web/components/xr/panels/HotspotsPanel.tsx
git commit -m "feat(xr): create HotspotsPanel with type variants and Tailwind"
```

---

### Task 2.6: Create ExportPanel

**Files:**
- Create: `apps/web/components/xr/panels/ExportPanel.tsx`

**Steps:**
1. Create panel with Tailwind CSS
2. Add user-facing error display (toast/alert)
3. Add copy-to-clipboard for embed code
4. Add ARIA labels

**Acceptance Criteria:**
- [ ] Errors display to user
- [ ] Embed code copies correctly
- [ ] Accessibility compliant

**Key Content:**
```tsx
"use client";

import { useState } from "react";

interface ExportPanelProps {
  posterUrl: string | null;
  onCapturePoster: () => void;
  onSaveAndPublish: () => Promise<{ viewerUrl: string; embedCode: string; qrCodeUrl: string } | null>;
  isSaving: boolean;
}

export function ExportPanel({ posterUrl, onCapturePoster, onSaveAndPublish, isSaving }: ExportPanelProps) {
  const [published, setPublished] = useState<{
    viewerUrl: string;
    embedCode: string;
    qrCodeUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setError(null);
    const result = await onSaveAndPublish();
    if (result) {
      setPublished(result);
    } else {
      setError("Publish failed. Please try again.");
    }
  };

  const copyEmbedCode = async () => {
    if (published) {
      await navigator.clipboard.writeText(published.embedCode);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Poster</label>
      {posterUrl && <img src={posterUrl} alt="Poster preview" className="w-full rounded-lg border border-purple-700" />}
      <button
        onClick={onCapturePoster}
        className="w-full py-2 px-4 rounded-lg border border-purple-700 text-purple-300 hover:bg-purple-900/30 transition-colors text-sm"
      >
        Generate poster from current view
      </button>

      <button
        onClick={handlePublish}
        disabled={isSaving}
        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? "Publishing..." : "Save and publish"}
      </button>

      {error && (
        <div className="p-3 bg-red-500/15 border border-red-500/40 text-red-300 text-sm rounded-lg">
          {error}
        </div>
      )}

      {published && (
        <div className="space-y-3 pt-4 border-t border-purple-700">
          <div className="space-y-1">
            <span className="text-xs text-gray-500">Universal Viewer link</span>
            <a href={published.viewerUrl} target="_blank" rel="noreferrer" className="block text-sm text-teal-400 break-all">
              {published.viewerUrl}
            </a>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500">Embed code</span>
            <code className="block text-xs bg-purple-950/50 p-2 rounded text-teal-400 break-all">
              {published.embedCode}
            </code>
            <button onClick={copyEmbedCode} className="text-xs text-purple-400 hover:text-purple-300">
              Copy embed code
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">QR code</span>
            <img src={published.qrCodeUrl} alt="QR code" width={72} height={72} />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Create ExportPanel.tsx**
- [ ] **Step 2: Verify**
- [ ] **Step 3: Commit**
```bash
git add apps/web/components/xr/panels/ExportPanel.tsx
git commit -m "feat(xr): create ExportPanel with error display and Tailwind"
```

---

## Phase 3: Top-level Wiring

### Task 3.1: Create XRConfigurator

**Files:**
- Create: `apps/web/components/xr/XRConfigurator.tsx`

**Steps:**
1. Create component with Tailwind CSS
2. Add undo/redo state history
3. Add keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+S)
4. Add debounced auto-save (3s)
5. Add AR tab (5th tab)
6. Add zod validation before publish
7. Add user-facing error display
8. Add loading skeleton
9. Add real-time dimension overlay
10. Wire all panel components
11. Add pixel streaming session creation
12. Add real-time config sync via WebSocket

**Acceptance Criteria:**
- [ ] Undo/Redo works with keyboard shortcuts
- [ ] Auto-save triggers after 3s
- [ ] AR tab launches/stops AR
- [ ] Validation errors display
- [ ] No `style jsx` remains
- [ ] Streaming session can be created
- [ ] Config changes sync in real-time

**Key Content:**
```tsx
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Vector3 } from "@babylonjs/core";
import { useBabylonScene } from "./useBabylonScene";
import { BabylonCanvas } from "./BabylonCanvas";
import { MaterialsPanel } from "./panels/MaterialsPanel";
import { LightingPanel } from "./panels/LightingPanel";
import { HotspotsPanel } from "./panels/HotspotsPanel";
import { ARPanel } from "./panels/ARPanel";
import { ExportPanel } from "./panels/ExportPanel";
import {
  type XRConfiguration,
  type MaterialOverride,
  type XRConfigurationSchema,
  emptyConfiguration,
} from "@viztr/types";
import { debounce } from "lodash";

type Tab = "materials" | "lighting" | "hotspots" | "ar" | "export";

interface XRConfiguratorProps {
  xrAssetId: string;
  glbUrl: string;
  initialConfig?: XRConfiguration;
}

export default function XRConfigurator({ xrAssetId, glbUrl, initialConfig }: XRConfiguratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<Tab>("materials");
  const [config, setConfig] = useState<XRConfiguration>(
    initialConfig ?? emptyConfiguration(xrAssetId, glbUrl)
  );
  const [meshIds, setMeshIds] = useState<string[]>([]);
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null);
  const [isPlacingHotspot, setIsPlacingHotspot] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(config.posterUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [arState, setArState] = useState<"inactive" | "entering" | "active" | "error">("inactive");

  // Undo/Redo state
  const [history, setHistory] = useState<{ config: XRConfiguration; timestamp: number }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((newConfig: XRConfiguration) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), { config: newConfig, timestamp: Date.now() }]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setConfig(history[historyIndex - 1].config);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setConfig(history[historyIndex + 1].config);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveAndPublish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Mesh pick handler
  const handleMeshPicked = useCallback(
    (meshId: string, point: Vector3) => {
      if (!isPlacingHotspot) return;
      const newHotspot = {
        id: crypto.randomUUID(),
        label: "New hotspot",
        position: [point.x, point.y, point.z] as [number, number, number],
        type: "info" as const,
      };
      setConfig((c) => ({ ...c, hotspots: [...c.hotspots, newHotspot] }));
      setIsPlacingHotspot(false);
    },
    [isPlacingHotspot]
  );

  const scene = useBabylonScene(canvasRef, { onMeshPicked: handleMeshPicked });

  // Load model
  useEffect(() => {
    if (!scene.isReady) return;
    scene.loadModel(config.glbUrl).then(() => {
      const meshes = scene.sceneRef.current?.meshes ?? [];
      setMeshIds(meshes.filter((m) => m.getTotalVertices() > 0).map((m) => m.id));
    });
  }, [scene.isReady, config.glbUrl]);

  // Re-apply environment
  useEffect(() => {
    if (scene.isReady) scene.applyEnvironment(config.environment);
  }, [scene, config.environment]);

  // Re-apply material overrides
  useEffect(() => {
    if (!scene.isReady) return;
    config.materials.forEach((m) => scene.applyMaterialOverride(m));
  }, [scene, config.materials]);

  // Sync hotspot markers
  useEffect(() => {
    scene.syncHotspotMarkers(config.hotspots, config.visibility.hotspotsVisibleByDefault);
  }, [scene, config.hotspots, config.visibility.hotspotsVisibleByDefault]);

  // Material overrides by mesh
  const materialOverridesByMesh: Record<string, MaterialOverride> = {};
  config.materials.forEach((m) => (materialOverridesByMesh[m.meshId] = m));

  // Update material
  const updateMaterial = (meshId: string, patch: Partial<MaterialOverride>) => {
    setConfig((c) => {
      const existingIdx = c.materials.findIndex((m) => m.meshId === meshId);
      const next = [...c.materials];
      if (existingIdx >= 0) {
        next[existingIdx] = { ...next[existingIdx], ...patch };
      } else {
        next.push({ meshId, ...patch });
      }
      return { ...c, materials: next };
    });
  };

  // Apply preset
  const applyPreset = (meshId: string, preset: { baseColor: string; metallic: number; roughness: number }) => {
    updateMaterial(meshId, { baseColor: preset.baseColor, metallic: preset.metallic, roughness: preset.roughness });
  };

  // Capture poster
  const handleCapturePoster = async () => {
    const dataUrl = await scene.capturePoster();
    setPosterUrl(dataUrl);
    setConfig((c) => ({ ...c, posterUrl: dataUrl }));
  };

  // Save and publish
  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/xr-assets/${xrAssetId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Publish failed");
      const data = await res.json();
      return {
        viewerUrl: data.viewerUrl,
        embedCode: `<iframe src="${data.viewerUrl}" width="100%" height="600" style="border:0" allow="xr-spatial-tracking"></iframe>`,
        qrCodeUrl: data.qrCodeUrl,
      };
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save (3s debounce)
  const debouncedAutoSave = useMemo(
    () => debounce(() => {
      if (config !== initialConfig) {
        handleSaveAndPublish();
      }
    }, 3000),
    [config, initialConfig]
  );

  useEffect(() => {
    debouncedAutoSave();
    return () => debouncedAutoSave.cancel();
  }, [config, debouncedAutoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveAndPublish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="grid grid-cols-[1fr_320px] gap-4 h-full min-h-[560px] font-sans">
      <div className="min-h-[400px]">
        <BabylonCanvas
          ref={canvasRef}
          isLoading={scene.isModelLoading}
          error={scene.loadError}
          posterUrl={posterUrl ?? undefined}
        />
      </div>

      <aside className="bg-black border border-purple-800/50 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex gap-1 border-b border-purple-800/50 pb-3">
          {(["materials", "lighting", "hotspots", "ar", "export"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded transition-colors ${
                t === tab ? "bg-purple-900 text-white" : "text-gray-500 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {tab === "materials" && (
            <MaterialsPanel
              meshIds={meshIds}
              selectedMeshId={selectedMeshId}
              onSelectMesh={setSelectedMeshId}
              overrides={materialOverridesByMesh}
              onChange={updateMaterial}
              onApplyPreset={applyPreset}
            />
          )}
          {tab === "lighting" && (
            <LightingPanel
              env={config.environment}
              onChange={(patch) => setConfig((c) => ({ ...c, environment: { ...c.environment, ...patch } }))}
            />
          )}
          {tab === "hotspots" && (
            <HotspotsPanel
              hotspots={config.hotspots}
              isPlacing={isPlacingHotspot}
              onTogglePlacing={() => setIsPlacingHotspot((p) => !p)}
              onUpdate={(id, patch) =>
                setConfig((c) => ({
                  ...c,
                  hotspots: c.hotspots.map((h) => (h.id === id ? { ...h, ...patch } : h)),
                }))
              }
              onDelete={(id) =>
                setConfig((c) => ({ ...c, hotspots: c.hotspots.filter((h) => h.id !== id) }))
              }
            />
          )}
          {tab === "ar" && (
            <ARPanel
              config={config}
              onChange={setConfig}
              onStartAR={scene.startARSession}
              onStopAR={scene.stopARSession}
              arState={arState}
            />
          )}
          {tab === "export" && (
            <ExportPanel
              posterUrl={posterUrl}
              onCapturePoster={handleCapturePoster}
              onSaveAndPublish={handleSaveAndPublish}
              isSaving={isSaving}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 1: Create XRConfigurator.tsx**
- [ ] **Step 2: Add undo/redo, auto-save, AR tab**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add apps/web/components/xr/XRConfigurator.tsx
git commit -m "feat(xr): create XRConfigurator with undo/redo, auto-save, AR tab"
```

---

### Task 3.2: Create XRViewer (Read-only)

**Files:**
- Create: `apps/web/components/xr/XRViewer.tsx`

**Steps:**
1. Create read-only viewer without edit panel
2. Add AR launch buttons (iOS Quick Look, Android WebXR)
3. Add share/embed functionality
4. Add fullscreen toggle
5. Style with Tailwind CSS

**Acceptance Criteria:**
- [ ] Loads without edit panel
- [ ] AR buttons work correctly
- [ ] Share/embed functional

**Key Content:**
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useBabylonScene } from "./useBabylonScene";
import { BabylonCanvas } from "./BabylonCanvas";
import type { XRConfiguration } from "@viztr/types";

interface XRViewerProps {
  config: XRConfiguration;
  glbUrl: string;
  usdzUrl?: string;
}

export default function XRViewer({ config, glbUrl, usdzUrl }: XRViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [arState, setArState] = useState<"inactive" | "entering" | "active" | "error">("inactive");

  const scene = useBabylonScene(canvasRef);

  // Load model
  useEffect(() => {
    if (!scene.isReady) return;
    scene.loadModel(glbUrl);
  }, [scene.isReady, glbUrl]);

  // Apply environment
  useEffect(() => {
    if (scene.isReady) scene.applyEnvironment(config.environment);
  }, [scene, config.environment]);

  // Apply materials
  useEffect(() => {
    if (!scene.isReady) return;
    config.materials.forEach((m) => scene.applyMaterialOverride(m));
  }, [scene, config.materials]);

  // Sync hotspots
  useEffect(() => {
    scene.syncHotspotMarkers(config.hotspots, config.visibility.hotspotsVisibleByDefault);
  }, [scene, config.hotspots, config.visibility.hotspotsVisibleByDefault]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="relative h-full w-full bg-black rounded-xl overflow-hidden">
      <BabylonCanvas
        ref={canvasRef}
        isLoading={scene.isModelLoading}
        error={scene.loadError}
      />

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          onClick={toggleFullscreen}
          className="px-3 py-2 rounded-lg bg-black/50 text-white text-sm hover:bg-black/70 transition-colors"
        >
          Fullscreen
        </button>
        {usdzUrl && (
          <a href={usdzUrl}>
            <button className="px-3 py-2 rounded-lg bg-black/50 text-white text-sm hover:bg-black/70 transition-colors">
              View in AR (iOS)
            </button>
          </a>
        )}
        <button
          onClick={() => scene.startARSession()}
          className="px-3 py-2 rounded-lg bg-black/50 text-white text-sm hover:bg-black/70 transition-colors"
        >
          View in AR (Android)
        </button>
      </div>

      {/* Latency badge */}
      <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/50 text-white text-xs">
        Ready
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create XRViewer.tsx**
- [ ] **Step 2: Verify**
- [ ] **Step 3: Commit**
```bash
git add apps/web/components/xr/XRViewer.tsx
git commit -m "feat(xr): create read-only XRViewer component"
```

---

## Phase 4: Pages & API

### Task 4.1: Create Configurator Page

**Files:**
- Create: `apps/web/app/configurator/[projectId]/page.tsx`

**Steps:**
1. Create RSC shell fetching config from Prisma
2. Dynamic import XRConfigurator with ssr: false
3. Add not found handling
4. Add SEO metadata
5. Style with Tailwind CSS

**Acceptance Criteria:**
- [ ] Loads config correctly
- [ ] 404 for invalid projectId
- [ ] SEO metadata present

**Key Content:**
```tsx
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@viztr/database";

const XRConfigurator = dynamic(() => import("@/components/xr/XRConfigurator"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      Loading configurator...
    </div>
  ),
});

interface PageProps {
  params: { projectId: string };
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Configurator - ${params.projectId}`,
    description: "3D XR Configurator by VizTR",
  };
}

export default async function ConfiguratorPage({ params }: PageProps) {
  const asset = await prisma.xrAsset.findUnique({
    where: { id: params.projectId },
    include: { configurations: { where: { name: "default" } } },
  });

  if (!asset) {
    notFound();
  }

  const initialConfig = asset.configurations[0]
    ? JSON.parse(asset.configurations[0].data as string)
    : undefined;

  return (
    <main className="h-screen p-5 bg-[#050208]">
      <XRConfigurator
        xrAssetId={asset.id}
        glbUrl={asset.glbUrl ?? ""}
        initialConfig={initialConfig}
      />
    </main>
  );
}
```

- [ ] **Step 1: Create page directory**
- [ ] **Step 2: Create page.tsx**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add apps/web/app/configurator/[projectId]/page.tsx
git commit -m "feat(xr): create configurator page with RSC and dynamic import"
```

---

### Task 4.2: Create Viewer Page

**Files:**
- Create: `apps/web/app/view/[configId]/page.tsx`

**Steps:**
1. Create RSC shell fetching config from Prisma
2. Dynamic import XRViewer with ssr: false
3. Add not found handling
4. Add SEO metadata
5. Style with Tailwind CSS

**Acceptance Criteria:**
- [ ] Loads config correctly
- [ ] 404 for invalid configId
- [ ] SEO metadata present

**Key Content:**
```tsx
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@viztr/database";

const XRViewer = dynamic(() => import("@/components/xr/XRViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      Loading viewer...
    </div>
  ),
});

interface PageProps {
  params: { configId: string };
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `3D Viewer - ${params.configId}`,
    description: "3D XR Viewer by VizTR",
  };
}

export default async function ViewerPage({ params }: PageProps) {
  const config = await prisma.configuration.findUnique({
    where: { id: params.configId },
    include: { xrAsset: true },
  });

  if (!config) {
    notFound();
  }

  return (
    <main className="h-screen bg-black">
      <XRViewer
        config={JSON.parse(config.data)}
        glbUrl={config.xrAsset.glbUrl ?? ""}
        usdzUrl={config.xrAsset.usdzUrl ?? undefined}
      />
    </main>
  );
}
```

- [ ] **Step 1: Create view directory**
- [ ] **Step 2: Create page.tsx**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add apps/web/app/view/[configId]/page.tsx
git commit -m "feat(xr): create viewer page with RSC and dynamic import"
```

---

### Task 4.3: Create API Route

**Files:**
- Create: `apps/web/app/api/xr-assets/[id]/config/route.ts`

**Steps:**
1. Create POST handler for saving config
2. Create GET handler for fetching config
3. Add Supabase JWT authentication
4. Add zod validation on POST body
5. Add rate limiting (10 req/min per user)
6. Add CORS headers
7. Add audit logging
8. Add error handling for Prisma queries

**Acceptance Criteria:**
- [ ] Unauthenticated requests rejected
- [ ] Invalid input rejected with 400
- [ ] Rate limits enforced
- [ ] Audit logs created
- [ ] CORS headers present

**Key Content:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@viztr/database";
import QRCode from "qrcode";
import { XRConfigurationSchema } from "@viztr/types";
import { z } from "zod";

// Rate limiting
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimit.get(userId);

  if (!limit || now > limit.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (limit.count >= 10) return false;
  limit.count++;
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate input
  const body = await req.json();
  const result = XRConfigurationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid configuration", details: result.error }, { status: 400 });
  }

  const config = result.data;

  // Check asset exists
  const asset = await prisma.xrAsset.findUnique({ where: { id: params.id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  // Upsert configuration
  const saved = await prisma.configuration.upsert({
    where: { xrAssetId_name: { xrAssetId: params.id, name: config.name } },
    update: { data: JSON.stringify(config) },
    create: {
      id: config.id,
      xrAssetId: params.id,
      name: config.name,
      data: JSON.stringify(config),
    },
  });

  const viewerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/view/${saved.id}`;
  const qrCodeUrl = await QRCode.toDataURL(viewerUrl, { margin: 1, width: 300 });

  return NextResponse.json({
    configId: saved.id,
    viewerUrl,
    qrCodeUrl,
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const config = await prisma.configuration.findFirst({
    where: { xrAssetId: params.id, name: "default" },
  });

  if (!config) {
    return NextResponse.json({ error: "No configuration found" }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(config.data));
}
```

- [ ] **Step 1: Create api directory**
- [ ] **Step 2: Create route.ts**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add apps/web/app/api/xr-assets/[id]/config/route.ts
git commit -m "feat(xr): create API route for XR configuration"
```

---

## Phase 5: Assets & Testing

### Task 5.1: Create HDRI Presets

**Files:**
- Create: `apps/web/public/hdri/` directory (placeholder)

**Steps:**
1. Create hdri directory
2. Document HDRI baking process
3. Create placeholder README

**Acceptance Criteria:**
- [ ] Directory structure created
- [ ] Documentation present

- [ ] **Step 1: Create directory**
- [ ] **Step 2: Create README**
- [ ] **Step 3: Commit**
```bash
git add apps/web/public/hdri/
git commit -m "feat(xr): add HDRI preset directory with documentation"
```

---

### Task 5.2: Create Material Preset Thumbnails

**Files:**
- Create: `apps/web/public/presets/` directory (placeholder)

**Steps:**
1. Create presets directory
2. Create placeholder README

**Acceptance Criteria:**
- [ ] Directory structure created

- [ ] **Step 1: Create directory**
- [ ] **Step 2: Create README**
- [ ] **Step 3: Commit**
```bash
git add apps/web/public/presets/
git commit -m "feat(xr): add material preset directory"
```

---

### Task 5.3: Write Tests

**Files:**
- Create: `apps/web/components/xr/__tests__/useBabylonScene.test.ts`
- Create: `apps/web/components/xr/__tests__/XRConfigurator.test.ts`
- Create: `apps/web/app/api/xr-assets/[id]/config/__tests__/route.test.ts`

**Steps:**
1. Write unit tests for useBabylonScene hook
2. Write integration tests for XRConfigurator
3. Write API route tests with mocked Prisma
4. Achieve 90%+ coverage

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] 90%+ coverage on new code
- [ ] No `any` types in tests

- [ ] **Step 1: Write useBabylonScene tests**
- [ ] **Step 2: Write XRConfigurator tests**
- [ ] **Step 3: Write API route tests**
- [ ] **Step 4: Verify coverage**
- [ ] **Step 5: Commit**
```bash
git add apps/web/components/xr/__tests__/ apps/web/app/api/xr-assets/[id]/config/__tests__/
git commit -m "test(xr): add comprehensive tests for XR configurator"
```

---

## Phase 6: Pixel Streaming

### Task 6.1: Create Pixel Viewer Component

**Files:**
- Create: `apps/web/components/xr/pixel-viewer.tsx`

**Steps:**
1. Create WebRTC viewer component
2. Add video stream rendering
3. Add input event forwarding
4. Add latency badge
5. Add fullscreen toggle
6. Style with Tailwind CSS

**Acceptance Criteria:**
- [ ] Video stream renders correctly
- [ ] Input events forwarded
- [ ] Latency badge displays RTCP stats

**Key Content:**
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { InputEvent } from "@viztr/types";

interface PixelViewerProps {
  sessionId: string;
  mode: "viewer" | "configurator";
  onInputEvent?: (event: InputEvent) => void;
  onLatencyUpdate?: (latency: number) => void;
}

export function PixelViewer({ sessionId, mode, onInputEvent, onLatencyUpdate }: PixelViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    // WebRTC connection setup
    const pc = new RTCPeerConnection();

    // Handle incoming video track
    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    // Track latency via RTCP stats
    const interval = setInterval(async () => {
      const stats = await pc.getStats();
      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          const latency = report.jitterBufferDelay * 1000;
          setLatency(Math.round(latency));
          onLatencyUpdate?.(Math.round(latency));
        }
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      pc.close();
    };
  }, [sessionId]);

  // Input event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onInputEvent?.({
      type: "mouse:move",
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onInputEvent?.({
      type: "mouse:down",
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      button: e.button,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onInputEvent?.({
      type: "mouse:up",
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      button: e.button,
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    onInputEvent?.({ type: "wheel", delta: e.deltaY });
  };

  return (
    <div className="relative h-full w-full bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Latency badge */}
      <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/50 text-white text-xs">
        {latency}ms
      </div>

      {/* Mode indicator */}
      <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/50 text-white text-xs">
        {mode === "configurator" ? "Configurator" : "Viewer"}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create pixel-viewer.tsx**
- [ ] **Step 2: Verify**
- [ ] **Step 3: Commit**
```bash
git add apps/web/components/xr/pixel-viewer.tsx
git commit -m "feat(xr): create PixelViewer component for WebRTC streaming"
```

---

### Task 6.2: Create ConfiguratorStream Component

**Files:**
- Create: `apps/web/components/xr/ConfiguratorStream.tsx`

**Steps:**
1. Create streaming wrapper component
2. Integrate PixelViewer
3. Add session management
4. Add permission display
5. Style with Tailwind CSS

**Acceptance Criteria:**
- [ ] Remote users see configurator video stream
- [ ] Remote users can view panels
- [ ] Session management works

**Key Content:**
```tsx
"use client";

import { useState, useEffect } from "react";
import { PixelViewer } from "./pixel-viewer";
import { MaterialsPanel } from "./panels/MaterialsPanel";
import { LightingPanel } from "./panels/LightingPanel";
import { HotspotsPanel } from "./panels/HotspotsPanel";
import type { XRConfiguration, InputEvent } from "@viztr/types";

interface ConfiguratorStreamProps {
  sessionId: string;
  config: XRConfiguration;
  isHost: boolean;
}

export function ConfiguratorStream({ sessionId, config, isHost }: ConfiguratorStreamProps) {
  const [currentConfig, setCurrentConfig] = useState(config);
  const [latency, setLatency] = useState(0);

  // Handle input events from remote viewer
  const handleInputEvent = (event: InputEvent) => {
    // Forward to host via WebSocket
    console.log("Input event:", event);
  };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-4 h-full">
      {/* Video stream or local canvas */}
      <div className="relative">
        {isHost ? (
          <div className="h-full bg-black rounded-xl flex items-center justify-center text-white">
            Local rendering (host)
          </div>
        ) : (
          <PixelViewer
            sessionId={sessionId}
            mode="configurator"
            onInputEvent={handleInputEvent}
            onLatencyUpdate={setLatency}
          />
        )}

        {/* Latency badge */}
        {!isHost && (
          <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/50 text-white text-xs">
            {latency}ms
          </div>
        )}
      </div>

      {/* Side panel - read-only for remote users */}
      <aside className={`bg-black border border-purple-800/50 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto ${!isHost ? "opacity-75" : ""}`}>
        <div className="flex gap-1 border-b border-purple-800/50 pb-3">
          {["materials", "lighting", "hotspots"].map((t) => (
            <button
              key={t}
              className="flex-1 py-1.5 text-xs uppercase tracking-wider rounded text-gray-500"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {!isHost && (
            <div className="text-xs text-gray-500 mb-4">
              View only - contact host to make changes
            </div>
          )}
          {/* Panels would go here - simplified for now */}
        </div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 1: Create ConfiguratorStream.tsx**
- [ ] **Step 2: Verify**
- [ ] **Step 3: Commit**
```bash
git add apps/web/components/xr/ConfiguratorStream.tsx
git commit -m "feat(xr): create ConfiguratorStream for pixel streaming"
```

---

### Task 6.3: Create Input Handler

**Files:**
- Create: `apps/web/lib/xr/input-handler.ts`

**Steps:**
1. Create input event types
2. Create input handler factory
3. Add mouse event handling
4. Add touch event handling
5. Add wheel event handling

**Acceptance Criteria:**
- [ ] Mouse events captured
- [ ] Touch events captured
- [ ] Wheel events captured

**Key Content:**
```typescript
import type { InputEvent } from "@viztr/types";

export function createInputHandler(
  canvas: HTMLCanvasElement,
  sendInput: (event: InputEvent) => void
) {
  // Mouse events
  const handleMouseDown = (e: MouseEvent) => {
    sendInput({
      type: "mouse:down",
      x: (e.target as HTMLElement).offsetLeft + e.offsetX,
      y: (e.target as HTMLElement).offsetTop + e.offsetY,
      button: e.button,
    });
  };

  const handleMouseUp = (e: MouseEvent) => {
    sendInput({
      type: "mouse:up",
      x: (e.target as HTMLElement).offsetLeft + e.offsetX,
      y: (e.target as HTMLElement).offsetTop + e.offsetY,
      button: e.button,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    sendInput({
      type: "mouse:move",
      x: (e.target as HTMLElement).offsetLeft + e.offsetX,
      y: (e.target as HTMLElement).offsetTop + e.offsetY,
    });
  };

  // Touch events
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    sendInput({
      type: "touch:start",
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    sendInput({
      type: "touch:move",
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
    });
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    sendInput({
      type: "touch:end",
      id: touch.identifier,
    });
  };

  // Wheel event
  const handleWheel = (e: WheelEvent) => {
    sendInput({
      type: "wheel",
      delta: e.deltaY,
    });
  };

  // Attach listeners
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
  canvas.addEventListener("wheel", handleWheel);

  // Return cleanup function
  return () => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchmove", handleTouchMove);
    canvas.removeEventListener("touchend", handleTouchEnd);
    canvas.removeEventListener("wheel", handleWheel);
  };
}
```

- [ ] **Step 1: Create input-handler.ts**
- [ ] **Step 2: Verify**
- [ ] **Step 3: Commit**
```bash
git add apps/web/lib/xr/input-handler.ts
git commit -m "feat(xr): create input handler for pixel streaming"
```

---

### Task 6.4: Create Session Manager

**Files:**
- Create: `apps/web/components/xr/SessionManager.tsx`
- Create: `apps/web/app/api/configurator-sessions/route.ts`

**Steps:**
1. Create session API routes (POST, GET)
2. Create SessionManager component
3. Add session creation
4. Add share link generation
5. Add QR code generation
6. Add viewer list
7. Style with Tailwind CSS

**Acceptance Criteria:**
- [ ] Host can create streaming session
- [ ] Share link generated
- [ ] QR code generated
- [ ] Viewer list displays connected users
- [ ] Session ends when host disconnects

**Key Content for SessionManager:**
```tsx
"use client";

import { useState } from "react";
import QRCode from "qrcode";

interface SessionManagerProps {
  projectId: string;
}

export function SessionManager({ projectId }: SessionManagerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [viewers, setViewers] = useState<{ id: string; joinedAt: string }[]>([]);

  const createSession = async () => {
    const res = await fetch("/api/configurator-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json();
    setSessionId(data.sessionId);
    setShareUrl(data.shareUrl);

    // Generate QR code
    const qr = await QRCode.toDataURL(data.shareUrl, { margin: 1, width: 200 });
    setQrCodeUrl(qr);
  };

  return (
    <div className="space-y-4">
      {!sessionId ? (
        <button
          onClick={createSession}
          className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium"
        >
          Start Streaming
        </button>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-purple-900/30 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Share Link</div>
            <div className="text-sm text-teal-400 break-all">{shareUrl}</div>
          </div>

          {qrCodeUrl && (
            <div className="flex justify-center">
              <img src={qrCodeUrl} alt="QR Code" width={150} height={150} />
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs text-gray-400">Connected Viewers ({viewers.length})</div>
            {viewers.map((v) => (
              <div key={v.id} className="text-xs text-gray-500">
                {v.id} - joined {new Date(v.joinedAt).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Create SessionManager.tsx**
- [ ] **Step 2: Create session API route**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**
```bash
git add apps/web/components/xr/SessionManager.tsx apps/web/app/api/configurator-sessions/route.ts
git commit -m "feat(xr): create SessionManager and session API route"
```

---

### Task 6.5: Create Permission Manager

**Files:**
- Create: `apps/web/components/xr/PermissionManager.tsx`

**Steps:**
1. Create permission management component
2. Add public/private toggle
3. Add user permission management
4. Style with Tailwind CSS

**Acceptance Criteria:**
- [ ] Public/private toggle works
- [ ] Edit permissions can be granted
- [ ] Permissions enforced on join
- [ ] Host always has full access

**Key Content:**
```tsx
"use client";

import { useState } from "react";
import type { SessionPermissions } from "@viztr/types";

interface PermissionManagerProps {
  sessionId: string;
  permissions: SessionPermissions;
  onUpdate: (permissions: SessionPermissions) => void;
}

export function PermissionManager({ sessionId, permissions, onUpdate }: PermissionManagerProps) {
  const [isPublic, setIsPublic] = useState(permissions.isPublic);

  const togglePublic = async () => {
    const newPermissions = { ...permissions, isPublic: !isPublic };
    setIsPublic(!isPublic);
    onUpdate(newPermissions);

    await fetch(`/api/configurator-sessions/${sessionId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPermissions),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">Public Access</label>
        <button
          onClick={togglePublic}
          className={`w-10 h-5 rounded-full transition-colors ${isPublic ? "bg-teal-600" : "bg-gray-600"}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      <div className="text-xs text-gray-500">
        {isPublic ? "Anyone with the link can view" : "Only invited users can view"}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create PermissionManager.tsx**
- [ ] **Step 2: Verify**
- [ ] **Step 3: Commit**
```bash
git add apps/web/components/xr/PermissionManager.tsx
git commit -m "feat(xr): create PermissionManager for session access control"
```

---

## Implementation Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 0: Foundation | 2 tasks | 1 hour |
| Phase 1: Core Engine | 1 task | 1 hour |
| Phase 2: UI Components | 6 tasks | 2.5 hours |
| Phase 3: Top-level Wiring | 2 tasks | 1.5 hours |
| Phase 4: Pages & API | 3 tasks | 1.5 hours |
| Phase 5: Assets & Testing | 3 tasks | 1.5 hours |
| Phase 6: Pixel Streaming | 5 tasks | 3 hours |
| **Total** | **22 tasks** | **~12 hours** |

---

## Dependencies

```
Phase 0 (Prisma + Types)
    ↓
Phase 1 (useBabylonScene)
    ↓
Phase 2 (UI Components)
    ↓
Phase 3 (XRConfigurator)
    ↓
Phase 4 (Pages & API)
    ↓
Phase 5 (Assets & Testing)
    ↓
Phase 6 (Pixel Streaming)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Prisma schema conflicts | Check existing schema before merge |
| WebXR not supported | Fallback to recorded video |
| Large bundle size | Dynamic import, code splitting |
| HDRI loading slow | Pre-bake, CDN cache |
| AR session fails | Graceful degradation to 3D viewer |
| WebRTC latency high | TURN fallback, adaptive bitrate |
| Config sync conflicts | Last-write-wins with timestamps |

---

## Definition of Done

- [ ] All 22 tasks completed
- [ ] All acceptance criteria met
- [ ] 90%+ test coverage
- [ ] No `style jsx` remains
- [ ] All components Tailwind CSS
- [ ] WCAG 2.1 AA compliant
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Documentation updated
- [ ] Pixel streaming works with < 100ms latency
- [ ] Remote users can view and interact with configurator
```

---

**Planning file written successfully.** 

Now I can begin scaffolding the project. Shall I proceed with Phase 0 (Prisma + Types)?