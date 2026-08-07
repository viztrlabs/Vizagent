// Original MVP types
export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  serviceType: 'tour';
  status: ProjectStatus;
  settings: ProjectSettings;
  budget?: number;
  deadline?: Date;
  publishedUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'draft' | 'uploaded' | 'qa_pending' | 'qa_passed' | 'published';

export interface ProjectSettings {
  cameraHeight: number;
  autoRotate: boolean;
  hotspotStyle: 'pin' | 'circle';
}

export interface Asset {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  thumbnailPath?: string;
  status: 'uploaded' | 'validating' | 'ready' | 'failed';
  createdAt: Date;
}

export interface QAReport {
  id: string;
  projectId: string;
  qaStatus: 'pending' | 'running' | 'passed' | 'failed';
  checks: QACheck[];
  issues: string[];
  checkedAt?: Date;
}

export interface QACheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'client';
}

export interface Deployment {
  id: string;
  projectId: string;
  environment: 'preview' | 'production';
  status: 'pending' | 'deploying' | 'success' | 'failed';
  previewUrl?: string;
  publicUrl?: string;
  deployedAt?: Date;
}

// XR Configurator types
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
}

export interface Configuration {
  id: string;
  xrAssetId: string;
  name: string;
  data: string; // JSON stringified ConfigData
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigData {
  scene: { bg: string; exposure: number; toneMapping: string; environment: string };
  materials: MaterialData[];
  objects: ObjectData[];
  lights: LightData[];
  camera: { position: [number, number, number]; target: [number, number, number]; fov: number };
}

export interface MaterialData {
  id: string;
  name: string;
  albedo: string;
  metallic: number;
  roughness: number;
  normalScale: number;
  emissiveColor: string;
  emissiveIntensity: number;
  opacity: number;
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
  color: string;
  intensity: number;
  position: [number, number, number];
  castShadow: boolean;
}

export interface ConfiguratorSession {
  id: string;
  projectId: string;
  hostId: string;
  config: string; // JSON stringified ConfigData
  shareToken: string;
  isActive: boolean;
  permissions: { canEdit: string[]; canView: string[]; isPublic: boolean };
  startAt?: Date;
  reminderSentAt?: Date;
  gcalEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Viewer {
  id: string;
  sessionId: string;
  userId?: string;
  joinedAt: Date;
  leftAt?: Date;
}

export interface PeerConnection {
  peerId: string;
  userId: string;
  stream?: MediaStream;
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed';
}
