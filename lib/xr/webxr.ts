// lib/xr/webxr.ts
// WebXR session management for AR/VR features

import { Scene, Vector3, Quaternion, WebXRDefaultExperience, WebXRFeatureName, WebXRHitTest, WebXRSessionManager } from "@babylonjs/core";

export type XRSessionType = "immersive-ar" | "immersive-vr";
export type XRSessionState = "ready" | "starting" | "active" | "error" | "unsupported";

export interface XRSessionStatus {
  state: XRSessionState;
  sessionType: XRSessionType | null;
  error?: string;
}

type HitTestCallback = (position: Vector3, rotationQuaternion: Quaternion | null) => void;

let sessionManager: WebXRSessionManager | null = null;
let currentSessionType: XRSessionType | null = null;
let hitTestCallback: HitTestCallback | null = null;
let statusCallbacks: Set<(status: XRSessionStatus) => void> = new Set();
let currentStatus: XRSessionStatus = { state: "ready", sessionType: null };

function notifyStatusChange(status: Partial<XRSessionStatus>) {
  currentStatus = { ...currentStatus, ...status };
  statusCallbacks.forEach((cb) => cb(currentStatus));
}

export async function checkARSupport(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.xr) return false;
  try {
    return await navigator.xr.isSessionSupported("immersive-ar");
  } catch {
    return false;
  }
}

export async function checkVRSupport(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.xr) return false;
  try {
    return await navigator.xr.isSessionSupported("immersive-vr");
  } catch {
    return false;
  }
}

export function onHitTest(callback: HitTestCallback) {
  hitTestCallback = callback;
}

export function onSessionStatusChange(callback: (status: XRSessionStatus) => void) {
  statusCallbacks.add(callback);
  callback(currentStatus);
  return () => statusCallbacks.delete(callback);
}

export async function startARSession(scene: Scene): Promise<boolean> {
  if (currentStatus.state === "active") return false;

  notifyStatusChange({ state: "starting", sessionType: "immersive-ar" });

  try {
    const xr = await scene.createDefaultXRExperienceAsync({
      floorMeshes: [],
      disableTeleportation: true,
    });

    sessionManager = xr.baseExperience.sessionManager;
    currentSessionType = "immersive-ar";

    const hitTest = xr.baseExperience.featuresManager.enableFeature(
      WebXRFeatureName.HIT_TEST,
      "latest",
      { disablePermanentHitTest: false },
      false
    ) as WebXRHitTest;

    if (hitTest) {
      hitTest.onHitTestResultObservable.add((results) => {
        if (results.length > 0 && hitTestCallback) {
          const hit = results[0];
          const position = hit.transformationMatrix.getTranslation();
          const rotationQuaternion = Quaternion.FromRotationMatrix(hit.transformationMatrix.getRotationMatrix());
          hitTestCallback(position, rotationQuaternion);
        }
      });
    }

    notifyStatusChange({ state: "active", sessionType: "immersive-ar" });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start AR session";
    notifyStatusChange({ state: "error", sessionType: "immersive-ar", error: message });
    await endXRSession();
    return false;
  }
}

export async function startVRSession(scene: Scene): Promise<boolean> {
  if (currentStatus.state === "active") return false;

  notifyStatusChange({ state: "starting", sessionType: "immersive-vr" });

  try {
    const xr = await scene.createDefaultXRExperienceAsync({
      floorMeshes: [],
      disableTeleportation: true,
    });

    sessionManager = xr.baseExperience.sessionManager;
    currentSessionType = "immersive-vr";

    notifyStatusChange({ state: "active", sessionType: "immersive-vr" });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start VR session";
    notifyStatusChange({ state: "error", sessionType: "immersive-vr", error: message });
    await endXRSession();
    return false;
  }
}

export async function endXRSession(): Promise<void> {
  if (sessionManager) {
    try {
      await sessionManager.exitXRAsync();
    } catch {
      // Ignore cleanup errors
    }
    sessionManager = null;
  }
  currentSessionType = null;
  hitTestCallback = null;
  notifyStatusChange({ state: "ready", sessionType: null });
}

export function getCurrentStatus(): XRSessionStatus {
  return currentStatus;
}

export function getCurrentSessionType(): XRSessionType | null {
  return currentSessionType;
}