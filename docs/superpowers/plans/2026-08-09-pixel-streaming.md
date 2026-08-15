# VizTR Pixel Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full-stack pixel streaming system: infrastructure scripts (.bat), metrics sidecar (Node.js), WebRTC stream client (React), and admin dashboard.

**Architecture:** UE5 runs on the host machine (GPU), streams via WebRTC through Cirrus signalling. Cloudflare tunnels expose `stream.viztr.io` (player) and `metrics.viztr.io` (admin data). The stream client is a React app using `@epicgames-ps/lib-pixelstreamingfrontend`. The metrics sidecar is a standalone Node.js process. The admin panel is a Next.js page behind Supabase auth.

**Tech Stack:** Next.js 15, React 19, `@epicgames-ps/lib-pixelstreamingfrontend`, Node.js (native http), PM2, cloudflared, Supabase auth, Tailwind CSS, lucide-react, vitest.

## Global Constraints

- Node.js ≥ 18
- UE 5.4 (Cirrus bundled at `Engine/Plugins/Media/PixelStreaming/Resources/WebServers/SignallingWebServer`)
- cloudflared (installed via winget or manual)
- PM2 (installed globally via npm)
- Supabase auth for admin panel (existing pattern from dashboard)
- All new React components are client-only (`'use client'`, dynamic import with `ssr: false`)
- Follow existing code style: styled-jsx for CSS, lucide-react for icons, Inter/Syne/JetBrains Mono fonts
- Metrics sidecar uses native Node.js `http` module (no Express)
- .bat scripts go in `local/pixel-streaming/`
- No database for metrics (in-memory only for v1)

---

## File Structure

```
local/pixel-streaming/
├── viztr-stream-setup.bat          # First-time setup
├── viztr-stream-start.bat          # Launch all services
├── viztr-stream-stop.bat           # Shutdown all services
├── ps-metrics-server.js            # Metrics sidecar (Node.js)
├── ps-metrics-server.test.js       # Tests for metrics sidecar
└── config.json                     # Runtime config (control access, etc.)

components/pixel-streaming/
├── PixelStreamingPlayer.tsx         # Main stream client component
├── PixelStreamingPlayer.test.tsx    # Tests for stream client
├── StreamControls.tsx               # Bottom control bar
├── StreamStats.tsx                  # Stats panel overlay
├── StreamSettings.tsx               # Settings panel overlay
├── ConnectingOverlay.tsx            # Connecting state overlay
├── LiveOverlay.tsx                  # Live state overlay
├── ErrorOverlay.tsx                 # Error state overlay
└── usePixelStreaming.ts             # WebRTC/signalling hook

app/(public)/stream/
├── page.tsx                         # Stream page (server component)
└── StreamPageClient.tsx             # Client component (dynamic import)

app/(dashboard)/admin/pixel-streaming/
├── page.tsx                         # Admin page (server component)
└── AdminPixelStreamingClient.tsx    # Client component

app/api/pixel-streaming/
├── metrics/route.ts                 # Proxy to metrics sidecar (optional)
└── config/route.ts                  # Proxy config updates (optional)

lib/pixel-streaming/
├── types.ts                         # TypeScript types
└── constants.ts                     # Quality presets, design tokens
```

---

### Task 1: Infrastructure Scripts (.bat files)

**Files:**
- Create: `local/pixel-streaming/viztr-stream-setup.bat`
- Create: `local/pixel-streaming/viztr-stream-start.bat`
- Create: `local/pixel-streaming/viztr-stream-stop.bat`

