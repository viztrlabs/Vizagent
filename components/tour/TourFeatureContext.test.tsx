import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import type { TourConfig } from '@/lib/tour/types';
import { DEFAULT_VIEW_FOV } from '@/lib/tour/view-angle';
import {
  TourFeatureProvider,
  useTourFeature,
  type TourFeatureContextType,
} from './TourFeatureContext';

const testConfig: TourConfig = {
  id: 'tour-1',
  projectId: 'proj-1',
  title: 'Sunset Villa',
  settings: {
    floors: [{ id: 'f1', name: 'Ground', order: 0 }],
    startSceneId: 'scene-1',
  },
  scenes: [
    {
      id: 'scene-1',
      projectId: 'proj-1',
      title: 'Living Room',
      equirectangularUrl: 'https://cdn.example/living.jpg',
      sortOrder: 0,
      hotspots: [],
    },
  ],
};

/** Renders the current context values into visible text for assertions. */
function Probe(): ReactElement {
  const ctx = useTourFeature();
  return (
    <div>
      <span data-testid="config-title">{ctx.config?.title ?? 'null'}</span>
      <span data-testid="active-scene">{ctx.activeSceneId ?? 'null'}</span>
      <span data-testid="heading">
        {ctx.cameraHeading.yaw},{ctx.cameraHeading.pitch},{ctx.cameraHeading.fov}
      </span>
      <span data-testid="active-floor">{ctx.activeFloorId ?? 'null'}</span>
      <span data-testid="auth">{String(ctx.isAuthenticated)}</span>
    </div>
  );
}

describe('TourFeatureContext', () => {
  it('throws when useTourFeature is used outside the provider', () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      'useTourFeature must be used within TourFeatureProvider'
    );
  });

  it('provides default values when no config or props are given', () => {
    const html = renderToStaticMarkup(
      <TourFeatureProvider>
        <Probe />
      </TourFeatureProvider>
    );

    expect(html).toContain('data-testid="config-title">null</span>');
    expect(html).toContain('data-testid="active-scene">null</span>');
    expect(html).toContain(
      `data-testid="heading">0,0,${DEFAULT_VIEW_FOV}</span>`
    );
    expect(html).toContain('data-testid="active-floor">null</span>');
    expect(html).toContain('data-testid="auth">false</span>');
  });

  it('exposes the provided config and authentication state to consumers', () => {
    const html = renderToStaticMarkup(
      <TourFeatureProvider config={testConfig} isAuthenticated>
        <Probe />
      </TourFeatureProvider>
    );

    expect(html).toContain('data-testid="config-title">Sunset Villa</span>');
    expect(html).toContain('data-testid="active-scene">null</span>');
    expect(html).toContain('data-testid="active-floor">null</span>');
    expect(html).toContain('data-testid="auth">true</span>');
  });

  it('wires all state setters into the context value', () => {
    const captured: { current: TourFeatureContextType | null } = {
      current: null,
    };
    function Capture(): ReactElement {
      captured.current = useTourFeature();
      return <span />;
    }
    renderToStaticMarkup(
      <TourFeatureProvider>
        <Capture />
      </TourFeatureProvider>
    );

    expect(captured.current).not.toBeNull();
    expect(typeof captured.current?.setActiveScene).toBe('function');
    expect(typeof captured.current?.setCameraHeading).toBe('function');
    expect(typeof captured.current?.setActiveFloor).toBe('function');
  });
});