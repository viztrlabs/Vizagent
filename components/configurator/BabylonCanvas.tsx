'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4 } from '@babylonjs/core';
import { useConfiguratorStore } from '@/lib/store/configurator-store';

interface BabylonCanvasProps {
  modelUrl?: string;
  className?: string;
}

export function BabylonCanvas({ modelUrl, className }: BabylonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  const config = useConfiguratorStore((s) => s.config);
  const undo = useConfiguratorStore((s) => s.undo);
  const redo = useConfiguratorStore((s) => s.redo);
  const saveConfig = useConfiguratorStore((s) => s.saveConfig);

  const initScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Scene settings from config
    if (config) {
      scene.clearColor = Color4.FromHexString(config.scene.bg + 'ff');
      scene.imageProcessingConfiguration.exposure = config.scene.exposure;
    }

    // Camera
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2,
      5,
      new Vector3(0, 1.7, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 20;
    camera.wheelDeltaPercentage = 0.01;

    // Default light
    const light = new HemisphericLight('light', new Vector3(0, 10, 0), scene);
    light.intensity = 0.8;
    light.diffuse = Color3.White();

    // Load model if provided
    if (modelUrl) {
      const { SceneLoader } = await import('@babylonjs/core/Loading/sceneLoader');
      await SceneLoader.AppendAsync('', modelUrl, scene);
    }

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize handler
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, [config, modelUrl]);

  useEffect(() => {
    const cleanup = initScene();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [initScene]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveConfig();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveConfig]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
    />
  );
}