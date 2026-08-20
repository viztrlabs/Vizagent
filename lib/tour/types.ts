export type TourSettings = {
  floors?: Array<{ id: string; name: string; order: number }>;
  floorPlan?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  hotspotStyle?: 'minimal' | 'pin';
  startSceneId?: string;
  // Audio settings
  audioUrl?: string;
  // Visual effects
  brightness?: number; // -100 to 100
  contrast?: number;   // -100 to 100
  saturation?: number; // -100 to 100
  // Transition settings
  transitionDuration?: number; // in seconds, default 0.5
  [key: string]: unknown;
};

export type TourConfig = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  viewCount?: number;
  settings: TourSettings;
  scenes: TourScene[];
  model3d?: TourScene3DConfig[];
};

export type TourScene = {
  id: string;
  projectId: string;
  floorId?: string | null;
  title: string;
  equirectangularUrl: string;
  initialView?: TourView;
  floorPlanPosition?: Record<string, unknown>;
  sortOrder: number;
  effects?: Record<string, unknown>;
  hotspots: TourHotspot[];
  galleryItems?: TourGalleryItem[];
};

export type TourHotspot = {
  id: string;
  sceneId: string;
  hotspotType: 'navigation' | 'info' | 'gallery' | 'floorplan';
  label?: string;
  description?: string;
  yaw: number;
  pitch: number;
  targetSceneId?: string | null;
  url?: string | null;
  galleryId?: string | null;
  floorId?: string | null;
  scene3dId?: string | null;
};

export type TourGalleryItem = {
  id: string;
  galleryId: string;
  imageUrl: string;
  caption?: string | null;
  sortOrder: number;
  is360: boolean;
  sceneId?: string | null;
};

export type TourView = {
  yaw: number;
  pitch: number;
  fov?: number;
};

export type TourScene3DConfig = {
  sceneId: string;
  modelUrl?: string;
  pointCloudUrl?: string;
  floorPlanPosition?: { x: number; y: number };
};