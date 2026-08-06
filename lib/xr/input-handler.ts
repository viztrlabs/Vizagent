import { Scene, ArcRotateCamera, Vector3 } from '@babylonjs/core';

export interface InputHandlerOptions {
  onObjectSelect?: (objectId: string) => void;
  onObjectDeselect?: () => void;
  onCameraMove?: (position: Vector3, target: Vector3) => void;
}

export class InputHandler {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private options: InputHandlerOptions;

  constructor(scene: Scene, camera: ArcRotateCamera, options: InputHandlerOptions = {}) {
    this.scene = scene;
    this.camera = camera;
    this.options = options;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.scene.onPointerDown = (evt, pickResult) => {
      if (pickResult?.hit && pickResult.pickedMesh) {
        this.options.onObjectSelect?.(pickResult.pickedMesh.id);
      } else {
        this.options.onObjectDeselect?.();
      }
    };

    this.camera.onViewMatrixChangedObservable.add(() => {
      this.options.onCameraMove?.(
        this.camera.position.clone(),
        this.camera.target.clone()
      );
    });
  }

  public dispose() {
    this.scene.onPointerDown = null;
    this.camera.onViewMatrixChangedObservable.clear();
  }
}