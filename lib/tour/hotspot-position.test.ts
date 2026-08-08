import { describe, it, expect } from 'vitest';
import { hotspotPosition } from './hotspot-position';

describe('hotspotPosition', () => {
  it('places a hotspot at the forward direction for yaw=0, pitch=0', () => {
    expect(hotspotPosition(0, 0, 1)).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('rotates +90° around Y for yaw=PI/2', () => {
    const p = hotspotPosition(Math.PI / 2, 0, 1);
    expect(p.x).toBeCloseTo(1, 5);
    expect(p.y).toBeCloseTo(0, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it('points up for pitch=PI/2', () => {
    const p = hotspotPosition(0, Math.PI / 2, 1);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBeCloseTo(1, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it('scales by radius', () => {
    const p = hotspotPosition(0, 0, 500);
    expect(p.z).toBe(500);
  });
});
