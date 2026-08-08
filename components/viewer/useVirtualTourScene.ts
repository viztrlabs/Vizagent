'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, Color4, PhotoDome } from '@babylonjs/core';
import type { WebXRDefaultExperience } from '@babylonjs/core/XR/webXRDefaultExperience';
import { GUI3DManager } from '@babylonjs/gui';
import type { TourConfig } from '@/lib/tour/types';

export function useVirtualTourScene(config: TourConfig, autoRotate: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const photoDomeRef = useRef<PhotoDome | null>(null);
  const guiManagerRef = useRef<GUI3DManager | null>(null);
  const xrExperienceRef = useRef<WebXRDefaultExperience | null>(null);
  const autoRotateRef = useRef(autoRotate);
  const isInVRRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vrError, setVrError] = useState<string | null>(null);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    isInVRRef.current = isInVR;
  }, [isInVR]);

  const disposeScene = useCallback(() => {
    if (guiManagerRef.current) {
      guiManagerRef.current.dispose();
      guiManagerRef.current = null;
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
    xrExperienceRef.current = null;
  }, []);

  const checkVRSupport = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.xr) {
      setIsVRSupported(false);
      return;
    }
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      setIsVRSupported(supported);
    } catch {
      setIsVRSupported(false);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setError(null);
    setVrError(null);

    try {
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
      });
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0, 0, 0, 0);

      const camera = new ArcRotateCamera(
        'tourCamera',
        config.settings.initialYaw,
        config.settings.initialPitch,
        1,
        Vector3.Zero(),
        scene
      );
      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 1;
      camera.upperRadiusLimit = 1;
      camera.wheelDeltaPercentage = 0.01;
      camera.panningSensibility = 0;
      camera.allowUpsideDown = true;
      camera.minZ = 0.1;
      camera.maxZ = 2000;

      const photoDome = new PhotoDome(
        'photoDome',
        config.equirectangularUrl,
        {
          resolution: 32,
          size: 1000,
          useDirectMapping: false,
        },
        scene
      );
      photoDome.imageMode = PhotoDome.MODE_MONOSCOPIC;

      const guiManager = new GUI3DManager(scene);

      engineRef.current = engine;
      sceneRef.current = scene;
      cameraRef.current = camera;
      photoDomeRef.current = photoDome;
      guiManagerRef.current = guiManager;

      const resize = () => engine.resize();
      window.addEventListener('resize', resize);

      engine.runRenderLoop(() => {
        if (autoRotateRef.current && cameraRef.current && !isInVRRef.current) {
          const delta = Math.min(engine.getDeltaTime(), 100) / 1000;
          cameraRef.current.alpha += config.settings.autoRotateSpeed * delta;
        }
        scene.render();
      });

      const onKey = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        const cam = cameraRef.current;
        if (!cam) return;
        const step = 0.05;
        if (e.key === 'ArrowLeft') cam.alpha -= step;
        if (e.key === 'ArrowRight') cam.alpha += step;
        if (e.key === 'ArrowUp') cam.beta = Math.max(0.1, cam.beta - step);
        if (e.key === 'ArrowDown') cam.beta = Math.min(Math.PI - 0.1, cam.beta + step);
      };
      window.addEventListener('keydown', onKey);

      void checkVRSupport();

      let settled = false;
      const finishLoading = () => {
        if (!settled) {
          settled = true;
          setIsLoading(false);
        }
      };

      const timer = window.setTimeout(finishLoading, 15000);
      let rafId = 0;

      photoDome.texture.getInternalTexture()?.onErrorObservable.add(() => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        window.cancelAnimationFrame(rafId);
        setError('Failed to load the tour panorama');
        setIsLoading(false);
      });

      const awaitDome = () => {
        if (settled) return;
        if (photoDome.texture.isReady()) {
          window.clearTimeout(timer);
          finishLoading();
        } else {
          rafId = requestAnimationFrame(awaitDome);
        }
      };
      awaitDome();

      return () => {
        window.clearTimeout(timer);
        window.cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKey);
        disposeScene();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.equirectangularUrl, config.settings.initialYaw, config.settings.initialPitch, disposeScene, checkVRSupport]);

  const enterVR = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene || isInVRRef.current) return;
    try {
      let xr = xrExperienceRef.current;
      if (!xr) {
        xr = await scene.createDefaultXRExperienceAsync({
          optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor'],
        });
        xrExperienceRef.current = xr;
        xr.baseExperience.sessionManager.onXRSessionInit.add(() => setIsInVR(true));
        xr.baseExperience.sessionManager.onXRSessionEnded.add(() => setIsInVR(false));
      }
      setVrError(null);
      await xr.baseExperience.enterXRAsync('immersive-vr', 'local-floor', undefined, {
        optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor'],
      });
    } catch (err) {
      console.error('Failed to enter VR:', err);
      setVrError('Could not start VR. Make sure a headset is available, then try again.');
    }
  }, []);

  const exitVR = useCallback(async () => {
    const xr = xrExperienceRef.current;
    if (!xr) return;
    try {
      await xr.baseExperience.exitXRAsync();
      setIsInVR(false);
    } catch (err) {
      console.error('Failed to exit VR:', err);
    }
  }, []);

  const getScene = useCallback(() => sceneRef.current, []);
  const getGuiManager = useCallback(() => guiManagerRef.current, []);
  const clearVrError = useCallback(() => setVrError(null), []);

  return {
    canvasRef,
    getScene,
    getGuiManager,
    isLoading,
    error,
    vrError,
    clearVrError,
    isVRSupported,
    isInVR,
    enterVR,
    exitVR,
  };
}
