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
