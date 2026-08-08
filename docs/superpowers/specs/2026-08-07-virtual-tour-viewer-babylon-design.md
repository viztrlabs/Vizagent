# Virtual Tour Viewer (Babylon.js PhotoDome) — Design Spec

## Overview
Build a public-facing Virtual Tour viewer using Babylon.js PhotoDome for equirectangular panorama rendering. This is the Babylon.js fallback path (per ADR 6.1.1) for when Marzipano is not used, or as a standalone PhotoDome-based tour viewer.

## Requirements

### Core Features (T-031)
- [x] **PhotoDome Panorama** — Render equirectangular 360° image on a sphere using Babylon.js `PhotoDome`
- [x] **Orbit Controls** — Mouse drag (desktop) / touch drag (mobile) for yaw/pitch navigation
- [x] **Auto-rotate** — Optional continuous rotation from project settings
- [x] **Hotspot Markers** — Clickable pins on sphere with labels, descriptions, and links
- [x] **Fullscreen Button** — Browser Fullscreen API toggle
- [x] **VR Button** — WebXR session for Cardboard/Daydream (immersive-vr)
- [x] **Data Loading** — Fetch tour config (image URL, hotspots, settings) from API
- [x] **Responsive Layout** — Full-screen on mobile, max-w-4xl centered on desktop
- [x] **Dark Theme** — Compatible with VizTR dark design system

### Technical Constraints
- Babylon.js 9.x (core, loaders, GUI, inspectors)
- Next.js 16 App Router
- Tailwind CSS 4
- TypeScript strict mode
- No authentication required for public viewer
- Follow existing patterns from `babylon_XR_World/useBabylonScene.ts` and `BabylonCanvas.tsx`

### Data Model
```typescript
interface TourConfig {
  id: string;
  title: string;
  equirectangularUrl: string;
  hotspots: TourHotspot[];
  settings: TourSettings;
}

interface TourHotspot {
  id: string;
  label: string;
  description?: string;
  url?: string;
  yaw: number;    // radians, -PI to PI
  pitch: number;  // radians, -PI/2 to PI/2
}

interface TourSettings {
  autoRotate: boolean;
  autoRotateSpeed: number; // radians per second
  initialYaw: number;
  initialPitch: number;
}
```

## Architecture

### Component Structure
```
components/viewer/
├── VirtualTourViewer.tsx      # Main React component (client)
├── useVirtualTourScene.ts     # Babylon.js scene lifecycle hook
├── HotspotMarker.tsx          # Hotspot mesh + label (Babylon GUI)
└── ViewerControls.tsx         # Fullscreen, VR, auto-rotate UI

app/
├── (public)/tour/[id]/
│   └── page.tsx               # Public tour page (SSR + client hydration)
└── api/tours/[id]/
    └── route.ts               # GET tour config (if needed)
```

### Data Flow
1. `page.tsx` fetches tour config via `GET /api/tours/[id]` (server-side)
2. Passes config to `VirtualTourViewer` as props
3. `VirtualTourViewer` initializes Babylon scene via `useVirtualTourScene`
4. Hook creates `PhotoDome`, `ArcRotateCamera`, hotspot markers
5. UI controls manipulate scene state (fullscreen, VR, auto-rotate)

## Implementation Approach

### PhotoDome Setup
```typescript
const photoDome = new PhotoDome(
  "photoDome",
  equirectangularUrl,
  {
    resolution: 32,
    size: 1000,
    useDirectMapping: false,
  },
  scene
);
```

### Camera (ArcRotateCamera)
- Target: `Vector3.Zero()`
- Alpha (yaw): controlled by user input / auto-rotate
- Beta (pitch): clamped to [-PI/2 + 0.1, PI/2 - 0.1]
- Radius: fixed at 1 (inside sphere)
- No zoom (radius fixed)

### Hotspot Markers
- Create plane mesh at spherical coordinates (yaw, pitch)
- Use `AdvancedDynamicTexture` for label rendering
- Billboard mode to always face camera
- Click handler for URL navigation or info panel

### WebXR (VR Button)
- Use `VRExperienceHelper` or `scene.createDefaultXRExperienceAsync`
- Request `"immersive-vr"` session
- Fallback gracefully if WebXR not supported

## API Design

### GET /api/tours/[id]
Returns tour configuration for public viewing.

```typescript
// Response
{
  id: string;
  title: string;
  equirectangularUrl: string;
  hotspots: TourHotspot[];
  settings: TourSettings;
}
```

## Error Handling
- Loading state with spinner/poster image
- Error overlay if image fails to load
- Graceful degradation if WebXR unavailable
- Hotspot click errors don't break viewer

## Accessibility
- ARIA labels on all controls
- Keyboard navigation (arrow keys for yaw/pitch)
- `prefers-reduced-motion` disables auto-rotate
- Focus management for VR entry

## Testing Strategy
- Unit test `useVirtualTourScene` hook with mocked Babylon
- Component test for `VirtualTourViewer` rendering
- Integration test for hotspot click handlers
- E2E test for fullscreen/VR flows (manual)

## Dependencies
- `@babylonjs/core`
- `@babylonjs/loaders`
- `@babylonjs/gui`
- `@babylonjs/inspector` (dev only)

## File Creation Order
1. `lib/tour/types.ts` — Shared type definitions
2. `app/api/tours/[id]/route.ts` — API endpoint
3. `components/viewer/useVirtualTourScene.ts` — Babylon hook
4. `components/viewer/HotspotMarker.tsx` — Hotspot component
5. `components/viewer/ViewerControls.tsx` — Control buttons
6. `components/viewer/VirtualTourViewer.tsx` — Main viewer
7. `app/(public)/tour/[id]/page.tsx` — Public page