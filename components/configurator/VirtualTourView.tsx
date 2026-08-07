'use client';

import { memo, useRef, useEffect } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4, MeshBuilder, StandardMaterial, Texture } from '@babylonjs/core';

interface VirtualTourViewProps {
  equirectUrl: string;
  className?: string;
  hotspots?: Array<{ id: string; position: [number, number, number]; label: string }>;
  onHotspotClick?: (id: string) => void;
}

export const VirtualTourView = memo(function VirtualTourView({ equirectUrl, className, hotspots = [], onHotspotClick }: VirtualTourViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color4(0.03, 0.04, 0.06, 1);

    const camera = new ArcRotateCamera(
      'tourCamera',
      0,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 0.1;
    camera.upperRadiusLimit = 100;
    camera.wheelDeltaPercentage = 0.01;
    camera.inertia = 0.7;
    camera.angularSensibilityX = 2000;
    camera.angularSensibilityY = 2000;

    const light = new HemisphericLight('tourLight', new Vector3(0, 1, 0), scene);
    light.intensity = 0.3;
    light.diffuse = Color3.White();

    const sphere = MeshBuilder.CreateSphere('tourSphere', { diameter: 10, sideOrientation: 2 }, scene);
    const material = new StandardMaterial('tourMat', scene);
    material.backFaceCulling = false;
    material.disableLighting = true;
    material.emissiveColor = Color3.White();

    if (equirectUrl) {
      const texture = new Texture(equirectUrl, scene, true, false);
      material.diffuseTexture = texture;
      material.emissiveTexture = texture;
    }
    sphere.material = material;

    for (const hotspot of hotspots) {
      const hotspotMesh = MeshBuilder.CreateSphere(`hotspot-${hotspot.id}`, { diameter: 0.15 }, scene);
      hotspotMesh.position = new Vector3(...hotspot.position);
      const hotspotMat = new StandardMaterial(`hotspotMat-${hotspot.id}`, scene);
      hotspotMat.diffuseColor = new Color3(0, 0.9, 1);
      hotspotMat.emissiveColor = new Color3(0, 0.9, 1);
      hotspotMesh.material = hotspotMat;

      if (onHotspotClick) {
        hotspotMesh.actionManager = scene.actionManager;
        hotspotMesh.metadata = { hotspotId: hotspot.id };
      }
    }

    engine.runRenderLoop(() => scene.render());

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, [equirectUrl, hotspots, onHotspotClick]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
    />
  );
});
