import { describe, it, expect } from 'vitest';
import { mapTourConfig } from './map-tour-config';

const urlFor = (path: string) => `https://cdn.example/${path}`;

const imageAsset = { id: 'a1', storage_path: 'p1/a1.jpg', file_type: 'image/jpeg' };

describe('mapTourConfig', () => {
  const project = {
    id: 'p1',
    name: 'Sunset Villa',
    settings: {},
  };

  it('returns null when there are no image assets', () => {
    expect(
      mapTourConfig({
        project,
        assets: [{ id: 'a1', storage_path: 'p1/a1.glb', file_type: 'model/gltf-binary' }],
        publicUrlFor: urlFor,
      })
    ).toBeNull();
    expect(mapTourConfig({ project, assets: [], publicUrlFor: urlFor })).toBeNull();
  });

  it('maps the first image asset to the equirectangular URL', () => {
    const config = mapTourConfig({
      project,
      assets: [imageAsset],
      publicUrlFor: urlFor,
    });
    expect(config).not.toBeNull();
    expect(config!.title).toBe('Sunset Villa');
    expect(config!.equirectangularUrl).toBe('https://cdn.example/p1/a1.jpg');
    expect(config!.id).toBe('p1');
  });

  it('picks the first image asset even when GLB files come first', () => {
    const config = mapTourConfig({
      project,
      assets: [
        { id: 'a0', storage_path: 'p1/scene.glb', file_type: 'model/gltf-binary' },
        imageAsset,
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.equirectangularUrl).toBe('https://cdn.example/p1/a1.jpg');
  });

  it('applies default settings when settings are empty', () => {
    const config = mapTourConfig({
      project,
      assets: [imageAsset],
      publicUrlFor: urlFor,
    });
    expect(config!.settings).toEqual({
      autoRotate: false,
      autoRotateSpeed: 0.5,
      initialYaw: -Math.PI / 2,
      initialPitch: 0,
    });
  });

  it('parses settings stored as a JSON string', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: JSON.stringify({ autoRotate: true, autoRotateSpeed: 1.2, initialYaw: 0, initialPitch: 0.1 }),
      },
      assets: [imageAsset],
      publicUrlFor: urlFor,
    });
    expect(config!.settings.autoRotate).toBe(true);
    expect(config!.settings.autoRotateSpeed).toBe(1.2);
    expect(config!.settings.initialPitch).toBe(0.1);
  });

  it('normalizes hotspots and drops malformed entries', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: {
          hotspots: [
            { id: 'h1', label: 'Kitchen', yaw: 0, pitch: 0, description: 'Full remodel' },
            { id: 'bad' },
            { id: 'h2', label: 'Garden', yaw: 1.2, pitch: -0.3, url: 'https://example.com' },
          ],
        },
      },
      assets: [imageAsset],
      publicUrlFor: urlFor,
    });
    expect(config!.hotspots).toHaveLength(2);
    expect(config!.hotspots[0]).toEqual({
      id: 'h1',
      label: 'Kitchen',
      yaw: 0,
      pitch: 0,
      description: 'Full remodel',
    });
    expect(config!.hotspots[1].url).toBe('https://example.com');
  });
});
