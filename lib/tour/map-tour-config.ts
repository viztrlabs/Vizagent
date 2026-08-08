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
