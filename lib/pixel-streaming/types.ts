export type StreamState = 'connecting' | 'live' | 'error';
export type ControlAccess = 'full' | 'partial' | 'view-only';

export interface PixelStreamingConfig {
  signalingUrl: string;
  sessionId: string;
  sessionName: string;
  sessionType: string;
  iceServers: RTCIceServer[];
}

export interface QualityPreset {
  name: string;
  bitrate: number;
  label: string;
}

export interface StreamStats {
  bitrate: number;
  fps: number;
  latency: number;
  resolution: string;
  connectionType: string;
  codec: string;
}

export interface MetricsHealth {
  status: StreamState;
  fps: number;
  latency: number;
  uptime: number;
  lastHeartbeat: number | null;
}

export interface MetricsViewers {
  count: number;
  lastUpdate: number | null;
}

export interface MetricsConfig {
  controlAccess: ControlAccess;
}

export interface MetricsSession {
  id: string;
  startTime: number;
  endTime: number | null;
  peakViewers: number;
  status: 'active' | 'ended';
}
