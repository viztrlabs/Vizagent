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
  floors?: TourFloorConfig[];
  galleries?: TourGalleryConfig[];
  walkthroughs?: WalkthroughConfig[];
  accessControl?: AccessControlConfig;
  branding?: BrandingConfig;
  visualEffects?: VisualEffectsConfig;
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

export type TourFloorConfig = {
  id: string;
  name: string;
  level: number;
  sortOrder: number;
  svgPath?: string;
  sceneIds: string[];
};

export type TourGalleryImage = {
  id: string;
  imageUrl: string;
  caption?: string;
  is360: boolean;
};

export type TourGalleryConfig = {
  id: string;
  title: string;
  images: TourGalleryImage[];
};

export type WalkthroughWaypoint = {
  sceneId: string;
  targetView: { yaw: number; pitch: number; fov?: number };
  durationMs: number;
  transition?: 'auto' | 'manual' | 'fade' | 'slide';
};

export type WalkthroughConfig = {
  id: string;
  title: string;
  path: WalkthroughWaypoint[];
  active: boolean;
};

export type TourScene3DConfig = {
  sceneId: string;
  modelUrl?: string;
  pointCloudUrl?: string;
  floorPlanPosition?: { x: number; y: number };
};

export type BrandingConfig = {
  primaryColor?: string;
  logoUrl?: string;
  coverImage?: string;
};

export type AccessControlConfig = {
  type: 'public' | 'password' | 'token';
  passwordHash?: string;
  allowedTokens?: string[];
};

export type VisualEffectsConfig = {
  brightness: number;
  contrast: number;
  saturation: number;
};