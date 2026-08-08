# VizTR — Frozen Contract (Phase 0-1 MVP)

**This file is law. Do not invent new database tables, API routes, or design tokens.**
**If something you need isn't defined here, stop and flag it to the human — do not guess.**

Source: consolidated from `00-MASTER-SPEC.md` and `2-VizTR-Phase-0-1-TechSpec.md`.
Scope frozen per `6-VizTR-MVP-Scope-Lock.md` — Virtual Tour only, no AI agents, no RLS, no billing.

---

## 1. Folder ownership (do not edit outside your assigned folder)

| Folder | Owner | Notes |
|--------|-------|-------|
| `/` (root config, package.json, CI) | OpenCode | Only OpenCode touches root-level config |
| `app/(marketing)/` | Google AI Studio | Public landing, pricing, waitlist |
| `app/(auth)/` | Antigravity | Signup, login |
| `app/(dashboard)/` | Antigravity | Dashboard shell, project CRUD, publish UI |
| `app/(public)/tour/` | VS Code | Public no-auth viewer page |
| `app/api/` | OpenCode | All API routes — flag to OpenCode if you need a new one |
| `components/upload/` | VS Code | Upload dropzone, progress |
| `components/viewer/` | VS Code | Three.js Virtual Tour viewer |
| `lib/qa/` | VS Code | QA checklist logic |
| `lib/supabase/` | OpenCode | Supabase client config — read-only for other tools |
| `.github/workflows/` | OpenCode | CI config |

**Rule**: if your task requires touching a file outside your folder, stop and note it in `TODO.md` under that task's Notes column instead of doing it.

---

## 2. Tech stack (locked — do not add or substitute)

- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- 3D: Three.js + React Three Fiber + Drei
- State: Zustand
- Validation: Zod
- Database/Auth/Storage: Supabase (free tier for now)
- Deploy: Vercel
- Package manager: pnpm

**Explicitly NOT in Phase 0-1** (do not add even if it seems useful): Railway, LangGraph, MCP, Ollama, BullMQ, Hermes local agent, Stripe/Razorpay, Google OAuth, RLS policies, AI agents of any kind.

---

## 3. Database schema (Supabase Postgres — exact, do not modify)

```sql
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

-- RLS is OFF for Phase 0-1 (fewer than 10 users). Do not enable it yet.
```

---

## 4. TypeScript types (exact — import from `lib/types.ts`, do not redefine)

```typescript
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
```

---

## 5. API routes (exact — do not add new ones without flagging OpenCode)

```
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

WebXR, WebAR, VR, Pixel Streaming, any of the 13 AI agents, LangGraph/CrewAI, MCP connector, Stripe/Razorpay billing, Google OAuth, magic links, RLS policies, audit logs, multi-user collaboration, analytics dashboards, white-label, SSO, Hermes local GPU agent.

Full list: see `6-VizTR-MVP-Scope-Lock.md`.

---

*Last updated: manually, by the human, whenever schema/API/tokens change. If you (a tool) think this file needs to change, do not edit it directly — flag it in `TODO.md` Notes and let the human update it.*
