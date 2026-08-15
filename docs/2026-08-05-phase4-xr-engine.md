# Phase 4 — XR Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 3D Experience Engine (WebGL/WebXR/AR/VR/Tour + Unified Viewer), Pixel Streaming (WebRTC + Unreal), the 3D Interaction Editor, multi-user live sessions, and the local workstation software.

**Architecture:** Decoupled XR engine served from `xr.viztr.com` (§9.13). Five experience modes share a Scene Graph and Mode Manager (§9.7–§9.9). Pixel Streaming broker handles WebRTC sessions with the local Unreal source (§9.6). Editor persists interaction JSON consumed by the engine (§13).

**Tech Stack:** Babylon.js 8+ (@babylonjs/core, gui, materials, loaders — Editor + Next.js template, ADR 6.1 Revised), WebRTC (medooze/ion-sfu or `node-mediasoup`), Socket.io 4.7, Unreal Engine 5 (local), zustand, zod.

## Global Constraints

- Engine decoupled: `xr.viztr.com` independent deploy; marketing site never bundles the engine (§9.13).
- Hybrid immersion: Tour → VR → AR progressive flow (§9.8); single Mode Manager controller (§9.9).
- **View Modes #8 hybrid (Tour ⇄ Dollhouse) owned HERE**: ModeManager routes between Marzipano tour (panorama layer, ADR 6.1.1 carve-out) and Babylon.js dollhouse, sharing room/camera state via the tour config. Marzipano plan (`2026-08-05-phase4-virtual-tour-marzipano.md`) provides the panorama viewer only; this plan owns the `ModeManager` routing and dollhouse mode.
- GLB ≤ 8–10MB compressed (Draco/KTX2) (§11.5); ≥ 60 FPS; respects `prefers-reduced-motion`.
- **WASM decoders + bundle budget:** Draco/KTX2 WASM decoders (~500KB–1MB each) served from Cloudflare R2 CDN and cached, NOT bundled into app JS; tree-shake `@babylonjs/core` imports (import `Scene`, `Engine`, etc. from submodules, never the barrel); bundle-budget CI check fails builds over budget.
- **USDZ (iOS Quick Look):** generated from GLB via `usd-from-gltf` (open source) or Reality Converter (macOS); the GLB→USDZ step is part of the asset pipeline, with output served to `ar-viewer.tsx` (§9.4/§9.18).
- **XR UI resolved (§17.5):** HTML/CSS overlay approach wins — all menus/HUD are custom glassmorphism HTML overlays; `@babylonjs/gui` is used ONLY for minimal in-canvas labels (never panels/HUD), preventing double-rendered UI.
- Pixel Streaming only from approved local workstations; session auth + analytics (§9.6).
- Interaction editor saves JSON per project version; engine consumes it (§13.5).
- Live sessions: presence, avatars, voice (WebRTC), scene sync (§9.14).
- **WebXR device test matrix:** Quest 2/3/Pro, Pico 4, Apple Vision Pro (Safari), desktop Chrome/Edge, Safari iOS. XR cannot be unit-tested — verify manually per device; non-XR fallbacks (tour/3D/AR) are covered by Playwright screenshot visual regression.

---

### Task 1: Decoupled XR engine bootstrap

**Files:**
- Create: `xr-runner/app/globals.css`, `xr-runner/app/layout.tsx`
- Create: `xr-runner/app/page.tsx`
- Create: `xr-runner/next.config.mjs`
- Test: `xr-runner/test/bootstrap.test.ts`

