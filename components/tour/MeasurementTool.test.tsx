import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MeasurementTool, calculateDistance } from './MeasurementTool';
import { TourFeatureProvider } from './TourFeatureContext';
import type { TourConfig } from '@/lib/tour/types';

const testConfig: TourConfig = {
  id: 'tour-1',
  projectId: 'proj-1',
  title: 'Test Tour',
  settings: { floors: [], floorPlan: '' },
  scenes: [],
};

function renderTool(config: TourConfig | null = testConfig) {
  return renderToStaticMarkup(
    <TourFeatureProvider config={config}>
      <MeasurementTool />
    </TourFeatureProvider>
  );
}

describe('MeasurementTool', () => {
  it('renders measure button by default', () => {
    const html = renderTool();
    expect(html).toContain('Measure');
    expect(html).toContain('role="presentation"');
  });

  it('shows measure button when not measuring', () => {
    const html = renderTool();
    expect(html).toContain('Measure');
    expect(html).not.toContain('Distance:');
  });
});

describe('calculateDistance', () => {
  it('returns zero for identical points', () => {
    const result = calculateDistance(
      { yaw: 0, pitch: 0 },
      { yaw: 0, pitch: 0 }
    );
    expect(result.distance).toBe(0);
    expect(result.unit).toBe('meters');
  });

  it('returns positive distance for different points', () => {
    const result = calculateDistance(
      { yaw: 0, pitch: 0 },
      { yaw: 0.5, pitch: 0.3 }
    );
    expect(result.distance).toBeGreaterThan(0);
  });

  it('returns symmetric results', () => {
    const a = { yaw: 0.5, pitch: 0.3 };
    const b = { yaw: 1.2, pitch: -0.4 };
    const result1 = calculateDistance(a, b);
    const result2 = calculateDistance(b, a);
    expect(result1.distance).toBeCloseTo(result2.distance, 10);
  });
});
