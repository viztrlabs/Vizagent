# Virtual Tour System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete virtual tour system with Marzipano (360° panoramas) + Babylon.js (3D modes) supporting all 15 features across 3 priority tiers.

**Architecture:** Monolithic tour module under `lib/server/tour/` and `components/tour/`, with lazy-loaded viewers via ModeManager and shared TourFeatureContext for state. Hybrid data model: JSON config on `Project.settings` + relational tables for structured tour data.

**Tech Stack:** Next.js 16.3, TypeScript, Prisma, Zod, React Server Components, Marzipano (panoramic), Babylon.js (3D), Vitest + Playwright for testing, Pino for logging.

## Global Constraints

- Next.js 16.3+ App Router (not Pages)
- TypeScript strict mode (`tsconfig.json` with `"strict": true`)
- All API routes use `app/api/` flat file router (not `pages/api/`)
- Tests run via `pnpm test` (Vitest) and `pnpm test:e2e` (Playwright)
- All DB access through `lib/db/server.ts` PrismaClient (singleton pattern)
- Auth via `lib/auth/session.ts` (`getCurrentAuth`, `requirePermission`)
- Validation via `lib/validations/api.ts` (`validateBody`, `validationErrorResponse`)
- Logging via `lib/server/logger.ts` (`createLogger`, `logRequest`, `logError`)
- Public tours use `app/(public)/tour/[id]/page.tsx` with `TourPageClient.tsx`
- Feature components must be client components (`'use client'`) with `tabIndex=0` for accessibility
- No server-side 3D processing; users supply web-ready models
- Use `lucide-react` for icons
- Use Radix UI patterns for interactive components (`@radix-ui/react-*`)

---

## Phase 1: Foundation (Week 1)

### Task 1: Extend Prisma Schema for Tour Entities

**Files:**
- Modify: `prisma/schema.prisma` — add TourScene, TourHotspot, TourFloor, TourGallery, TourGalleryItem, TourWalkthrough, TourVersion models
- Modify: `prisma/schema.prisma` — add `viewCount` to Project model
- Modify: `lib/db/server.ts` — ensure singleton pattern (no change needed if already correct)

**Interfaces:**
- Consumes: existing Project model in `prisma/schema.prisma`
- Produces: new Prisma models with relations to Project and each other
- Test: `npx tsc --noEmit` (schema types must compile)

```prisma
model TourScene {
  id           String  @id @default(uuid())
  projectId    String  @map("project_id")
  floorId      String? @map("floor_id")
  title        String
  equirectangularUrl String
  initialView  Json?
  floorPlanPosition Json?
  sortOrder    Int     @default(0)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  project      Project @relation(fields: [projectId], references: [id])
  floor        TourFloor? @relation(fields: [floorId], references: [id])
  hotspots     TourHotspot[]
  galleryItems TourGalleryItem[]
  effects      Json?

  @@index([projectId])
  @@index([floorId])
  @@map("tour_scenes")
}

model TourHotspot {
  id           String  @id @default(uuid())
  sceneId      String  @map("scene_id")
  type         String  // 'navigation', 'info', 'gallery', 'floorplan'
  label        String?
  yaw          Float
  pitch        Float
  targetSceneId String?
  url          String?
  galleryId    String?
  scene        TourScene @relation(fields: [sceneId], references: [id])
  gallery      TourGallery? @relation(fields: [galleryId], references: [id])

  @@index([sceneId])
  @@map("tour_hotspots")
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

  @@index([projectId])
  @@map("tour_floors")
}

model TourGallery {
  id           String  @id @default(uuid())
  sceneId      String  @map("scene_id")
  title        String
  thumbnailUrl String?
  scene        TourScene @relation(fields: [sceneId], references: [id])
  items        TourGalleryItem[]

  @@index([sceneId])
  @@map("tour_galleries")
}

model TourGalleryItem {
  id          String  @id @default(uuid())
  galleryId   String  @map("gallery_id")
  imageUrl    String
  caption     String?
  sortOrder   Int     @default(0)
  is360       Boolean @default(false)
  gallery     TourGallery @relation(fields: [galleryId], references: [id])
  sceneId     String? @map("scene_id")
  scene       TourScene? @relation(fields: [sceneId], references: [id])

  @@index([galleryId])
  @@map("tour_gallery_items")
}

model TourWalkthrough {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  title     String
  path      Json     // [{ sceneId, targetView, durationMs, transition }]
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  project   Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@map("tour_walkthroughs")
}

model TourVersion {
  id            String   @id @default(uuid())
  projectId     String   @map("project_id")
  version       String
  configSnapshot Json
  createdAt     DateTime @default(now()) @map("created_at")
  createdBy     String   @map("created_by")
  project       Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@map("tour_versions")
}
```

Also add to Project model:
```prisma
viewCount    Int      @default(0) @map("view_count")
```

