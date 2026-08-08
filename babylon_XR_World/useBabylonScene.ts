// src/components/xr/useBabylonScene.ts
// Client-only. Owns the Babylon Engine/Scene lifecycle and exposes
// imperative mutators the configurator panels call into.
//
// Deliberately NOT using @babylonjs/react or the Babylon Editor —
// this is a plain runtime driven by our own React state, which is
// what a multi-tenant "upload then configure" product needs.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color4,
  SceneLoader,
  PBRMaterial,
  Color3,
  CubeTexture,
  ShadowGenerator,
  DirectionalLight,
  AbstractMesh,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  PointerEventTypes,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { EnvironmentSettings, MaterialOverride, Hotspot } from "@/lib/xr/types";

interface UseBabylonSceneOptions {
  onMeshPicked?: (meshId: string, point: Vector3) => void;
}

export function useBabylonScene(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: UseBabylonSceneOptions = {}
) {
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const rootMeshRef = useRef<AbstractMesh | null>(null);
  const shadowGenRef = useRef<ShadowGenerator | null>(null);
  const hotspotMarkersRef = useRef<Map<string, Mesh>>(new Map());

  const [isReady, setIsReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Engine + scene bootstrap ---------------------------------------
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2.5,
      Math.PI / 2.5,
      3,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 0.3;
    camera.upperRadiusLimit = 20;
    camera.wheelDeltaPercentage = 0.01;

    const light = new DirectionalLight("mainLight", new Vector3(-1, -2, -1), scene);
    light.intensity = 1.2;
    const shadowGen = new ShadowGenerator(1024, light);
    shadowGen.usePercentageCloserFiltering = true;

    engineRef.current = engine;
    sceneRef.current = scene;
    cameraRef.current = camera;
    shadowGenRef.current = shadowGen;

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;
      const pick = pointerInfo.pickInfo;
      if (pick?.hit && pick.pickedMesh && pick.pickedPoint) {
        options.onMeshPicked?.(pick.pickedMesh.id, pick.pickedPoint);
      }
    });

    engine.runRenderLoop(() => scene.render());
    setIsReady(true);

    return () => {
      window.removeEventListener("resize", resize);
      scene.dispose();
      engine.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Model loading -----------------------------------------------------
  const loadModel = useCallback(async (glbUrl: string) => {
    const scene = sceneRef.current;
    if (!scene) return;
    setIsModelLoading(true);
    setLoadError(null);

    try {
      if (rootMeshRef.current) {
        rootMeshRef.current.dispose(false, true);
      }
      const result = await SceneLoader.ImportMeshAsync("", "", glbUrl, scene);
      const root = result.meshes[0];
      rootMeshRef.current = root;

      result.meshes.forEach((m) => {
        m.receiveShadows = true;
        if (m instanceof Mesh) shadowGenRef.current?.addShadowCaster(m);
      });

      // Frame camera on the loaded bounds
      const { min, max } = root.getHierarchyBoundingVectors();
      const center = min.add(max).scale(0.5);
      const size = max.subtract(min).length();
      if (cameraRef.current) {
        cameraRef.current.setTarget(center);
        cameraRef.current.radius = Math.max(size * 1.6, 1);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load model");
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  // --- Environment / lighting --------------------------------------------
  const applyEnvironment = useCallback((env: EnvironmentSettings) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const hdrTexture = CubeTexture.CreateFromPrefilteredData(env.hdriUrl, scene);
    scene.environmentTexture = hdrTexture;
    scene.environmentIntensity = env.exposure;

    if (env.background === "environment") {
      scene.createDefaultSkybox(hdrTexture, true, 1000, 0.3);
    } else if (env.background === "color" && env.backgroundColor) {
      const c = Color3.FromHexString(env.backgroundColor);
      scene.clearColor = new Color4(c.r, c.g, c.b, 1);
    } else {
      scene.clearColor = new Color4(0, 0, 0, 0);
    }

    if (shadowGenRef.current) {
      shadowGenRef.current.setDarkness(1 - env.shadowIntensity);
      shadowGenRef.current.blurKernel = 8 + env.shadowBlur * 32;
    }
  }, []);

  // --- Material overrides -------------------------------------------------
  const applyMaterialOverride = useCallback((override: MaterialOverride) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const mesh = scene.getMeshById(override.meshId);
    if (!mesh) return;

    let mat = mesh.material as PBRMaterial | null;
    if (!mat || !(mat instanceof PBRMaterial)) {
      mat = new PBRMaterial(`${override.meshId}-mat`, scene);
      mesh.material = mat;
    }
    if (override.baseColor) mat.albedoColor = Color3.FromHexString(override.baseColor);
    if (override.metallic !== undefined) mat.metallic = override.metallic;
    if (override.roughness !== undefined) mat.roughness = override.roughness;
    if (override.emissive) mat.emissiveColor = Color3.FromHexString(override.emissive);
    if (override.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = override.emissiveIntensity;
    }
    if (override.opacity !== undefined) {
      mat.alpha = override.opacity;
      mat.transparencyMode = override.opacity < 1 ? PBRMaterial.PBRMATERIAL_ALPHABLEND : PBRMaterial.PBRMATERIAL_OPAQUE;
    }
  }, []);

  // --- Hotspots -------------------------------------------------------------
  const syncHotspotMarkers = useCallback((hotspots: Hotspot[], visible: boolean) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const existing = hotspotMarkersRef.current;

    // remove markers no longer present
    for (const [id, mesh] of existing) {
      if (!hotspots.find((h) => h.id === id)) {
        mesh.dispose();
        existing.delete(id);
      }
    }

    hotspots.forEach((h) => {
      let marker = existing.get(h.id);
      if (!marker) {
        marker = MeshBuilder.CreateSphere(`hotspot-${h.id}`, { diameter: 0.04 }, scene);
        const mat = new StandardMaterial(`hotspot-mat-${h.id}`, scene);
        mat.emissiveColor = Color3.FromHexString("#0D9488"); // VizTR teal
        mat.disableLighting = true;
        marker.material = mat;
        existing.set(h.id, marker);
      }
      marker.position = new Vector3(...h.position);
      marker.setEnabled(visible);
    });
  }, []);

  // --- Dimensions / scale ------------------------------------------------
  const applyScale = useCallback((scale: number) => {
    rootMeshRef.current?.getChildMeshes().forEach((m) => m.scaling.setAll(scale));
    rootMeshRef.current?.scaling.setAll(scale);
  }, []);

  const getBoundingSizeCm = useCallback((): [number, number, number] => {
    const root = rootMeshRef.current;
    if (!root) return [0, 0, 0];
    const { min, max } = root.getHierarchyBoundingVectors();
    const size = max.subtract(min);
    // glTF/GLB is meters by convention -> cm
    return [size.x * 100, size.y * 100, size.z * 100];
  }, []);

  // --- Poster capture ------------------------------------------------------
  const capturePoster = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const engine = engineRef.current;
      const scene = sceneRef.current;
      if (!engine || !scene) return resolve("");
      // one extra render then grab the canvas
      scene.render();
      resolve(engine.getRenderingCanvas()!.toDataURL("image/png"));
    });
  }, []);

  return {
    isReady,
    isModelLoading,
    loadError,
    loadModel,
    applyEnvironment,
    applyMaterialOverride,
    syncHotspotMarkers,
    applyScale,
    getBoundingSizeCm,
    capturePoster,
    sceneRef,
  };
}
