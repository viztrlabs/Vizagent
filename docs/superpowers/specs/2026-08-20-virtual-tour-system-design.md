# Virtual Tour System - Design Spec

**Date**: 2026-08-20
**Author**: Opencode
**Status**: Approved

## 1. Overview

Extends VizTR with a full-featured virtual tour system using a hybrid Marzipano (360° panoramas) + Babylon.js (3D views) approach. All 15 features from the implementation roadmap are in scope, with full-featured analytics, theming, and versioning.

## 2. Scope

| Tier | Duration | Features |
|------|----------|----------|
| Immediate | 1-2 weeks | Floor navigation, floor plan, compass, photo galleries, timeline walkthrough |
| Medium-term | 3-4 weeks | Visual effects, audio, smooth transitions, accessibility, asset management |
| Long-term | 5-8 weeks | 3D view modes, measurement tool, analytics dashboard, theming, publish/versioning |

All complex systems are full-featured from the start (not MVP-then-upgrade).

## 3. Architecture

```
app/(public)/tour/[id]/
  page.tsx             → static: fetches config, renders public viewer shell
  TourPageClient.tsx   → client: ModeManager + feature overlays

components/tour/
  ModeManager.tsx      → router: Marzipano ↔ Babylon.js
  FloorSelector.tsx    → multi-level floor dropdown
  FloorPlanOverlay.tsx → clickable SVG floor plan
  Compass.tsx          → directional compass + minimap
  PhotoGallery.tsx     → carousel/lightbox per scene
  TimelinePlayer.tsx   → guided walkthrough controls
  AudioPlayer.tsx      → BGM + mute
  VisualEffects.tsx    → brightness/contrast/saturation
  ViewModeSwitcher.tsx → panoramic/dollhouse/floorplan toggle
  MeasurementTool.tsx  → tape measure with calibration
  TourMenu.tsx         → project info, links, view count

components/marzipano/  → existing viewer, minimal changes
components/babylon/    → new, lazy-loaded Babylon.js wrappers

lib/server/tour/
  config.ts            → extends lib/tour/map-tour-config → TourConfig
  engine/
    marzipano.ts       → Marzipano scene adapter
    babylon.ts         → Babylon.js scene loader + view controllers
  pages/api/tours/     → all REST endpoints below
```

### 3.1 ModeManager & Engine Strategy

- **Phase 1**: Marzipano-only for 360° panoramas. Ship immediately.
- **Phase 2**: When 3D assets (.glb/.ply) are present, Babylon.js lazy-loads for dollhouse/floor-plan views.
- ModeManager defines the interface now; Babylon.js rendering is added as an extension when 3D data arrives.

### 3.2 TourFeatureContext

Shared React context for all feature overlays:
```typescript
interface TourFeatureContextValue {
  config: TourConfig;
  activeSceneId: string;
  cameraHeading: { yaw: number; pitch: number };
  activeFloorId?: string;
  isAuthenticated: boolean;
}
```

## 4. Data Model (Hybrid Approach)

### 4.1 Project.extensions (no migration)
```json
{
  "settings": {
    "floors": [{ "id": "f1", "name": "Ground Floor", "level": 0 }],
    "floorPlan": { "svg": "<svg>...</svg>", "positions": [{ "sceneId": "s1", "x": 100, "y": 150 }] },
    "audioUrl": "/cdn/tours/123/audio.mp3",
    "branding": { "primaryColor": "#00C8E0", "logoUrl": "/cdn/tours/123/logo.png" },
    "accessControl": { "type": "password", "password": "sha256..." }
  }
}
```

### 4.2 Project.new fields
| Field | Type | Default |
|-------|------|---------|
| `viewCount` | `Int` | `0` |
| `publishedUrl` | `String?` | existing |

### 4.3 New relational tables

