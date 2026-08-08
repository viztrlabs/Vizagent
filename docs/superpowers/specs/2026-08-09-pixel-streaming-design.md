# VizTR Pixel Streaming — Design Spec

**Date:** 2026-08-09
**Status:** Draft
**Author:** opencode (brainstorming session)

---

## 1. Overview

VizTR Pixel Streaming allows website visitors to interact with a real-time Unreal Engine 5 application running on the host's local GPU. The host launches UE5 via batch scripts; the stream is delivered to visitors via WebRTC through Cirrus signalling and a Cloudflare tunnel. An admin panel monitors stream health and controls client access levels.

**Key constraint:** The UE5 application runs on the host's local machine (providing GPU power). The host does not manually open UE5 — they run `.bat` scripts that handle everything.

---

## 2. Architecture

### 2.1 Data Flow

```
Host Local Machine (GPU)
├── UE5 (VizTR.exe) — renders scene using host GPU
│   ├── streams via WebRTC → Cirrus (signalling, port 80/8888)
│   └── heartbeat → ps-metrics-server (port 9000)
├── Cirrus signalling server
└── ps-metrics-server.js (metrics sidecar)

Cloudflare Edge
├── stream.viztr.io → Cirrus (host machine)
└── metrics.viztr.io → ps-metrics-server (port 9000)

Website Visitor (browser)
├── stream.viztr.io — full-screen interactive player
│   └── WebRTC connects to Cirrus → receives UE5 stream
│   └── mouse/keyboard input sent back to UE5
└── Admin panel (viztr.io/admin/pixel-streaming)
    └── fetches health data from metrics.viztr.io
```

### 2.2 Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Stream client | `app/(public)/stream/page.tsx` | Full-screen WebRTC player |
| Admin panel | `app/(dashboard)/admin/pixel-streaming/page.tsx` | Health, sessions, analytics, control access |
| Metrics sidecar | `local/pixel-streaming/ps-metrics-server.js` | In-memory REST API for health/viewers/sessions |
| Setup script | `local/pixel-streaming/viztr-stream-setup.bat` | First-time setup (Node, PM2, cloudflared, tunnel) |
| Start script | `local/pixel-streaming/viztr-stream-start.bat` | Launch Cirrus + metrics + tunnel + UE5 |
| Stop script | `local/pixel-streaming/viztr-stream-stop.bat` | Shutdown all processes |

---

## 3. Pages & Routes

| Route | Purpose | Auth | Domain |
|-------|---------|------|--------|
| `/services/pixel-streaming` | Marketing page — describes the service, "Watch Live" CTA | Public | viztr.io |
| `stream.viztr.io` | Full-screen interactive player (WebRTC) | Public (admin can gate access) | stream.viztr.io |
| `/admin/pixel-streaming` | Admin dashboard — health, sessions, analytics, control access | Supabase auth (admin role) | viztr.io |

---

## 4. Stream Client

### 4.1 Tech Stack

