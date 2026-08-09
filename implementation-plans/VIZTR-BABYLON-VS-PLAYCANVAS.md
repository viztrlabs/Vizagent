# VizTR 3D Engine Selection — Babylon.js vs PlayCanvas

> **Decision context:** The Technical Decision Log (ADR 6.1 Revised) leans toward **Babylon.js + Editor** as VizTR's single core engine (superseding Three.js/R3F), with a **Marzipano** carve-out for pure 360° virtual tours. This document validates that direction by comparing Babylon.js and PlayCanvas head-to-head against VizTR's exact requirements: beginner-friendliness, the 5 XR services, and Next.js architecture fit.

---

## 1. Executive Summary

**Winner for VizTR: Babylon.js.**

PlayCanvas is easier for a pure beginner, but Babylon.js covers **more of VizTR's 5 XR services with better quality**, integrates **natively into Next.js/React**, and is **free with zero vendor lock-in**. For a B2B SaaS platform (not a web game), Babylon.js is the correct choice — and it is the engine already being adopted in ADR 6.1 Revised.

---

## 2. Beginner Friendliness

| Factor | Babylon.js | PlayCanvas |
|---|---|---|
| Visual editor | Babylon.js Editor + Node Material Editor (desktop/web, free) | Web editor in browser, drag-and-drop, Unity-like |
| Learning curve | Code-first, but Babylon Playground + superb docs make it fast | Lowest possible — visual-first, great for non-coders |
| Community focus | Strong in **non-game 3D**: ArchViz, e-commerce, digital twins | Game-centric community |
| Ecosystem | TypeScript-first, huge plugin set, GUI, Inspector, Node Materials | Editor-centric, engine harder to use standalone |
| Verdict | 7.5/10 — needs a little code, but the right kind | 8/10 — easiest start, but locks you into its editor |

**The catch with PlayCanvas:** its beginner-friendliness comes *from* its hosted web editor — and that editor is a paid SaaS. Free projects must be public. To keep VizTR's work private you pay per seat. That single fact outweighs the easier learning curve for a commercial platform.

---

## 3. VizTR Service Coverage — The 5 XR Services

| # | VizTR Service | Babylon.js | PlayCanvas | Winner |
|---|---|---|---|---|
| 1 | **WebXR** (immersive VR/AR in browser) | Best-in-class. One-liner `createDefaultXRExperienceAsync()`, controllers, hand tracking, teleport, gaze, XR layers | Supported, but more manual; examples are game-flavored | **Babylon.js** |
| 2 | **WebAR** (marker / image-target AR) | Excellent. Native WebXR-AR (hit-test, plane detection) + clean MindAR integration for markers | Relies on 8th Wall ($$$) or Zappar; MindAR integration less documented | **Babylon.js** |
| 3 | **Virtual Reality** (desktop/mobile VR viewer) | Excellent. Post-processing, baked lighting, anti-aliasing — built for high-fidelity ArchViz | Excellent performance, tiny bundle, great mobile FPS | **Tie** |
| 4 | **Virtual Tour** (360° panoramas) | Good (`PhotoDome`), but **Marzipano is lighter and better for pure tours** | Good (skybox), same "overkill for DOM tours" caveat | **Tie — use Marzipano for both** |
| 5 | **Pixel Streaming** (Unreal WebRTC UI overlay) | Excellent — Babylon GUI layers cleanly over the video element and syncs with React | Harder — UI tied to its canvas; awkward to overlay on an external stream | **Babylon.js** |

**Score: Babylon.js 4.5 / 5 — PlayCanvas 2.5 / 5.**

---

## 4. Architecture Fit — Next.js, React, Zustand

VizTR runs on **Next.js 16.2 + React + Zustand + Turborepo**. The engine must plug into that, not fight it.

- **Babylon.js:** Declarative React integration (`react-babylonjs`). 3D objects become React components; Zustand state flows straight into the scene. Obeys the Minimal Software Rule (one tool per concern) — no iframe, no event bridge.
- **PlayCanvas:** Operates as a black box. React must talk to it via `window.postMessage` bridges — fragile, and it duplicates your UI state in a second place. Violates the platform's architecture principles.

**ArchViz fidelity:** Babylon.js natively supports glTF/GLB extensions (glass transmission, clearcoat floors) and ships a Node Material Editor for architectural shaders without writing GLSL. PlayCanvas's glTF pipeline often wants pre-processing through its cloud editor.

---

## 5. Licensing & Cost

| | Babylon.js | PlayCanvas |
|---|---|---|
| Engine license | Apache 2.0 — 100% free, forever | MIT engine, but editor is freemium SaaS |
| Private projects | Fully private, runs on your own infra | Free = public; private = paid seats ($50–$200+/user/mo) |
| VizTR MVP ($0 budget) | ✅ Perfect | ❌ Costs money to keep work private |

---

## 6. Recommendation & Action Items

**Babylon.js is the right single core engine.** It covers WebXR, WebAR, VR, and Pixel Streaming better, integrates with Next.js, and stays free for the MVP. The only carve-out is Virtual Tours → keep **Marzipano** (ADR 6.1.1) since it's lighter and purpose-built for 360° panoramas.

1. **Confirm ADR 6.1 Revised** — Babylon.js replaces Three.js/R3F as core engine.
2. **Confirm ADR 6.1.1** — Marzipano for pure virtual tours.
3. **Add packages:** `@babylonjs/core`, `@babylonjs/gui`, `@babylonjs/loaders` (plus `react-babylonjs`) into `packages/experience-engine`.
4. **Use Babylon.js Editor + Node Material Editor** for visual ArchViz scene authoring — this closes the beginner-friendliness gap with PlayCanvas.
5. Keep Three.js only if a specific dependency (e.g., a legacy asset pipeline) demands it — otherwise migrate.

---

*Document version 1.0 — August 10, 2026*
