'use client';

import { useRef, useState } from 'react';
import type { Scene } from '@babylonjs/core';

export function useBabylonScene() {
  const sceneRef = useRef<Scene | null>(null);
  const [isReady] = useState(false);
  return { isReady, sceneRef };
}
