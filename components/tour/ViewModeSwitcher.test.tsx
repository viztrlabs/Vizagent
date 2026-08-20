import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TourConfig } from '@/lib/tour/types';
import { ViewModeSwitcher } from './ViewModeSwitcher';
import { TourFeatureProvider } from './TourFeatureContext';
import type { TourMode } from './ModeManager';

const testConfig: TourConfig = {
  id: 'tour-1',
  projectId: 'proj-1',
  title: 'Sunset Villa',
  settings: { floors: [], floorPlan: '' },
  scenes: [],
};

function renderSwitcher(
  config: TourConfig | null,
  onChange?: (mode: TourMode) => void
) {
  const html = renderToStaticMarkup(
    <TourFeatureProvider config={config}>
      <ViewModeSwitcher onChange={onChange} />
    </TourFeatureProvider>
  );
  return html;
}

describe('ViewModeSwitcher', () => {
  it('renders only panoramic mode when no 3D models', () => {
    const html = renderSwitcher(testConfig);
    expect(html).toContain('Panoramic');
    expect(html).not.toContain('Dollhouse');
    expect(html).not.toContain('Floor Plan');
  });

  it('renders all modes when 3D models exist', () => {
    const configWith3D: TourConfig = {
      ...testConfig,
      model3d: [{ sceneId: 'scene-1', modelUrl: 'https://example.com/model.glb' }],
    };
    const html = renderSwitcher(configWith3D);
    expect(html).toContain('Panoramic');
    expect(html).toContain('Dollhouse');
    expect(html).toContain('Floor Plan');
  });

  it('marks the default mode as active', () => {
    const html = renderSwitcher(testConfig);
    expect(html).toContain('aria-selected="true"');
  });

  it('renders nothing when config is null', () => {
    const html = renderSwitcher(null);
    expect(html).toContain('Panoramic');
  });
});
