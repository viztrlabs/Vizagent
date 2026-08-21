import { Engine, Scene, Vector3, AbstractEngine } from '@babylonjs/core';

export type XRMode = 'tour' | 'webxr' | 'webAR' | 'vr' | 'streaming';

export interface ExperienceConfig {
  mode: XRMode;
  assetId: string;
  projectId: string;
  tenantId: string;
  options?: Record<string, unknown>;
}

export interface ExperienceState {
  status: 'idle' | 'initializing' | 'ready' | 'running' | 'paused' | 'error' | 'disposed';
  mode: XRMode;
  scene?: Scene;
  error?: string;
  startTime?: number;
  frameCount: number;
}

export abstract class ExperienceEngine {
  protected engine: Engine;
  protected scene: Scene | null = null;
  protected config: ExperienceConfig;
  protected state: ExperienceState;
  protected canvas: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement, config: ExperienceConfig) {
    this.canvas = canvas;
    this.config = config;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    this.state = {
      status: 'idle',
      mode: config.mode,
      frameCount: 0,
    };
  }

  abstract initialize(): Promise<void>;
  abstract start(): Promise<void>;
  abstract pause(): void;
  abstract resume(): void;
  abstract dispose(): void;

  protected async createScene(): Promise<Scene> {
    const scene = new Scene(this.engine);
    scene.clearColor = new Vector3(0.03, 0.04, 0.06);
    return scene;
  }

  protected setupRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      if (this.scene && this.state.status === 'running') {
        this.state.frameCount++;
        this.onFrame();
        this.scene.render();
      }
    });
  }

  protected abstract onFrame(): void;

  getEngine(): Engine {
    return this.engine;
  }

  getScene(): Scene | null {
    return this.scene;
  }

  getState(): Readonly<ExperienceState> {
    return { ...this.state };
  }

  getConfig(): Readonly<ExperienceConfig> {
    return { ...this.config };
  }

  protected setState(partial: Partial<ExperienceState>): void {
    this.state = { ...this.state, ...partial };
  }

  protected handleError(error: Error): void {
    console.error(`[${this.config.mode} engine]`, error);
    this.setState({ status: 'error', error: error.message });
    throw error;
  }

  resize(): void {
    this.engine.resize();
  }
}

export function createExperienceEngine(
  canvas: HTMLCanvasElement,
  config: ExperienceConfig
): ExperienceEngine {
  switch (config.mode) {
    case 'tour':
      return new TourEngine(canvas, config);
    case 'webxr':
      return new WebXREngine(canvas, config);
    case 'webAR':
      return new WebAREngine(canvas, config);
    case 'vr':
      return new VREngine(canvas, config);
    case 'streaming':
      return new StreamingEngine(canvas, config);
    default:
      throw new Error(`Unknown XR mode: ${config.mode}`);
  }
}

class TourEngine extends ExperienceEngine {
  async initialize(): Promise<void> {
    this.setState({ status: 'initializing' });
    try {
      this.scene = await this.createScene();
      await this.setupTourScene();
      this.setupRenderLoop();
      this.setState({ status: 'ready', scene: this.scene, startTime: Date.now() });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async start(): Promise<void> {
    if (this.state.status !== 'ready' && this.state.status !== 'paused') return;
    this.setState({ status: 'running' });
  }

  pause(): void {
    this.setState({ status: 'paused' });
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.setState({ status: 'running' });
    }
  }

  dispose(): void {
    this.scene?.dispose();
    this.engine.dispose();
    this.setState({ status: 'disposed' });
  }

  private async setupTourScene(): Promise<void> {
    if (!this.scene) return;
    // Marzipano integration would go here for tour mode
    // Fallback to Babylon PhotoDome for 360° panoramas
  }

  protected onFrame(): void {
    // Tour-specific frame logic
  }
}

class WebXREngine extends ExperienceEngine {
  private xrExperience: unknown = null;