**Interfaces:**
- Consumes: None (standalone scripts)
- Produces: Three batch scripts that manage the pixel streaming infrastructure

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p local/pixel-streaming
```

- [ ] **Step 2: Create viztr-stream-setup.bat**

Create `local/pixel-streaming/viztr-stream-setup.bat` with the content from the reference (check Node.js, install PM2, check/install cloudflared, Cloudflare login, create tunnel, route DNS for stream.viztr.io and metrics.viztr.io).

- [ ] **Step 3: Create viztr-stream-start.bat**

Create `local/pixel-streaming/viztr-stream-start.bat` with the content from the reference (check prerequisites, stop stale processes, start Cirrus via PM2, start metrics sidecar via PM2, connect cloudflared tunnel, launch UE5 with Pixel Streaming CLI args).

- [ ] **Step 4: Create viztr-stream-stop.bat**

Create `local/pixel-streaming/viztr-stream-stop.bat` with the content from the reference (stop PM2 processes, kill cloudflared, kill UE5 process).

- [ ] **Step 5: Commit**

```bash
git add local/pixel-streaming/
git commit -m "feat: add pixel streaming infrastructure scripts"
```

---

### Task 2: Metrics Sidecar (ps-metrics-server.js)

**Files:**
- Create: `local/pixel-streaming/ps-metrics-server.js`
- Create: `local/pixel-streaming/ps-metrics-server.test.js`

**Interfaces:**
- Consumes: None (standalone Node.js process)
- Produces: REST API on port 9000 with endpoints: GET /health, GET /sessions, GET /viewers, GET /config, POST /heartbeat, POST /viewers/update, POST /config

- [ ] **Step 1: Write the failing test**

Create `local/pixel-streaming/ps-metrics-server.test.js`:

```javascript
const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const http = require('http');

const PORT = 9001; // Use different port for testing
let server;
let baseUrl;

beforeAll(async () => {
  process.env.PORT = PORT;
  process.env.PS_METRICS_SECRET = 'test-secret';
  server = require('./ps-metrics-server');
  baseUrl = `http://localhost:${PORT}`;
  await new Promise(resolve => setTimeout(resolve, 500));
});

afterAll(() => {
  if (server && server.close) server.close();
});

