# T-049 — AR/VR Features (WebXR Session, Hit-Test, Scene Understanding)

**Date:** 2026-08-08
**Status:** Approved design
**Task:** T-049 (AR/VR features: WebXR session, hit-test)

Replace the placeholder ARPanel with real WebXR capabilities: AR mode
(immersive-ar) with hit-test reticle + plane detection, VR mode
(immersive-vr), and scene understanding (anchors, planes).

## Files

- lib/xr/webxr-session.ts — WebXR session manager (AR/VR/monitor)
- lib/xr/scene-understanding.ts — hit-test, plane detection, anchors
- components/configurator/ARPanel.tsx — real AR/VR UI (modified)