- [ ] **Step 1: Add models to schema.prisma**
- [ ] **Step 2: Run `pnpm prisma:generate` to verify types**
- [ ] **Step 3: Run `pnpm db:push` to apply migration** (use dev DB)
- [ ] **Step 4: Run `pnpm typecheck`**
- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "chore: add tour schema models (TourScene, TourFloor, TourGallery, TourWalkthrough, TourVersion)"
```

---

### Task 2: Extend TourConfig Types

**Files:**
- Modify: `lib/tour/types.ts` — add Floor, Gallery, Walkthrough, AccessControl, Branding, AudioConfig, VisualEffects types
- Add: `lib/tour/types.ts` extension for 3D model reference

**Interfaces:**
- Consumes: existing `TourConfig`, `TourScene`, `TourHotspot`, `TourSettings` types
- Produces: extended types for floors, galleries, walkthrough, versioning, access control, 3D models

```typescript
export interface TourFloorConfig {
  id: string;
  name: string;
  level: number;
  sortOrder: number;
  svgPath?: string;
  sceneIds: string[];
}

export interface TourGalleryImage {
  id: string;
  imageUrl: string;
  caption?: string;
  is360: boolean;
}

export interface TourGalleryConfig {
  id: string;
  title: string;
  images: TourGalleryImage[];
}

export interface WalkthroughWaypoint {
  sceneId: string;
  targetView: { yaw: number; pitch: number; fov?: number };
  durationMs: number;
  transition?: 'auto' | 'manual' | 'fade' | 'slide';
}

export interface WalkthroughConfig {
  id: string;
  title: string;
  path: WalkthroughWaypoint[];
  active: boolean;
}

export interface AccessControlConfig {
  type: 'public' | 'password' | 'token';
  passwordHash?: string;
  allowedTokens?: string[];
}

export interface BrandingConfig {
  primaryColor?: string;
  logoUrl?: string;
  coverImage?: string;
}

export interface VisualEffectsConfig {
  brightness: number;  // 0-200
  contrast: number;    // 0-200
  saturation: number;  // 0-200
}

export interface TourScene3DConfig {
  sceneId: string;
  modelUrl?: string;        // glb/gltf
  pointCloudUrl?: string;   // ply/las converted
  floorPlanPosition?: { x: number; y: number };
}

export interface TourConfig {
  id: string;
  title: string;
  scenes: TourScene[];
  settings: TourSettings;
  floors?: TourFloorConfig[];           // NEW
  galleries?: TourGalleryConfig[];      // NEW
  walkthroughs?: WalkthroughConfig[];   // NEW
  accessControl?: AccessControlConfig;  // NEW
  branding?: BrandingConfig;            // NEW
  audioUrl?: string;                    // NEW
  version?: string;                     // NEW - for versioning
  model3d?: TourScene3DConfig[];        // NEW - Babylon.js integration
}
```

- [ ] **Step 1: Extend types.ts**
- [ ] **Step 2: Run typecheck**
- [ ] **Step 3: Commit**

```bash
git add lib/tour/types.ts
git commit -m "feat: extend TourConfig types with floors, galleries, walkthrough, access control"
```

---

### Task 3: Extend mapTourConfig for New Data

**Files:**
- Modify: `lib/tour/map-tour-config.ts` — merge relational TourScene/TourFloor/TourGallery data into TourConfig
- Modify: `lib/tour/map-tour-config.test.ts` — add tests for new data sources

**Interfaces:**
- Consumes: `TourConfig` from `lib/tour/types.ts` (after Task 2)
- Produces: extended `mapTourConfig` that queries Prisma for relational tour data

**Consumes (Prisma data):**
- `TourScene.findMany({ where: { projectId } })` → scenes override asset-derived scenes
- `TourFloor.findMany({ where: { projectId }, orderBy: { level: 'asc' } })` → floor list
- `TourGallery.findMany({ where: { sceneId } })` → galleries per scene
- `TourWalkthrough.findMany({ where: { projectId, active: true } })` → walkthroughs

**Produces:** Enhanced `TourConfig` with all new fields populated

- [ ] **Step 1: Update mapTourConfig to accept Prisma data**

The function signature changes to:
```typescript
export async function mapTourConfig(
  input: MapTourConfigInput,
  dbData?: {
    scenes?: TourSceneData[];
    floors?: TourFloorData[];
    galleries?: TourGalleryData[];
    walkthroughs?: WalkthroughData[];
  }
): Promise<TourConfig | null>
```

Where `TourSceneData` is the Prisma-returned shape with `hotspots`, `galleryItems`, etc.

- [ ] **Step 2: Write failing tests for floor mapping**
- [ ] **Step 3: Implement floor mapping**
- [ ] **Step 4: Write failing tests for gallery mapping**
- [ ] **Step 5: Implement gallery mapping**
- [ ] **Step 6: Write failing tests for walkthrough mapping**
- [ ] **Step 7: Implement walkthrough mapping**
- [ ] **Step 8: Run tests, fix failures**
- [ ] **Step 9: Commit**

```bash
git add lib/tour/map-tour-config.ts lib/tour/map-tour-config.test.ts
git commit -m "feat: extend mapTourConfig to merge relational tour data"
```

---

### Task 4: Create TourFeatureContext

**Files:**
- Create: `components/tour/TourFeatureContext.tsx` — shared React context
- Create: `components/tour/TourFeatureContext.test.tsx` — component tests

**Interfaces:**
- Consumes: `TourConfig` from `lib/tour/types.ts`
- Produces: `TourFeatureContextType` with `config`, `activeSceneId`, `cameraHeading`, `activeFloorId`, `isAuthenticated`

```typescript
interface TourFeatureContextType {
  config: TourConfig | null;
  activeSceneId: string | null;
  cameraHeading: { yaw: number; pitch: number; fov: number };
  activeFloorId: string | null;
  isAuthenticated: boolean;
  setActiveScene: (id: string) => void;
  setCameraHeading: (heading: { yaw: number; pitch: number; fov: number }) => void;
  setActiveFloor: (id: string | null) => void;
}

