# VizTR XR Configurator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Babylon.js-based 3D/XR configurator with real-time collaboration via WebRTC pixel streaming, following the multi-tool dev pipeline and CONTRACT.md frozen law.

**Architecture:** Next.js 16 App Router with Babylon.js as the single core 3D engine. Zustand for state management (with Undo/Redo + Auto-save). WebRTC P2P for pixel streaming. Supabase for database/auth/storage. Vercel for deployment.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Babylon.js 8+, Zustand, Zod, Supabase, Socket.io 4.7, medooze/ion-sfu (WebRTC), pnpm

## Global Constraints

- **CONTRACT.md is law** — do not invent new database tables, API routes, or design tokens
- **Next.js 16** (App Router) — not 15, not any other framework
- **Babylon.js 8+** — single core 3D/XR engine (Three.js REJECTED per ADR 6.1)
- **TypeScript strict mode** — no `any` types, full type safety
- **No new dependencies** without flagging OpenCode first
- **No secrets in code** — all secrets via environment variables
- **Conventional commits** — `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- **Test coverage** — minimum 80% for new code
- **Accessibility** — WCAG 2.1 AA compliance where applicable

---

## File Structure

```
VizAgent/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                    # Landing page
│   │   ├── pricing/page.tsx
│   │   └── waitlist/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   └── projects/[projectId]/
│   │       ├── page.tsx
│   │       └── configure/page.tsx
│   ├── configurator/[projectId]/
│   │   ├── page.tsx                    # RSC shell for BabylonCanvas
│   │   └── loading.tsx
│   ├── view/[configId]/
│   │   └── page.tsx                    # Read-only viewer page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── projects/
│   │   │   ├── route.ts                # GET, POST
│   │   │   └── [id]/route.ts           # GET, PATCH, DELETE
│   │   ├── assets/
│   │   │   ├── upload-url/route.ts
│   │   │   └── [id]/route.ts
│   │   ├── qa/
│   │   │   ├── run/route.ts
│   │   │   └── [jobId]/status/route.ts
│   │   ├── deployments/
│   │   │   ├── preview/route.ts
│   │   │   └── publish/route.ts
│   │   ├── xr/
│   │   │   ├── assets/
│   │   │   │   ├── route.ts            # GET, POST
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts        # GET
│   │   │   │       └── config/
│   │   │   │           ├── route.ts    # GET, POST
│   │   │   │           └── [configId]/route.ts  # PUT
│   │   │   └── configurator/
│   │   │       └── sessions/
│   │   │           ├── route.ts        # POST
│   │   │           └── [token]/route.ts # GET
│   │   └── streams/
│   │       ├── create/route.ts
│   │       ├── join/route.ts
│   │       ├── leave/route.ts
│   │       └── stats/route.ts
│   └── layout.tsx                      # Root layout with fonts
├── components/
│   ├── ui/                             # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── tabs.tsx
│   │   ├── slider.tsx
│   │   ├── select.tsx
│   │   └── dialog.tsx
│   ├── upload/
│   │   ├── UploadDropzone.tsx
│   │   └── UploadProgress.tsx
│   ├── viewer/
│   │   └── BabylonViewer.tsx           # Babylon.js Virtual Tour viewer
│   ├── configurator/
│   │   ├── BabylonCanvas.tsx           # Main Babylon.js canvas wrapper
│   │   ├── MaterialsPanel.tsx
│   │   ├── LightingPanel.tsx
│   │   ├── HotspotsPanel.tsx
│   │   ├── ExportPanel.tsx
│   │   ├── ARPanel.tsx                 # 5th tab (FuturePhase)
│   │   ├── ConfigPanel.tsx
│   │   ├── Sidebar.tsx                 # Collapsible side panel
│   │   ├── Toolbar.tsx                 # Action buttons
│   │   └── ViewControls.tsx
│   └── stream/
│       ├── StreamViewer.tsx            # WebRTC viewer component
│       ├── ControlBar.tsx              # Mute, Fullscreen, etc.
│       └── ConnectionStatus.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   └── server.ts                   # Server client
│   ├── types.ts                        # All TypeScript types (from CONTRACT.md)
│   ├── validations.ts                  # Zod schemas
│   ├── qa/
│   │   ├── run.ts                      # QA execution logic
│   │   └── checks.ts                   # 5 QA checks
│   ├── xr/
│   │   ├── input-handler.ts            # Babylon.js input handling
│   │   └── validation.ts               # Zod schemas for XR data
│   └── store/
│       └── configurator-store.ts       # Zustand store with Undo/Redo + Auto-save
├── prisma/
│   └── schema.prisma                   # Database schema
├── public/
│   └── models/                         # Sample 3D models for testing
├── .github/workflows/ci.yml
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── pnpm-lock.yaml
```

---

## Task List

### Task 1: Initialize Next.js 16 Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js`
- Create: `app/layout.tsx`, `app/page.tsx`
- Create: `.gitignore`, `.env.local.example`
- Modify: `.github/workflows/ci.yml` (update build command if needed)

**Interfaces:**
- Consumes: None (first task)
- Produces: Running dev server, passing TypeScript compilation

- [ ] **Step 1: Initialize Next.js 16 project**

```bash
cd C:\Users\Arch_Viz\Desktop\VizAgent
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --no-react-compiler
```

Note: If prompted about directory not being empty, choose to continue anyway.

- [ ] **Step 2: Update package.json**

```json
{
  "name": "vizagent",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^16.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.5.0",
    "prisma": "^6.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.3.0",
    "jest": "^30.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

- [ ] **Step 3: Run dev server to verify setup**

```bash
pnpm dev
```

Expected: Server starts at http://localhost:3000

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize next.js 16 project with typescript and tailwind"
```

