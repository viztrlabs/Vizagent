# T-048: Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize VizTR Next.js application bundle size, loading performance, and runtime efficiency through bundle analysis, code splitting, image/font optimization, caching, tree shaking, and lazy loading.

**Architecture:** Apply Next.js performance best practices incrementally: add analyzer first for measurement, then configure Next.js optimizations (images, fonts, headers), then refactor components for dynamic imports and granular Babylon.js imports, finally add lazy loading utilities.

**Tech Stack:** Next.js 15, React 19, Babylon.js 9.19, Recharts 3.10, @next/bundle-analyzer, next/font/google

## Global Constraints
- Next.js 15.0.0 with Turbopack
- React 19.0.0
- TypeScript strict mode
- All changes must pass `pnpm typecheck` and `pnpm lint`
- Bundle analyzer must work with `ANALYZE=true pnpm build`
- Dynamic imports must use `ssr: false` for client-only components
- Babylon.js imports must be granular (per-file)
- Font must use `display: 'swap'` with `preload: true`
- Supabase storage domain: `*.supabase.co` with pathname `/storage/v1/object/public/**`

---

### Task 1: Add Bundle Analyzer

**Files:**
- Modify: `package.json` (devDependencies, scripts)
- Modify: `next.config.js` (bundle analyzer config)

**Interfaces:**
- Produces: `ANALYZE=true pnpm build` command generating `.next/analyze/client.html` and `.next/analyze/server.html`

- [ ] **Step 1: Add @next/bundle-analyzer to devDependencies**

```json
"devDependencies": {
  ...,
  "@next/bundle-analyzer": "^15.0.0"
}
```

- [ ] **Step 2: Configure bundle analyzer in next.config.js**

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

- [ ] **Step 3: Add analyze script to package.json**

```json
"scripts": {
  ...,
  "analyze": "ANALYZE=true pnpm build"
}
```

- [ ] **Step 4: Run build to verify analyzer works**

Run: `pnpm analyze`
Expected: Build completes, `.next/analyze/` directory created with HTML reports

- [ ] **Step 5: Commit**

```bash
git add package.json next.config.js
git commit -m "perf: add bundle analyzer (T-048)"
```

---

### Task 2: Configure Image Optimization & Caching Headers

**Files:**
- Modify: `next.config.js` (images, headers)

**Interfaces:**
- Produces: `images.remotePatterns` allowing Supabase storage, `headers()` returning Cache-Control for static assets

- [ ] **Step 1: Add images configuration for Supabase storage**

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
}
```

- [ ] **Step 2: Add caching headers for static assets**

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/image/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ]
}
```

- [ ] **Step 3: Run typecheck and build to verify**

Run: `pnpm typecheck && pnpm build`
Expected: No errors, build completes

- [ ] **Step 4: Commit**

```bash
git add next.config.js
git commit -m "perf: configure image domains and caching headers (T-048)"
```

---

### Task 3: Optimize Font Loading in Root Layout

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `inter` font variable with `display: 'swap'`, `preload: true`, applied to `<html>` className

- [ ] **Step 1: Import Inter font from next/font/google**

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})
```

- [ ] **Step 2: Apply font variable to html element**

```typescript
<html lang="en" className={`${inter.variable} dark`}>
```

- [ ] **Step 3: Update globals.css to use CSS variable**

```css
:root {
  --font-inter: 'Inter', system-ui, sans-serif;
}
body {
  font-family: var(--font-inter);
}
```

- [ ] **Step 4: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "perf: optimize font loading with next/font (T-048)"
```

---

### Task 4: Dynamic Import Heavy Components - Dashboard Charts

**Files:**
- Modify: `app/(dashboard)/dashboard/DashboardClient.tsx`

**Interfaces:**
- Consumes: `Charts` module exports (`ViewsLineChart`, `ServiceBarChart`, `StatusDoughnutChart`, `ChartCard`)
- Produces: Dynamically imported `Charts` components with loading states

- [ ] **Step 1: Import dynamic from next/dynamic**

```typescript
import dynamic from 'next/dynamic'
```

- [ ] **Step 2: Create dynamic imports for each chart component**

```typescript
const ViewsLineChart = dynamic(
  () => import('@/components/dashboard/Charts').then(m => m.ViewsLineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const ServiceBarChart = dynamic(
  () => import('@/components/dashboard/Charts').then(m => m.ServiceBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const StatusDoughnutChart = dynamic(
  () => import('@/components/dashboard/Charts').then(m => m.StatusDoughnutChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const ChartCard = dynamic(
  () => import('@/components/dashboard/Charts').then(m => m.ChartCard),
  { ssr: false, loading: () => <ChartCardSkeleton /> }
)
```

