import { describe, it, expect } from 'vitest';
import {
  MARZIPANO_YAW_OFFSET,
  DEFAULT_VIEW_FOV,
  toMarzipanoYaw,
  toMarzipanoView,
  toMarzipanoHotspotPosition,
} from './view-angle';

describe('toMarzipanoYaw', () => {
  it('adds the documented offset to the stored yaw', () => {
    expect(toMarzipanoYaw(0)).toBe(MARZIPANO_YAW_OFFSET);
    expect(toMarzipanoYaw(Math.PI / 2)).toBe(Math.PI / 2 + MARZIPANO_YAW_OFFSET);
  });
});

describe('toMarzipanoView', () => {
  it('maps yaw and passes pitch through', () => {
    expect(toMarzipanoView(0.5, -0.2)).toEqual({
      yaw: 0.5 + MARZIPANO_YAW_OFFSET,
      pitch: -0.2,
      fov: DEFAULT_VIEW_FOV,
    });
  });

  it('uses the provided fov when present', () => {
    expect(toMarzipanoView(0, 0, 1.2).fov).toBe(1.2);
  });
});

describe('toMarzipanoHotspotPosition', () => {
  it('maps yaw and keeps pitch', () => {
    expect(toMarzipanoHotspotPosition(1, 0.3)).toEqual({
      yaw: 1 + MARZIPANO_YAW_OFFSET,
      pitch: 0.3,
    });
  });
});
