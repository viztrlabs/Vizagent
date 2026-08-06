# T-037: Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize bundle size, enable code splitting, configure image/font optimization, add caching headers, and implement lazy loading for the VizTR Next.js 16 application.

**Architecture:** Apply Next.js 16 performance best practices: bundle analysis with @next/bundle-analyzer, dynamic imports for heavy client components (BabylonCanvas, StreamViewer, Sidebar panels), next.config.ts optimization for images/fonts/caching, and IntersectionObserver-based lazy loading.

**Tech Stack:** Next.js 16.3.0, Turbopack, @next/bundle-analyzer, next/font/google, next/dynamic, React 19.2.8

## Global Constraints

- Next.js 16.3.0 with Turbopack (pnpm build, pnpm dev --turbopack)
- React 19.2.8, TypeScript 5
- Babylon.js 9.19.1 (heavy dependency - must use granular imports)
- Supabase storage for images (need domain configuration)
- Font optimization: DM Sans, Syne, Bebas Neue via next/font/google with display: swap
- All components use 'use client' directive where needed

---

### Task 1: Add Bundle Analyzer to package.json

**Files:**
- Modify: `package.json` (devDependencies + scripts)

**Interfaces:**
- Produces: `ANALYZE=true pnpm build` command to generate bundle report

- [ ] **Step 1: Add @next/bundle-analyzer to devDependencies**

```json
"@next/bundle-analyzer": "^16.3.0"
```

- [ ] **Step 2: Add analyze script to package.json**

```json
"analyze": "ANALYZE=true next build"
```

- [ ] **Step 3: Verify installation**

Run: `pnpm install`
Expected: No errors, package installed

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "perf: add @next/bundle-analyzer for bundle analysis"
```

---

### Task 2: Configure next.config.ts with Bundle Analyzer, Image Optimization, and Caching

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: @next/bundle-analyzer package
- Produces: Optimized Next.js configuration

- [ ] **Step 1: Import withBundleAnalyzer**

```typescript
import type { NextConfig } from "next";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
```

- [ ] **Step 2: Configure images.domains for Supabase storage**

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
  formats: ['image/avif', 'image/webp'],
}
```

- [ ] **Step 3: Add caching headers for static assets**

```typescript
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
  ];
}
```

- [ ] **Step 4: Configure experimental.optimizePackageImports for Babylon.js**

```typescript
experimental: {
  optimizePackageImports: ['@babylonjs/core', '@babylonjs/gui', '@babylonjs/loaders', '@babylonjs/materials'],
}
```

- [ ] **Step 5: Wrap config with withBundleAnalyzer and export**

```typescript
export default withBundleAnalyzer(nextConfig);
```

- [ ] **Step 6: Verify build works**

Run: `pnpm build`
Expected: Successful build

- [ ] **Step 7: Commit**

```bash
git add next.config.ts
git commit -m "perf: configure bundle analyzer, image optimization, caching headers"
```

---

### Task 3: Optimize Font Loading in app/layout.tsx

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: next/font/google fonts
- Produces: Preloaded critical fonts with display: swap

- [ ] **Step 1: Add display: 'swap' to all font configurations**

```typescript
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
```

- [ ] **Step 2: Add preload for critical font weights if needed**

```typescript
// Already handled by preload: true above
```

- [ ] **Step 3: Verify build works**