- [ ] **Step 3: Add skeleton loading components**

```typescript
function ChartSkeleton() {
  return (
    <div className="h-64 md:h-72 flex items-center justify-center bg-surface/50 rounded-xl border border-border">
      <div className="animate-pulse bg-gray-700 rounded w-3/4 h-3/4" />
    </div>
  )
}

function ChartCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface/50 rounded-2xl border border-border p-6">
      <div className="h-6 w-1/4 bg-gray-700 rounded animate-pulse mb-4" />
      <div className="h-64 bg-gray-700 rounded animate-pulse" />
    </div>
  )
}
```

- [ ] **Step 4: Update JSX to use dynamic components**

Replace direct imports with dynamic component references in the render.

- [ ] **Step 5: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: No errors, charts load dynamically

- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/dashboard/DashboardClient.tsx
git commit -m "perf: dynamic import dashboard charts (T-048)"
```

---

### Task 5: Dynamic Import BabylonCanvas and VirtualTourViewer

**Files:**
- Modify: `babylon_XR_World/page.tsx` (already uses dynamic for XRConfigurator)
- Create/Modify: Any pages using `BabylonCanvas` or `VirtualTourViewer`

**Interfaces:**
- Consumes: `BabylonCanvas`, `VirtualTourViewer` components
- Produces: Dynamic imports with `ssr: false` and loading states

- [ ] **Step 1: Verify babylon_XR_World/page.tsx already uses dynamic import for XRConfigurator** ✓ (already done)

- [ ] **Step 2: Create dynamic import wrapper for BabylonCanvas if used elsewhere**

```typescript
// If BabylonCanvas is used directly in any page:
const BabylonCanvas = dynamic(
  () => import('@/babylon_XR_World/BabylonCanvas').then(m => m.BabylonCanvas),
  { ssr: false, loading: () => <BabylonCanvasSkeleton /> }
)
```

- [ ] **Step 3: Create dynamic import for VirtualTourViewer**

```typescript
const VirtualTourViewer = dynamic(
  () => import('@/babylon_XR_World/components/viewer/VirtualTourViewer').then(m => m.VirtualTourViewer),
  { ssr: false, loading: () => <VirtualTourViewerSkeleton /> }
)
```

- [ ] **Step 4: Add skeleton components**

```typescript
function BabylonCanvasSkeleton() {
  return (
    <div className="viztr-canvas-shell" style={{ width: '100%', height: '100%' }}>
      <div className="viztr-canvas-overlay">
        <div className="viztr-spinner" aria-label="Loading model" />
      </div>
      <style jsx>{`...`}</style>
    </div>
  )
}

