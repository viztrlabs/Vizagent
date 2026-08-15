'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Marzipano from 'marzipano';
import { nextIndex, prevIndex, resolveStartScene } from './navigation';
import {
  DEFAULT_VIEW_FOV,
  MAX_VIEW_FOV,
  toMarzipanoHotspotPosition,
  toMarzipanoView,
} from '@/lib/tour/view-angle';
import type { TourConfig, TourHotspot, TourScene } from '@/lib/tour/types';

const LOAD_TIMEOUT_MS = 15000;
const SWITCH_DURATION_MS = 800;

export interface UseMarzipanoTourResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  error: string | null;
  currentSceneIndex: number;
  isPlaying: boolean;
  goToScene: (sceneId: string) => void;
  goNext: () => void;
  goPrev: () => void;
  toggleAutorotate: () => void;
}

function loadImageWidth(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth || img.width);
    img.onerror = () => reject(new Error('Failed to load panorama image'));
    img.src = url;
  });
}

export function useMarzipanoTour(config: TourConfig): UseMarzipanoTourResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);
  const sceneMapRef = useRef<Map<string, Marzipano.Scene>>(new Map());
  const switchSceneRef = useRef<(sceneId: string) => void>(() => {});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(() =>
    resolveStartScene(config.scenes, config.settings.startSceneId)
  );

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [isPlaying, setIsPlaying] = useState(
    () => config.settings.autoRotate && !prefersReducedMotion
  );

  const switchToScene = useCallback(
    (sceneId: string) => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      const scene = sceneMapRef.current.get(sceneId);
      if (!scene) return;
      const index = config.scenes.findIndex((s) => s.id === sceneId);
      if (index >= 0) setCurrentSceneIndex(index);
      scene.switchTo({ transitionDuration: SWITCH_DURATION_MS });
    },
    [config.scenes]
  );

  useEffect(() => {
    switchSceneRef.current = switchToScene;
  }, [switchToScene]);

  const goNext = useCallback(() => {
    const index = nextIndex(currentSceneIndex, config.scenes.length);
    const scene = config.scenes[index];
    if (scene) switchSceneRef.current(scene.id);
  }, [currentSceneIndex, config.scenes]);

  const goPrev = useCallback(() => {
    const index = prevIndex(currentSceneIndex, config.scenes.length);
    const scene = config.scenes[index];
    if (scene) switchSceneRef.current(scene.id);
  }, [currentSceneIndex, config.scenes]);

  const toggleAutorotate = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      const viewer = viewerRef.current;
      if (viewer) {
        if (next) {
          viewer.setIdleMovement(
            0,
            Marzipano.autorotate({ yawSpeed: config.settings.autoRotateSpeed })
          );
        } else {
          viewer.setIdleMovement(Infinity, null);
        }
      }
      return next;
    });
  }, [config.settings.autoRotateSpeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const timers: number[] = [];
    const sceneMap = new Map<string, Marzipano.Scene>();
    sceneMapRef.current = sceneMap;

    const handleLoadError = () => {
      if (!cancelled) setError('Failed to load the panorama. Please try again.');
    };

    let viewer: Marzipano.Viewer;
    try {
      viewer = new Marzipano.Viewer(container, { controls: { mouseViewMode: 'drag' } });
    } catch {
      // Defer to avoid react-hooks/set-state-in-effect for synchronous throws.
      window.setTimeout(
        () => setError('Your browser does not support WebGL, which is required for the tour.'),
        0
      );
      return;
    }
    viewerRef.current = viewer;

    timers.push(window.setTimeout(() => setIsLoading(false), LOAD_TIMEOUT_MS));

    const startIndex = resolveStartScene(config.scenes, config.settings.startSceneId);
    const startSceneId = config.scenes[startIndex]?.id;

    const createHotspotElement = (hotspot: TourHotspot): HTMLElement => {
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', hotspot.label);
      el.style.position = 'absolute';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = 'none';
      el.style.padding = '0';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.5)';
      if (config.settings.hotspotStyle === 'minimal') {
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.background = '#06b6d4';
      } else {
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.background = '#0d9488';
        el.style.border = '3px solid rgba(255, 255, 255, 0.9)';
      }
      el.addEventListener('click', () => {
        if (hotspot.targetSceneId) {
          switchSceneRef.current(hotspot.targetSceneId);
        } else if (hotspot.url) {
          window.open(hotspot.url, '_blank', 'noopener,noreferrer');
        }
      });
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          el.click();
        }
      });
      return el;
    };

    const createHotspots = (scene: Marzipano.Scene, hotspots: TourHotspot[]) => {
      const hotspotContainer = scene.hotspotContainer();
      for (const hotspot of hotspots) {
        const position = toMarzipanoHotspotPosition(hotspot.yaw, hotspot.pitch);
        hotspotContainer.createHotspot(createHotspotElement(hotspot), position);
      }
    };

    const createSceneFor = async (tourScene: TourScene) => {
      const isStart = tourScene.id === startSceneId;

      let width: number;
      try {
        width = await loadImageWidth(tourScene.equirectangularUrl);
      } catch {
        handleLoadError();
        return;
      }
      if (cancelled) return;

      const source = Marzipano.ImageUrlSource.fromString(tourScene.equirectangularUrl);
      const geometry = new Marzipano.EquirectGeometry([{ width }]);
      const initialView = toMarzipanoView(
        tourScene.initialView?.yaw ?? 0,
        tourScene.initialView?.pitch ?? 0,
        tourScene.initialView?.fov
      );
      const limiter = Marzipano.RectilinearView.limit.traditional(width, MAX_VIEW_FOV);
      const view = new Marzipano.RectilinearView(initialView, limiter);
      const scene = viewer.createScene({ source, geometry, view, pinFirstLevel: true });

      sceneMap.set(tourScene.id, scene);

      const layer = scene.listLayers()[0];
      layer?.textureStore().addEventListener('textureError', handleLoadError);
      if (isStart) {
        layer?.addEventListener('renderComplete', () => {
          if (!cancelled) setIsLoading(false);
        });
        scene.switchTo({ transitionDuration: 0 });
      }

      createHotspots(scene, tourScene.hotspots);
    };

    config.scenes.forEach((tourScene) => {
      void createSceneFor(tourScene);
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      viewer.destroy();
      viewerRef.current = null;
      sceneMapRef.current = new Map();
    };
  }, [config]);

  return {
    containerRef,
    isLoading,
    error,
    currentSceneIndex,
    isPlaying,
    goToScene: switchToScene,
    goNext,
    goPrev,
    toggleAutorotate,
  };
}
