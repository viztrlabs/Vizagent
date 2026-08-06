# VizTR — Frozen Contract (Phase 0-1 MVP + XR Configurator)

**This file is law. Do not invent new database tables, API routes, or design tokens.**
**If something you need isn't defined here, stop and flag it to the human — do not guess.**

Source: consolidated from `00-MASTER-SPEC.md`, `2-VizTR-Phase-0-1-TechSpec.md`, and XR Configurator discussions.
Scope: Virtual Tour + XR Configurator with Pixel Streaming. No AI agents, no RLS, no billing.

---

## 1. Folder ownership (do not edit outside your assigned folder)

| Folder | Owner | Notes |
|--------|-------|-------|
| `/` (root config, package.json, CI) | OpenCode | Only OpenCode touches root-level config |
| `app/(marketing)/` | Google AI Studio | Public landing, pricing, waitlist |
| `app/(auth)/` | Antigravity | Signup, login |
| `app/(dashboard)/` | Antigravity | Dashboard shell, project CRUD, publish UI |
| `app/(public)/tour/` | VS Code | Public no-auth viewer page |
| `app/configurator/[projectId]/` | OpenCode | XR Configurator page (RSC shell) |
| `app/view/[configId]/` | OpenCode | Read-only viewer page |
| `app/api/` | OpenCode | All API routes — flag to OpenCode if you need a new one |
| `components/upload/` | VS Code | Upload dropzone, progress |
| `components/viewer/` | VS Code | Babylon.js Virtual Tour viewer |
| `components/xr/` | OpenCode | XR Configurator components (BabylonCanvas, panels, etc.) |
| `lib/qa/` | VS Code | QA checklist logic |
| `lib/supabase/` | OpenCode | Supabase client config — read-only for other tools |
| `lib/xr/` | OpenCode | XR types, validation, input handler |
| `.github/workflows/` | OpenCode | CI config |

**Rule**: if your task requires touching a file outside your folder, stop and note it in `TODO.md` under that task's Notes column instead of doing it.

---

## 2. Tech stack (locked — do not add or substitute)

- Frontend: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- 3D/XR: Babylon.js 8+ (single core engine — Three.js REJECTED per ADR 6.1)
- State: Zustand
- Validation: Zod
- Database/Auth/Storage: Supabase (Postgres, Auth, Storage)
- Deploy: Vercel
- Package manager: pnpm
- WebRTC: medooze/ion-sfu or node-mediasoup (for pixel streaming)
- Signaling: Socket.io 4.7

**Explicitly NOT in Phase 0-1** (do not add even if it seems useful): Railway, LangGraph, MCP, Ollama, BullMQ, Hermes local agent, Stripe/Razorpay, Google OAuth, RLS policies, AI agents of any kind, Three.js/React Three Fiber/Drei.

---

## 3. Database schema (Supabase Postgres — exact, do not modify)

```sql
-- Original MVP tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'tour' CHECK (service_type IN ('tour')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'uploaded', 'qa_pending', 'qa_passed', 'published'
  )),
  settings JSONB DEFAULT '{"cameraHeight": 1.7, "autoRotate": false, "hotspotStyle": "pin"}',
  budget DECIMAL(10,2),
  deadline TIMESTAMPTZ,
  published_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validating', 'ready', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_assets_project ON assets(project_id);

CREATE TABLE qa_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  qa_status TEXT NOT NULL CHECK (qa_status IN ('pending', 'running', 'passed', 'failed')),
  checks JSONB DEFAULT '[]',
  issues JSONB DEFAULT '[]',
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_qa_reports_project ON qa_reports(project_id);

CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('preview', 'production')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'deploying', 'success', 'failed')),
  preview_url TEXT,
  public_url TEXT,
  commit_sha TEXT,
  deployed_by UUID REFERENCES users(id),
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_deployments_project ON deployments(project_id);

-- XR Configurator tables (added per discussions)
CREATE TABLE xr_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'model3d' CHECK (type IN ('model3d', 'equirect')),
  service TEXT NOT NULL DEFAULT 'webXR' CHECK (service IN ('vr', 'mr', 'webAR', 'tour', 'webXR')),
  glb_url TEXT,
  equirect_url TEXT,
  usdz_url TEXT,
  file_size_bytes INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_xr_assets_project ON xr_assets(project_id);

CREATE TABLE configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xr_asset_id UUID REFERENCES xr_assets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'default',
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(xr_asset_id, name)
);
CREATE INDEX idx_configurations_xr_asset ON configurations(xr_asset_id);

CREATE TABLE configurator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  host_id TEXT NOT NULL,
  config TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{"canEdit": [], "canView": [], "isPublic": false}',
  start_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  gcal_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_configurator_sessions_share_token ON configurator_sessions(share_token);
CREATE INDEX idx_configurator_sessions_host ON configurator_sessions(host_id);
CREATE INDEX idx_configurator_sessions_start_at ON configurator_sessions(start_at);

CREATE TABLE viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES configurator_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ
);
CREATE INDEX idx_viewers_session ON viewers(session_id);

-- RLS is OFF for Phase 0-1 (fewer than 10 users). Do not enable it yet.
```

