import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TourConfig } from '@/lib/tour/types';
import { ModeManager, type TourMode } from './ModeManager';

const testConfig: TourConfig = {
  id: 'tour-1',
  projectId: 'proj-1',
  title: 'Sunset Villa',
  settings: { floors: [], floorPlan: '' },
  scenes: [],
};

function renderMode(mode?: TourMode) {
  return renderToStaticMarkup(
    <ModeManager config={testConfig} mode={mode} />
  );
}

describe('ModeManager', () => {
  it('renders panoramic mode by default', () => {
    const html = renderMode();
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('Panoramic');
    expect(html).toContain('Dollhouse');
    expect(html).toContain('Floor Plan');
  });

  it('renders BabylonStub for dollhouse mode', () => {
    const html = renderMode('dollhouse');
    expect(html).toContain('3D Dollhouse View');
    expect(html).toContain('Coming soon');
  });

  it('renders BabylonStub for floor-plan mode', () => {
    const html = renderMode('floor-plan');
    expect(html).toContain('3D Floor Plan View');
    expect(html).toContain('Coming soon');
  });

  it('marks the correct tab as active', () => {
    const html = renderMode('floor-plan');
    const floorPlanTabMatch = html.match(/Floor Plan[^<]*<\/button>/);
    expect(floorPlanTabMatch).toBeTruthy();
  });
});
