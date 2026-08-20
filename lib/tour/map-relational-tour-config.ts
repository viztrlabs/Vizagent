import type {
  TourConfig,
  TourFloorConfig,
  TourHotspot,
  TourScene,
  TourSettings,
  TourView,
  WalkthroughConfig,
} from './types';

export interface RelationalTourProject {
  id: string;
  name: string;
  description?: string | null;
  settings?: unknown;
  viewCount?: number;
}

export interface RelationalTourHotspot {
  id: string;
  scene_id: string;
  type?: string | null;
  label?: string | null;
  yaw: number;
  pitch: number;
  target_scene_id?: string | null;
  url?: string | null;
  gallery_id?: string | null;
}

export interface RelationalTourScene {
  id: string;
  project_id: string;
  floor_id?: string | null;
  title: string;
  equirectangular_url: string;
  sort_order: number;
  initial_view?: unknown;
  floor_plan_position?: unknown;
  effects?: unknown;
  hotspots: RelationalTourHotspot[];
}

export interface RelationalTourFloor {
  id: string;
  project_id: string;
  name: string;
  level: number;
  sort_order: number;
  svg_path?: string | null;
}

export interface RelationalTourWalkthrough {
  id: string;
  project_id: string;
  title: string;
  path: unknown;
  active: boolean;
}

export interface MapRelationalTourConfigInput {
  project: RelationalTourProject;
  scenes: RelationalTourScene[];
  floors: RelationalTourFloor[];
  walkthroughs: RelationalTourWalkthrough[];
}

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

function normalizeHotspotType(type: string | null | undefined): TourHotspot['hotspotType'] {
  if (type === 'navigation' || type === 'gallery' || type === 'floorplan') {
    return type;
  }
  return 'info';
}

export function mapRelationalTourConfig(
  input: MapRelationalTourConfigInput
): TourConfig {
  const project = input.project;
  const settings = parseSettings(project.settings);

  const scenes: TourScene[] = input.scenes.map((s) => ({
    id: s.id,
    projectId: project.id,
    floorId: s.floor_id ?? null,
    title: s.title,
    equirectangularUrl: s.equirectangular_url,
    sortOrder: s.sort_order,
    ...(normalizeInitialView(s.initial_view)
      ? { initialView: normalizeInitialView(s.initial_view) }
      : {}),
    ...(s.floor_plan_position
      ? { floorPlanPosition: s.floor_plan_position as Record<string, unknown> }
      : {}),
    ...(s.effects ? { effects: s.effects as Record<string, unknown> } : {}),
    hotspots: (s.hotspots ?? []).map((h) => ({
      id: h.id,
      sceneId: h.scene_id,
      hotspotType: normalizeHotspotType(h.type),
      ...(h.label ? { label: h.label } : {}),
      yaw: h.yaw,
      pitch: h.pitch,
      ...(h.target_scene_id ? { targetSceneId: h.target_scene_id } : {}),
      ...(h.url ? { url: h.url } : {}),
      ...(h.gallery_id ? { galleryId: h.gallery_id } : {}),
    })),
  }));

  const floors: TourFloorConfig[] = input.floors.map((f) => ({
    id: f.id,
    name: f.name,
    level: f.level,
    sortOrder: f.sort_order,
    ...(f.svg_path ? { svgPath: f.svg_path } : {}),
    sceneIds: scenes.filter((s) => s.floorId === f.id).map((s) => s.id),
  }));

  const walkthroughs: WalkthroughConfig[] = input.walkthroughs.map((w) => ({
    id: w.id,
    title: w.title,
    path: (Array.isArray(w.path) ? w.path : []) as WalkthroughConfig['path'],
    active: w.active,
  }));

  const tourSettings: TourSettings = {
    ...settings,
    floors: floors.map((f) => ({ id: f.id, name: f.name, order: f.level })),
  };

  return {
    id: project.id,
    projectId: project.id,
    title: project.name,
    ...(project.description ? { description: project.description } : {}),
    ...(typeof project.viewCount === 'number' ? { viewCount: project.viewCount } : {}),
    settings: tourSettings,
    scenes,
    ...(floors.length > 0 ? { floors } : {}),
    ...(walkthroughs.length > 0 ? { walkthroughs } : {}),
  };
}