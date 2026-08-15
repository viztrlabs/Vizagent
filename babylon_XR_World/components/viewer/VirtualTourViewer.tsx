"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color4,
  PhotoDome,
  Mesh,
  PointerEventTypes,
  WebXRExperienceHelper,
  Constants,
} from "@babylonjs/core";
import { GUI3DManager, HolographicButton, AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import "@babylonjs/loaders";

export interface Hotspot {
  id: string;
  label: string;
  description?: string;
  yaw: number;
  pitch: number;
  targetAssetId?: string;
  type: "info" | "navigation";
}

export interface TourAsset {
  id: string;
  equirectUrl: string;
  hotspots: Hotspot[];
}

export interface TourData {
  projectId: string;
  projectName: string;
  assets: TourAsset[];
  currentAssetIndex: number;
  settings: {
    autoRotate: boolean;
    autoRotateSpeed: number;
    defaultYaw: number;
    defaultPitch: number;
  };
}

interface VirtualTourViewerProps {
  tourData: TourData;
  onAssetChange?: (assetId: string) => void;
  className?: string;
}

export function VirtualTourViewer({
  tourData,
  onAssetChange,
  className = "",
}: VirtualTourViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const photoDomeRef = useRef<PhotoDome | null>(null);
  const hotspotMeshesRef = useRef<Map<string, Mesh>>(new Map());
  const hotspotButtonsRef = useRef<Map<string, Button3D>>(new Map());
  const guiManagerRef = useRef<GUI3DManager | null>(null);
  const xrHelperRef = useRef<WebXRExperienceHelper | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const currentAsset = tourData.assets[tourData.currentAssetIndex];

  const initializeScene = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const engine = new Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
      });
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0, 0, 0, 0);

      const camera = new ArcRotateCamera(
        "camera",
        tourData.settings.defaultYaw,
        tourData.settings.defaultPitch,
        1,
        Vector3.Zero(),
        scene
      );
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 0.1;
      camera.upperRadiusLimit = 100;
      camera.wheelDeltaPercentage = 0.01;
      camera.panningSensibility = 0;
      camera.allowUpsideDown = true;

      engineRef.current = engine;
      sceneRef.current = scene;
      cameraRef.current = camera;

      const resize = () => engine.resize();
      window.addEventListener("resize", resize);

      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          setShowControls(true);
          setTimeout(() => setShowControls(false), 3000);
        }
      });

      engine.runRenderLoop(() => {
        if (tourData.settings.autoRotate && cameraRef.current && !isInVR) {
          cameraRef.current.alpha += tourData.settings.autoRotateSpeed * 0.001;
        }
        scene.render();
      });

      await loadPhotoDome(currentAsset.equirectUrl);
      createHotspots(currentAsset.hotspots);

      await checkVRSupport();

      setIsLoading(false);

      return () => {
        window.removeEventListener("resize", resize);
        disposeScene();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize viewer");
      setIsLoading(false);
    }
  }, [currentAsset.equirectUrl, currentAsset.hotspots, tourData.settings, isInVR]);

  const loadPhotoDome = async (url: string) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) return;

    if (photoDomeRef.current) {
      photoDomeRef.current.dispose();
    }

    setIsLoading(true);

    return new Promise<void>((resolve, reject) => {
      try {
        const dome = new PhotoDome(
          "photoDome",
          url,
          {
            resolution: 32,
            size: 1000,
            useDirectMapping: false,
          },
          scene
        );
        dome.imageMode = Constants.TEXTURE_EQUIRECTANGULAR_FIXED;
        photoDomeRef.current = dome;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };

  const createHotspots = (hotspots: Hotspot[]) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) return;

    hotspotMeshesRef.current.forEach((mesh) => mesh.dispose());
    hotspotMeshesRef.current.clear();
    hotspotButtonsRef.current.forEach((btn) => btn.dispose());
    hotspotButtonsRef.current.clear();

    if (guiManagerRef.current) {
      guiManagerRef.current.dispose();
    }
    const guiManager = new GUI3DManager(scene);
    guiManagerRef.current = guiManager;

    hotspots.forEach((hotspot) => {
      const direction = new Vector3(
        Math.sin(hotspot.yaw) * Math.cos(hotspot.pitch),
        Math.sin(hotspot.pitch),
        Math.cos(hotspot.yaw) * Math.cos(hotspot.pitch)
      );

      const distance = 500;
      const position = direction.scale(distance);

      const button = new HolographicButton(`hotspot-${hotspot.id}`);
      button.mesh.scaling.setAll(0.15);
      button.mesh.position = position;
      button.mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;

      const advancedTexture = AdvancedDynamicTexture.CreateForMesh(button.mesh, 256, 256);
      const textBlock = new TextBlock();
      textBlock.text = hotspot.label;
      textBlock.color = "white";
      textBlock.fontSize = 24;
      textBlock.fontFamily = "Inter, system-ui, sans-serif";
      textBlock.textWrapping = true;
      advancedTexture.addControl(textBlock);

      button.onPointerUpObservable.add(() => {
        handleHotspotClick(hotspot);
      });

      guiManager.addControl(button);
      hotspotButtonsRef.current.set(hotspot.id, button);
    });
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (hotspot.type === "navigation" && hotspot.targetAssetId) {
      const targetIndex = tourData.assets.findIndex((a) => a.id === hotspot.targetAssetId);
      if (targetIndex !== -1 && onAssetChange) {
        onAssetChange(hotspot.targetAssetId);
      }
    }
  };

  const checkVRSupport = async () => {
    if (!navigator.xr) {
      setIsVRSupported(false);
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported("immersive-vr");
      setIsVRSupported(supported);
    } catch {
      setIsVRSupported(false);
    }
  };

  const enterVR = async () => {
    const scene = sceneRef.current;
    if (!scene || xrHelperRef.current) return;

    try {
      const xrHelper = await scene.createDefaultXRExperienceAsync({
        floorMeshes: [],
        optionalFeatures: ["hit-test", "local-floor", "bounded-floor"],
      });

      xrHelperRef.current = xrHelper;

      const sessionManager = xrHelper.baseExperience.sessionManager;
      sessionManager.onXRSessionInit.add(() => {
        setIsInVR(true);
      });

      await xrHelper.baseExperience.enterXRAsync("immersive-vr", "local-floor", {
        optionalFeatures: ["hit-test", "local-floor", "bounded-floor"],
      });
    } catch (err) {
      console.error("Failed to enter VR:", err);
      setError("Failed to enter VR mode");
    }
  };

  const exitVR = async () => {
    const xrHelper = xrHelperRef.current;
    if (!xrHelper) return;

    try {
      await xrHelper.baseExperience.exitXRAsync();
      xrHelper.dispose();
      xrHelperRef.current = null;
      setIsInVR(false);
    } catch (err) {
      console.error("Failed to exit VR:", err);
    }
  };

  const toggleFullscreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!document.fullscreenElement) {
      canvas.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const disposeScene = () => {
    hotspotMeshesRef.current.forEach((mesh) => mesh.dispose());
    hotspotMeshesRef.current.clear();
    hotspotButtonsRef.current.forEach((btn) => btn.dispose());
    hotspotButtonsRef.current.clear();

    if (guiManagerRef.current) {
      guiManagerRef.current.dispose();
      guiManagerRef.current = null;
    }

    if (xrHelperRef.current) {
      xrHelperRef.current.dispose();
      xrHelperRef.current = null;
    }

    if (photoDomeRef.current) {
      photoDomeRef.current.dispose();
      photoDomeRef.current = null;
    }

    if (sceneRef.current) {
      sceneRef.current.dispose();
      sceneRef.current = null;
    }

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
  };

  useEffect(() => {
    initializeScene();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      disposeScene();
    };
  }, [initializeScene]);

  useEffect(() => {
    if (!isLoading && currentAsset) {
      loadPhotoDome(currentAsset.equirectUrl).then(() => {
        createHotspots(currentAsset.hotspots);
      });
    }
  }, [currentAsset, isLoading]);

  if (isLoading) {
    return (
      <div className={`viztr-tour-viewer ${className}`} style={{ position: "relative", width: "100%", height: "100%" }}>
        <canvas ref={canvasRef} className="viztr-tour-canvas" touch-action="none" />
        <div className="viztr-tour-overlay">
          <div className="viztr-spinner" aria-label="Loading tour" />
        </div>
        <style jsx>{`
          .viztr-tour-viewer {
            position: relative;
            width: 100%;
            height: 100%;
            background: #0b0710;
            border-radius: 12px;
            overflow: hidden;
          }
          .viztr-tour-canvas {
            width: 100%;
            height: 100%;
            display: block;
            outline: none;
          }
          .viztr-tour-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0b0710;
            z-index: 10;
          }
          .viztr-spinner {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid rgba(107, 33, 168, 0.25);
            border-top-color: #0d9488;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`viztr-tour-viewer ${className}`} style={{ position: "relative", width: "100%", height: "100%" }}>
        <canvas ref={canvasRef} className="viztr-tour-canvas" touch-action="none" />
        <div className="viztr-tour-error">
          Couldn&apos;t load this tour. {error}
        </div>
        <style jsx>{`
          .viztr-tour-viewer {
            position: relative;
            width: 100%;
            height: 100%;
            background: #0b0710;
            border-radius: 12px;
            overflow: hidden;
          }
          .viztr-tour-canvas {
            width: 100%;
            height: 100%;
            display: block;
            outline: none;
          }
          .viztr-tour-error {
            position: absolute;
            bottom: 16px;
            left: 16px;
            right: 16px;
            padding: 12px 16px;
            background: rgba(220, 38, 38, 0.15);
            border: 1px solid rgba(220, 38, 38, 0.4);
            color: #fca5a5;
            font-size: 14px;
            border-radius: 8px;
            z-index: 20;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`viztr-tour-viewer ${className}`} style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} className="viztr-tour-canvas" touch-action="none" />

      {showControls && (
        <div className="viztr-tour-controls" role="toolbar" aria-label="Tour controls">
          <div className="viztr-tour-control-group viztr-tour-control-left">
            <button
              className="viztr-tour-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>

          <div className="viztr-tour-control-group viztr-tour-control-center">
            <span className="viztr-tour-title">{tourData.projectName}</span>
            {tourData.assets.length > 1 && (
              <div className="viztr-tour-nav-indicator">
                {tourData.currentAssetIndex + 1} / {tourData.assets.length}
              </div>
            )}
          </div>

          <div className="viztr-tour-control-group viztr-tour-control-right">
            {isVRSupported && (
              <button
                className="viztr-tour-btn viztr-tour-btn-vr"
                onClick={isInVR ? exitVR : enterVR}
                aria-label={isInVR ? "Exit VR" : "Enter VR"}
                title={isInVR ? "Exit VR" : "Enter VR"}
              >
                {isInVR ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                    <path d="M22 11V9a2 2 0 0 0-2-2h-2" />
                    <path d="M15 5v.01" />
                    <path d="M22 15v.01" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                    <path d="M22 11V9a2 2 0 0 0-2-2h-2" />
                    <path d="M15 5v.01" />
                    <path d="M22 15v.01" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .viztr-tour-viewer {
          position: relative;
          width: 100%;
          height: 100%;
          background: #0b0710;
          border-radius: 12px;
          overflow: hidden;
        }
        .viztr-tour-canvas {
          width: 100%;
          height: 100%;
          display: block;
          outline: none;
          touch-action: none;
        }
        .viztr-tour-controls {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        .viztr-tour-viewer:hover .viztr-tour-controls,
        .viztr-tour-controls:focus-within {
          opacity: 1;
        }
        .viztr-tour-control-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
        }
        .viztr-tour-control-left {
          justify-content: flex-start;
        }
        .viztr-tour-control-center {
          justify-content: center;
          flex: 1;
        }
        .viztr-tour-control-right {
          justify-content: flex-end;
        }
        .viztr-tour-title {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          font-family: Inter, system-ui, sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }
        .viztr-tour-nav-indicator {
          color: rgba(255,255,255,0.6);
          font-size: 12px;
          font-family: Inter, system-ui, sans-serif;
          padding: 2px 8px;
          background: rgba(0,0,0,0.4);
          border-radius: 12px;
        }
        .viztr-tour-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(8px);
          color: #fff;
          cursor: pointer;
          pointer-events: auto;
          transition: background 0.2s, transform 0.1s;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .viztr-tour-btn:hover {
          background: rgba(13, 17, 23, 0.95);
          transform: scale(1.05);
        }
        .viztr-tour-btn:active {
          transform: scale(0.95);
        }
        .viztr-tour-btn:focus-visible {
          outline: 2px solid #0d9488;
          outline-offset: 2px;
        }
        .viztr-tour-btn-vr {
          background: linear-gradient(135deg, #0d9488, #06b6d4);
        }
        .viztr-tour-btn-vr:hover {
          background: linear-gradient(135deg, #06b6d4, #0d9488);
        }
        @media (max-width: 640px) {
          .viztr-tour-title {
            max-width: 150px;
            font-size: 12px;
          }
          .viztr-tour-btn {
            width: 36px;
            height: 36px;
          }
          .viztr-tour-control-group {
            padding: 8px 12px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .viztr-tour-btn {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

VirtualTourViewer.displayName = "VirtualTourViewer";