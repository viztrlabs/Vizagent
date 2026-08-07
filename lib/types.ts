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