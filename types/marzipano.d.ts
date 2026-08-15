declare namespace Marzipano {
  interface ViewParameters {
    yaw: number;
    pitch: number;
    fov: number;
  }

  class View {
    constructor(parameters?: Partial<ViewParameters>, limiter?: unknown);
    parameters(): ViewParameters;
    yaw(): number;
    pitch(): number;
    fov(): number;
    setYaw(yaw: number): void;
    setPitch(pitch: number): void;
    setFov(fov: number): void;
    setParameters(parameters: Partial<ViewParameters>): void;
  }

  class RectilinearView extends View {
    static limit: {
      traditional(maxResolution: number, maxFov: number): unknown;
    };
  }

  interface Source {
    loadAsset(
      stage: unknown,
      tile: unknown,
      done: (err: unknown, tile?: unknown, asset?: unknown) => void
    ): () => void;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- nominal marker type; an empty Record would reject EquirectGeometry assignments
  interface Geometry {}

  class HotspotContainer {
    createHotspot(domElement: HTMLElement, coords: { yaw: number; pitch: number }): unknown;
    destroyHotspot(hotspot: unknown): void;
    hide(): void;
    show(): void;
  }

  class TextureStore {
    addEventListener(type: string, handler: () => void): void;
    removeEventListener(type: string, handler: () => void): void;
  }

  class Layer {
    source(): Source;
    geometry(): Geometry;
    textureStore(): TextureStore;
    addEventListener(type: string, handler: (value?: unknown) => void): void;
    removeEventListener(type: string, handler: (value?: unknown) => void): void;
    pinFirstLevel(): void;
  }

  class Scene {
    view(): View;
    listLayers(): Layer[];
    hotspotContainer(): HotspotContainer;
    switchTo(opts?: { transitionDuration?: number }, done?: () => void): void;
    lookTo(
      params: Partial<ViewParameters>,
      opts?: { transitionDuration?: number },
      done?: () => void
    ): void;
    startMovement(
      fn: () => (params: Partial<ViewParameters>, elapsed: number) => Partial<ViewParameters> | null,
      done?: () => void
    ): void;
    stopMovement(): void;
    addEventListener(type: string, handler: () => void): void;
    destroy(): void;
  }

  class Viewer {
    constructor(domElement: HTMLElement, opts?: { controls?: Record<string, unknown> });
    createScene(opts: {
      source: Source;
      geometry: Geometry;
      view: View;
      pinFirstLevel?: boolean;
    }): Scene;
    switchScene(scene: Scene, opts?: { transitionDuration?: number }, done?: () => void): void;
    lookTo(
      params: Partial<ViewParameters>,
      opts?: { transitionDuration?: number },
      done?: () => void
    ): void;
    scene(): Scene | null;
    view(): View | null;
    controls(): unknown;
    startMovement(
      fn: () => (params: Partial<ViewParameters>, elapsed: number) => Partial<ViewParameters> | null,
      done?: () => void
    ): void;
    stopMovement(): void;
    setIdleMovement(
      timeout: number,
      movement?: (() => (params: Partial<ViewParameters>, elapsed: number) => Partial<ViewParameters> | null) | null
    ): void;
    addEventListener(type: string, handler: () => void): void;
    destroy(): void;
    domElement(): HTMLElement;
  }

  const ImageUrlSource: {
    fromString(
      url: string,
      opts?: {
        cubeMapPreviewUrl?: string;
        cubeMapPreviewFaceOrder?: string;
        concurrency?: number;
        retryDelay?: number;
      }
    ): Source;
  };

  const EquirectGeometry: new (levels: Array<{ width: number }>) => Geometry;

  function autorotate(opts?: {
    yawSpeed?: number;
    pitchSpeed?: number;
    fovSpeed?: number;
    yawAccel?: number;
    pitchAccel?: number;
    fovAccel?: number;
    targetPitch?: number | null;
    targetFov?: number | null;
  }): () => (params: Partial<ViewParameters>, elapsed: number) => Partial<ViewParameters> | null;
}

declare module 'marzipano' {
  export = Marzipano;
}