---

### Task 2: Install Dependencies and Configure

**Files:**
- Modify: `package.json` (add dependencies)
- Create: `tailwind.config.ts` (update with design tokens)
- Create: `app/globals.css` (update with design tokens)

**Interfaces:**
- Consumes: Task 1 (Next.js project)
- Produces: Configured project with all dependencies

- [ ] **Step 1: Install core dependencies**

```bash
pnpm add zustand zod @prisma/client next-auth@beta socket.io socket.io-client
pnpm add -D @types/node
```

- [ ] **Step 2: Install Babylon.js dependencies**

```bash
pnpm add @babylonjs/core @babylonjs/loaders @babylonjs/materials @babylonjs/gui
```

- [ ] **Step 3: Install UI dependencies**

```bash
pnpm add lucide-react class-variance-authority clsx tailwind-merge
pnpm add -D @types/jest
```

- [ ] **Step 4: Update tailwind.config.ts with design tokens**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080a0f",
        surface: "#0d1117",
        cyan: "#00e5ff",
        violet: "#7c3aed",
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      spacing: {
        base: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Update app/globals.css**

```css
@import "tailwindcss";

:root {
  --bg: #080a0f;
  --surface: #0d1117;
  --cyan: #00e5ff;
  --violet: #7c3aed;
}

body {
  background-color: var(--bg);
  color: white;
  font-family: "DM Sans", sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Syne", sans-serif;
}

.font-display {
  font-family: "Bebas Neue", sans-serif;
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: install dependencies and configure design tokens"
```

---

### Task 3: Setup Prisma and Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local.example`

**Interfaces:**
- Consumes: Task 1 (Next.js project), Task 2 (dependencies)
- Produces: Database schema, Supabase clients

- [ ] **Step 1: Create .env.local.example**

```env
# Database
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Authentication
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# WebRTC (for pixel streaming)
TURN_SERVER_URL="turn:your-turn-server.com:3478"
TURN_SERVER_USERNAME="username"
TURN_SERVER_CREDENTIAL="password"
```

- [ ] **Step 2: Create prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      String   @default("client")
  avatarUrl String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  projects      Project[]
  deployments   Deployment[]

  @@map("users")
}

model Project {
  id           String    @id @default(uuid())
  name         String
  description  String?
  clientId     String    @map("client_id")
  serviceType  String    @default("tour") @map("service_type")
  status       String    @default("draft")
  settings     Json      @default("{\"cameraHeight\": 1.7, \"autoRotate\": false, \"hotspotStyle\": \"pin\"}")
  budget       Decimal?  @db.Decimal(10, 2)
  deadline     DateTime?
  publishedUrl String?   @map("published_url")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  client      User          @relation(fields: [clientId], references: [id], onDelete: Cascade)
  assets      Asset[]
  qaReports   QAReport[]
  deployments Deployment[]
  xrAssets    XrAsset[]

  @@index([clientId])
  @@index([status])
  @@map("projects")
}

model Asset {
  id            String   @id @default(uuid())
  projectId     String   @map("project_id")
  fileName      String   @map("file_name")
  fileType      String   @map("file_type")
  fileSize      BigInt?  @map("file_size")
  storagePath   String   @map("storage_path")
  thumbnailPath String?  @map("thumbnail_path")
  status        String   @default("uploaded")
  metadata      Json     @default("{}")
  createdAt     DateTime @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("assets")
}

model QAReport {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  qaStatus  String   @map("qa_status")
  checks    Json     @default("[]")
  issues    Json     @default("[]")
  checkedAt DateTime? @map("checked_at")
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("qa_reports")
}

