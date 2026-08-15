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