```prisma
model TourScene {
  id          String    @id @default(uuid())
  projectId   String    @map("project_id")
  floorId     String?   @map("floor_id")
  title       String
  equirectangularUrl String
  initialView Json?
  floorPlanPosition Json?
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  project     Project   @relation(fields: [projectId], references: [id])
  floor       TourFloor? @relation(fields: [floorId], references: [id])
  hotspots    TourHotspot[]
  galleryItems TourGalleryItem[]
  effects     Json?
}

model TourHotspot {
  id          String  @id @default(uuid())
  sceneId     String  @map("scene_id")
  type        String  // 'navigation', 'info', 'gallery', 'floorplan'
  label       String?
  yaw         Float
  pitch       Float
  targetSceneId String?
  url         String?
  galleryId   String?
  scene       TourScene @relation(fields: [sceneId], references: [id])
  gallery     TourGallery? @relation(fields: [galleryId], references: [id])
}

model TourFloor {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  name      String
  level     Int
  sortOrder Int      @default(0)
  svgPath   String?
  project   Project  @relation(fields: [projectId], references: [id])
  scenes    TourScene[]
}

model TourGallery {
  id           String   @id @default(uuid())
  sceneId      String   @map("scene_id")
  title        String
  thumbnailUrl String?
  scene        TourScene @relation(fields: [sceneId], references: [id])
  items        TourGalleryItem[]
}

model TourGalleryItem {
  id          String  @id @default(uuid())
  galleryId   String  @map("gallery_id")
  imageUrl    String
  caption     String?
  sortOrder   Int     @default(0)
  is360       Boolean @default(false)
  gallery     TourGallery @relation(fields: [galleryId], references: [id])
  sceneId     String?  @map("scene_id")
  scene       TourScene? @relation(fields: [sceneId], references: [id])
}

model TourWalkthrough {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  title     String
  path      Json     // [{ sceneId, targetView, durationMs, transition }]
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  project   Project  @relation(fields: [projectId], references: [id])
}

model TourVersion {
  id               String   @id @default(uuid())
  projectId        String   @map("project_id")
  version          String
  configSnapshot   Json
  createdAt        DateTime @default(now())
  createdBy        String   @map("created_by")
  project          Project  @relation(fields: [projectId], references: [id])
}
```

**Backward compatibility**: `map-tour-config.ts` continues mapping `Project.assets` → scenes. New relational tables are optional; they activate when admin populates them.

## 5. API Design

### 5.1 Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tours/[id]` | public | Tour config + increment view count |
| POST | `/api/tours/[id]/view` | public | Record analytics view event |
| GET | `/api/tours/[id]/stats` | owner | Analytics + heatmap data |
| GET/POST | `/api/tours/[id]/scenes` | owner | Scene list / create |
| GET/PUT/DEL | `/api/tours/[id]/scenes/[sceneId]` | owner | Scene CRUD |
| GET/POST | `/api/tours/[id]/scenes/[sceneId]/hotspots` | owner | Hotspot management |
| GET/POST | `/api/tours/[id]/scenes/[sceneId]/gallery` | owner | Photo gallery per scene |
| GET/POST | `/api/tours/[id]/floors` | owner | Floor management |
| GET/POST | `/api/tours/[id]/walkthrough` | owner | Walkthrough paths |
| POST | `/api/tours/[id]/access` | public | Password/token validation |
| POST | `/api/tours/[id]/publish` | owner | Publish + version snapshot |
| GET | `/api/tours/[id]/versions` | owner | Version history |
| POST | `/api/tours/[id]/versions/[versionId]/restore` | owner | Restore version |
| POST | `/api/tours/[id]/upload` | owner | 3D asset upload (presigned URL) |

### 5.2 Schema validation (Zod)
Uses existing `lib/validations/api.ts` helpers. Key schemas:
- `createSceneSchema` — { title, equirectangularUrl, floorId?, initialView?, floorPlanPosition? }
- `createHotspotSchema` — { type, label?, yaw, pitch, targetSceneId?, url?, galleryId? }
- `createWalkthroughSchema` — { title, path: [{ sceneId, targetView, durationMs, transition? }] }
- `uploadRequestSchema` — { filename, file_type, file_size }
- `viewEventSchema` — { sceneId?, durationMs, heading? }

### 5.3 Authorization
Uses `requirePermission()` from `lib/auth/session.ts`:
- Public: GET tour config, view events, access validation
- Owner (SUPER_ADMIN/ADMIN/USER): all other endpoints
- Enforced in `proxy.ts` via `isApiProtectedPath`

## 6. 3D Pipeline

### 6.1 Supported formats
| Format | Source | Target |
|--------|--------|--------|
| `.glb` / `.gltf` | Photogrammetry exports | Babylon.js (native) |
| `.obj` + `.mtl` | Matterport exports | Convert → `.glb` |
| `.ply` | LiDAR point clouds | Convert → `.glb` (point cloud) |
| `.las` | LiDAR scans | Convert → `.glb` (point cloud) |
| `.jpg` / `.png` | Equirectangular panoramas | Marzipano (existing) |