const TourFeatureContext = createContext<TourFeatureContextType | null>(null);

export function useTourFeature() {
  const ctx = useContext(TourFeatureContext);
  if (!ctx) throw new Error('useTourFeature must be used within TourFeatureProvider');
  return ctx;
}
```

- [ ] **Step 1: Create TourFeatureContext with provider**
- [ ] **Step 2: Create test file with basic context tests**
- [ ] **Step 3: Run tests, verify pass**
- [ ] **Step 4: Commit**

```bash
git add components/tour/TourFeatureContext.tsx components/tour/TourFeatureContext.test.tsx
git commit -m "feat: create TourFeatureContext for shared tour state"
```

---

### Task 5: Create ModeManager Component

**Files:**
- Create: `components/tour/ModeManager.tsx` — lazy-loads Marzipano or Babylon.js viewer
- Create: `components/tour/ModeManager.test.tsx` — tests mode switching

**Interfaces:**
- Consumes: `TourConfig` from `lib/tour/types.ts`, `useTourFeature` hook
- Produces: `ModeManager` component with `mode` prop (`'panoramic' | 'dollhouse' | 'floor-plan'`)

```typescript
interface ModeManagerProps {
  config: TourConfig;
  mode?: 'panoramic' | 'dollhouse' | 'floor-plan';
  defaultMode?: 'panoramic' | 'dollhouse' | 'floor-plan';
  className?: string;
}

function ModeManager({ config, mode = 'panoramic', defaultMode = 'panoramic' }: ModeManagerProps) {
  const [currentMode, setCurrentMode] = useState(mode);

  if (currentMode === 'panoramic') {
    return <MarzipanoTourViewer config={config} />;
  }

  // Lazy-load Babylon.js viewer for 3D modes
  if (currentMode === 'dollhouse' || currentMode === 'floor-plan') {
    const BabylonTourViewer = dynamic(() => import('../babylon/BabylonTourViewer'), { ssr: false });
    return <BabylonTourViewer config={config} mode={currentMode} />;
  }

  return <MarzipanoTourViewer config={config} />;
}
```

For Phase 1 (no Babylon.js yet), the component renders Marzipano for all modes, with a stub for Babylon.js that shows "3D models coming soon."

- [ ] **Step 1: Create ModeManager with lazy loading**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests, verify pass**
- [ ] **Step 4: Run typecheck**
- [ ] **Step 5: Commit**

```bash
git add components/tour/ModeManager.tsx components/tour/ModeManager.test.tsx
git commit -m "feat: create ModeManager for viewer switching"
```

---

## Phase 2: Immediate Features (Week 1-2)

### Task 6: Extend TourPageClient with Feature Provider

**Files:**
- Modify: `app/(public)/tour/[id]/TourPageClient.tsx` — wrap viewer in TourFeatureProvider

**Interfaces:**
- Consumes: `ModeManager`, `TourFeatureProvider` from Task 5
- Produces: TourPageClient with feature overlays container

Modify `TourPageClient.tsx` to:
1. Wrap in `TourFeatureProvider`
2. Render `ModeManager` instead of `MarzipanoTourViewer` directly
3. Add container div for overlay components

```tsx
export function TourPageClient({ config }: TourPageClientProps) {
  // ... existing null check ...
  return (
    <div className="viztr-tour-page">
      <TourFeatureProvider config={config}>
        <div className="relative w-full h-screen">
          <ModeManager config={config} defaultMode="panoramic" />
          {/* Overlays mount here in later tasks */}
        </div>
      </TourFeatureProvider>
    </div>
  );
}
```

- [ ] **Step 1: Update TourPageClient to use ModeManager + TourFeatureProvider**
- [ ] **Step 2: Run typecheck**
- [ ] **Step 3: Run dev server, verify tour loads**
- [ ] **Step 4: Commit**

```bash
git add app/(public)/tour/[id]/TourPageClient.tsx
git commit -m "feat: integrate ModeManager and TourFeatureProvider into tour page"
```

---

### Task 7: Extend Public Tour API Route

**Files:**
- Modify: `app/api/public/tour/[id]/route.ts` — increment viewCount, support access control

**Interfaces:**
- Consumes: existing route handler
- Produces: enhanced GET that increments `viewCount` and validates access control

Changes:
1. After fetching project, call `prisma.project.update({ where: { id }, data: { viewCount: { increment: 1 } } })`
2. Check `project.settings.accessControl` — if password-protected, return challenge
3. Return config including new fields (floors, galleries, walkthroughs)

```typescript
// After project fetch:
await prisma.project.update({
  where: { id },
  data: { viewCount: { increment: 1 } },
});

