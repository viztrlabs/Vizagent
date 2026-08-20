'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { TourConfig } from '@/lib/tour/types';
import { DEFAULT_VIEW_FOV } from '@/lib/tour/view-angle';

export interface CameraHeading {
  yaw: number;
  pitch: number;
  fov: number;
}

export interface TourFeatureContextType {
  config: TourConfig | null;
  activeSceneId: string | null;
  cameraHeading: CameraHeading;
  activeFloorId: string | null;
  isAuthenticated: boolean;
  setActiveScene: (id: string) => void;
  setCameraHeading: (heading: CameraHeading) => void;
  setActiveFloor: (id: string | null) => void;
}

const DEFAULT_CAMERA_HEADING: CameraHeading = {
  yaw: 0,
  pitch: 0,
  fov: DEFAULT_VIEW_FOV,
};

const TourFeatureContext = createContext<TourFeatureContextType | null>(null);

interface TourFeatureProviderProps {
  config?: TourConfig | null;
  isAuthenticated?: boolean;
  children: ReactNode;
}

export function TourFeatureProvider({
  config = null,
  isAuthenticated = false,
  children,
}: TourFeatureProviderProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [cameraHeading, setCameraHeadingState] =
    useState<CameraHeading>(DEFAULT_CAMERA_HEADING);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);

  const setActiveScene = useCallback((id: string) => setActiveSceneId(id), []);
  const setCameraHeading = useCallback(
    (heading: CameraHeading) => setCameraHeadingState(heading),
    []
  );
  const setActiveFloor = useCallback(
    (id: string | null) => setActiveFloorId(id),
    []
  );

  const value = useMemo<TourFeatureContextType>(
    () => ({
      config,
      activeSceneId,
      cameraHeading,
      activeFloorId,
      isAuthenticated,
      setActiveScene,
      setCameraHeading,
      setActiveFloor,
    }),
    [
      config,
      activeSceneId,
      cameraHeading,
      activeFloorId,
      isAuthenticated,
      setActiveScene,
      setCameraHeading,
      setActiveFloor,
    ]
  );

  return (
    <TourFeatureContext.Provider value={value}>
      {children}
    </TourFeatureContext.Provider>
  );
}

export function useTourFeature(): TourFeatureContextType {
  const ctx = useContext(TourFeatureContext);
  if (!ctx) {
    throw new Error('useTourFeature must be used within TourFeatureProvider');
  }
  return ctx;
}

export { TourFeatureContext };