  async initialize(): Promise<void> {
    this.setState({ status: 'initializing' });
    try {
      this.scene = await this.createScene();
      await this.setupWebXRScene();
      this.setupRenderLoop();
      this.setState({ status: 'ready', scene: this.scene, startTime: Date.now() });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async start(): Promise<void> {
    if (this.state.status !== 'ready' && this.state.status !== 'paused') return;
    try {
      await this.enterXR('immersive-vr');
      this.setState({ status: 'running' });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  pause(): void {
    this.setState({ status: 'paused' });
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.setState({ status: 'running' });
    }
  }

  dispose(): void {
    this.exitXR();
    this.scene?.dispose();
    this.engine.dispose();
    this.setState({ status: 'disposed' });
  }

  private async setupWebXRScene(): Promise<void> {
    if (!this.scene) return;
    // WebXR scene setup with teleportation, controllers, etc.
  }

  protected onFrame(): void {
    // WebXR-specific frame logic
  }

  private async enterXR(sessionMode: 'immersive-vr' | 'immersive-ar'): Promise<void> {
    if (!this.scene) throw new Error('Scene not initialized');
    // WebXR session creation logic
  }

  private async exitXR(): Promise<void> {
    // WebXR session cleanup
  }
}

class WebAREngine extends ExperienceEngine {
  async initialize(): Promise<void> {
    this.setState({ status: 'initializing' });
    try {
      this.scene = await this.createScene();
      await this.setupARScene();
      this.setupRenderLoop();
      this.setState({ status: 'ready', scene: this.scene, startTime: Date.now() });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async start(): Promise<void> {
    if (this.state.status !== 'ready' && this.state.status !== 'paused') return;
    try {
      await this.enterAR();
      this.setState({ status: 'running' });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  pause(): void {
    this.setState({ status: 'paused' });
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.setState({ status: 'running' });
    }
  }

  dispose(): void {
    this.exitAR();
    this.scene?.dispose();
    this.engine.dispose();
    this.setState({ status: 'disposed' });
  }

  private async setupARScene(): Promise<void> {
    if (!this.scene) return;
    // AR scene setup with plane detection, hit testing, anchors
  }

  protected onFrame(): void {
    // AR-specific frame logic
  }

  private async enterAR(): Promise<void> {
    if (!this.scene) throw new Error('Scene not initialized');
    // AR session creation logic
  }

  private async exitAR(): Promise<void> {
    // AR session cleanup
  }
}

class VREngine extends ExperienceEngine {
  async initialize(): Promise<void> {
    this.setState({ status: 'initializing' });
    try {
      this.scene = await this.createScene();
      await this.setupVRScene();
      this.setupRenderLoop();
      this.setState({ status: 'ready', scene: this.scene, startTime: Date.now() });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async start(): Promise<void> {
    if (this.state.status !== 'ready' && this.state.status !== 'paused') return;
    try {
      await this.enterVR();
      this.setState({ status: 'running' });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  pause(): void {
    this.setState({ status: 'paused' });
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.setState({ status: 'running' });
    }
  }

  dispose(): void {
    this.exitVR();
    this.scene?.dispose();
    this.engine.dispose();
    this.setState({ status: 'disposed' });
  }

  private async setupVRScene(): Promise<void> {
    if (!this.scene) return;
    // VR scene setup for native headsets (6DOF, haptics, eye tracking)
  }

  protected onFrame(): void {
    // VR-specific frame logic (90 FPS target)
  }

  private async enterVR(): Promise<void> {
    if (!this.scene) throw new Error('Scene not initialized');
    // VR session creation logic
  }

  private async exitVR(): Promise<void> {
    // VR session cleanup
  }
}

class StreamingEngine extends ExperienceEngine {
  private peerConnection: RTCPeerConnection | null = null;

  async initialize(): Promise<void> {
    this.setState({ status: 'initializing' });
    try {
      this.scene = await this.createScene();
      await this.setupStreamingScene();
      this.setupRenderLoop();
      this.setState({ status: 'ready', scene: this.scene, startTime: Date.now() });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async start(): Promise<void> {
    if (this.state.status !== 'ready' && this.state.status !== 'paused') return;
    try {
      await this.connectToStream();
      this.setState({ status: 'running' });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  pause(): void {
    this.setState({ status: 'paused' });
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.setState({ status: 'running' });
    }
  }

  dispose(): void {
    this.disconnectStream();
    this.scene?.dispose();
    this.engine.dispose();
    this.setState({ status: 'disposed' });
  }

  private async setupStreamingScene(): Promise<void> {
    if (!this.scene) return;
    // Pixel streaming scene setup (WebRTC, GPU orchestration)
  }

  protected onFrame(): void {
    // Streaming-specific frame logic
  }

  private async connectToStream(): Promise<void> {
    // WebRTC connection to GPU workstation
  }

  private async disconnectStream(): Promise<void> {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}