- **Core library**: `@epicgames-ps/lib-pixelstreamingfrontend` (WebRTC connection, input handling)
- **UI**: Custom React component (not Epic's UI library)
- **Framework**: Next.js 15 App Router, client-only (dynamic import, ssr: false)

### 4.2 UI

- Full-screen: no header, no navigation
- Overlay controls (bottom-center, auto-hide after 3s):
  - Connection status indicator (connected/disconnected/connecting)
  - Fullscreen toggle
  - Reconnect button (shown when disconnected)
- Minimal, non-intrusive design

### 4.3 Interactivity

- Mouse + keyboard input sent to UE5 via the library's input handling
- Control access is governed by admin settings:
  - **Full**: mouse + keyboard input enabled
  - **Partial**: limited input (e.g., camera rotation only)
  - **View-only**: no input sent to UE5

### 4.4 Connection

- Auto-connects to `wss://stream.viztr.io` on mount
- Handles disconnection gracefully (shows reconnect button)
- Reconnects automatically on network recovery

---

## 5. Admin Panel

### 5.1 Tabs

1. **Health**
   - Stream status: connected / disconnected / reconnecting
   - Latency (ms)
   - Uptime (formatted duration)
   - Current viewer count
   - UE5 FPS (if available from metrics)

2. **Sessions**
   - Table of recent sessions: start time, duration, peak viewers
   - Session status (active / ended)

3. **Analytics**
   - Viewer count over time (chart)
   - Peak viewers
   - Average session duration
   - Total views

4. **Control Access**
   - Dropdown to set access level: Full / Partial / View-only
   - Applies to all current and future viewers
   - persisted in metrics sidecar (in-memory)

### 5.2 Data Source

Direct fetch to `metrics.viztr.io` (cloudflare tunnel to port 9000). No Vercel API proxy.

### 5.3 Authentication

Supabase auth (existing pattern from dashboard). Only users with admin role can access.

---

## 6. Metrics Sidecar

### 6.1 Tech Stack

- Node.js + native `http` module (no Express — minimal dependencies)
- In-memory storage (no database)
- PM2 for process management

### 6.2 Port

9000 (exposed via cloudflared tunnel to `metrics.viztr.io`)

### 6.3 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Stream health status (connected/disconnected, latency, uptime) |
| `GET` | `/sessions` | Active + recent sessions (last 24h) |
| `GET` | `/viewers` | Current viewer count |
| `GET` | `/config` | Current control access settings |
| `POST` | `/heartbeat` | Cirrus/UE5 sends heartbeat (updates health status) |
| `POST` | `/viewers/update` | Cirrus sends viewer count updates |
| `POST` | `/config` | Admin updates control access settings |

### 6.4 Authentication

No auth on the sidecar itself. It's an internal service, not publicly exposed — only accessible via cloudflared tunnel to `metrics.viztr.io`.

---

## 7. Infrastructure Scripts

### 7.1 Directory

`local/pixel-streaming/`

### 7.2 Scripts

| File | Purpose |
|------|---------|
| `viztr-stream-setup.bat` | First-time setup: check Node.js, install PM2, check/install cloudflared, Cloudflare login, create tunnel, route DNS for `stream.viztr.io` and `metrics.viztr.io` |
| `viztr-stream-start.bat` | Launch: check prerequisites, stop stale processes, start Cirrus via PM2, start metrics sidecar via PM2, connect cloudflared tunnel, launch UE5 with Pixel Streaming CLI args |
| `viztr-stream-stop.bat` | Shutdown: stop PM2 processes (viztr-cirrus, viztr-metrics), kill cloudflared, kill UE5 process |

### 7.3 Configuration

The start script has a CONFIG section at the top with editable paths:

| Variable | Default | Purpose |
|----------|---------|---------|
| `UE5_EXE` | `C:\VizTR\Build\Windows\VizTR.exe` | Path to packaged UE5 executable |
| `CIRRUS_DIR` | `C:\Program Files\Epic Games\UE_5.4\Engine\Plugins\Media\PixelStreaming\Resources\WebServers\SignallingWebServer` | Cirrus signalling server directory |
| `CF_TUNNEL_NAME` | `viztr-pixel` | Cloudflare tunnel name |
| `METRICS_DIR` | `C:\VizTR\ps-metrics-server` | Metrics sidecar directory |
| `STREAMER_PORT` | `8888` | Port UE5 streams to Cirrus |
| `HTTP_PORT` | `80` | Port Cirrus serves web player |
| `METRICS_PORT` | `9000` | Metrics sidecar port |
| `METRICS_SECRET` | (user-provided) | Secret for admin panel auth (must match `.env.local` on Vercel) |
| `RES_X` / `RES_Y` | `1920` / `1080` | UE5 resolution |

---

## 8. Dependencies

### 8.1 NPM Packages

| Package | Purpose |
|---------|---------|
| `@epicgames-ps/lib-pixelstreamingfrontend` | Core WebRTC Pixel Streaming library |

### 8.2 External Tools

| Tool | Purpose |
|------|---------|
| Node.js | Runtime for metrics sidecar |
| PM2 | Process management for Cirrus + metrics |
| cloudflared | Cloudflare tunnel (stream.viztr.io, metrics.viztr.io) |
| UE 5.4 | Unreal Engine (Cirrus bundled, UE5 executable) |

---

## 9. Testing

- **Metrics sidecar**: Unit tests for API endpoints (vitest)
- **Stream client**: No unit tests (client-only, WebRTC integration)
- **Admin panel**: No unit tests (client-only, fetch-based)
- **Integration**: Manual testing with UE5 running locally

---

## 11. Implementation Notes

### 11.1 Metrics Sidecar ↔ Cirrus Communication

The metrics sidecar polls Cirrus's `/status` endpoint (localhost:80/status) every 5 seconds to get:
- Connected streamers (UE5 instances)
- Connected viewers
- Stream health status

No Cirrus plugin required — standard HTTP polling.

### 11.2 Control Access Implementation

The admin panel writes control access settings to a JSON config file on the host machine (`local/pixel-streaming/config.json`). UE5 reads this file on startup and applies the access level:
- **Full**: mouse + keyboard input enabled
- **Partial**: camera rotation only (no click/keyboard)
- **View-only**: input disabled

The metrics sidecar serves this config via `GET /config` and accepts updates via `POST /config`.

### 11.3 Data Persistence

In-memory storage for v1. No database, no file persistence. Data resets on sidecar restart. This is acceptable for a single-host streaming setup.

---

## 12. Out of Scope

- Database persistence for sessions/analytics (in-memory only for v1)
- User authentication for stream clients (admin controls access via settings)
- Multi-user UE5 sessions (single host, multiple viewers)
- Recording/replay functionality
- Mobile-optimized stream client (desktop-first)