// Check access control
const settings = typeof project.settings === 'string' ? JSON.parse(project.settings) : project.settings;
const accessControl = settings?.accessControl;
if (accessControl?.type === 'password') {
  // Return 401 with challenge
  return NextResponse.json({ error: 'Password required', code: 'ACCESS_CONTROL_REQUIRED' }, { status: 401 });
}

// Fetch relational tour data
const [tourScenes, tourFloors, tourWalkthroughs] = await Promise.all([
  prisma.tourScene.findMany({ where: { projectId: id }, include: { hotspots: true, galleryItems: true } }),
  prisma.tourFloor.findMany({ where: { projectId: id } }),
  prisma.tourWalkthrough.findMany({ where: { projectId: id, active: true } }),
]);
```

Also add POST `/api/tours/[id]/access` for password validation:
```typescript
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { password } = await req.json();
  // Validate password against stored hash
  // Return success or 401
}
```

- [ ] **Step 1: Update GET route to increment viewCount and support access control**
- [ ] **Step 2: Create POST access validation endpoint**
- [ ] **Step 3: Write tests for view count increment**
- [ ] **Step 4: Commit**

```bash
git add app/api/public/tour/[id]/route.ts
git commit -m "feat: increment viewCount, add access control to tour API"
```

---

### Task 8: FloorSelector Component

**Files:**
- Create: `components/tour/FloorSelector.tsx`
- Create: `components/tour/FloorSelector.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature` from Task 4
- Produces: Dropdown stepper for floor selection, filters scenes by floor

```typescript
export function FloorSelector() {
  const { config, activeFloorId, setActiveFloor, setActiveScene } = useTourFeature();
  if (!config?.floors || config.floors.length <= 1) return null;

  // Render: vertical stepper or dropdown with floor names
  // When floor changes: update activeFloorId, switch to first scene on that floor
  return (
    <div className="viztr-floor-selector">
      {config.floors.map((floor) => (
        <button
          key={floor.id}
          onClick={() => {
            setActiveFloor(floor.id);
            setActiveScene(floor.sceneIds[0]);
          }}
          className={activeFloorId === floor.id ? 'active' : ''}
        >
          {floor.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 1: Create FloorSelector component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Run typecheck**
- [ ] **Step 5: Commit**

```bash
git add components/tour/FloorSelector.tsx components/tour/FloorSelector.test.tsx
git commit -m "feat: add FloorSelector component for multi-level tour navigation"
```

---

### Task 9: FloorPlanOverlay Component

**Files:**
- Create: `components/tour/FloorPlanOverlay.tsx`
- Create: `components/tour/FloorPlanOverlay.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature` from Task 4
- Produces: Clickable SVG floor plan overlay with room hotspots

```typescript
export function FloorPlanOverlay() {
  const { config, activeFloorId, setActiveScene, cameraHeading } = useTourFeature();
  if (!config?.floors?.[0]?.svgPath) return null;

  // Render SVG overlay with clickable polygons
  // Clicking a room polygon → setActiveScene(sceneId)
  return (
    <div className="viztr-floor-plan-overlay">
      <svg dangerouslySetInnerHTML={{ __html: activeFloor?.svgPath }} />
      {rooms.map((room) => (
        <polygon
          key={room.id}
          points={room.points}
          onClick={() => setActiveScene(room.sceneId)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 1: Create FloorPlanOverlay component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/FloorPlanOverlay.tsx components/tour/FloorPlanOverlay.test.tsx
git commit -m "feat: add FloorPlanOverlay component for clickable floor navigation"
```

---

### Task 10: Compass Component

**Files:**
- Create: `components/tour/Compass.tsx`
- Create: `components/tour/Compass.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature` from Task 4
- Produces: Compass rose showing heading + mini-map position marker

```typescript
export function Compass() {
  const { cameraHeading, config } = useTourFeature();
  if (!config) return null;

  return (
    <div className="viztr-compass">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="transparent" stroke="white" strokeWidth="1" />
        <line
          x1="50"
          y1="50"
          x2={50 + 35 * Math.sin(cameraHeading.yaw)}
          y2={50 - 35 * Math.cos(cameraHeading.yaw)}
          stroke="cyan"
          strokeWidth="2"
        />
        {/* N, E, S, W markers */}
      </svg>
    </div>
  );
}
```

- [ ] **Step 1: Create Compass component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/Compass.tsx components/tour/Compass.test.tsx
git commit -m "feat: add Compass component with heading indicator"
```

---

### Task 11: PhotoGallery Component

**Files:**
- Create: `components/tour/PhotoGallery.tsx`
- Create: `components/tour/PhotoGallery.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature`, `TourGalleryConfig` from types
- Produces: Carousel/lightbox modal for scene photo galleries

```typescript
export function PhotoGallery() {
  const { config, activeSceneId } = useTourFeature();
  const gallery = config?.galleries?.find((g) => g.sceneIds?.includes(activeSceneId ?? ''));
  if (!gallery) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>View Photos</button>
      {isOpen && (
        <div className="viztr-lightbox">
          {/* Carousel with lightbox */}
          <img src={gallery.images[activeIndex].imageUrl} alt={gallery.images[activeIndex].caption} />
          {/* Navigation arrows, thumbnails */}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 1: Create PhotoGallery component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/PhotoGallery.tsx components/tour/PhotoGallery.test.tsx
git commit -m "feat: add PhotoGallery component with lightbox carousel"
```

---

### Task 12: TimelinePlayer Component

**Files:**
- Create: `components/tour/TimelinePlayer.tsx`
- Create: `components/tour/TimelinePlayer.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature`, `WalkthroughConfig` from types
- Produces: Playback controls for guided walkthrough paths

```typescript
export function TimelinePlayer() {
  const { config, setActiveScene } = useTourFeature();
  const walkthrough = config?.walkthroughs?.[0];
  if (!walkthrough) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // On play: iterate through waypoints, switch scenes after duration
  return (
    <div className="viztr-timeline-player">
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      {/* Progress bar showing waypoint progress */}
    </div>
  );
}
```

- [ ] **Step 1: Create TimelinePlayer component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/TimelinePlayer.tsx components/tour/TimelinePlayer.test.tsx
git commit -m "feat: add TimelinePlayer component for guided walkthroughs"
```

---

### Task 13: AudioPlayer Component

**Files:**
- Create: `components/tour/AudioPlayer.tsx`
- Create: `components/tour/AudioPlayer.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature`
- Produces: Audio player with volume/mute controls

```typescript
export function AudioPlayer() {
  const { config } = useTourFeature();
  if (!config?.audioUrl) return null;

  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);

  return (
    <div className="viztr-audio-player">
      <audio src={config.audioUrl} autoPlay loop />
      <input type="range" min="0" max="100" value={volume * 100} onChange={...} />
      <button onClick={() => setMuted(!muted)}>Mute</button>
    </div>
  );
}
```

- [ ] **Step 1: Create AudioPlayer component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/AudioPlayer.tsx components/tour/AudioPlayer.test.tsx
git commit -m "feat: add AudioPlayer component with volume controls"
```

---

### Task 14: VisualEffects Component

**Files:**
- Create: `components/tour/VisualEffects.tsx`
- Create: `components/tour/VisualEffects.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature`
- Produces: Sliders for brightness, contrast, saturation applied via CSS filters

```typescript
export function VisualEffects() {
  const { config } = useTourFeature();
  if (!config?.effects) return null;

  const effects = config.effects || { brightness: 100, contrast: 100, saturation: 100 };

  return (
    <div className="viztr-visual-effects">
      <label>Brightness: <input type="range" min="0" max="200" value={effects.brightness} /></label>
      <label>Contrast: <input type="range" min="0" max="200" value={effects.contrast} /></label>
      <label>Saturation: <input type="range" min="0" max="200" value={effects.saturation} /></label>
    </div>
  );
}
```

- [ ] **Step 1: Create VisualEffects component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/VisualEffects.tsx components/tour/VisualEffects.test.tsx
git commit -m "feat: add VisualEffects component with CSS filter controls"
```

---

### Task 15: TourMenu Component

**Files:**
- Create: `components/tour/TourMenu.tsx`
- Create: `components/tour/TourMenu.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature`
- Produces: Slide-out drawer with project info, external links, view count

```typescript
export function TourMenu() {
  const { config } = useTourFeature();
  if (!config) return null;

  return (
    <div className="viztr-tour-menu">
      <div className="viztr-tour-menu-content">
        <h2>{config.title}</h2>
        <p>Views: {config.viewCount ?? 0}</p>
        {config.branding?.logoUrl && <img src={config.branding.logoUrl} alt="Logo" />}
        {config.settings.externalLinks?.map((link) => (
          <a key={link.url} href={link.url}>{link.label}</a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create TourMenu component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/TourMenu.tsx components/tour/TourMenu.test.tsx
git commit -m "feat: add TourMenu component with project info and links"
```

---

### Task 16: Integrate All Feature Components into TourPageClient

**Files:**
- Modify: `app/(public)/tour/[id]/TourPageClient.tsx`

**Interfaces:**
- Consumes: All feature components from Tasks 8-15
- Produces: TourPageClient with all immediate-tier overlays mounted

```tsx
// Inside TourFeatureProvider wrapper, add overlays:
<FloorSelector />
<FloorPlanOverlay />
<Compass />
<PhotoGallery />
<TimelinePlayer />
<AudioPlayer />
<VisualEffects />
<TourMenu />
```

- [ ] **Step 1: Import and render all feature components**
- [ ] **Step 2: Add CSS for overlay positioning**
- [ ] **Step 3: Run dev server, verify all overlays render**
- [ ] **Step 4: Run typecheck**
- [ ] **Step 5: Commit**

```bash
git add app/(public)/tour/[id]/TourPageClient.tsx
git commit -m "feat: integrate all tour feature components into viewer page"
```

---

### Task 17: Create Tour Admin Dashboard Pages

**Files:**
- Create: `app/(dashboard)/tours/[id]/page.tsx` — admin tour view
- Create: `app/(dashboard)/tours/[id]/scenes/page.tsx` — scene management
- Create: `app/(dashboard)/tours/[id]/floors/page.tsx` — floor management
- Create: `app/(dashboard)/tours/[id]/gallery/page.tsx` — gallery management

**Interfaces:**
- Consumes: existing dashboard layout pattern from `app/(dashboard)/dashboard/page.tsx`
- Produces: admin pages with CRUD interfaces using Radix UI components

**Key admin features for immediate tier:**
1. Scene list with edit/delete (uses `app/api/tours/[id]/scenes` endpoints)
2. Floor list with sort order (uses `app/api/tours/[id]/floors` endpoints)
3. Gallery manager with upload/reorder (uses `app/api/tours/[id]/scenes/[sid]/gallery` endpoints)
4. Walkthrough editor with waypoint drag-drop (uses `app/api/tours/[id]/walkthrough` endpoints)

- [ ] **Step 1: Create admin tour page shell**
- [ ] **Step 2: Create scene management page**
- [ ] **Step 3: Create floor management page**
- [ ] **Step 4: Create gallery management page**
- [ ] **Step 5: Run typecheck**
- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/tours/
git commit -m "feat: add tour admin dashboard pages"
```

---

### Task 18: Add API Endpoints for Tour CRUD Operations

**Files:**
- Create: `app/api/tours/[id]/route.ts` — GET (admin), POST (create)
- Create: `app/api/tours/[id]/scenes/route.ts` — GET, POST
- Create: `app/api/tours/[id]/scenes/[sceneId]/route.ts` — GET, PUT, DELETE
- Create: `app/api/tours/[id]/scenes/[sceneId]/hotspots/route.ts` — GET, POST
- Create: `app/api/tours/[id]/floors/route.ts` — GET, POST
- Create: `app/api/tours/[id]/walkthrough/route.ts` — GET, POST
- Create: `app/api/tours/[id]/stats/route.ts` — GET analytics
- Create: `app/api/tours/[id]/versions/route.ts` — GET version history
- Create: `app/api/tours/[id]/publish/route.ts` — POST publish + snapshot

**Interfaces:**
- Consumes: Prisma client, `validateBody`, `getCurrentAuth`, `createLogger`
- Produces: RESTful endpoints with Zod validation

**Key endpoints for immediate tier:**
```typescript
// app/api/tours/[id]/scenes/route.ts
export async function GET(req, { params }) {
  const auth = await getCurrentAuth();
  if (!auth.dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await params;
  const scenes = await prisma.tourScene.findMany({
    where: { projectId: id },
    include: { hotspots: true, galleryItems: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ scenes });
}

export async function POST(req, { params }) {
  const auth = await getCurrentAuth();
  if (!auth.dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await params;
  const body = await req.json();
  const validation = validateBody(createSceneSchema, body);
  if (!validation.success) return validationErrorResponse(validation.errors);
  
  const scene = await prisma.tourScene.create({
    data: { projectId: id, ...validation.data },
  });
  return NextResponse.json({ scene }, { status: 201 });
}
```

- [ ] **Step 1: Create scene CRUD endpoints**
- [ ] **Step 2: Create floor CRUD endpoints**
- [ ] **Step 3: Create walkthrough endpoints**
- [ ] **Step 4: Create stats endpoint**
- [ ] **Step 5: Create publish endpoint**
- [ ] **Step 6: Run typecheck**
- [ ] **Step 7: Run tests**
- [ ] **Step 8: Commit**

```bash
git add app/api/tours/
git commit -m "feat: add tour CRUD API endpoints for scenes, floors, walkthroughs, stats, publish"
```

---

## Phase 3: Medium-Term Features (Weeks 3-4)

### Task 19: Asset Management Extension

**Files:**
- Modify: `prisma/schema.prisma` — add `tags` field to Asset model
- Create: `app/(dashboard)/assets/page.tsx` — media library with tags
- Create: `lib/validations/index.ts` — `assetTagSchema`

**Interfaces:**
- Consumes: existing Asset model
- Produces: tagged assets with cross-project reuse support

```prisma
// Add to Asset model:
tags    String[]  @default([]) @map("tags")
```

- [ ] **Step 1: Add tags field to Asset schema**
- [ ] **Step 2: Create media library admin page**
- [ ] **Step 3: Add asset tag validation schema**
- [ ] **Step 4: Run typecheck**
- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma app/(dashboard)/assets/ lib/validations/index.ts
git commit -m "feat: add asset tags and media library"
```

---

### Task 20: ViewModeSwitcher Component

**Files:**
- Create: `components/tour/ViewModeSwitcher.tsx`
- Create: `components/tour/ViewModeSwitcher.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature`, ModeManager from Task 5
- Produces: Toolbar button to toggle between panoramic/dollhouse/floor-plan views

```typescript
export function ViewModeSwitcher() {
  const { config } = useTourFeature();
  const [mode, setMode] = useState<'panoramic' | 'dollhouse' | 'floor-plan'>('panoramic');
  
  // Only show 3D modes if model3d assets exist
  const has3D = !!config?.model3d?.length;

  return (
    <div className="viztr-view-mode-switcher">
      <button onClick={() => setMode('panoramic')}>Panoramic</button>
      {has3D && <button onClick={() => setMode('dollhouse')}>Dollhouse</button>}
      {has3D && <button onClick={() => setMode('floor-plan')}>Floor Plan</button>}
    </div>
  );
}
```

- [ ] **Step 1: Create ViewModeSwitcher component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/ViewModeSwitcher.tsx components/tour/ViewModeSwitcher.test.tsx
git commit -m "feat: add ViewModeSwitcher component"
```

---

### Task 21: MeasurementTool Component

**Files:**
- Create: `components/tour/MeasurementTool.tsx`
- Create: `components/tour/MeasurementTool.test.tsx`

**Interfaces:**
- Consumes: `useTourFeature`
- Produces: Click-drag measurement tool with distance readout

```typescript
export function MeasurementTool() {
  const { config, cameraHeading } = useTourFeature();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [startPoint, setStartPoint] = useState<{ yaw: number; pitch: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ yaw: number; pitch: number } | null>(null);

  // On click when measuring: set startPoint
  // On click again: set endPoint, calculate distance
  // Distance = arcdistance on sphere based on yaw/pitch difference

  return (
    <div className="viztr-measurement-tool">
      <button onClick={() => setIsMeasuring(!isMeasuring)}>
        {isMeasuring ? 'Cancel' : 'Measure'}
      </button>
      {startPoint && endPoint && (
        <div>Distance: {calculateDistance(startPoint, endPoint)} meters</div>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Create MeasurementTool component**
- [ ] **Step 2: Create test file**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add components/tour/MeasurementTool.tsx components/tour/MeasurementTool.test.tsx
git commit -m "feat: add MeasurementTool component with distance calculation"
```

---

### Task 22: Update E2E Tests for Tour Features

**Files:**
- Modify: `e2e/tour.spec.ts` — cover tour loading, floor switching, walkthrough

**Interfaces:**
- Consumes: existing Playwright setup
- Produces: E2E tests for immediate-tier tour features

```typescript
import { test, expect } from '@playwright/test';

test('tour loads and displays viewer', async ({ page }) => {
  await page.goto('/tour/sample-tour-id');
  await expect(page).toHaveURL(/.*\/tour\/sample-tour-id/);
  await expect(page.locator('[role="region"]')).toBeVisible();
});

test('floor selector appears on multi-floor tours', async ({ page }) => {
  await page.goto('/tour/multi-floor-tour');
  await expect(page.locator('.viztr-floor-selector')).toBeVisible();
});

test('walkthrough player starts on click', async ({ page }) => {
  await page.goto('/tour/walkthrough-tour');
  await page.click('button:has-text("▶")');
  // Verify scene changes
});
```

- [ ] **Step 1: Create E2E test file for tour features**
- [ ] **Step 2: Run tests**
- [ ] **Step 3: Fix any failures**
- [ ] **Step 4: Commit**

```bash
git add e2e/tour.spec.ts
git commit -m "test: add E2E tests for virtual tour features"
```

---

## Phase 4: Long-Term Features (Weeks 5-8)

### Task 23: Analytics Dashboard

**Files:**
- Create: `app/(dashboard)/tours/[id]/analytics/page.tsx`
- Create: `lib/server/tour/analytics.ts` — metrics calculation
- Modify: `app/api/tours/[id]/stats/route.ts` — extend with heatmap data

**Interfaces:**
- Consumes: `TourVersion`, `TourWalkthrough` models, view events
- Produces: Admin analytics dashboard with heatmap overlay, engagement metrics, time-per-scene

```typescript
// lib/server/tour/analytics.ts
export interface TourAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  sceneHeatmap: Record<string, number>;  // sceneId → view count
  engagementByScene: Record<string, { avgTime: number; clicks: number }>;
  sourceSegments: Record<string, number>;
}

export async function getTourAnalytics(tourId: string): Promise<TourAnalytics> {
  // Aggregate from view events, scene visits, etc.
}
```

- [ ] **Step 1: Create analytics aggregation function**
- [ ] **Step 2: Extend stats API endpoint**
- [ ] **Step 3: Create analytics dashboard page**
- [ ] **Step 4: Run typecheck**
- [ ] **Step 5: Commit**

```bash
git add lib/server/tour/analytics.ts app/api/tours/[id]/stats/route.ts app/(dashboard)/tours/[id]/analytics/page.tsx
git commit -m "feat: add tour analytics dashboard with heatmap"
```

---

### Task 24: Theming System

**Files:**
- Modify: `app/api/tours/[id]/route.ts` — update branding settings
- Create: `components/tour/ThemingControls.tsx`
- Modify: `app/(public)/tour/[id]/TourPageClient.tsx` — apply CSS custom properties

**Interfaces:**
- Consumes: `BrandingConfig` from types
- Produces: Live theme preview with CSS custom properties

```typescript
export function ThemingControls() {
  const { config } = useTourFeature();
  const [primaryColor, setPrimaryColor] = useState(config?.branding?.primaryColor ?? '#00C8E0');

  useEffect(() => {
    document.documentElement.style.setProperty('--viztr-primary', primaryColor);
  }, [primaryColor]);

  return (
    <div className="viztr-theming-controls">
      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
    </div>
  );
}
```

- [ ] **Step 1: Create ThemingControls component**
- [ ] **Step 2: Apply CSS custom properties in tour page**
- [ ] **Step 3: Create branding update API**
- [ ] **Step 4: Commit**

```bash
git add components/tour/ThemingControls.tsx app/(public)/tour/[id]/TourPageClient.tsx
git commit -m "feat: add theming system with live preview"
```

---

### Task 25: Publish/Versioning Workflow

**Files:**
- Modify: `app/api/tours/[id]/publish/route.ts` — create version snapshot on publish
- Modify: `app/api/tours/[id]/versions/route.ts` — add restore endpoint
- Create: `app/(dashboard)/tours/[id]/versions/page.tsx` — version history UI

**Interfaces:**
- Consumes: `TourVersion` model, `mapTourConfig`
- Produces: Complete versioning system with snapshot, history, restore

```typescript
// POST /api/tours/[id]/publish
export async function POST(req, { params }) {
  const { id } = await params;
  // Snapshot current config
  const config = await buildTourConfig(id);
  const version = await prisma.tourVersion.create({
    data: {
      projectId: id,
      version: `v${Date.now()}`,
      configSnapshot: config,
      createdBy: auth.dbUser.id,
    },
  });
  // Set publishedAt, status = 'published'
  return NextResponse.json({ version });
}

// POST /api/tours/[id]/versions/[versionId]/restore
export async function POST(req, { params }) {
  const { id, versionId } = await params;
  const version = await prisma.tourVersion.findUnique({ where: { id: versionId } });
  // Restore configSnapshot to project settings
}
```

- [ ] **Step 1: Implement publish with version snapshot**
- [ ] **Step 2: Implement version restore**
- [ ] **Step 3: Create version history admin page**
- [ ] **Step 4: Run typecheck**
- [ ] **Step 5: Commit**

```bash
git add app/api/tours/[id]/publish/route.ts app/api/tours/[id]/versions/ app/(dashboard)/tours/[id]/versions/page.tsx
git commit -m "feat: complete publish/versioning workflow with snapshot and restore"
```

---

## Spec Coverage Checklist

| Feature | Spec Section | Task(s) |
|---------|-------------|---------|
| Multi-Level Floor Navigation (#6) | §7 Navigation | 8 |
| Floor Plan Extender/Pop-up (#5) | §7 Navigation | 9 |
| Wayfinder/Compass (#7) | §7 Navigation | 10 |
| Photo Galleries per Room (#13) | §7 Media | 11 |
| Timeline/Sweep Walkthrough (#15) | §7 Media | 12 |
| Audio/Background Music (#24) | §7 Media | 13 |
| Visual Effects Controls (#23) | §7 UX | 14 |
| Smooth Transitions (#25) | §7 UX | 12 (timeline), general |
| Accessibility Enhancements (#27) | §7 UX | throughout (ARIA, keyboard) |
| Asset Management (#14) | §7 Admin | 19 |
| Advanced View Modes (#8) | §7 Admin | 5, 20 |
| Measurement Tool (#9) | §7 Admin | 21 |
| Analytics Dashboard (#39) | §7 Admin | 23 |
| Theming System (#40) | §7 Admin | 24 |
| Publish/Versioning (#41) | §7 Admin | 25 |

---

## Implementation Order Summary

1. **Week 1**: Tasks 1-5 (schema, types, config mapping, context, ModeManager)
2. **Week 2**: Tasks 6-14 (integrate into page, 7 feature components, admin pages)
3. **Week 2-3**: Tasks 15-18 (admin pages, API endpoints)
4. **Week 3-4**: Tasks 19-22 (asset management, view modes, measurement, E2E tests)
5. **Week 5-6**: Tasks 23-25 (analytics, theming, versioning)

**Total: 25 tasks across ~6 weeks**

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-20-virtual-tour-system-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