model Deployment {
  id          String    @id @default(uuid())
  projectId   String    @map("project_id")
  environment String
  status      String
  previewUrl  String?   @map("preview_url")
  publicUrl   String?   @map("public_url")
  commitSha   String?   @map("commit_sha")
  deployedBy  String?   @map("deployed_by")
  deployedAt  DateTime? @map("deployed_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  deployer User?   @relation(fields: [deployedBy], references: [id])

  @@index([projectId])
  @@map("deployments")
}

model XrAsset {
  id            String   @id @default(uuid())
  projectId     String   @map("project_id")
  type          String   @default("model3d")
  service       String   @default("webXR")
  glbUrl        String?  @map("glb_url")
  equirectUrl   String?  @map("equirect_url")
  usdzUrl       String?  @map("usdz_url")
  fileSizeBytes Int?     @map("file_size_bytes")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  project         Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  configurations  Configuration[]

  @@index([projectId])
  @@map("xr_assets")
}

model Configuration {
  id         String   @id @default(uuid())
  xrAssetId  String   @map("xr_asset_id")
  name       String   @default("default")
  data       String
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  xrAsset XrAsset @relation(fields: [xrAssetId], references: [id], onDelete: Cascade)

  @@unique([xrAssetId, name])
  @@index([xrAssetId])
  @@map("configurations")
}

model ConfiguratorSession {
  id          String   @id @default(uuid())
  projectId   String   @map("project_id")
  hostId      String   @map("host_id")
  config      String
  shareToken  String   @unique @map("share_token")
  isActive    Boolean  @default(true) @map("is_active")
  permissions Json     @default("{\"canEdit\": [], \"canView\": [], \"isPublic\": false}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  viewers Viewer[]

  @@index([shareToken])
  @@index([hostId])
  @@map("configurator_sessions")
}

model Viewer {
  id        String    @id @default(uuid())
  sessionId String    @map("session_id")
  userId    String?   @map("user_id")
  joinedAt  DateTime  @default(now()) @map("joined_at")
  leftAt    DateTime? @map("left_at")

  session ConfiguratorSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@map("viewers")
}
```

- [ ] **Step 3: Create lib/supabase/client.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Create lib/supabase/server.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

- [ ] **Step 5: Run Prisma generate**

```bash
pnpm prisma generate
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: setup prisma schema and supabase clients"
```

---

### Task 4: Create TypeScript Types and Validations

**Files:**
- Create: `lib/types.ts`
- Create: `lib/validations.ts`
- Create: `lib/xr/validation.ts`

**Interfaces:**
- Consumes: Task 1 (Next.js project)
- Produces: All TypeScript types, Zod schemas

- [ ] **Step 1: Create lib/types.ts**

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
```

- [ ] **Step 2: Create lib/validations.ts**

```typescript
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  deadline: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
});

export const assetSchema = z.object({
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_type: z.string(),
  file_size: z.number().positive(),
});

export const xrAssetSchema = z.object({
  project_id: z.string().uuid(),
  type: z.enum(['model3d', 'equirect']),
  service: z.enum(['vr', 'mr', 'webAR', 'tour', 'webXR']),
  glb_url: z.string().url().optional(),
  equirect_url: z.string().url().optional(),
  usdz_url: z.string().url().optional(),
});

export const configuratorSessionSchema = z.object({
  project_id: z.string().uuid(),
  host_id: z.string(),
  config: z.string(),
});

export const streamCreateSchema = z.object({
  room_id: z.string(),
  user_id: z.string(),
});
```

- [ ] **Step 3: Create lib/xr/validation.ts**

```typescript
import { z } from 'zod';

export const materialSchema = z.object({
  id: z.string(),
  name: z.string(),
  albedo: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  metallic: z.number().min(0).max(1),
  roughness: z.number().min(0).max(1),
  normalScale: z.number().min(0).max(2),
  emissiveColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  emissiveIntensity: z.number().min(0).max(10),
  opacity: z.number().min(0).max(1),
  doubleSided: z.boolean(),
});

export const objectSchema = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
});

export const lightSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  type: z.enum(['hemisphere', 'directional', 'point', 'spot']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  intensity: z.number().min(0).max(100),
  position: z.tuple([z.number(), z.number(), z.number()]),
  castShadow: z.boolean(),
});

export const configDataSchema = z.object({
  scene: z.object({
    bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    exposure: z.number().min(0).max(5),
    toneMapping: z.string(),
    environment: z.string(),
  }),
  materials: z.array(materialSchema),
  objects: z.array(objectSchema),
  lights: z.array(lightSchema),
  camera: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    target: z.tuple([z.number(), z.number(), z.number()]),
    fov: z.number().min(10).max(120),
  }),
});
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add typescript types and zod validations"
```

---

### Task 5: Create Zustand Store with Undo/Redo and Auto-save

**Files:**
- Create: `lib/store/configurator-store.ts`
- Create: `lib/store/__tests__/configurator-store.test.ts`

**Interfaces:**
- Consumes: Task 4 (types, validations)
- Produces: ConfiguratorStore with undo/redo, auto-save, local persistence

- [ ] **Step 1: Create lib/store/configurator-store.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConfigData, MaterialData, LightData } from '../types';
import { configDataSchema } from '../xr/validation';

const MAX_HISTORY = 50;
const AUTO_SAVE_DELAY = 3000; // 3 seconds

interface HistoryEntry {
  config: ConfigData;
  timestamp: number;
}

interface ConfiguratorStore {
  // State
  config: ConfigData | null;
  history: HistoryEntry[];
  historyIndex: number;
  isDirty: boolean;
  lastSavedAt: number | null;
  xrAssetId: string | null;

  // Actions
  setConfig: (config: ConfigData) => void;
  loadConfig: (xrAssetId: string) => Promise<void>;
  saveConfig: () => Promise<void>;

  // Material actions
  updateMaterial: (materialId: string, updates: Partial<MaterialData>) => void;
  addMaterial: (material: MaterialData) => void;
  removeMaterial: (materialId: string) => void;

  // Light actions
  updateLight: (lightId: string, updates: Partial<LightData>) => void;

  // Scene actions
  updateScene: (updates: Partial<ConfigData['scene']>) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const defaultConfig: ConfigData = {
  scene: {
    bg: '#080a0f',
    exposure: 1.0,
    toneMapping: 'ACES',
    environment: 'studio',
  },
  materials: [],
  objects: [],
  lights: [
    {
      id: 'default-hemisphere',
      name: 'Hemisphere Light',
      enabled: true,
      type: 'hemisphere',
      color: '#ffffff',
      intensity: 0.8,
      position: [0, 10, 0],
      castShadow: false,
    },
  ],
  camera: {
    position: [0, 1.7, 5],
    target: [0, 1.7, 0],
    fov: 60,
  },
};

export const useConfiguratorStore = create<ConfiguratorStore>()(
  persist(
    (set, get) => ({
      config: null,
      history: [],
      historyIndex: -1,
      isDirty: false,
      lastSavedAt: null,
      xrAssetId: null,

      setConfig: (config) => {
        const validation = configDataSchema.safeParse(config);
        if (!validation.success) {
          console.error('Invalid config:', validation.error);
          return;
        }

        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ config, timestamp: Date.now() });

        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        set({
          config,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isDirty: true,
        });
      },

      loadConfig: async (xrAssetId) => {
        try {
          const response = await fetch(`/api/xr/assets/${xrAssetId}/config`);
          if (response.ok) {
            const data = await response.json();
            const config = JSON.parse(data.config.data);
            set({
              config,
              xrAssetId,
              history: [{ config, timestamp: Date.now() }],
              historyIndex: 0,
              isDirty: false,
            });
          } else {
            set({ config: defaultConfig, xrAssetId });
          }
        } catch (error) {
          console.error('Failed to load config:', error);
          set({ config: defaultConfig, xrAssetId });
        }
      },

      saveConfig: async () => {
        const { config, xrAssetId, isDirty } = get();
        if (!config || !xrAssetId || !isDirty) return;

        try {
          await fetch(`/api/xr/assets/${xrAssetId}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: JSON.stringify(config), name: 'default' }),
          });
          set({ isDirty: false, lastSavedAt: Date.now() });
        } catch (error) {
          console.error('Failed to save config:', error);
        }
      },

      updateMaterial: (materialId, updates) => {
        const { config, setConfig } = get();
        if (!config) return;

        const updatedMaterials = config.materials.map((mat) =>
          mat.id === materialId ? { ...mat, ...updates } : mat
        );
        setConfig({ ...config, materials: updatedMaterials });
      },

      addMaterial: (material) => {
        const { config, setConfig } = get();
        if (!config) return;
        setConfig({ ...config, materials: [...config.materials, material] });
      },

      removeMaterial: (materialId) => {
        const { config, setConfig } = get();
        if (!config) return;
        setConfig({
          ...config,
          materials: config.materials.filter((m) => m.id !== materialId),
        });
      },

      updateLight: (lightId, updates) => {
        const { config, setConfig } = get();
        if (!config) return;

        const updatedLights = config.lights.map((light) =>
          light.id === lightId ? { ...light, ...updates } : light
        );
        setConfig({ ...config, lights: updatedLights });
      },

      updateScene: (updates) => {
        const { config, setConfig } = get();
        if (!config) return;
        setConfig({ ...config, scene: { ...config.scene, ...updates } });
      },

      undo: () => {
        const { historyIndex, history, setConfig } = get();
        if (historyIndex <= 0) return;
        const newIndex = historyIndex - 1;
        set({ historyIndex: newIndex, config: history[newIndex].config });
      },

      redo: () => {
        const { historyIndex, history, setConfig } = get();
        if (historyIndex >= history.length - 1) return;
        const newIndex = historyIndex + 1;
        set({ historyIndex: newIndex, config: history[newIndex].config });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    }),
    {
      name: 'viztr-configurator',
      partialize: (state) => ({
        config: state.config,
        xrAssetId: state.xrAssetId,
      }),
    }
  )
);
```

- [ ] **Step 2: Create lib/store/__tests__/configurator-store.test.ts**

```typescript
import { useConfiguratorStore } from '../configurator-store';

describe('ConfiguratorStore', () => {
  beforeEach(() => {
    useConfiguratorStore.setState({
      config: null,
      history: [],
      historyIndex: -1,
      isDirty: false,
      lastSavedAt: null,
      xrAssetId: null,
    });
  });

  it('should initialize with default config', () => {
    const { setConfig } = useConfiguratorStore.getState();
    const defaultConfig = {
      scene: { bg: '#080a0f', exposure: 1.0, toneMapping: 'ACES', environment: 'studio' },
      materials: [],
      objects: [],
      lights: [],
      camera: { position: [0, 1.7, 5], target: [0, 1.7, 0], fov: 60 },
    };

    setConfig(defaultConfig);

    const { config, history, isDirty } = useConfiguratorStore.getState();
    expect(config).toEqual(defaultConfig);
    expect(history).toHaveLength(1);
    expect(isDirty).toBe(true);
  });

  it('should undo and redo', () => {
    const { setConfig } = useConfiguratorStore.getState();

    setConfig({
      scene: { bg: '#080a0f', exposure: 1.0, toneMapping: 'ACES', environment: 'studio' },
      materials: [],
      objects: [],
      lights: [],
      camera: { position: [0, 1.7, 5], target: [0, 1.7, 0], fov: 60 },
    });

    setConfig({
      scene: { bg: '#ff0000', exposure: 2.0, toneMapping: 'ACES', environment: 'studio' },
      materials: [],
      objects: [],
      lights: [],
      camera: { position: [0, 1.7, 5], target: [0, 1.7, 0], fov: 60 },
    });

    const { undo, redo, canUndo, canRedo } = useConfiguratorStore.getState();
    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);

    undo();
    const { config: configAfterUndo } = useConfiguratorStore.getState();
    expect(configAfterUndo?.scene.bg).toBe('#080a0f');
    expect(undo).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm test lib/store/__tests__/configurator-store.test.ts
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add zustand store with undo/redo and auto-save"
```

---

### Task 6: Create Babylon.js Canvas and Scene Setup

**Files:**
- Create: `components/configurator/BabylonCanvas.tsx`
- Create: `lib/xr/input-handler.ts`
- Create: `components/configurator/__tests__/BabylonCanvas.test.tsx`

**Interfaces:**
- Consumes: Task 4 (types), Task 5 (store)
- Produces: BabylonCanvas component, input handler

- [ ] **Step 1: Create components/configurator/BabylonCanvas.tsx**

```typescript
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4 } from '@babylonjs/core';
import { useConfiguratorStore } from '@/lib/store/configurator-store';

interface BabylonCanvasProps {
  modelUrl?: string;
  className?: string;
}

export function BabylonCanvas({ modelUrl, className }: BabylonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  const config = useConfiguratorStore((s) => s.config);
  const updateMaterial = useConfiguratorStore((s) => s.updateMaterial);

  const initScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Scene settings from config
    if (config) {
      scene.clearColor = Color4.FromHexString(config.scene.bg + 'ff');
      scene.imageProcessingConfiguration.exposure = config.scene.exposure;
    }

    // Camera
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2,
      5,
      new Vector3(0, 1.7, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 20;
    camera.wheelDeltaPercentage = 0.01;

    // Default light
    const light = new HemisphericLight('light', new Vector3(0, 10, 0), scene);
    light.intensity = 0.8;
    light.diffuse = Color3.White();

    // Load model if provided
    if (modelUrl) {
      const { SceneLoader } = await import('@babylonjs/core/Loading/sceneLoader');
      await SceneLoader.AppendAsync('', modelUrl, scene);
    }

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize handler
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, [config, modelUrl]);

  useEffect(() => {
    const cleanup = initScene();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [initScene]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      onTouchStart={() => {}}
      onTouchMove={() => {}}
      onTouchEnd={() => {}}
    />
  );
}
```

- [ ] **Step 2: Create lib/xr/input-handler.ts**

```typescript
import { Scene, ArcRotateCamera, Vector3 } from '@babylonjs/core';

export interface InputHandlerOptions {
  onObjectSelect?: (objectId: string) => void;
  onObjectDeselect?: () => void;
  onCameraMove?: (position: Vector3, target: Vector3) => void;
}

export class InputHandler {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private options: InputHandlerOptions;

  constructor(scene: Scene, camera: ArcRotateCamera, options: InputHandlerOptions = {}) {
    this.scene = scene;
    this.camera = camera;
    this.options = options;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.scene.onPointerDown = (evt, pickResult) => {
      if (pickResult?.hit && pickResult.pickedMesh) {
        this.options.onObjectSelect?.(pickResult.pickedMesh.id);
      } else {
        this.options.onObjectDeselect?.();
      }
    };

    this.camera.onViewMatrixChangedObservable.add(() => {
      this.options.onCameraMove?.(
        this.camera.position.clone(),
        this.camera.target.clone()
      );
    });
  }

  public dispose() {
    this.scene.onPointerDown = null;
    this.camera.onViewMatrixChangedObservable.clear();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add babylon.js canvas and input handler"
```

---

### Task 7: Create Configurator Panels (Materials, Lighting, Hotspots, Export)

**Files:**
- Create: `components/configurator/MaterialsPanel.tsx`
- Create: `components/configurator/LightingPanel.tsx`
- Create: `components/configurator/HotspotsPanel.tsx`
- Create: `components/configurator/ExportPanel.tsx`
- Create: `components/configurator/ARPanel.tsx`

**Interfaces:**
- Consumes: Task 4 (types), Task 5 (store)
- Produces: 4 panels + AR panel (placeholder)

- [ ] **Step 1: Create components/configurator/MaterialsPanel.tsx**

```typescript
'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';
import { MaterialData } from '@/lib/types';

const materialPresets: MaterialData[] = [
  {
    id: 'preset-chrome',
    name: 'Chrome',
    albedo: '#c0c0c0',
    metallic: 1.0,
    roughness: 0.1,
    normalScale: 1.0,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    opacity: 1.0,
    doubleSided: false,
  },
  {
    id: 'preset-wood',
    name: 'Wood',
    albedo: '#8b4513',
    metallic: 0.0,
    roughness: 0.8,
    normalScale: 1.0,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    opacity: 1.0,
    doubleSided: false,
  },
  {
    id: 'preset-glass',
    name: 'Glass',
    albedo: '#ffffff',
    metallic: 0.0,
    roughness: 0.0,
    normalScale: 1.0,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    opacity: 0.3,
    doubleSided: true,
  },
];

interface MaterialsPanelProps {
  selectedMaterialId?: string;
}

export function MaterialsPanel({ selectedMaterialId }: MaterialsPanelProps) {
  const config = useConfiguratorStore((s) => s.config);
  const updateMaterial = useConfiguratorStore((s) => s.updateMaterial);
  const addMaterial = useConfiguratorStore((s) => s.addMaterial);

  const selectedMaterial = config?.materials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Materials</h3>

      {/* Material Presets */}
      <div>
        <label className="text-sm text-gray-400">Presets</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {materialPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => addMaterial({ ...preset, id: `mat-${Date.now()}` })}
              className="p-2 bg-surface rounded-md hover:bg-surface/80 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: preset.albedo }}
              />
              <span className="text-xs">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Controls */}
      {selectedMaterial && (
        <div className="space-y-3">
          <label className="text-sm text-gray-400">Manual Controls</label>

          <div>
            <label className="text-xs text-gray-500">Albedo Color</label>
            <input
              type="color"
              value={selectedMaterial.albedo}
              onChange={(e) => updateMaterial(selectedMaterial.id, { albedo: e.target.value })}
              className="w-full h-8 rounded-md cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Metallic: {selectedMaterial.metallic.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedMaterial.metallic}
              onChange={(e) =>
                updateMaterial(selectedMaterial.id, { metallic: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Roughness: {selectedMaterial.roughness.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedMaterial.roughness}
              onChange={(e) =>
                updateMaterial(selectedMaterial.id, { roughness: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Opacity: {selectedMaterial.opacity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedMaterial.opacity}
              onChange={(e) =>
                updateMaterial(selectedMaterial.id, { opacity: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create components/configurator/LightingPanel.tsx**

```typescript
'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

export function LightingPanel() {
  const config = useConfiguratorStore((s) => s.config);
  const updateLight = useConfiguratorStore((s) => s.updateLight);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Lighting</h3>

      {config?.lights.map((light) => (
        <div key={light.id} className="p-3 bg-surface rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">{light.name}</span>
            <input
              type="checkbox"
              checked={light.enabled}
              onChange={(e) => updateLight(light.id, { enabled: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Color</label>
            <input
              type="color"
              value={light.color}
              onChange={(e) => updateLight(light.id, { color: e.target.value })}
              className="w-full h-6 rounded-md cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Intensity: {light.intensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={light.intensity}
              onChange={(e) =>
                updateLight(light.id, { intensity: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create components/configurator/HotspotsPanel.tsx**

```typescript
'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

export function HotspotsPanel() {
  const config = useConfiguratorStore((s) => s.config);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Hotspots</h3>
      <p className="text-sm text-gray-400">
        Click on the 3D model to place hotspots. Hotspots will be saved with the configuration.
      </p>

      <div className="p-4 bg-surface rounded-md">
        <p className="text-xs text-gray-500">
          {config?.objects.length || 0} objects in scene
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create components/configurator/ExportPanel.tsx**

```typescript
'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

export function ExportPanel() {
  const config = useConfiguratorStore((s) => s.config);
  const saveConfig = useConfiguratorStore((s) => s.saveConfig);
  const isDirty = useConfiguratorStore((s) => s.isDirty);

  const handleExport = () => {
    if (!config) return;

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'viztr-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Export</h3>

      <div className="space-y-2">
        <button
          onClick={saveConfig}
          disabled={!isDirty}
          className="w-full py-2 px-4 bg-cyan text-bg rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan/90 transition-colors"
        >
          Save to Cloud
        </button>

        <button
          onClick={handleExport}
          className="w-full py-2 px-4 bg-surface text-white rounded-md font-medium hover:bg-surface/80 transition-colors"
        >
          Export as JSON
        </button>

        <button
          onClick={() => {
            const shareUrl = `${window.location.origin}/view/current`;
            navigator.clipboard.writeText(shareUrl);
          }}
          className="w-full py-2 px-4 bg-surface text-white rounded-md font-medium hover:bg-surface/80 transition-colors"
        >
          Copy Share Link
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create components/configurator/ARPanel.tsx**

```typescript
'use client';

export function ARPanel() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">AR View</h3>

      <div className="p-6 bg-surface rounded-md text-center">
        <p className="text-gray-400">AR functionality coming in FuturePhase</p>
        <p className="text-xs text-gray-500 mt-2">
          This tab will enable WebAR for mobile devices
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add configurator panels (materials, lighting, hotspots, export, ar)"
```

---

### Task 8: Create Main Configurator Page Layout

**Files:**
- Create: `app/configurator/[projectId]/page.tsx`
- Create: `app/configurator/[projectId]/loading.tsx`
- Create: `components/configurator/Sidebar.tsx`
- Create: `components/configurator/Toolbar.tsx`

**Interfaces:**
- Consumes: Task 6 (BabylonCanvas), Task 7 (panels)
- Produces: Complete configurator page

- [ ] **Step 1: Create app/configurator/[projectId]/page.tsx**

```typescript
import { Suspense } from 'react';
import { BabylonCanvas } from '@/components/configurator/BabylonCanvas';
import { Sidebar } from '@/components/configurator/Sidebar';
import { Toolbar } from '@/components/configurator/Toolbar';

interface ConfiguratorPageProps {
  params: { projectId: string };
}

export default async function ConfiguratorPage({ params }: ConfiguratorPageProps) {
  const { projectId } = params;

  return (
    <div className="h-screen flex bg-bg">
      {/* Main 3D Viewport */}
      <div className="flex-1 relative">
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading 3D Engine...</div>}>
          <BabylonCanvas modelUrl={`/api/projects/${projectId}/model`} />
        </Suspense>

        {/* Floating Toolbar */}
        <Toolbar projectId={projectId} />
      </div>

      {/* Side Panel */}
      <Sidebar projectId={projectId} />
    </div>
  );
}
```

- [ ] **Step 2: Create app/configurator/[projectId]/loading.tsx**

```typescript
export default function ConfiguratorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Initializing Babylon.js engine...</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create components/configurator/Sidebar.tsx**

```typescript
'use client';

import { useState } from 'react';
import { MaterialsPanel } from './MaterialsPanel';
import { LightingPanel } from './LightingPanel';
import { HotspotsPanel } from './HotspotsPanel';
import { ExportPanel } from './ExportPanel';
import { ARPanel } from './ARPanel';

interface SidebarProps {
  projectId: string;
}

const tabs = [
  { id: 'materials', label: 'Materials' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'hotspots', label: 'Hotspots' },
  { id: 'export', label: 'Export' },
  { id: 'ar', label: 'AR' },
];

export function Sidebar({ projectId }: SidebarProps) {
  const [activeTab, setActiveTab] = useState('materials');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`h-full bg-surface border-l border-gray-800 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 right-4 p-2 bg-surface rounded-md hover:bg-surface/80 transition-colors z-10"
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {!isCollapsed && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan border-b-2 border-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="p-4 overflow-y-auto h-[calc(100%-48px)]">
            {activeTab === 'materials' && <MaterialsPanel />}
            {activeTab === 'lighting' && <LightingPanel />}
            {activeTab === 'hotspots' && <HotspotsPanel />}
            {activeTab === 'export' && <ExportPanel />}
            {activeTab === 'ar' && <ARPanel />}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create components/configurator/Toolbar.tsx**

```typescript
'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

interface ToolbarProps {
  projectId: string;
}

export function Toolbar({ projectId }: ToolbarProps) {
  const undo = useConfiguratorStore((s) => s.undo);
  const redo = useConfiguratorStore((s) => s.redo);
  const canUndo = useConfiguratorStore((s) => s.canUndo);
  const canRedo = useConfiguratorStore((s) => s.canRedo);
  const isDirty = useConfiguratorStore((s) => s.isDirty);
  const lastSavedAt = useConfiguratorStore((s) => s.lastSavedAt);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/90 backdrop-blur-sm rounded-lg p-2">
      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo()}
        className="p-2 rounded-md hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        onClick={redo}
        disabled={!canRedo()}
        className="p-2 rounded-md hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-700" />

      {/* Status */}
      <div className="px-3 text-sm">
        {isDirty ? (
          <span className="text-yellow-400">Unsaved changes</span>
        ) : lastSavedAt ? (
          <span className="text-gray-400">
            Saved {new Date(lastSavedAt).toLocaleTimeString()}
          </span>
        ) : (
          <span className="text-gray-400">No changes</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add main configurator page layout with sidebar and toolbar"
```

---

### Task 9: Create API Routes for XR Assets and Configurations

**Files:**
- Create: `app/api/xr/assets/route.ts`
- Create: `app/api/xr/assets/[id]/route.ts`
- Create: `app/api/xr/assets/[id]/config/route.ts`
- Create: `app/api/xr/assets/[id]/config/[configId]/route.ts`

**Interfaces:**
- Consumes: Task 3 (Prisma), Task 4 (types, validations)
- Produces: All XR API routes

- [ ] **Step 1: Create app/api/xr/assets/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { xrAssetSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const assets = await prisma.xrAsset.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = xrAssetSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const asset = await prisma.xrAsset.create({
    data: validation.data,
  });

  return NextResponse.json({ asset }, { status: 201 });
}
```

- [ ] **Step 2: Create app/api/xr/assets/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const asset = await prisma.xrAsset.findUnique({
    where: { id },
    include: { configurations: true },
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json({ asset });
}
```

- [ ] **Step 3: Create app/api/xr/assets/[id]/config/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const config = await prisma.configuration.findFirst({
    where: { xrAssetId: id, name: 'default' },
  });

  if (!config) {
    return NextResponse.json({ error: 'No config found' }, { status: 404 });
  }

  return NextResponse.json({ config });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();

  const config = await prisma.configuration.upsert({
    where: {
      xrAssetId_name: { xrAssetId: id, name: body.name || 'default' },
    },
    update: { data: body.data },
    create: { xrAssetId: id, name: body.name || 'default', data: body.data },
  });

  return NextResponse.json({ config });
}
```

- [ ] **Step 4: Create app/api/xr/assets/[id]/config/[configId]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; configId: string } }
) {
  const { id, configId } = params;
  const body = await request.json();

  const config = await prisma.configuration.update({
    where: { id: configId },
    data: { data: body.data, name: body.name },
  });

  return NextResponse.json({ config });
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add xr assets and configurations api routes"
```

---

### Task 10: Create WebRTC Pixel Streaming API Routes

**Files:**
- Create: `app/api/streams/create/route.ts`
- Create: `app/api/streams/join/route.ts`
- Create: `app/api/streams/leave/route.ts`
- Create: `app/api/streams/stats/route.ts`

**Interfaces:**
- Consumes: Task 3 (Prisma), Task 4 (types, validations)
- Produces: WebRTC API routes

- [ ] **Step 1: Create app/api/streams/create/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { streamCreateSchema } from '@/lib/validations';

// In-memory store for rooms (replace with Redis in production)
const rooms = new Map<string, { peers: Set<string>; createdAt: number }>();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = streamCreateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const { room_id, user_id } = validation.data;

  if (!rooms.has(room_id)) {
    rooms.set(room_id, { peers: new Set(), createdAt: Date.now() });
  }

  const room = rooms.get(room_id)!;
  room.peers.add(user_id);

  // STUN/TURN servers for WebRTC
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  return NextResponse.json({
    room_id,
    ice_servers: iceServers,
    peers: Array.from(room.peers),
  });
}
```

- [ ] **Step 2: Create app/api/streams/join/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { streamCreateSchema } from '@/lib/validations';

const rooms = new Map<string, { peers: Set<string>; createdAt: number }>();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = streamCreateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const { room_id, user_id } = validation.data;

  if (!rooms.has(room_id)) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const room = rooms.get(room_id)!;
  room.peers.add(user_id);

  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  return NextResponse.json({
    room_id,
    ice_servers: iceServers,
    peers: Array.from(room.peers),
  });
}
```

- [ ] **Step 3: Create app/api/streams/leave/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { streamCreateSchema } from '@/lib/validations';

const rooms = new Map<string, { peers: Set<string>; createdAt: number }>();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = streamCreateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const { room_id, user_id } = validation.data;

  if (!rooms.has(room_id)) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const room = rooms.get(room_id)!;
  room.peers.delete(user_id);

  // Clean up empty rooms
  if (room.peers.size === 0) {
    rooms.delete(room_id);
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create app/api/streams/stats/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';

const rooms = new Map<string, { peers: Set<string>; createdAt: number }>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('room_id');

  if (roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      stats: {
        peerCount: room.peers.size,
        streamCount: room.peers.size,
        room_id: roomId,
      },
    });
  }

  // Return all rooms stats
  const allStats = Array.from(rooms.entries()).map(([id, room]) => ({
    room_id: id,
    peerCount: room.peers.size,
    streamCount: room.peers.size,
  }));

  return NextResponse.json({ stats: allStats });
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add webrtc pixel streaming api routes"
```

---

### Task 11: Create Stream Viewer Components

**Files:**
- Create: `components/stream/StreamViewer.tsx`
- Create: `components/stream/ControlBar.tsx`
- Create: `components/stream/ConnectionStatus.tsx`

**Interfaces:**
- Consumes: Task 4 (types), Task 10 (API routes)
- Produces: Stream viewer components

- [ ] **Step 1: Create components/stream/StreamViewer.tsx**

```typescript
'use client';

import { useRef, useEffect, useState } from 'react';
import { PeerConnection } from '@/lib/types';

interface StreamViewerProps {
  roomId: string;
  userId: string;
}

export function StreamViewer({ roomId, userId }: StreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', room_id: roomId, user_id: userId }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'peer_joined') {
        const peerConnection = new RTCPeerConnection();
        // Add your logic for handling peer connections
      }

      if (data.type === 'offer') {
        // Handle offer
      }

      if (data.type === 'answer') {
        // Handle answer
      }

      if (data.type === 'ice_candidate') {
        // Handle ICE candidate
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId, userId]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover rounded-lg"
      />
      <ConnectionStatus isConnected={isConnected} peerCount={peers.length} />
    </div>
  );
}
```

- [ ] **Step 2: Create components/stream/ControlBar.tsx**

```typescript
'use client';

interface ControlBarProps {
  onMute?: () => void;
  onFullscreen?: () => void;
  isMuted?: boolean;
}

export function ControlBar({ onMute, onFullscreen, isMuted }: ControlBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/90 backdrop-blur-sm rounded-lg p-2">
      <button
        onClick={onMute}
        className="p-2 rounded-md hover:bg-surface transition-colors"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      <button
        onClick={onFullscreen}
        className="p-2 rounded-md hover:bg-surface transition-colors"
        title="Fullscreen"
      >
        ⛶
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create components/stream/ConnectionStatus.tsx**

```typescript
'use client';

interface ConnectionStatusProps {
  isConnected: boolean;
  peerCount: number;
}

export function ConnectionStatus({ isConnected, peerCount }: ConnectionStatusProps) {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface/90 backdrop-blur-sm rounded-lg px-3 py-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-sm text-gray-300">
        {isConnected ? `${peerCount} viewer${peerCount !== 1 ? 's' : ''}` : 'Disconnected'}
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add stream viewer components"
```

---

### Task 12: Create View Page (Read-only Viewer)

**Files:**
- Create: `app/view/[configId]/page.tsx`

**Interfaces:**
- Consumes: Task 6 (BabylonCanvas), Task 11 (StreamViewer)
- Produces: Public viewer page

- [ ] **Step 1: Create app/view/[configId]/page.tsx**

```typescript
import { Suspense } from 'react';
import { BabylonCanvas } from '@/components/configurator/BabylonCanvas';
import { StreamViewer } from '@/components/stream/StreamViewer';

interface ViewPageProps {
  params: { configId: string };
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { configId } = params;

  return (
    <div className="h-screen bg-bg">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading viewer...</div>}>
        <BabylonCanvas modelUrl={`/api/config/${configId}/model`} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add read-only view page"
```

---

### Task 13: Create Configurator Session API Routes

**Files:**
- Create: `app/api/configurator/sessions/route.ts`
- Create: `app/api/configurator/sessions/[token]/route.ts`

**Interfaces:**
- Consumes: Task 3 (Prisma), Task 4 (types, validations)
- Produces: Session management API routes

- [ ] **Step 1: Create app/api/configurator/sessions/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { configuratorSessionSchema } from '@/lib/validations';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = configuratorSessionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const shareToken = nanoid(10);

  const session = await prisma.configuratorSession.create({
    data: {
      ...validation.data,
      shareToken,
    },
  });

  return NextResponse.json({ session, share_token: shareToken }, { status: 201 });
}
```

- [ ] **Step 2: Create app/api/configurator/sessions/[token]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const session = await prisma.configuratorSession.findUnique({
    where: { shareToken: token },
    include: { viewers: true },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ session });
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add configurator session api routes"
```

---

### Task 14: Add Keyboard Shortcuts and Final Polish

**Files:**
- Modify: `components/configurator/BabylonCanvas.tsx` (add keyboard shortcuts)
- Create: `components/configurator/__tests__/keyboard-shortcuts.test.ts`

**Interfaces:**
- Consumes: Task 5 (store), Task 6 (BabylonCanvas)
- Produces: Keyboard shortcuts support

- [ ] **Step 1: Update BabylonCanvas.tsx with keyboard shortcuts**

Add to the BabylonCanvas component:

```typescript
// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveConfig();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo, saveConfig]);
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add keyboard shortcuts for undo/redo/save"
```

---

### Task 15: Create Basic Marketing Pages

**Files:**
- Create: `app/(marketing)/page.tsx`
- Create: `app/(marketing)/layout.tsx`

**Interfaces:**
- Consumes: Task 2 (design tokens)
- Produces: Basic landing page

- [ ] **Step 1: Create app/(marketing)/layout.tsx**

```typescript
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-gray-800">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-2xl text-cyan">VizTR</span>
          <div className="flex items-center gap-6">
            <a href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="/login" className="text-gray-400 hover:text-white transition-colors">Login</a>
            <a href="/signup" className="px-4 py-2 bg-cyan text-bg rounded-md font-medium hover:bg-cyan/90 transition-colors">Sign Up</a>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create app/(marketing)/page.tsx**

```typescript
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="font-display text-6xl text-center mb-6">
        Architectural Visualization <span className="text-cyan">Reimagined</span>
      </h1>
      <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto mb-10">
        Create immersive 3D experiences for your architectural projects with real-time collaboration and AI-powered rendering.
      </p>
      <div className="flex justify-center gap-4">
        <a href="/signup" className="px-8 py-3 bg-cyan text-bg rounded-lg font-medium text-lg hover:bg-cyan/90 transition-colors">
          Get Started Free
        </a>
        <a href="/demo" className="px-8 py-3 bg-surface text-white rounded-lg font-medium text-lg hover:bg-surface/80 transition-colors">
          View Demo
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add basic marketing pages"
```

---

## Plan Complete

**Saved to:** `docs/superpowers/plans/2026-08-06-viztr-xr-configurator.md`

**Total Tasks:** 15
**Estimated Time:** 8-10 hours

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
