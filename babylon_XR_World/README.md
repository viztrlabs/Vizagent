# VizTR XR Configurator — Babylon.js + Next.js scaffold

## Install

```bash
npm install @babylonjs/core @babylonjs/loaders @babylonjs/materials qrcode
npm install -D @types/qrcode
```

No Babylon Editor, no Electron app in the loop — this is pure npm packages
driven by your own React state, matching the "Option A" architecture:
clients upload a GLB, your own UI configures it live, nothing round-trips
through a desktop tool.

## File map

```
src/
  lib/xr/types.ts                          — shared config data model
  components/xr/useBabylonScene.ts         — engine/scene lifecycle + mutators
  components/xr/BabylonCanvas.tsx          — presentational canvas + loading state
  components/xr/panels/MaterialsPanel.tsx  — per-mesh PBR controls
  components/xr/panels/LightingPanel.tsx   — HDRI/exposure/shadow controls
  components/xr/panels/HotspotsPanel.tsx   — click-to-place annotations
  components/xr/panels/ExportPanel.tsx     — poster capture + publish + QR/embed
  components/xr/XRConfigurator.tsx         — top-level wiring (client-only)
  app/configurator/[projectId]/page.tsx    — RSC shell, dynamic-imports the above
  app/api/xr-assets/[id]/config/route.ts   — save/publish + QR generation
prisma-schema-snippet.prisma               — models to merge into your schema.prisma
```

## Why the page is split this way

`page.tsx` is a **server component** — it does the Prisma fetch, ships zero
extra JS for that part. The actual Babylon canvas is `next/dynamic`'d with
`ssr: false`, so:

- Babylon's ~1-2MB never enters the bundle for any page that isn't this one
- The user sees the RSC shell instantly; the "Loading configurator…" state
  only blocks the 3D-specific chunk, not the whole page

## Things you still need to wire up for production

1. **HDRI presets** (`/hdri/*.env`) — pre-bake these with Babylon's own
   `cubeMapToSphericalPolynomial` tooling or the online HDR-to-.env converter,
   don't ship raw `.hdr` files to the client.
2. **`prisma` singleton** at `src/lib/prisma.ts` — standard Next.js pattern,
   you already have this per your existing stack.
3. **USDZ generation** — the API route has a commented-out hook where a
   background job (BullMQ/Inngest, whatever you're already running) should
   call Google's `usd_from_gltf` on the uploaded GLB so iOS AR Quick Look
   works. This must NOT run inline in the request — GLB→USDZ conversion is
   slow enough to need a queue.
4. **`/view/[configId]`** — the actual public Universal Viewer page isn't
   scaffolded here; it's the same `XRConfigurator` minus the editing panel,
   rendered read-only with AR launch buttons (Quick Look link for iOS,
   WebXR/Scene Viewer for Android — same `<model-viewer>` fallback pattern
   discussed earlier for the iOS AR gap).
5. **Upload pipeline** — run `gltf-transform` (Draco/Meshopt + KTX2) on
   every incoming GLB before it's stored, so what this configurator loads
   is always pre-optimized.