Run: `pnpm build`
Expected: Successful build

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "perf: optimize font loading with display: swap and preload"
```

---

### Task 4: Add Dynamic Imports for Heavy Components

**Files:**
- Modify: `components/configurator/BabylonCanvas.tsx` (add loading export)
- Modify: `components/stream/StreamViewer.tsx` (add loading export)
- Modify: `components/configurator/Sidebar.tsx` (use dynamic imports for panels)
- Create: `components/configurator/SidebarPanels.tsx` (lazy-loaded panel components)
- Modify: `app/configurator/[projectId]/page.tsx` (dynamic import BabylonCanvas and Sidebar)

**Interfaces:**
- Consumes: next/dynamic
- Produces: Code-split chunks loaded on demand

- [ ] **Step 1: Create loading skeleton components**

Create `components/ui/Skeleton.tsx` with basic loading placeholders

- [ ] **Step 2: Dynamic import BabylonCanvas in configurator page**

```typescript
const BabylonCanvas = dynamic(() => import('@/components/configurator/BabylonCanvas'), {
  ssr: false,
  loading: () => <CanvasSkeleton />,
});
```

- [ ] **Step 3: Dynamic import StreamViewer where used**

```typescript
const StreamViewer = dynamic(() => import('@/components/stream/StreamViewer'), {
  ssr: false,
  loading: () => <StreamViewerSkeleton />,
});
```

- [ ] **Step 4: Dynamic import Sidebar panels in Sidebar.tsx**

```typescript
const MaterialsPanel = dynamic(() => import('./MaterialsPanel'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
// Repeat for LightingPanel, HotspotsPanel, ExportPanel, ARPanel
```

- [ ] **Step 5: Verify build works and chunks are created**

Run: `pnpm build`
Expected: Separate chunks for dynamic imports

- [ ] **Step 6: Commit**

```bash
git add components/configurator/BabylonCanvas.tsx components/stream/StreamViewer.tsx components/configurator/Sidebar.tsx components/ui/Skeleton.tsx app/configurator/[projectId]/page.tsx
git commit -m "perf: add dynamic imports for heavy components (BabylonCanvas, StreamViewer, Sidebar panels)"
```

---

### Task 5: Add Image Optimization with Blur Placeholders

**Files:**
- Modify: `app/dashboard/page.tsx` (add blur placeholders to project thumbnails)
- Modify: `components/portal/SessionCard.tsx` (if using images)

**Interfaces:**
- Consumes: next/image with blurDataURL
- Produces: Optimized images with LQIP

- [ ] **Step 1: Create base64 blur data URL placeholder utility**

Create `lib/utils/blur-placeholder.ts` with a small transparent PNG base64

- [ ] **Step 2: Update dashboard thumbnails to use next/image with blur**

```typescript
import Image from 'next/image';
import { blurDataURL } from '@/lib/utils/blur-placeholder';

<Image
  src={project.thumbnail}
  alt={project.name}
  fill
  className="object-cover"
  placeholder="blur"
  blurDataURL={blurDataURL}
  loading="lazy"
/>
```

- [ ] **Step 3: Add loading="lazy" for below-fold images**

- [ ] **Step 4: Verify build works**

Run: `pnpm build`
Expected: Successful build

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx lib/utils/blur-placeholder.ts
git commit -m "perf: add image optimization with blur placeholders and lazy loading"
```

---

### Task 6: Verify Babylon.js Granular Imports (Tree Shaking)

**Files:**
- Review: `components/configurator/BabylonCanvas.tsx`
- Review: Any other Babylon.js imports

**Interfaces:**
- Consumes: @babylonjs/core granular imports
- Produces: Minimal bundle size from Babylon.js

- [ ] **Step 1: Verify current imports are granular**

Current: `import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4 } from '@babylonjs/core';`

- [ ] **Step 2: Ensure SceneLoader is dynamically imported (already done)**

```typescript
const { SceneLoader } = await import('@babylonjs/core/Loading/sceneLoader');
```

- [ ] **Step 3: Verify no barrel imports from @babylonjs/core**

- [ ] **Step 4: Commit if changes needed**

```bash
git commit -m "perf: ensure granular Babylon.js imports for tree shaking"
```

---

### Task 7: Add IntersectionObserver for Off-Screen Component Lazy Loading

**Files:**
- Create: `hooks/useIntersectionObserver.ts`
- Modify: `components/configurator/Sidebar.tsx` (lazy load panels when tab not active)

**Interfaces:**
- Consumes: IntersectionObserver API
- Produces: Lazy loading trigger for off-screen components

- [ ] **Step 1: Create useIntersectionObserver hook**

```typescript
export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting };
}
```

- [ ] **Step 2: Apply to Sidebar panels - only mount active tab panel**

Already handled by conditional rendering in Sidebar.tsx, but verify

- [ ] **Step 3: Verify build works**

Run: `pnpm build`
Expected: Successful build

- [ ] **Step 4: Commit**

```bash
git add hooks/useIntersectionObserver.ts components/configurator/Sidebar.tsx
git commit -m "perf: add IntersectionObserver for off-screen component lazy loading"
```

---

### Task 8: Run Bundle Analysis and Verify Optimizations

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: ANALYZE=true pnpm build
- Produces: Bundle analysis report

- [ ] **Step 1: Run production build with analysis**

Run: `ANALYZE=true pnpm build`
Expected: Build succeeds, generates .next/analyze/client.html

- [ ] **Step 2: Verify chunk splitting**

Check: Separate chunks for BabylonCanvas, StreamViewer, Sidebar panels

- [ ] **Step 3: Verify total bundle size reduction**

- [ ] **Step 4: Run regular build to ensure no regressions**

Run: `pnpm build`
Expected: Successful build

- [ ] **Step 5: Commit final changes**

```bash
git commit -am "perf: bundle optimization, code splitting, lazy loading (T-037)"
```

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-07-performance-optimization-t037.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**