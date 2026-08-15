import { describe, it, expect } from 'vitest';
import { nextIndex, prevIndex, resolveStartScene } from './navigation';

describe('nextIndex', () => {
  it('advances within range', () => {
    expect(nextIndex(0, 3)).toBe(1);
  });

  it('wraps around at the end', () => {
    expect(nextIndex(2, 3)).toBe(0);
  });

  it('is safe for a single scene', () => {
    expect(nextIndex(0, 1)).toBe(0);
  });

  it('handles an empty list', () => {
    expect(nextIndex(0, 0)).toBe(0);
  });
});

describe('prevIndex', () => {
  it('steps back within range', () => {
    expect(prevIndex(2, 3)).toBe(1);
  });

  it('wraps around at the start', () => {
    expect(prevIndex(0, 3)).toBe(2);
  });

  it('is safe for a single scene', () => {
    expect(prevIndex(0, 1)).toBe(0);
  });

  it('handles an empty list', () => {
    expect(prevIndex(0, 0)).toBe(0);
  });
});

describe('resolveStartScene', () => {
  const scenes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('defaults to the first scene', () => {
    expect(resolveStartScene(scenes)).toBe(0);
  });

  it('resolves a matching startSceneId', () => {
    expect(resolveStartScene(scenes, 'b')).toBe(1);
  });

  it('falls back to the first scene for an unknown id', () => {
    expect(resolveStartScene(scenes, 'nope')).toBe(0);
  });

  it('is safe for an empty scene list', () => {
    expect(resolveStartScene([], 'a')).toBe(0);
  });
});
