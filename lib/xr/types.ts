// src/lib/xr/types.ts
// Shared data model for a VizTR XR configuration.
// This is what gets persisted to Postgres via Prisma and hydrated back
// into a live Babylon.js scene at runtime.

export interface MaterialOverride {
  meshId: string;         // Babylon mesh name/id, from GLB node names
  baseColor?: string;     // hex, e.g. "#6B21A8"
  metallic?: number;      // 0-1
  roughness?: number;     // 0-1
  emissive?: string;      // hex
  emissiveIntensity?: number;
  opacity?: number;       // 0-1
  textureUrl?: string;    // optional swapped albedo texture
}

export interface EnvironmentSettings {
  hdriUrl: string;        // .env (pre-baked PMREM) or .hdr
  exposure: number;       // tone mapping exposure
  background: "environment" | "color" | "transparent";
  backgroundColor?: string;
  shadowIntensity: number; // 0-1
  shadowBlur: number;      // 0-1
}

export interface Hotspot {
  id: string;
  label: string;
  description?: string;
  url?: string;
  position: [number, number, number]; // local space, relative to model root
}

export interface DimensionSettings {
  realWorldSizeCm: [number, number, number]; // x,y,z as measured
  scale: number; // uniform scale applied on top of native size
}

export interface XRConfiguration {
  id: string;
  xrAssetId: string;       // FK -> uploaded GLB asset
  name: string;
  materials: MaterialOverride[];
  environment: EnvironmentSettings;
  hotspots: Hotspot[];
  dimensions: DimensionSettings;
  visibility: {
    arEnabled: boolean;
    autostartViewer: boolean;
    hotspotsVisibleByDefault: boolean;
    dimensionsVisibleByDefault: boolean;
    placement: "floor" | "wall";
  };
  posterUrl?: string;
  glbUrl: string;
  usdzUrl?: string; // generated server-side for iOS AR Quick Look
  updatedAt: string;
}

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
