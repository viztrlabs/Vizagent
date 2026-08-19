 
// M0.3: This Babylon.js single-scene tour hook is superseded by the Marzipano
// multi-scene viewer (`components/marzipano/MarzipanoTourViewer.tsx`).
//
// Its only consumer (`components/viewer/VirtualTourViewer.tsx`) never existed
// in the repo, and the single-scene `TourConfig` shape it relied on
// (`equirectangularUrl`, `settings.initialYaw/initialPitch`) has been replaced
// by the multi-scene `lib/tour/types.ts`. Keeping the file only as a stub so
// any stale import resolves; it is inert. Remove on the host (see
// docs/superpowers/plans/2026-08-09-virtual-tour-marzipano-viewer.md).
export {};