**Interfaces:**
- Consumes: `@viztr/types`, `@viztr/utils`.
- Produces: standalone `xr-runner` Next.js app on its own domain (Vercel project `viztr-xr`), empty viewer shell with `<ModeManagerProvider>` mount point.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { viewerRouteFor } from "../lib/routes";
describe("viewer routes", () => {
  it("maps project id to viewer route", () => {
    expect(viewerRouteFor("p_abc")).toBe("/viewer/p_abc");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/routes.ts`:
```ts
export function viewerRouteFor(projectId: string): string {
  return `/viewer/${projectId}`;
}
```

App shell with `next.config.mjs` basePath `/`, styled by `@viztr/ui` tokens. Page renders `<ViewerShell />` (to be filled by Tasks 2–3).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner
git commit -m "feat(xr-runner): scaffold decoupled XR engine app"
```

---

### Task 2: Experience modes + Mode Manager

**Files:**
- Create: `xr-runner/core/modes.ts`
- Create: `xr-runner/core/mode-manager.ts`
- Create: `xr-runner/components/experience-router.tsx`
- Test: `xr-runner/test/modes.test.ts`

**Interfaces:**
- Consumes: Task 1 shell.
- Produces: `ExperienceMode = "tour" | "webxr" | "webar" | "vr" | "pixel-streaming"`, `createModeManager(initial)` (zustand store: `setMode`, `current`, transitions with locks), `<ExperienceRouter project>` selecting the active viewer (§9.1/§9.9).

- [ ] **Step 1: Write the failing test**

```ts
import { createModeManager } from "../core/mode-manager";
describe("mode manager", () => {
  it("switches modes and records transitions", () => {
    const m = createModeManager("tour");
    m.setMode("vr");
    expect(m.current()).toBe("vr");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`mode-manager.ts`:
```ts
import { create } from "zustand";
export type ExperienceMode = "tour" | "webxr" | "webar" | "vr" | "pixel-streaming";
export const createModeManager = (initial: ExperienceMode) =>
  create<{ current: ExperienceMode; history: ExperienceMode[]; setMode: (m: ExperienceMode) => void }>((set) => ({
    current: initial,
    history: [initial],
    setMode: (m) => set((s) => ({ current: m, history: [...s.history, m] })),
  }));
```

`experience-router.tsx` switches on `current` to Tour/WebXR/WebAR/VR/PixelStreaming viewers.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/core xr-runner/components/experience-router.tsx xr-runner/test/modes.test.ts
git commit -m "feat(xr-runner): add experience modes and Mode Manager store"
```

---

### Task 3: Unified Viewer (360 + 3D) + Hybrid immersion

**Files:**
- Create: `xr-runner/app/viewer/[projectId]/page.tsx`
- Stub: `xr-runner/components/viewers/tour-viewer.tsx` (Marzipano rework landed in `2026-08-05-phase4-virtual-tour-marzipano.md` Task 1 — this plan only mounts the placeholder + fallback path)
- Create: `xr-runner/components/viewers/babylon-viewer.tsx`
- Create: `xr-runner/components/viewers/ar-viewer.tsx`
- Test: `xr-runner/test/viewer-config.test.ts`

**Interfaces:**
- Consumes: Task 2 router, interaction JSON (Phase 4 Task 5).
- Produces: `/viewer/[projectId]` — config fetched by ID; 360 panorama + 3D GLB unified (§9.21); Hybrid progression Tour → VR → AR per §9.8.

`interface ExperienceConfig` (unified Experience JSON schema §9.13/§9.18) — lives in `packages/types/experience.ts` (Phase 0 scaffold), shared by ALL viewers including the Marzipano tour plan (`2026-08-05-phase4-virtual-tour-marzipano.md` Task 1 consumes `config.assets.panoramaUrl` + hotspots):

```ts
export type ExperienceMode = "tour" | "webxr" | "webar" | "vr" | "pixel-streaming";
export type DeviceModeConfig = {
  webar?: { markerType?: "image" | "matrix"; anchors?: boolean; occlusion?: boolean; shadows?: boolean; hitTesting?: boolean; lightEstimation?: boolean };
  vr?: { gazeDwellMs?: number };
  tour?: { photoDomeFallback?: boolean };
  "pixel-streaming"?: { captureScreenshot?: boolean };
};

export interface ExperienceConfig {
  id: string;
  mode: ExperienceMode;
  assets: { glbUrl?: string; panoramaUrl?: string; usdzUrl?: string };
  hotspots: Array<{ id: string; position: [number, number, number]; label?: string; radius?: number }>;
  annotations: Array<{ id: string; text: string; target: string }>;
  camera: { initial?: { position: [number, number, number]; target: [number, number, number] }; fov?: number };
  environment?: { environmentUrl?: string; lighting?: "studio" | "outdoor" | "night" };
  interactions: Array<{ trigger: string; action: string; payload?: Record<string, unknown> }>;
  devices?: {
    desktop: { enabledViewers: ExperienceMode[]; modeConfig: Partial<Record<ExperienceMode, DeviceModeConfig>> };
    mobile: { enabledViewers: ExperienceMode[]; modeConfig: Partial<Record<ExperienceMode, DeviceModeConfig>> };
    hmd: { enabledViewers: ExperienceMode[]; modeConfig: Partial<Record<ExperienceMode, DeviceModeConfig>> };
  };
}
```

`buildViewerConfig` (Step 3) derives `available`/`defaultMode` from a `Pick<ExperienceConfig, "mode">` + `modes` list and passes through `devices` (per-device-class `enabledViewers` + per-mode `modeConfig` for desktop/mobile/hmd — consumed by Tasks 13–15); hotspot shape matches Task 5's `Hotspot`. `devices` is optional, so existing callers and the test above stay valid.

- [ ] **Step 1: Write the failing test**

```ts
import { buildViewerConfig } from "../lib/viewer-config";
describe("viewer config", () => {
  it("defaults to tour mode for a tour project", () => {
    const c = buildViewerConfig({ modes: ["tour", "vr", "ar"], default: "tour" });
    expect(c.defaultMode).toBe("tour");
    expect(c.available).toEqual(["tour", "vr", "ar"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/viewer-config.ts`:
```ts
import type { ExperienceMode } from "../core/modes";
import type { ExperienceConfig } from "@viztr/types";
export function buildViewerConfig(project: {
  modes: ExperienceMode[];
  default?: ExperienceMode;
  devices?: ExperienceConfig["devices"];
}) {
  return { available: project.modes, defaultMode: project.default ?? project.modes[0], devices: project.devices };
}
```

`tour-viewer.tsx`: Marzipano 360° panorama + hotspot navigation (primary, named carve-out ADR 6.1.1 — full build in `2026-08-05-phase4-virtual-tour-marzipano.md` Task 1; this plan provides the ModeManager mount + Babylon.js `PhotoDome` fallback behind `photoDomeFallback` flag). `babylon-viewer.tsx`: `SceneLoader.ImportMesh` GLB + Draco, grid/float pattern, `ArcRotateCamera`. `ar-viewer.tsx`: Babylon.js `WebXRDefaultExperience` + `WebXRSessionManager` AR session (§9.4).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/app/viewer xr-runner/components/viewers xr-runner/lib/viewer-config.ts xr-runner/test/viewer-config.test.ts
git commit -m "feat(xr-runner): add unified viewer routes, tour/3D/AR viewers"
```

---

### Task 4: Pixel Streaming (WebRTC broker)

**Files:**
- Create: `services/pixel-streaming/broker.ts`
- Create: `services/pixel-streaming/session.ts`
- Create: `xr-runner/components/viewers/pixel-viewer.tsx`
- Test: `services/pixel-streaming/test/session.test.ts`

**Interfaces:**
- Consumes: Hermes launcher (Phase 3 Task 6), approval status.
- Produces: `createSession(workstationId, projectId)` (auth → returns token + SFU endpoints), `signal(sessionId, sdp)` (offer/answer), `closeSession(sessionId)`; `pixel-viewer.tsx` WebRTC `<video>` with connection state + latency badge (§9.6).

- [ ] **Step 1: Write the failing test**

```ts
import { createSession } from "../src/session";
describe("pixel streaming session", () => {
  it("rejects unauth sessions", async () => {
    await expect(createSession({ token: null }, "ws1", "p1")).rejects.toThrow(/unauthorized/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/pixel-streaming test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`session.ts`:
```ts
export async function createSession(auth: { token: string | null }, workstationId: string, projectId: string) {
  if (!auth.token) throw new Error("unauthorized");
  return { sessionId: crypto.randomUUID(), workstationId, projectId, signalingUrl: process.env.SFU_URL };
}
```

`broker.ts` wires Socket.io signaling: `stream:start`, `stream:answer`, `stream:ice`. `pixel-viewer.tsx` uses `RTCPeerConnection`, renders video, shows `LATENCY ms` via RTCP stats.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/pixel-streaming test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/pixel-streaming xr-runner/components/viewers/pixel-viewer.tsx
git commit -m "feat(streaming): add Pixel Streaming session broker and viewer"
```

---

### Task 5: 3D Interaction Editor

**Files:**
- Create: `apps/admin/app/admin/projects/[id]/interaction/page.tsx`
- Create: `apps/admin/components/interaction/editor.tsx`
- Create: `apps/admin/lib/interaction-store.ts`
- Test: `apps/admin/test/interaction-store.test.ts`

**Interfaces:**
- Consumes: `updateProjectStatus` audit pattern (Phase 2 Task 6).
- Produces: `saveInteraction(db, projectId, versionId, json, actor)` (persist + audit), `loadInteraction(db, projectId)`; editor UI for hotspots, annotations, event wiring (§13.3–§13.5).

- [ ] **Step 1: Write the failing test**

```ts
import { normalizeInteraction } from "../lib/interaction-store";
describe("interaction store", () => {
  it("normalizes hotspots with default radius", () => {
    const r = normalizeInteraction({ hotspots: [{ id: "h1", position: [1, 2, 3] }] });
    expect(r.hotspots[0].radius).toBe(0.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`interaction-store.ts`:
```ts
export interface Hotspot { id: string; position: [number, number, number]; label?: string; radius?: number }
export function normalizeInteraction(input: { hotspots: Array<Partial<Hotspot> & { id: string }> }): { hotspots: Hotspot[] } {
  return { hotspots: input.hotspots.map((h) => ({ ...h, position: h.position ?? [0, 0, 0], radius: h.radius ?? 0.5 })) };
}
```

Editor: three-pane (list / canvas / inspector), persists JSON via API, versioned per `ProjectVersion`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/admin/projects/[id]/interaction apps/admin/components/interaction apps/admin/lib/interaction-store.ts apps/admin/test/interaction-store.test.ts
git commit -m "feat(editor): add 3D interaction editor with normalized JSON store"
```

---

### Task 6: Multi-user live sessions

**Files:**
- Create: `services/realtime/presence.ts`
- Create: `services/realtime/scene-sync.ts`
- Create: `services/realtime/voice.ts`
- Test: `services/realtime/test/sync.test.ts`

**Interfaces:**
- Consumes: Socket.io, Task 2 Mode Manager state.
- Produces: `joinRoom(io, roomId, userId)`, `broadcastTransform(roomId, userId, tf)`, `muteUnmute(roomId, userId)` — presence, avatars, voice (WebRTC SFU), scene-state sync (§9.14).

- [ ] **Step 1: Write the failing test**

```ts
import { roomKey } from "../src/scene-sync";
describe("scene sync", () => {
  it("namespaces rooms per project", () => {
    expect(roomKey("p_1", "tour")).toBe("p_1:tour");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/realtime test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`scene-sync.ts`:
```ts
export function roomKey(projectId: string, mode: string): string {
  return `${projectId}:${mode}`;
}
```

`presence.ts`: `io.on("connection")` joins `roomKey`, tracks member set, emits `presence:update`. `voice.ts`: manages WebRTC peer offers within the room.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/realtime test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/realtime
git commit -m "feat(realtime): add multi-user presence, scene sync, and voice"
```

---

### Task 7: Local workstation software

**Files:**
- Create: `local/workstation/README.md`
- Create: `local/workstation/hermes-agent.md`
- Create: `local/workstation/scripts/start-stream.bat`
- Create: `local/workstation/scripts/report-status.ps1`
- Test: `local/workstation/test/status-report.test.ts`

**Interfaces:**
- Consumes: Phase 3 Task 6 Hermes launcher.
- Produces: workstation install docs, `start-stream.bat` (launches Unreal Pixel Streaming + Hermes), `report-status.ps1` (POSTs status to dashboard, §9.6).

- [ ] **Step 1: Write the failing test**

```ts
import { buildStatusPayload } from "../scripts/status-lib";
describe("workstation status", () => {
  it("builds status payload", () => {
    expect(buildStatusPayload({ gpu: "RTX 4090", running: true })).toMatchObject({ gpu: "RTX 4090", running: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/local test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`status-lib.ts`:
```ts
export function buildStatusPayload(s: { gpu: string; running: boolean; projectId?: string }) {
  return { ...s, reportedAt: new Date().toISOString() };
}
```

`start-stream.bat`: starts Unreal Pixel Streaming with `-PixelStreamingIP`/port, launches Hermes, waits for health. `report-status.ps1`: `Invoke-RestMethod` POST to `/api/workstations/status`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/local test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add local/workstation
git commit -m "feat(local): add workstation docs, stream launcher, status reporter"
```

---

### Task 8: Token-based delivery viewers

**Files:**
- Create: `xr-runner/app/view/tour/[token]/page.tsx`
- Create: `xr-runner/app/view/ar/[token]/page.tsx`
- Create: `xr-runner/app/view/vr/[token]/page.tsx`
- Create: `xr-runner/app/view/xr/[token]/page.tsx`
- Create: `xr-runner/app/view/stream/[token]/page.tsx`
- Create: `xr-runner/lib/share/access.ts`
- Test: `xr-runner/test/share-access.test.ts`

**Interfaces:**
- Consumes: canonical `XrShareLink` model (`projectId`, `mode`, `accessType` enum `PUBLIC|PASSWORD|TOKEN`, `passwordHash`, `token`, `expiry`, `viewCount`, `revoked`, `createdBy`), Supabase server client (`@viztr/database`), Task 3 viewers, Task 2 Mode Manager.
- Produces: `resolveShare(token)` (Supabase lookup by `token`), `checkAccess(link, creds)` (public/password/token gates + expiry + revoked), `incrementViewCount(linkId)` — the five `/view/<mode>/[token]` routes gate on access then mount the matching viewer (tour → `tour-viewer`, ar → `ar-viewer`, vr → `babylon-viewer`, xr → `experience-router`, stream → `pixel-viewer`); per-link `viewCount` incremented on successful load.

- [ ] **Step 1: Write the failing test**

```ts
import { checkAccess, hashPassword } from "../lib/share/access";
describe("share access", () => {
  it("requires a password for PASSWORD links", () => {
    const link = { accessType: "PASSWORD", passwordHash: hashPassword("s3cret"), expiry: null, revoked: false };
    expect(checkAccess(link, {})).toBe(false);
    expect(checkAccess(link, { password: "s3cret" })).toBe(true);
  });
  it("blocks expired and revoked links", () => {
    const link = { accessType: "PUBLIC", passwordHash: null, expiry: new Date(0), revoked: true };
    expect(checkAccess(link, {})).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/share/access.ts`:
```ts
import { createHash } from "node:crypto";
export type AccessType = "PUBLIC" | "PASSWORD" | "TOKEN";
export interface ShareLink {
  id: string; projectId: string; mode: string; accessType: AccessType;
  passwordHash: string | null; token: string; expiry: Date | null; viewCount: number; revoked: boolean;
}
export function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}
export function checkAccess(link: ShareLink, creds: { password?: string; token?: string }): boolean {
  if (link.revoked) return false;
  if (link.expiry && link.expiry < new Date()) return false;
  if (link.accessType === "PUBLIC") return true;
  if (link.accessType === "TOKEN") return creds.token === link.token;
  return link.passwordHash === hashPassword(creds.password ?? "");
}
export async function resolveShare(token: string, db = supabase) {
  return (await db.from("XrShareLink").select("*").eq("token", token).maybeSingle()).data;
}
export async function incrementViewCount(linkId: string, db = supabase) {
  await db.rpc("xr_share_link_increment_view", { link_id: linkId });
}
```

Each `page.tsx` calls `resolveShare(token)`; if not found or `!checkAccess(link, creds)` it renders the 404/expired state or a password/token gate (POST back with credentials), otherwise it renders the mode's viewer and fires `incrementViewCount` (via the `xr_share_link_increment_view` RPC). The `/view/xr/[token]` route uses `experience-router` so one page serves the whole hybrid experience.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/app/view xr-runner/lib/share xr-runner/test/share-access.test.ts
git commit -m "feat(share): add token-based delivery viewers with access control"
```

---

### Task 9: XR Link Generator (studio)

**Files:**
- Create: `apps/admin/app/admin/projects/[id]/links/page.tsx`
- Create: `apps/admin/lib/link-generator.ts`
- Test: `apps/admin/test/link-generator.test.ts`

**Interfaces:**
- Consumes: `XrShareLink` model (Task 8), project modes (Task 2), admin session.
- Produces: `createShareLink(db, { projectId, mode, accessType, password?, expiry, actor })` (crypto token + hashed password → insert `XrShareLink`), `listShareLinks(db, projectId)` (with `viewCount`), `revokeShareLink(db, linkId, actor)` (sets `revoked: true`) — studio UI lists per-mode links with view counts and a revoke button, plus a create form (mode / access type / expiry).

- [ ] **Step 1: Write the failing test**

```ts
import { createShareLink, newToken } from "../lib/link-generator";
describe("link generator", () => {
  it("creates a token link per mode", () => {
    const link = createShareLink({ projectId: "p1", mode: "tour", accessType: "TOKEN", expiry: null });
    expect(link.token).toMatch(/^[a-f0-9]{32}$/);
    expect(link.mode).toBe("tour");
    expect(link.url).toBe(`/view/tour/${link.token}`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/link-generator.ts`:
```ts
import { createHash, randomBytes } from "node:crypto";
export function newToken(): string {
  return randomBytes(16).toString("hex");
}
export function createShareLink(input: {
  projectId: string; mode: string; accessType: "PUBLIC" | "PASSWORD" | "TOKEN";
  password?: string; expiry?: Date | null;
}) {
  const token = newToken();
  return {
    id: `xl_${token.slice(0, 8)}`, projectId: input.projectId, mode: input.mode,
    accessType: input.accessType, token,
    passwordHash: input.password ? createHash("sha256").update(input.password).digest("hex") : null,
    expiry: input.expiry ?? null, viewCount: 0, revoked: false,
    url: `/view/${input.mode}/${token}`,
  };
}
export async function listShareLinks(db, projectId: string) {
  return (await db.from("XrShareLink").select("*").eq("projectId", projectId).order("createdAt", { ascending: false })).data;
}
export async function revokeShareLink(db, linkId: string, actor: string) {
  return db.from("XrShareLink").update({ revoked: true, revokedBy: actor }).eq("id", linkId);
}
```

Page: per-project `/admin/projects/[id]/links` — create form (mode select from the project's modes, access type, optional password + expiry), table of links (mode badge, copy-URL button, `viewCount`, expiry, revoke button calling `revokeShareLink` then re-listing). New links point at the Task 8 `/view/<mode>/<token>` routes.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/admin/projects/[id]/links apps/admin/lib/link-generator.ts apps/admin/test/link-generator.test.ts
git commit -m "feat(admin): add XR share link generator with revoke + view counts"
```

---

### Task 10: Per-type asset validators (studio builder workflow)

**Files:**
- Create: `apps/admin/lib/asset-validators.ts`
- Test: `apps/admin/test/asset-validators.test.ts`

**Interfaces:**
- Consumes: uploaded asset metadata (type, size, mime), Phase 4 Task 5 project config.
- Produces: `validateAsset(type, files)` per mode — **tour:** 2–8 images; **webar:** image/scene/wasm including `mindar-image-*.wasm`; **vr:** model/VRM; **xr:** glb/gltf; **stream:** glb/gltf; returns `{ ok, errors[] }`. Wired into the studio builder flow: **upload → per-type validate → configure → publish**.

- [ ] **Step 1: Write the failing test**

```ts
import { validateAsset } from "../lib/asset-validators";
describe("asset validators", () => {
  it("tour requires 2-8 images", () => {
    expect(validateAsset("tour", { images: ["a.jpg"] }).ok).toBe(false);
    expect(validateAsset("tour", { images: ["a.jpg", "b.jpg", "c.jpg"] }).ok).toBe(true);
  });
  it("webar requires a marker + mindar wasm", () => {
    expect(validateAsset("webar", { files: ["logo.patt"] }).ok).toBe(false);
    expect(validateAsset("webar", { files: ["logo.patt", "mindar-image-tracking.wasm"] }).ok).toBe(true);
  });
  it("xr/stream require glb/gltf", () => {
    expect(validateAsset("xr", { files: ["scene.glb"] }).ok).toBe(true);
    expect(validateAsset("stream", { files: ["scene.gltf"] }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/asset-validators.ts`:
```ts
export type AssetType = "tour" | "webar" | "vr" | "xr" | "stream";
export function validateAsset(type: AssetType, files: { images?: string[]; files?: string[] }) {
  const exts = (files.files ?? []).map((f) => f.split(".").pop()?.toLowerCase());
  const all = (files.files ?? []).map((f) => f.toLowerCase());
  switch (type) {
    case "tour": {
      const n = (files.images ?? []).length;
      return n >= 2 && n <= 8 ? { ok: true, errors: [] } : { ok: false, errors: ["tour requires 2-8 panorama images"] };
    }
    case "webar": {
      const hasMarker = all.some((f) => f.endsWith(".patt") || f.endsWith(".mind"));
      const hasWasm = all.some((f) => f.includes("mindar-image-") && f.endsWith(".wasm"));
      return hasMarker && hasWasm
        ? { ok: true, errors: [] }
        : { ok: false, errors: ["webar requires a .patt/.mind marker and mindar-image-*.wasm"] };
    }
    case "vr": {
      const ok = exts.includes("vrm") || exts.includes("glb");
      return ok ? { ok: true, errors: [] } : { ok: false, errors: ["vr requires a VRM or GLB model"] };
    }
    case "xr":
    case "stream": {
      const ok = exts.includes("glb") || exts.includes("gltf");
      return ok ? { ok: true, errors: [] } : { ok: false, errors: [`${type} requires a glb/gltf model`] };
    }
    default:
      return { ok: false, errors: ["unknown asset type"] };
  }
}
```

Studio builder wiring: **upload** (asset library, `2026-08-05-phase4-virtual-tour-marzipano.md` Task 14) → `validateAsset(type, files)` gates the **publish** button and shows the error list inline → **configure** (interaction JSON, Task 5) → **publish** (saves the version + config).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/lib/asset-validators.ts apps/admin/test/asset-validators.test.ts
git commit -m "feat(admin): add per-type XR asset validators for the studio builder"
```

---

### Task 11: Review Viewport (studio QA)

**Files:**
- Create: `apps/admin/app/admin/projects/[id]/review/page.tsx`
- Create: `apps/admin/components/review/viewport.tsx`
- Create: `apps/admin/lib/review-pins.ts`
- Test: `apps/admin/test/review-pins.test.ts`

**Interfaces:**
- Consumes: project version renders, Task 5 config, Task 9 link generator.
- Produces: `addPin(state, {x, y, comment})`, `removePin(state, id)`, `togglePinVisibility(state)`, `savePins(db, projectId, versionId, pins, actor)`, `loadPins(db, projectId, versionId)` — studio QA tool over a rendered image/panorama: navigate image, click to pin, comment, load/save pins per version, share a `/view/xr/...` link (Task 8) for client review.

- [ ] **Step 1: Write the failing test**

```ts
import { addPin, togglePinVisibility, removePin } from "../lib/review-pins";
describe("review pins", () => {
  it("adds, removes, and toggles pins", () => {
    const s = addPin({ pins: [], visible: true }, { x: 10, y: 20, comment: "door swings wrong way" });
    expect(s.pins).toHaveLength(1);
    expect(togglePinVisibility(s).visible).toBe(false);
    expect(removePin(s, s.pins[0].id).pins).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/admin test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/review-pins.ts`:
```ts
export interface ReviewPin { id: string; x: number; y: number; comment: string }
export function addPin(state: { pins: ReviewPin[]; visible: boolean }, pin: Omit<ReviewPin, "id">) {
  return { pins: [...state.pins, { id: `rp_${Math.random().toString(36).slice(2, 8)}`, ...pin }], visible: state.visible };
}
export function removePin(state: { pins: ReviewPin[]; visible: boolean }, id: string) {
  return { pins: state.pins.filter((p) => p.id !== id), visible: state.visible };
}
export function togglePinVisibility(state: { pins: ReviewPin[]; visible: boolean }) {
  return { pins: state.pins, visible: !state.visible };
}
export async function savePins(db, projectId: string, versionId: string, pins: ReviewPin[], actor: string) {
  return db.from("ProjectReviewPins").upsert({ projectId, versionId, pins, updatedBy: actor });
}
export async function loadPins(db, projectId: string, versionId: string) {
  return (await db.from("ProjectReviewPins").select("pins").eq("projectId", projectId).eq("versionId", versionId).maybeSingle()).data?.pins ?? [];
}
```

`viewport.tsx`: full-viewport image (or panorama frame), click places a pin marker (absolute x/y), comment input per pin, eye toggle hides/shows all pins, Save persists via `savePins`, Load restores via `loadPins`, and a "Share for review" button opens the Task 8 `/view/xr/<token>` link.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/admin test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/admin/projects/[id]/review apps/admin/components/review apps/admin/lib/review-pins.ts apps/admin/test/review-pins.test.ts
git commit -m "feat(admin): add review viewport with pinnable comments + share link"
```

---

### Task 12: Pixel Streaming screenshot capture (extends Task 4 pixel-viewer)

**Files:**
- Modify: `xr-runner/components/viewers/pixel-viewer.tsx`
- Create: `xr-runner/lib/stream/capture.ts`
- Test: `xr-runner/test/stream-capture.test.ts`

**Interfaces:**
- Consumes: Task 4 session + the live WebRTC `<video>` element.
- Produces: `renderFrame(video, toDataUrl)` (draw the video frame to a canvas → PNG data URL) wired to a **Capture** button in `pixel-viewer.tsx` that downloads the screenshot and can attach it to a review pin (Task 11).

- [ ] **Step 1: Write the failing test**

```ts
import { renderFrame } from "../lib/stream/capture";
describe("stream capture", () => {
  it("builds a PNG frame from video dimensions", () => {
    const f = renderFrame({ videoWidth: 1280, videoHeight: 720 }, (w, h) => `data:image/png;${w}x${h}`);
    expect(f).toMatchObject({ width: 1280, height: 720 });
    expect(f.dataUrl).toContain("data:image/png");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/stream/capture.ts`:
```ts
export interface StreamFrame { width: number; height: number; dataUrl: string }
export function renderFrame(
  video: { videoWidth: number; videoHeight: number },
  toDataUrl: (w: number, h: number) => string,
): StreamFrame {
  return { width: video.videoWidth, height: video.videoHeight, dataUrl: toDataUrl(video.videoWidth, video.videoHeight) };
}
export function captureStreamFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
```

`pixel-viewer.tsx`: add a **Capture** button in the overlay HUD — on click it runs `captureStreamFrame(videoEl)` (via `renderFrame`), downloads the PNG (`<a download>`), and shows an "attach to review" action that pre-fills the Task 11 review pin on the studio page.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/components/viewers/pixel-viewer.tsx xr-runner/lib/stream xr-runner/test/stream-capture.test.ts
git commit -m "feat(streaming): add pixel streaming screenshot capture"
```

---

### Task 13: WebAR improvements (extends Task 3 ar-viewer)

**Files:**
- Modify: `xr-runner/components/viewers/ar-viewer.tsx`
- Create: `xr-runner/lib/webar/marker.ts`
- Test: `xr-runner/test/webar-marker.test.ts`

**Interfaces:**
- Consumes: MindAR WebAR (marker-based, `mindar-image-three`), Babylon.js WebXR fallback, Task 3 ar-viewer.
- Produces: `markerTypeFromName(name)` (`.patt`/`.mind`/matrix), `deviceOrientationPermission()` (iOS `DeviceOrientationEvent.requestPermission`) — `ar-viewer.tsx` gains custom marker file upload, matrix-code fallback, fullscreen toggle, and iOS device-orientation gating.

- [ ] **Step 1: Write the failing test**

```ts
import { markerTypeFromName } from "../lib/webar/marker";
describe("webar marker", () => {
  it("detects marker type from file name", () => {
    expect(markerTypeFromName("logo.patt")).toBe("patt");
    expect(markerTypeFromName("room.mind")).toBe("mind");
    expect(markerTypeFromName("")).toBe("matrix");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/webar/marker.ts`:
```ts
export function markerTypeFromName(name: string): "patt" | "mind" | "matrix" {
  if (name.endsWith(".patt")) return "patt";
  if (name.endsWith(".mind")) return "mind";
  return "matrix";
}
export async function deviceOrientationPermission(): Promise<boolean> {
  const d = (globalThis as any).DeviceOrientationEvent as any;
  if (typeof d?.requestPermission === "function") return (await d.requestPermission()) === "granted";
  return true;
}
```

`ar-viewer.tsx`: file input accepting `.patt`/`.mind` (from the Task 10 webar validator asset list) → MindAR image tracking with the uploaded marker; no marker file → matrix-code fallback (MindAR `{ mode: "matrix" }`); fullscreen button on the HUD (`requestFullscreen` on the container); on iOS call `deviceOrientationPermission()` before starting the session and show a permission-gated start overlay.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/components/viewers/ar-viewer.tsx xr-runner/lib/webar xr-runner/test/webar-marker.test.ts
git commit -m "feat(webar): custom markers, matrix fallback, fullscreen, orientation gate"
```

---

### Task 14: VR gaze dwell selection (extends Task 3 babylon-viewer VR)

**Files:**
- Modify: `xr-runner/components/viewers/babylon-viewer.tsx`
- Create: `xr-runner/lib/vr/gaze.ts`
- Test: `xr-runner/test/gaze.test.ts`

**Interfaces:**
- Consumes: Babylon.js `WebXRDefaultExperience` VR input, Task 5 hotspots, Task 3 babylon-viewer.
- Produces: `GazeSelector(dwellMs, onSelect)` — raycast gaze against hotspot targets, accumulate dwell over frames, fire `onSelect(targetId)`, render a reticle + dwell-progress ring in the HTML overlay (Task 3 XR UI decision, §17.5), cancel on focus loss.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { GazeSelector } from "../lib/vr/gaze";
describe("gaze selector", () => {
  it("fires after dwell time", () => {
    const onSelect = vi.fn();
    const g = new GazeSelector(1000, onSelect);
    g.update({ targetId: "h1", focused: true, dtMs: 500 });
    g.update({ targetId: "h1", focused: true, dtMs: 500 });
    expect(onSelect).toHaveBeenCalledWith("h1");
  });
  it("resets on focus loss", () => {
    const onSelect = vi.fn();
    const g = new GazeSelector(1000, onSelect);
    g.update({ targetId: "h1", focused: true, dtMs: 500 });
    g.update({ targetId: null, focused: false, dtMs: 500 });
    g.update({ targetId: "h1", focused: true, dtMs: 500 });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/vr/gaze.ts`:
```ts
export class GazeSelector {
  private elapsed = 0;
  constructor(private dwellMs: number, private onSelect: (targetId: string) => void) {}
  update(state: { targetId: string | null; focused: boolean; dtMs: number }) {
    if (!state.focused || !state.targetId) { this.elapsed = 0; return; }
    this.elapsed += state.dtMs;
    if (this.elapsed >= this.dwellMs) { this.onSelect(state.targetId); this.elapsed = 0; }
  }
  progress(): number { return Math.min(this.elapsed / this.dwellMs, 1); }
}
```

`babylon-viewer.tsx`: in VR mode, raycast the center-of-view (WebXR gaze ray) against hotspot meshes each frame, feed `dtMs` from `engine.getDeltaTime()` into `GazeSelector`, render the reticle + dwell-progress ring in the HTML overlay, and invoke the hotspot's interaction action on select.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/components/viewers/babylon-viewer.tsx xr-runner/lib/vr xr-runner/test/gaze.test.ts
git commit -m "feat(vr): add gaze-based cursor with dwell-timer selection"
```

---

### Task 15: WebXR AR anchors / occlusion / shadows (extends Task 3 ar-viewer)

**Files:**
- Modify: `xr-runner/components/viewers/ar-viewer.tsx`
- Create: `xr-runner/lib/webxr/anchors.ts`
- Test: `xr-runner/test/webxr-anchors.test.ts`

**Interfaces:**
- Consumes: Babylon.js `WebXRDefaultExperience` + `WebXRSessionManager` (Task 3), `ExperienceConfig.devices.mobile.modeConfig.webar` (device matrix, Task 3 extension).
- Produces: `buildWebXrFeatures(config)` (anchors, occlusion, shadows, hit-testing, light-estimation flags) and `enableArFeatures(xr, flags)` — alongside hit-testing/light estimation, the AR session enables **anchors** (`WebXRFeatureName.ANCHOR_SYSTEM`, content re-parents to persistent anchors), **occlusion** (depth-aware compositing on the WebXR render target), and **shadows** (`ShadowGenerator` bound to the light-estimation light).

- [ ] **Step 1: Write the failing test**

```ts
import { buildWebXrFeatures } from "../lib/webxr/anchors";
describe("webxr anchors", () => {
  it("enables anchors, occlusion, and shadows from config", () => {
    const f = buildWebXrFeatures({ anchors: true, occlusion: true, shadows: true, hitTesting: true, lightEstimation: true });
    expect(f).toEqual({ anchors: true, occlusion: true, shadows: true, hitTesting: true, lightEstimation: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`lib/webxr/anchors.ts`:
```ts
export interface WebXrFeatureFlags {
  anchors: boolean; occlusion: boolean; shadows: boolean; hitTesting: boolean; lightEstimation: boolean;
}
export function buildWebXrFeatures(cfg: Partial<WebXrFeatureFlags>): WebXrFeatureFlags {
  return {
    anchors: cfg.anchors ?? false,
    occlusion: cfg.occlusion ?? false,
    shadows: cfg.shadows ?? false,
    hitTesting: cfg.hitTesting ?? true,
    lightEstimation: cfg.lightEstimation ?? false,
  };
}
```

`ar-viewer.tsx`: read `ExperienceConfig.devices.mobile.modeConfig.webar` (Task 3 extension) → `buildWebXrFeatures` → on `xr.onXRSessionInit` enable the Babylon features:
- anchors: `xr.featuresManager.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM)`; models/hotspots re-parent to `xrAnchor` on `ANCHOR_ADDED`.
- occlusion: depth-composed rendering via the WebXR render target so real surfaces occlude virtual geometry.
- shadows: `ShadowGenerator` with the light from `WebXRFeatureName.LIGHT_ESTIMATION`; toggled per-mode config.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/xr-runner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add xr-runner/components/viewers/ar-viewer.tsx xr-runner/lib/webxr xr-runner/test/webxr-anchors.test.ts
git commit -m "feat(webar): add WebXR anchors, occlusion, and shadows"
```

---

### Checkpoint: M4 Definition of Done

- [ ] `/viewer/[projectId]` serves tour/3D/AR from interaction config; Mode Manager switches modes.
- [ ] `/view/<mode>/<token>` viewers gate on `XrShareLink` access (public/password/token, expiry, revoke); per-link `viewCount` increments.
- [ ] Studio link generator lists per-mode links with view counts + revoke.
- [ ] Per-type asset validators gate the studio publish flow.
- [ ] Review viewport pins save per version and share via `/view/xr/<token>`.
- [ ] Pixel Streaming screenshot capture, WebAR custom markers/fullscreen, VR gaze dwell, and WebXR anchors/occlusion/shadows verified manually per device.
- [ ] Pixel Streaming session connects from local Unreal source; latency badge live.
- [ ] Interaction editor saves/loads normalized JSON per version.
- [ ] Two users join a room; presence + scene transform sync work.
- [ ] Workstation status reported to dashboard.
- [ ] §25 tracker rows 30 updated.
