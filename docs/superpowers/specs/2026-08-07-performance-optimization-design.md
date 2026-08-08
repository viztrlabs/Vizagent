# T-048: Performance Optimization Design

## Overview
Optimize the VizTR Next.js application for production performance through bundle analysis, code splitting, image optimization, font optimization, caching headers, tree shaking, and lazy loading.

## Current State Analysis

### Bundle Size Concerns
- **Babylon.js**: ~1-2MB (imported in `VirtualTourViewer`, `BabylonCanvas`, `ARPanel`, `XRConfigurator`)
- **Recharts**: Heavy charting library (used in `DashboardClient` via `Charts.tsx`)
- **UploadDropzone**: Large component with file upload logic
- No bundle analyzer configured

### Code Splitting Opportunities
1. `BabylonCanvas` - Client-only, heavy 3D engine
2. `VirtualTourViewer` - Client-only, heavy 3D + XR
3. `UploadDropzone` - Large upload component
4. `Charts` (Recharts) - Heavy charting, only on dashboard
5. `ARPanel` - WebXR functionality

### Image Optimization
- No `next.config.js` image domains configured
- Supabase storage URLs need to be allowed
- No blur placeholders for thumbnails

### Font Optimization
- No `next/font/google` usage in `layout.tsx`
- System fonts only currently

### Caching Headers
- No `Cache-Control` headers configured

### Tree Shaking
- Babylon.js imports are not granular (importing entire modules)
- Recharts imports could be optimized

### Lazy Loading
- No `loading="lazy"` on images
- No IntersectionObserver for off-screen components

## Design

### 1. Bundle Analysis
- Add `@next/bundle-analyzer` as devDependency
- Configure `ANALYZE=true pnpm build` script
- Generate HTML report in `.next/analyze/`

### 2. Code Splitting with Dynamic Imports
Use `next/dynamic` with `ssr: false` for client-only components:

```typescript
// Heavy components to dynamically import:
const BabylonCanvas = dynamic(() => import('@/babylon_XR_World/BabylonCanvas'), { ssr: false, loading: ... })
const VirtualTourViewer = dynamic(() => import('@/babylon_XR_World/components/viewer/VirtualTourViewer'), { ssr: false, loading: ... })
const UploadDropzone = dynamic(() => import('@/components/upload/UploadDropzone'), { ssr: false, loading: ... })
const Charts = dynamic(() => import('@/components/dashboard/Charts'), { ssr: false, loading: ... })
const ARPanel = dynamic(() => import('@/components/configurator/ARPanel'), { ssr: false, loading: ... })
```

### 3. Image Optimization
Configure `next.config.js`:
```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
  ],
}
```
Add `placeholder="blur"` and `blurDataURL` for project thumbnails.

### 4. Font Optimization
Add to `app/layout.tsx`:
```typescript
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap', preload: true })
```

### 5. Caching Headers
Add to `next.config.js`:
```javascript
async headers() {
  return [
    { source: '/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    // ... specific rules for static assets
  ]
}
```

### 6. Tree Shaking - Babylon.js
Change imports from:
```typescript
import { Engine, Scene, ... } from '@babylonjs/core'
```
To granular imports:
```typescript
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
// etc.
```

### 7. Lazy Loading
- Add `loading="lazy"` to `<Image />` components below fold
- Create `useIntersectionObserver` hook for off-screen component lazy loading

## Implementation Plan

1. **Setup**: Add bundle analyzer, update package.json
2. **next.config.js**: Configure images, headers, bundle analyzer
3. **Font Optimization**: Update layout.tsx with next/font
4. **Code Splitting**: Update DashboardClient, XRConfigurator, upload pages
5. **Tree Shaking**: Refactor Babylon.js imports in VirtualTourViewer, ARPanel, XRConfigurator
6. **Lazy Loading**: Add hook and apply to images/components
7. **Verification**: Run builds and analyze bundle

## Success Criteria
- Bundle size reduced by 30%+
- First Contentful Paint improved
- Lighthouse performance score > 90
- All dynamic imports working with loading states
- Images optimized with blur placeholders
- Fonts loading with swap display