### 6.2 No server-side processing
Users provide web-ready models. Optional client-side optimization via Babylon.js DRACO compression when uploading.

### 6.3 Development without samples
Use public datasets:
- Matterport3D synthetic: https://github.com/niessner/Matterport3D
- Sketchfab CC-BY room models
- Poly Haven / Google poly (for simple room geometry)

## 7. Feature Details

### Navigation (Feature #6, #5, #7)
- **FloorSelector**: Dropdown with floor names, keyboard shortcut (1-9)
- **FloorPlanOverlay**: SVG overlay bottom-left, clickable room polygons → hotspot navigation
- **Compass**: Top-center, shows heading, mini-map in corner, click to reset orientation

### Media (Feature #13, #15, #24)
- **PhotoGallery**: Lightbox modal, swipe navigation, 360° image support via Marzipano embed
- **TimelinePlayer**: Bottom-bar playback, auto-advance, configurable timing per waypoint
- **AudioPlayer**: Volume slider, mute toggle, autoplay safety, persists preference in localStorage

### UX (Feature #25, #23, #27)
- **Transitions**: CSS transitions between scenes (fade, slide), 250-500ms duration
- **VisualEffects**: Per-scene or global sliders (brightness 0-200%, contrast 0-200%, saturation 0-200%)
- **Accessibility**: ARIA labels, keyboard nav (arrow keys, tab), screen reader announcements, `prefers-reduced-motion`

### Admin (Feature #18, #4, #40, #41)
- **FloorPlanBuilder**: Drag-drop polygon editor (client-side), exports to SVG, stored in Project.settings
- **GalleryManager**: Upload, reorder (drag-drop), caption, 360° toggle, thumbnail crop
- **AnalyticsDashboard**: Heatmap overlay, engagement metrics, time-per-scene, export CSV
- **ThemingSystem**: Live preview of colors/fonts, stores in Project.settings.branding
- **Publish/Versioning**: Draft/live toggle, version history (snapshot on publish), rollback

### Social (Feature #19, #20, #12)
- **Deep linking**: Share URL with `?scene=xxx&yaw=1.2&pitch=0.1` params
- **Social sharing**: Twitter/Facebook/LinkedIn share, Open Graph meta tags with `?view=share`
- **Deep linking**: Copy shareable link button, QR code generator

### Technical (Feature #8, #9, #16, #1)
- **ViewModeSwitcher**: Toggle panoramic/dollhouse/floor-plan, shows loading skeleton during Babylon.js init
- **MeasurementTool**: Click-drag, shows distance in user units (m/ft), calibration mode
- **AssetManagement**: Tags on Asset model, cross-project reuse, bulk operations
- **TourAnalyticsEndpoint**: POST events, GET aggregated metrics

## 8. Error Handling & Testing

### 8.1 Error handling
- API errors: structured `{ error, code? }` with 400/401/403/404/500
- Viewer errors: fallback UI with retry button
- All errors include `tenantId` + `userId` in Pino logs (via `createLogger`)
- 3D pipeline errors logged + surfaced in admin version history

### 8.2 Testing strategy
- **Unit** (`lib/tour/*.test.ts`): config mapping, hotspot normalization, walkthrough validation
- **Component** (`components/tour/*.test.tsx`): ModeManager switching, FloorSelector filtering, Compass heading
- **E2E** (`e2e/tour.spec.ts`): login → open tour → switch floor → walkthrough → measure
- Uses existing Playwright config (localhost:3001) + Pino for test logging

## 9. Deployment

- 3D pipeline runs as BullMQ worker (existing queue infrastructure)
- Babylon.js lazy-loaded via `next/dynamic(ssr: false)`
- R2 cold storage for originals + optimized assets
- CDN caching (1-year TTL via R2 + CloudFront)
- Feature flag: `tour.settings.enable3d` (boolean) to disable on low-spec devices

## 10. Constraints & Assumptions

- Panoramic mode (Marzipano) is the primary deliverable; 3D modes are extensions
- No server-side 3D processing required; users supply web-ready models
- Existing `map-tour-config.ts` continues to work; new tables are optional enhancements
- TypeScript strict mode enabled throughout
