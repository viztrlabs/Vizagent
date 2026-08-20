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
      sceneId: '',
      hotspotType: (typeof h.type === 'string' ? h.type : 'info') as TourHotspot['hotspotType'],
      label: h.label as string,
      description: typeof h.description === 'string' ? h.description : undefined,
      url: isSafeUrl(h.url) ? h.url : undefined,
      targetSceneId:
        typeof h.targetSceneId === 'string' && sceneIds.has(h.targetSceneId)
          ? h.targetSceneId
          : undefined,
      yaw: h.yaw as number,
      pitch: h.pitch as number,
      galleryId: undefined,
      floorId: undefined,
      scene3dId: undefined,
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
    floorPlan: typeof settings.floorPlan === 'string' ? settings.floorPlan : undefined,
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

    const hotspots = normalizeHotspots(meta.hotspots, sceneIds).map((h) => ({
      ...h,
      sceneId: asset.id,
    }));

    return {
      id: asset.id,
      projectId: input.project.id,
      title,
      equirectangularUrl: input.publicUrlFor(asset.storage_path),
      sortOrder: index,
      ...(initialView ? { initialView } : {}),
      hotspots,
    };
  });

  if (scenes.every((scene) => scene.hotspots.length === 0)) {
    const legacyHotspots = normalizeHotspots(settings.hotspots, sceneIds).map((h) => ({
      ...h,
      sceneId: imageAssets[0].id,
    }));
    if (legacyHotspots.length > 0) {
      scenes[0] = { ...scenes[0], hotspots: legacyHotspots };
    }
  }

  return {
    id: input.project.id,
    projectId: input.project.id,
    title: input.project.name,
    scenes,
    settings: normalizeSettings(settings, sceneIds),
  };
}