---

## 4. TypeScript types (exact — import from `lib/types.ts`, do not redefine)

```typescript
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

// XR Configurator types (added per discussions)
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
  start_at?: Date;
  reminder_sent_at?: Date;
  gcal_event_id?: string;
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
```

---

## 5. API routes (exact — do not add new ones without flagging OpenCode)

```
-- Original MVP routes
POST   /api/auth/signup          { email, password, name } → { user, token }
POST   /api/auth/login           { email, password } → { user, token }
POST   /api/auth/logout          → { success: true }

GET    /api/projects             ?client_id=uuid → { projects: Project[] }
GET    /api/projects/:id         → { project: Project }
POST   /api/projects             { name, description, deadline, budget } → { project: Project }
PATCH  /api/projects/:id         { ...fields } → { project: Project }
DELETE /api/projects/:id         → { success: true }

POST   /api/assets/upload-url    { project_id, file_name, file_type, file_size } → { asset_id, upload_url, fields }
GET    /api/assets/:id           → { asset: Asset }
GET    /api/projects/:id/assets  → { assets: Asset[] }

POST   /api/qa/run               { project_id } → { job_id }
GET    /api/qa/:job_id/status    → { status, report: QAReport }

POST   /api/deployments/preview  { project_id } → { preview_url, status }
POST   /api/deployments/publish  { project_id, qa_passed: true, admin_approved: true } → { deployment: Deployment }

-- XR Configurator routes (added per discussions)
POST   /api/xr/assets           { project_id, type, service, glb_url?, equirect_url? } → { asset: XrAsset }
GET    /api/xr/assets/:id       → { asset: XrAsset }
GET    /api/xr/assets/:id/config → { config: Configuration }
POST   /api/xr/assets/:id/config → { config: Configuration }
PUT    /api/xr/assets/:id/config/:configId → { config: Configuration }

POST   /api/configurator/sessions { project_id, host_id, config, start_at? } → { session: ConfiguratorSession, share_token: string }
GET    /api/configurator/sessions/:token → { session: ConfiguratorSession }
PATCH  /api/configurator/sessions/:id { config?, status? } → { session: ConfiguratorSession }
DELETE /api/configurator/sessions/:id → { success: true }

POST   /api/streams/create      { room_id, user_id } → { room_id, ice_servers: IceServer[] }
POST   /api/streams/join        { room_id, user_id } → { room_id, ice_servers: IceServer[] }
POST   /api/streams/leave       { room_id, user_id } → { success: true }
GET    /api/streams/stats       ?room_id → { stats: { peerCount, streamCount } }

-- Booking & Calendar routes (added per pixel streaming discussions)
POST   /api/bookings            { project_id, service, date, time, duration, client_name, email, project_type } → { session: ConfiguratorSession, gcal_event_id?: string }
GET    /api/bookings            ?email=string → { sessions: ConfiguratorSession[] }
DELETE /api/bookings/:id        → { success: true }

GET    /api/cron/session-reminders → { sent: number, total: number }  (Vercel cron, every 15 min)
```

---

## 6. Design tokens (use these exact values — do not pick your own colors/fonts)

```json
{
  "colors": {
    "bg": "#080a0f",
    "surface": "#0d1117",
    "cyan": "#00e5ff",
    "violet": "#7c3aed"
  },
  "typography": {
    "display": "Bebas Neue",
    "heading": "Syne",
    "body": "DM Sans"
  },
  "spacing": {
    "base": "4px",
    "scale": [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
  },
  "borderRadius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  },
  "xr": {
    "targetFPS": { "desktop": 60, "mobile": 30 }
  }
}
```

---

## 7. QA checklist (the 5 checks — exact logic, do not add or remove checks)

1. File size < 100MB
2. Image dimensions >= 4096x2048
3. Aspect ratio ~2:1 (equirectangular)
4. EXIF metadata present (warning only, not a hard fail)
5. File not corrupted (can be decoded)

Publish button is **disabled** unless `qa_status = 'passed'` AND an admin has approved.

---

## 8. What is explicitly out of scope (do not build, even if it seems easy)

Three.js/React Three Fiber/Drei (REJECTED per ADR 6.1 — Babylon.js is the single core engine), WebXR (native), WebAR (native), VR (native), any of the 13 AI agents, LangGraph/CrewAI, MCP connector, Stripe/Razorpay billing, Google OAuth, magic links, RLS policies, audit logs, multi-user collaboration beyond basic pixel streaming, analytics dashboards, white-label, SSO, Hermes local GPU agent.

**Now in scope (per discussions):**
- Pixel Streaming: WebRTC for remote collaboration, P2P architecture, WebRTC API routes
- XR Configurator: Babylon.js scene, 4 panels (Materials, Lighting, Hotspots, Export), Undo/Redo, Auto-save (3s debounce)
- AR Tab: 5th tab for AR visualization (FuturePhase)
- Material Presets: Built-in library + manual sliders (both options)

Full list: see `6-VizTR-MVP-Scope-Lock.md`.

---

*Last updated: 2026-08-06, by OpenCode, per human's XR configurator discussions.*
