// Original MVP types
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

export interface Asset {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path?: string;
  status: 'uploaded' | 'validating' | 'ready' | 'failed';
  created_at: Date;
}

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

// XR Configurator types
export interface XrAsset {
  id: string;
  project_id: string;
  type: 'model3d' | 'equirect';
  service: 'vr' | 'mr' | 'webAR' | 'tour' | 'webXR';
  glb_url?: string;
  equirect_url?: string;
  usdz_url?: string;
  file_size_bytes?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Configuration {
  id: string;
  xr_asset_id: string;
  name: string;
  data: string; // JSON stringified ConfigData
  created_at: Date;
  updated_at: Date;
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
  project_id: string;
  host_id: string;
  config: string; // JSON stringified ConfigData
  share_token: string;
  is_active: boolean;
  permissions: { canEdit: string[]; canView: string[]; isPublic: boolean };
  created_at: Date;
  updated_at: Date;
}

export interface Viewer {
  id: string;
  session_id: string;
  user_id?: string;
  joined_at: Date;
  left_at?: Date;
}

export interface PeerConnection {
  peerId: string;
  userId: string;
  stream?: MediaStream;
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed';
}