'use client';

import { useEffect } from 'react';
import { Mesh } from '@babylonjs/core';
import {
  GUI3DManager,
  HolographicButton,
  AdvancedDynamicTexture,
  TextBlock,
} from '@babylonjs/gui';
import { hotspotPosition } from '@/lib/tour/hotspot-position';
import type { TourHotspot } from '@/lib/tour/types';

interface HotspotMarkerProps {
  hotspot: TourHotspot;
  getGuiManager: () => GUI3DManager | null;
  onSelect: (hotspot: TourHotspot) => void;
}

export function HotspotMarker({ hotspot, getGuiManager, onSelect }: HotspotMarkerProps) {
  useEffect(() => {
    let button: HolographicButton | null = null;
    let rafId = 0;
    let disposed = false;

    const create = () => {
      if (disposed) return;
      const manager = getGuiManager();
      if (!manager) {
        rafId = requestAnimationFrame(create);
        return;
      }

      button = new HolographicButton(`hotspot-${hotspot.id}`);
      const mesh = button.mesh;
      if (!mesh) {
        button.dispose();
        button = null;
        return;
      }
      mesh.scaling.setAll(0.15);
      const pos = hotspotPosition(hotspot.yaw, hotspot.pitch, 350);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;

      const texture = AdvancedDynamicTexture.CreateForMesh(mesh, 256, 256);
      const label = new TextBlock();
      label.text = hotspot.label;
      label.color = 'white';
      label.fontSize = 24;
      label.textWrapping = true;
      texture.addControl(label);

      const onPointer = () => onSelect(hotspot);
      button!.onPointerUpObservable.add(onPointer);
      manager.addControl(button);
    };

    create();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      if (button) {
        button.dispose();
      }
    };
  }, [hotspot, getGuiManager, onSelect]);

  return null;
}
