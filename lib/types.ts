export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  service_type: 'tour';
  status: ProjectStatus;
  settings: ProjectSettings;
  budget?: number;
  deadline?: Date;
  published_url?: string;
  created_at: Date;
  updated_at: Date;
}

export type ProjectStatus = 'draft' | 'uploaded' | 'qa_pending' | 'qa_passed' | 'published';

export interface ProjectSettings {
  cameraHeight: number;
  autoRotate: boolean;
  hotspotStyle: 'pin' | 'circle';
}

// CamelCase Asset matching Prisma model + asset.repository.ts
// status includes 'uploading' which is used during multipart upload
export interface Asset {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  thumbnailPath?: string;
  status: 'uploaded' | 'validating' | 'ready' | 'failed' | 'uploading';
  createdAt: Date;
  tenantId?: string;
}

// XrAsset — mirrors Prisma model (lines 114–133)
export interface XrAsset {
  id: string;
  projectId: string;
  type: 'model3d' | 'equirect';
  service: 'vr' | 'mr' | 'webAR' | 'tour' | 'webXR';
  glbUrl?: string;
  equirectUrl?: string;
  usdzUrl?: string;
  fileSizeBytes?: number;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

// Configuration — mirrors Prisma model (lines 135–150)
export interface Configuration {
  id: string;
  xrAssetId: string;
  name: string;
  data: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

// ConfiguratorSession — mirrors Prisma model (lines 152–174)
export interface ConfiguratorSession {
  id: string;
  projectId: string;
  hostId: string;
  config: string;
  shareToken: string;
  isActive: boolean;
  permissions: {
    canEdit: string[];
    canView: string[];
    isPublic: boolean;
  };
  startAt?: Date;
  reminderSentAt?: Date;
  gcalEventId?: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

// ---- Types derived from lib/xr/validation.ts zod schemas ----

export interface MaterialData {
  id: string;
  name: string;
  albedo: string; // hex #RRGGBB
  metallic: number; // 0..1
  roughness: number; // 0..1
  normalScale: number; // 0..2
  emissiveColor: string; // hex #RRGGBB
  emissiveIntensity: number; // 0..10
  opacity: number; // 0..1
  doubleSided: boolean;
}

export interface ObjectData {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface LightData {
  id: string;
  name: string;
  enabled: boolean;
  type: 'hemisphere' | 'directional' | 'point' | 'spot';
  color: string; // hex #RRGGBB
  intensity: number; // 0..100
  position: [number, number, number];
  castShadow: boolean;
}

export interface ConfigData {
  scene: {
    bg: string; // hex #RRGGBB
    exposure: number; // 0..5
    toneMapping: string;
    environment: string;
  };
  materials: MaterialData[];
  objects: ObjectData[];
  lights: LightData[];
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number; // 10..120
  };
}

// PeerConnection — for pixel streaming (StreamViewer.tsx:14,33)
export interface PeerConnection {
  peerId: string;
  userId: string;
  connectionState: 'connected' | 'connecting' | 'disconnected' | 'failed';
}

// ---- Existing types (snake_case preserved for backward compat) ----

export interface QAReport {
  id: string;
  project_id: string;
  qa_status: 'pending' | 'running' | 'passed' | 'failed';
  checks: QACheck[];
  issues: string[];
  checked_at?: Date;
}

export interface QACheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'client';
}

export interface Deployment {
  id: string;
  project_id: string;
  environment: 'preview' | 'production';
  status: 'pending' | 'deploying' | 'success' | 'failed';
  preview_url?: string;
  public_url?: string;
  deployed_at?: Date;
}