describe('Metrics Sidecar', () => {
  it('GET /health returns stream status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('status');
    expect(['connected', 'disconnected', 'reconnecting']).toContain(data.status);
  });

  it('GET /viewers returns viewer count', async () => {
    const res = await fetch(`${baseUrl}/viewers`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('count');
    expect(typeof data.count).toBe('number');
  });

  it('GET /sessions returns session list', async () => {
    const res = await fetch(`${baseUrl}/sessions`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data.sessions)).toBe(true);
  });

  it('GET /config returns control access settings', async () => {
    const res = await fetch(`${baseUrl}/config`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('controlAccess');
    expect(['full', 'partial', 'view-only']).toContain(data.controlAccess);
  });

  it('POST /heartbeat updates health status', async () => {
    const res = await fetch(`${baseUrl}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'connected', fps: 60, latency: 45 })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('POST /config updates control access', async () => {
    const res = await fetch(`${baseUrl}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ controlAccess: 'partial' })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);

    // Verify update
    const check = await fetch(`${baseUrl}/config`);
    const checkData = await check.json();
    expect(checkData.controlAccess).toBe('partial');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd local/pixel-streaming && npx vitest run ps-metrics-server.test.js
```

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

Create `local/pixel-streaming/ps-metrics-server.js`:

```javascript
const http = require('http');

const PORT = process.env.PORT || 9000;
const PS_METRICS_SECRET = process.env.PS_METRICS_SECRET || '';

// In-memory state
const state = {
  health: {
    status: 'disconnected',
    fps: 0,
    latency: 0,
    uptime: 0,
    lastHeartbeat: null
  },
  viewers: {
    count: 0,
    lastUpdate: null
  },
  sessions: [],
  config: {
    controlAccess: 'full' // full | partial | view-only
  }
};

let startTime = Date.now();

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /health
  if (url.pathname === '/health' && req.method === 'GET') {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...state.health, uptime }));
    return;
  }

  // GET /viewers
  if (url.pathname === '/viewers' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state.viewers));
    return;
  }

  // GET /sessions
  if (url.pathname === '/sessions' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessions: state.sessions }));
    return;
  }

  // GET /config
  if (url.pathname === '/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state.config));
    return;
  }

  // POST /heartbeat
  if (url.pathname === '/heartbeat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        state.health.status = data.status || state.health.status;
        state.health.fps = data.fps || state.health.fps;
        state.health.latency = data.latency || state.health.latency;
        state.health.lastHeartbeat = Date.now();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // POST /viewers/update
  if (url.pathname === '/viewers/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        state.viewers.count = data.count || 0;
        state.viewers.lastUpdate = Date.now();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // POST /config
  if (url.pathname === '/config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.controlAccess) {
          state.config.controlAccess = data.controlAccess;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[VizTR Metrics] Running on port ${PORT}`);
});

module.exports = server;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd local/pixel-streaming && npx vitest run ps-metrics-server.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add local/pixel-streaming/ps-metrics-server.js local/pixel-streaming/ps-metrics-server.test.js
git commit -m "feat: add pixel streaming metrics sidecar"
```

---

### Task 3: Types and Constants

**Files:**
- Create: `lib/pixel-streaming/types.ts`
- Create: `lib/pixel-streaming/constants.ts`

**Interfaces:**
- Consumes: None
- Produces: `PixelStreamingConfig`, `StreamState`, `QualityPreset`, `ControlAccess` types; `QUALITY_PRESETS`, `DESIGN_TOKENS`, `SIGNALING_URL` constants

- [ ] **Step 1: Create types**

Create `lib/pixel-streaming/types.ts`:

```typescript
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
```

- [ ] **Step 2: Create constants**

Create `lib/pixel-streaming/constants.ts`:

```typescript
import type { QualityPreset } from './types';

export const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || 'wss://stream.viztr.io';
export const METRICS_URL = process.env.NEXT_PUBLIC_METRICS_URL || 'https://metrics.viztr.io';

export const QUALITY_PRESETS: QualityPreset[] = [
  { name: 'Ultra', bitrate: 8, label: '8 Mbps' },
  { name: 'High', bitrate: 4, label: '4 Mbps' },
  { name: 'Standard', bitrate: 2, label: '2 Mbps' },
  { name: 'Low', bitrate: 1, label: '1 Mbps' }
];

export const DESIGN_TOKENS = {
  colors: {
    bg: '#0D0D0F',
    surface: '#141416',
    surface2: '#1A1A1E',
    surface3: '#222226',
    gold: '#C9A84C',
    green: '#1D9E75',
    cyan: '#00C8E0',
    purple: '#534AB7',
    red: '#E24B4A',
    text: '#F0EDE8',
    text2: '#A09D97',
    text3: '#55534E'
  },
  fonts: {
    syne: "'Syne', sans-serif",
    mono: "'JetBrains Mono', monospace",
    inter: "'Inter', sans-serif"
  }
} as const;
```

- [ ] **Step 3: Commit**

```bash
mkdir -p lib/pixel-streaming
git add lib/pixel-streaming/
git commit -m "feat: add pixel streaming types and constants"
```

---

### Task 4: usePixelStreaming Hook

**Files:**
- Create: `components/pixel-streaming/usePixelStreaming.ts`
- Create: `components/pixel-streaming/usePixelStreaming.test.ts`

**Interfaces:**
- Consumes: `PixelStreamingConfig`, `StreamState`, `StreamStats` from `lib/pixel-streaming/types`
- Produces: `usePixelStreaming(config)` returns `{ state, stats, videoRef, connect, reconnect, toggleMute, isMuted }`

- [ ] **Step 1: Write the failing test**

Create `components/pixel-streaming/usePixelStreaming.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePixelStreaming } from './usePixelStreaming';

// Mock WebSocket and RTCPeerConnection
const mockWs = {
  close: vi.fn(),
  send: vi.fn(),
  readyState: 1,
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null
};

const mockPc = {
  close: vi.fn(),
  addTransceiver: vi.fn(),
  addIceCandidate: vi.fn(),
  setRemoteDescription: vi.fn(),
  createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
  setLocalDescription: vi.fn(),
  getStats: vi.fn().mockResolvedValue(new Map()),
  ontrack: null,
  onicecandidate: null,
  onconnectionstatechange: null,
  connectionState: 'connected'
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('WebSocket', vi.fn(() => mockWs));
  vi.stubGlobal('RTCPeerConnection', vi.fn(() => mockPc));
});

describe('usePixelStreaming', () => {
  it('initializes with connecting state', () => {
    const { result } = renderHook(() =>
      usePixelStreaming({
        signalingUrl: 'wss://test.example.com',
        sessionId: 'test',
        sessionName: 'Test',
        sessionType: 'Test',
        iceServers: []
      })
    );
    expect(result.current.state).toBe('connecting');
    expect(result.current.isMuted).toBe(false);
  });

  it('provides connect and reconnect functions', () => {
    const { result } = renderHook(() =>
      usePixelStreaming({
        signalingUrl: 'wss://test.example.com',
        sessionId: 'test',
        sessionName: 'Test',
        sessionType: 'Test',
        iceServers: []
      })
    );
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.reconnect).toBe('function');
    expect(typeof result.current.toggleMute).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/pixel-streaming/usePixelStreaming.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

Create `components/pixel-streaming/usePixelStreaming.ts`:

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixelStreamingConfig, StreamState, StreamStats } from '@/lib/pixel-streaming/types';

interface UsePixelStreamingResult {
  state: StreamState;
  stats: StreamStats;
  videoRef: React.RefObject<HTMLVideoElement>;
  connect: () => void;
  reconnect: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

export function usePixelStreaming(config: PixelStreamingConfig): UsePixelStreamingResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<StreamState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState<StreamStats>({
    bitrate: 0,
    fps: 0,
    latency: 0,
    resolution: '—',
    connectionType: '—',
    codec: '—'
  });

  const setupPeerConnection = useCallback((iceConfig: RTCConfiguration) => {
    const pc = new RTCPeerConnection(iceConfig);
    pcRef.current = pc;

    pc.ontrack = (ev) => {
      if (videoRef.current && ev.streams[0]) {
        videoRef.current.srcObject = ev.streams[0];
        setState('live');
        startStatsCollection();
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'iceCandidate', candidate: ev.candidate }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected'].includes(pc.connectionState)) {
        setState('error');
      }
    };

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    return pc;
  }, []);

  const startStatsCollection = useCallback(() => {
    if (statsIntervalRef.current) return;
    statsIntervalRef.current = setInterval(async () => {
      if (!pcRef.current) return;
      try {
        const s = await pcRef.current.getStats();
        let bitrate = 0, fps = 0, latency = 0, width = 0, height = 0, codec = 'H.264';
        s.forEach((r: any) => {
          if (r.type === 'inbound-rtp' && r.mediaType === 'video') {
            bitrate = Math.round(r.bytesReceived * 8 / 1e6 * 10) / 10;
            fps = Math.round(r.framesPerSecond || 0);
            width = r.frameWidth || 0;
            height = r.frameHeight || 0;
          }
          if (r.type === 'candidate-pair' && r.state === 'succeeded') {
            latency = Math.round((r.currentRoundTripTime || 0) * 1000);
          }
          if (r.type === 'codec' && r.mimeType) {
            codec = r.mimeType.split('/')[1] || 'H.264';
          }
        });
        setStats({
          bitrate,
          fps,
          latency,
          resolution: width && height ? `${width}×${height}` : '1920×1080',
          connectionType: 'P2P',
          codec
        });
      } catch {}
    }, 2000);
  }, []);

  const connect = useCallback(() => {
    setState('connecting');
    try {
      const ws = new WebSocket(config.signalingUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log('[VizTR PS] Signalling WS connected');

      ws.onmessage = async (ev) => {
        let m: any;
        try { m = JSON.parse(ev.data); } catch { return; }
        console.log('[VizTR PS]', m.type);

        if (m.type === 'config') {
          setupPeerConnection(m.peerConnectionOptions || { iceServers: config.iceServers });
        } else if (m.type === 'offer') {
          if (!pcRef.current) setupPeerConnection({ iceServers: config.iceServers });
          await pcRef.current!.setRemoteDescription({ type: 'offer', sdp: m.sdp });
          const ans = await pcRef.current!.createAnswer();
          await pcRef.current!.setLocalDescription(ans);
          ws.send(JSON.stringify({ type: 'answer', sdp: ans.sdp }));
        } else if (m.type === 'iceCandidate' && pcRef.current && m.candidate) {
          try { await pcRef.current.addIceCandidate(m.candidate); } catch {}
        }
      };

      ws.onerror = () => setState('error');
      ws.onclose = () => {
        if (state === 'live') setState('error');
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
      };
    } catch {
      setState('error');
    }
  }, [config, setupPeerConnection, state]);

  const reconnect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (statsIntervalRef.current) { clearInterval(statsIntervalRef.current); statsIntervalRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; }
    setTimeout(connect, 400);
  }, [connect]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (videoRef.current) videoRef.current.muted = !prev;
      return !prev;
    });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pcRef.current) pcRef.current.close();
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [connect]);

  return { state, stats, videoRef, connect, reconnect, toggleMute, isMuted };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run components/pixel-streaming/usePixelStreaming.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/pixel-streaming/usePixelStreaming.ts components/pixel-streaming/usePixelStreaming.test.ts
git commit -m "feat: add usePixelStreaming hook"
```

---

### Task 5: Stream Client Components

**Files:**
- Create: `components/pixel-streaming/ConnectingOverlay.tsx`
- Create: `components/pixel-streaming/LiveOverlay.tsx`
- Create: `components/pixel-streaming/ErrorOverlay.tsx`
- Create: `components/pixel-streaming/StreamStats.tsx`
- Create: `components/pixel-streaming/StreamSettings.tsx`
- Create: `components/pixel-streaming/StreamControls.tsx`
- Create: `components/pixel-streaming/PixelStreamingPlayer.tsx`

**Interfaces:**
- Consumes: `usePixelStreaming` hook, `StreamState`, `StreamStats`, `QualityPreset` from types
- Produces: `PixelStreamingPlayer` component (main export)

- [ ] **Step 1: Create ConnectingOverlay**

Create `components/pixel-streaming/ConnectingOverlay.tsx` matching the reference HTML's connecting state (blueprint grid, scan animation, expanding rings, "Connecting..." text).

- [ ] **Step 2: Create LiveOverlay**

Create `components/pixel-streaming/LiveOverlay.tsx` matching the reference HTML's live state (top/bottom gradients, LIVE badge).

- [ ] **Step 3: Create ErrorOverlay**

Create `components/pixel-streaming/ErrorOverlay.tsx` matching the reference HTML's error state (error icon, title, message, retry button).

- [ ] **Step 4: Create StreamStats**

Create `components/pixel-streaming/StreamStats.tsx` matching the reference HTML's stats panel (bitrate, FPS, latency, resolution, connection, codec).

- [ ] **Step 5: Create StreamSettings**

Create `components/pixel-streaming/StreamSettings.tsx` matching the reference HTML's settings panel (quality presets, audio toggle, input toggles, connection info).

- [ ] **Step 6: Create StreamControls**

Create `components/pixel-streaming/StreamControls.tsx` matching the reference HTML's control bar (mute, quality selector, session ID chip, stats toggle, settings toggle, fullscreen).

- [ ] **Step 7: Create PixelStreamingPlayer**

Create `components/pixel-streaming/PixelStreamingPlayer.tsx` as the main component that composes all overlays and controls, using the `usePixelStreaming` hook. Match the reference HTML's layout: header → stage (canvas + video + overlays) → controls.

- [ ] **Step 8: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS (no new errors)

- [ ] **Step 9: Commit**

```bash
git add components/pixel-streaming/
git commit -m "feat: add pixel streaming player components"
```

---

### Task 6: Stream Page

**Files:**
- Create: `app/(public)/stream/page.tsx`
- Create: `app/(public)/stream/StreamPageClient.tsx`

**Interfaces:**
- Consumes: `PixelStreamingPlayer` component
- Produces: `/stream` route serving the full-screen player

- [ ] **Step 1: Create StreamPageClient**

Create `app/(public)/stream/StreamPageClient.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const PixelStreamingPlayer = dynamic(
  () => import('@/components/pixel-streaming/PixelStreamingPlayer').then((m) => m.PixelStreamingPlayer),
  { ssr: false }
);

export function StreamPageClient() {
  return (
    <div className="viztr-stream-page">
      <Suspense fallback={<div className="viztr-stream-loading">Loading stream...</div>}>
        <PixelStreamingPlayer />
      </Suspense>
      <style jsx>{`
        .viztr-stream-page {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #0D0D0F;
        }
        .viztr-stream-loading {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0D0D0F;
          color: #A09D97;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Create page.tsx**

Create `app/(public)/stream/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { StreamPageClient } from './StreamPageClient';

export const metadata: Metadata = {
  title: 'Live Stream | VizTR',
  description: 'Watch the live 3D stream',
};

export default function StreamPage() {
  return <StreamPageClient />;
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/stream/"
git commit -m "feat: add pixel streaming page at /stream"
```

---

### Task 7: Admin Panel

**Files:**
- Create: `app/(dashboard)/admin/pixel-streaming/page.tsx`
- Create: `app/(dashboard)/admin/pixel-streaming/AdminPixelStreamingClient.tsx`
- Create: `components/admin/PixelStreamingHealth.tsx`
- Create: `components/admin/PixelStreamingSessions.tsx`
- Create: `components/admin/PixelStreamingAnalytics.tsx`
- Create: `components/admin/PixelStreamingControlAccess.tsx`

**Interfaces:**
- Consumes: `METRICS_URL` from `lib/pixel-streaming/constants`, Supabase auth (existing pattern)
- Produces: `/admin/pixel-streaming` route with multi-tab dashboard

- [ ] **Step 1: Create AdminPixelStreamingClient**

Create `app/(dashboard)/admin/pixel-streaming/AdminPixelStreamingClient.tsx` with tabs: Health, Sessions, Analytics, Control Access. Fetch data from `metrics.viztr.io`.

- [ ] **Step 2: Create Health tab component**

Create `components/admin/PixelStreamingHealth.tsx` showing: stream status, latency, uptime, viewer count, FPS.

- [ ] **Step 3: Create Sessions tab component**

Create `components/admin/PixelStreamingSessions.tsx` showing: session history table (start time, duration, peak viewers, status).

- [ ] **Step 4: Create Analytics tab component**

Create `components/admin/PixelStreamingAnalytics.tsx` showing: viewer count chart, peak viewers, average session duration.

- [ ] **Step 5: Create Control Access tab component**

Create `components/admin/PixelStreamingControlAccess.tsx` showing: dropdown to set access level (Full/Partial/View-only), save button.

- [ ] **Step 6: Create page.tsx**

Create `app/(dashboard)/admin/pixel-streaming/page.tsx` with Supabase auth check.

- [ ] **Step 7: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add "app/(dashboard)/admin/pixel-streaming/" components/admin/PixelStreaming*.tsx
git commit -m "feat: add pixel streaming admin panel"
```

---

### Task 8: Final Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-08-09-pixel-streaming-design.md` (mark status as shipped)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Passing typecheck, passing tests, updated spec

- [ ] **Step 1: Run full typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Expected: SUCCESS

- [ ] **Step 4: Update spec status**

Edit `docs/superpowers/specs/2026-08-09-pixel-streaming-design.md` — change status from "Draft" to "Shipped".

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-08-09-pixel-streaming-design.md
git commit -m "docs: mark pixel streaming spec as shipped"
```
