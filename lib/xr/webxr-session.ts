import { Engine, Scene, Vector3 } from '@babylonjs/core';
import { WebXRDefaultExperience } from '@babylonjs/core/XR/webXRDefaultExperience';

export type XrMode = 'none' | 'ar' | 'vr';

export interface XrCapabilities {
  ar: boolean;
  vr: boolean;
  hitTest: boolean;
  planes: boolean;
  anchors: boolean;
  meshDetection: boolean;
}

let currentExperience: WebXRDefaultExperience | null = null;

function createMinimalScene(): Scene {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const engine = new Engine(canvas, true);
  return new Scene(engine);
}

export async function getCapabilities(): Promise<XrCapabilities> {
  const caps: XrCapabilities = { ar: false, vr: false, hitTest: false, planes: false, anchors: false, meshDetection: false };
  try {
    if (navigator.xr) {
      caps.ar = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
      caps.vr = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
    }
  } catch {
    // navigator.xr unavailable
  }
  return caps;
}

export async function tryEnterAR(
  scene?: Scene,
  options: { hitTest?: boolean; planes?: boolean; anchors?: boolean } = {}
): Promise<boolean> {
  try {
    const activeScene = scene ?? createMinimalScene();
    const experience = await WebXRDefaultExperience.CreateAsync(activeScene as never, {
      disableDefaultUI: false,
      disableTeleportation: true,
    });
    currentExperience = experience;
    const xr = experience.baseExperience as unknown as {
      sessionManager: { session: { mode?: string } };
      featuresManager?: { enableFeature?: (name: string, version: string) => void };
    };
    const fm = xr.featuresManager;
    if (fm?.enableFeature) {
      if (options.hitTest !== false) { try { fm.enableFeature('xr-hit-test', 'latest'); } catch {} }
      if (options.planes !== false) { try { fm.enableFeature('xr-plane-detection', 'latest'); } catch {} }
      if (options.anchors !== false) { try { fm.enableFeature('xr-anchor-system', 'latest'); } catch {} }
    }
    return true;
  } catch {
    return false;
  }
}

export async function tryEnterVR(scene?: Scene): Promise<boolean> {
  try {
    const activeScene = scene ?? createMinimalScene();
    const experience = await WebXRDefaultExperience.CreateAsync(activeScene as never, {
      disableDefaultUI: false,
    });
    currentExperience = experience;
    return true;
  } catch {
    return false;
  }
}

export function getMode(): XrMode {
  if (!currentExperience) return 'none';
  const xr = currentExperience.baseExperience as unknown as {
    sessionManager?: { session?: { mode?: string } };
  };
  const mode = xr.sessionManager?.session?.mode;
  if (mode === 'immersive-ar') return 'ar';
  if (mode === 'immersive-vr') return 'vr';
  return 'none';
}

export function getDetectedPlanes(): number {
  if (!currentExperience) return 0;
  try {
    const fm = (currentExperience.baseExperience as unknown as {
      featuresManager?: { getEnabledFeature?: (n: string) => { planes?: unknown[] } | null };
    }).featuresManager;
    const detector = fm?.getEnabledFeature?.('xr-plane-detection');
    return detector?.planes?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function placeAnchor(position: Vector3): Promise<boolean> {
  if (!currentExperience) return false;
  try {
    const fm = (currentExperience.baseExperience as unknown as {
      featuresManager?: { getEnabledFeature?: (n: string) => { addAnchorPointAsync?: (p: Vector3) => Promise<void> } | null };
    }).featuresManager;
    const anchorSystem = fm?.getEnabledFeature?.('xr-anchor-system');
    if (!anchorSystem?.addAnchorPointAsync) return false;
    await anchorSystem.addAnchorPointAsync(position);
    return true;
  } catch {
    return false;
  }
}

export async function exitXr(): Promise<void> {
  if (currentExperience) {
    const xr = currentExperience.baseExperience as unknown as {
      exitXRAsync?: () => Promise<void>;
      exitAsync?: () => Promise<void>;
    };
    if (xr.exitXRAsync) await xr.exitXRAsync();
    else if (xr.exitAsync) await xr.exitAsync();
    currentExperience = null;
  }
}

export function disposeXr(): void {
  currentExperience?.dispose();
  currentExperience = null;
}