function VirtualTourViewerSkeleton() {
  return (
    <div className="viztr-tour-viewer" style={{ position: "relative", width: "100%", height: "100%" }}>
      <div className="viztr-tour-overlay">
        <div className="viztr-spinner" aria-label="Loading tour" />
      </div>
      <style jsx>{`...`}</style>
    </div>
  )
}
```

- [ ] **Step 5: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 6: Commit**

```bash
git add babylon_XR_World/page.tsx
git commit -m "perf: dynamic import Babylon components (T-048)"
```

---

### Task 6: Dynamic Import UploadDropzone

**Files:**
- Modify: Pages/components using `UploadDropzone` (need to find usage)

**Interfaces:**
- Consumes: `UploadDropzone` component
- Produces: Dynamic import with `ssr: false`

- [ ] **Step 1: Find where UploadDropzone is used**

Search: `grep -r "UploadDropzone" --include="*.tsx"`

- [ ] **Step 2: Create dynamic import at usage site**

```typescript
const UploadDropzone = dynamic(
  () => import('@/components/upload/UploadDropzone').then(m => m.UploadDropzone),
  { ssr: false, loading: () => <UploadDropzoneSkeleton /> }
)
```

- [ ] **Step 3: Add skeleton**

```typescript
function UploadDropzoneSkeleton() {
  return (
    <div className="relative border-2 border-dashed rounded-lg p-8 text-center animate-pulse">
      <div className="w-16 h-16 rounded-full bg-surface border border-cyan/30 mx-auto mb-4" />
      <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto mb-2" />
      <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto" />
    </div>
  )
}
```

- [ ] **Step 4: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 5: Commit**

```bash
git add <usage-file>
git commit -m "perf: dynamic import UploadDropzone (T-048)"
```

---

### Task 7: Dynamic Import ARPanel

**Files:**
- Modify: `babylon_XR_World/XRConfigurator.tsx` (imports ARPanel)

**Interfaces:**
- Consumes: `ARPanel` component
- Produces: Dynamic import with `ssr: false`

- [ ] **Step 1: Read XRConfigurator.tsx to see ARPanel usage**

- [ ] **Step 2: Replace static import with dynamic import**

```typescript
const ARPanel = dynamic(
  () => import('@/components/configurator/ARPanel').then(m => m.ARPanel),
  { ssr: false, loading: () => <ARPanelSkeleton /> }
)
```

- [ ] **Step 3: Add skeleton**

```typescript
function ARPanelSkeleton() {
  return (
    <div className="ar-panel animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/4 mb-4" />
      <div className="h-40 bg-gray-700 rounded" />
    </div>
  )
}
```

- [ ] **Step 4: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 5: Commit**

```bash
git add babylon_XR_World/XRConfigurator.tsx
git commit -m "perf: dynamic import ARPanel (T-048)"
```

---

### Task 8: Tree Shaking - Granular Babylon.js Imports in VirtualTourViewer

**Files:**
- Modify: `babylon_XR_World/components/viewer/VirtualTourViewer.tsx`

**Interfaces:**
- Consumes: Babylon.js modules
- Produces: Granular imports from `@babylonjs/core/*` submodules

- [ ] **Step 1: Replace bulk imports with granular imports**

```typescript
// Before:
import { Engine, Scene, ArcRotateCamera, Vector3, Color4, PhotoDome, MeshBuilder, StandardMaterial, Color3, Texture, AdvancedDynamicTexture, GUI3DManager, Button3D, HolographicButton, Mesh, AbstractMesh, PointerEventTypes, WebXRDefaultExperience, WebXRSessionManager, WebXREnterExitUI, WebXRExperienceHelper, Constants, Quaternion, Matrix, Tools } from "@babylonjs/core"

// After - granular imports:
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color4 } from '@babylonjs/core/Maths/math.color'
import { PhotoDome } from '@babylonjs/core/Helpers/photoDome'
import { MeshBuilder } from '@babylonjs/core/Meshes/Builders/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { GUI3DManager } from '@babylonjs/gui/3D/gui3DManager'
import { HolographicButton } from '@babylonjs/gui/3D/controls/holographicButton'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents'
import { WebXRDefaultExperience } from '@babylonjs/core/XR/webXRDefaultExperience'
import { WebXRSessionManager } from '@babylonjs/core/XR/webXRSessionManager'
import { WebXREnterExitUI } from '@babylonjs/core/XR/webXREnterExitUI'
import { WebXRExperienceHelper } from '@babylonjs/core/XR/webXRExperienceHelper'
import { Constants } from '@babylonjs/core/Engines/constants'
import { Quaternion } from '@babylonjs/core/Maths/math.vector'
import { Matrix } from '@babylonjs/core/Maths/math.matrix'
import { Tools } from '@babylonjs/core/Misc/tools'
import '@babylonjs/loaders'
```

- [ ] **Step 2: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 3: Run bundle analyzer to verify size reduction**

Run: `pnpm analyze`

- [ ] **Step 4: Commit**

```bash
git add babylon_XR_World/components/viewer/VirtualTourViewer.tsx
git commit -m "perf: granular Babylon.js imports in VirtualTourViewer (T-048)"
```

---

### Task 9: Tree Shaking - Granular Babylon.js Imports in ARPanel

**Files:**
- Modify: `components/configurator/ARPanel.tsx`

**Interfaces:**
- Consumes: `Vector3`, `Quaternion` from Babylon.js
- Produces: Granular imports

- [ ] **Step 1: Replace bulk imports**

```typescript
// Before:
import { Vector3, Quaternion } from "@babylonjs/core"

// After:
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Quaternion } from '@babylonjs/core/Maths/math.vector'
```

- [ ] **Step 2: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add components/configurator/ARPanel.tsx
git commit -m "perf: granular Babylon.js imports in ARPanel (T-048)"
```

---

### Task 10: Tree Shaking - Granular Babylon.js Imports in XRConfigurator

**Files:**
- Modify: `babylon_XR_World/XRConfigurator.tsx`

**Interfaces:**
- Consumes: `Vector3`, `Quaternion`, `useBabylonScene`, `BabylonCanvas`
- Produces: Granular imports

- [ ] **Step 1: Read XRConfigurator.tsx and update imports**

```typescript
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Quaternion } from '@babylonjs/core/Maths/math.vector'
```

- [ ] **Step 2: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add babylon_XR_World/XRConfigurator.tsx
git commit -m "perf: granular Babylon.js imports in XRConfigurator (T-048)"
```

---

### Task 11: Create IntersectionObserver Hook for Lazy Loading

**Files:**
- Create: `lib/hooks/useIntersectionObserver.ts`

**Interfaces:**
- Produces: `useIntersectionObserver(options)` hook returning `{ ref, isIntersecting }`

- [ ] **Step 1: Create the hook**

```typescript
'use client'

import { useEffect, useRef, useState, RefObject } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean
}

export function useIntersectionObserver<T extends HTMLElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, boolean] {
  const { triggerOnce = true, ...observerOptions } = options
  const ref = useRef<T>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true)
        if (triggerOnce) {
          observer.unobserve(element)
        }
      } else if (!triggerOnce) {
        setIsIntersecting(false)
      }
    }, observerOptions)

    observer.observe(element)
    return () => observer.disconnect()
  }, [triggerOnce, observerOptions.root, observerOptions.rootMargin, observerOptions.threshold])

  return [ref, isIntersecting]
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/useIntersectionObserver.ts
git commit -m "perf: add useIntersectionObserver hook (T-048)"
```

---

### Task 12: Apply Lazy Loading to Images and Off-Screen Components

**Files:**
- Modify: Components using images (need to find usage)
- Modify: DashboardClient.tsx (for charts below fold)

**Interfaces:**
- Consumes: `useIntersectionObserver` hook
- Produces: Lazy-loaded images with `loading="lazy"` and IntersectionObserver for components

- [ ] **Step 1: Find image usage in codebase**

Search: `grep -r "next/image\|<img" --include="*.tsx"`

- [ ] **Step 2: Add loading="lazy" to below-fold images**

```tsx
<Image
  src={src}
  alt={alt}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataURL}
/>
```

- [ ] **Step 3: Apply IntersectionObserver to off-screen charts in DashboardClient**

```typescript
const [chartsRef, chartsVisible] = useIntersectionObserver({ rootMargin: '100px' })

// In JSX:
<div ref={chartsRef}>
  {chartsVisible && (
    <>
      <ChartCard title="Views Over Time">...</ChartCard>
      <ChartCard title="Projects by Service Type">...</ChartCard>
    </>
  )}
</div>
```

- [ ] **Step 4: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 5: Commit**

```bash
git add <modified-files>
git commit -m "perf: add lazy loading for images and off-screen components (T-048)"
```

---

### Task 13: Verify Build and Analyze Bundle

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verification that build passes and bundle size reduced

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: Success, no TypeScript or ESLint errors

- [ ] **Step 2: Run bundle analyzer**

Run: `pnpm analyze`
Expected: Reports generated, note bundle sizes

- [ ] **Step 3: Compare bundle sizes**

Check: `.next/analyze/client.html` for:
- Babylon.js chunk separated
- Recharts chunk separated
- UploadDropzone chunk separated
- Overall bundle size reduction

- [ ] **Step 4: Run lighthouse (optional)**

Run: `npx lighthouse http://localhost:3000 --view` (after `pnpm start`)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "perf: bundle optimization, code splitting, lazy loading (T-048)"
```

---

## Summary of Changes

| Task | Area | Files Modified |
|------|------|----------------|
| 1 | Bundle Analyzer | `package.json`, `next.config.js` |
| 2 | Images & Caching | `next.config.js` |
| 3 | Fonts | `app/layout.tsx`, `app/globals.css` |
| 4 | Dynamic Charts | `app/(dashboard)/dashboard/DashboardClient.tsx` |
| 5 | Dynamic Babylon | `babylon_XR_World/page.tsx` |
| 6 | Dynamic Upload | `<usage-file>` |
| 7 | Dynamic ARPanel | `babylon_XR_World/XRConfigurator.tsx` |
| 8 | Tree Shake VirtualTour | `babylon_XR_World/components/viewer/VirtualTourViewer.tsx` |
| 9 | Tree Shake ARPanel | `components/configurator/ARPanel.tsx` |
| 10 | Tree Shake XRConfig | `babylon_XR_World/XRConfigurator.tsx` |
| 11 | IntersectionObserver | `lib/hooks/useIntersectionObserver.ts` (new) |
| 12 | Lazy Loading | Multiple components |
| 13 | Verification | Build + Analyze |