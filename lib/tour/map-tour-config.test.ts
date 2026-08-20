import { describe, it, expect } from 'vitest';
import { mapTourConfig, type MapTourConfigInputAsset } from './map-tour-config';

const urlFor = (path: string) => `https://cdn.example/${path}`;

const asset = (overrides: Partial<MapTourConfigInputAsset> = {}): MapTourConfigInputAsset => ({
  id: 'a1',
  storage_path: 'p1/a1.jpg',
  file_type: 'image/jpeg',
  file_name: 'a1.jpg',
  ...overrides,
});

const project = {
  id: 'p1',
  name: 'Sunset Villa',
  settings: {},
};

describe('mapTourConfig', () => {
  it('returns null when there are no image assets', () => {
    expect(
      mapTourConfig({
        project,
        assets: [asset({ file_type: 'model/gltf-binary', storage_path: 'p1/s.glb' })],
        publicUrlFor: urlFor,
      })
    ).toBeNull();
    expect(mapTourConfig({ project, assets: [], publicUrlFor: urlFor })).toBeNull();
  });

  it('maps a single image asset to one scene using file_name for the title', () => {
    const config = mapTourConfig({ project, assets: [asset()], publicUrlFor: urlFor });
    expect(config).not.toBeNull();
    expect(config!.title).toBe('Sunset Villa');
    expect(config!.scenes).toHaveLength(1);
    expect(config!.scenes[0]).toMatchObject({
      id: 'a1',
      title: 'a1',
      equirectangularUrl: 'https://cdn.example/p1/a1.jpg',
      hotspots: [],
    });
  });

  it('prefers metadata.title over file_name and strips the extension from file_name', () => {
    const config = mapTourConfig({
      project,
      assets: [
        asset({
          file_name: 'living-room.jpg',
          metadata: { title: 'Open Living Room' },
        }),
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].title).toBe('Open Living Room');

    const fallback = mapTourConfig({
      project,
      assets: [asset({ file_name: 'living-room.jpg' })],
      publicUrlFor: urlFor,
    });
    expect(fallback!.scenes[0].title).toBe('living-room');
  });

  it('orders scenes by metadata.order and falls back to the input (created_at/id) order', () => {
    const config = mapTourConfig({
      project,
      assets: [
        asset({ id: 'kitchen', metadata: { order: 2 } }),
        asset({ id: 'bedroom', metadata: { order: 0 } }),
        asset({ id: 'garden' }),
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes.map((s) => s.id)).toEqual(['bedroom', 'kitchen', 'garden']);
  });

  it('reads initialView from asset metadata', () => {
    const config = mapTourConfig({
      project,
      assets: [asset({ metadata: { initialView: { yaw: 1.2, pitch: -0.4, fov: 0.8 } } })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].initialView).toEqual({ yaw: 1.2, pitch: -0.4, fov: 0.8 });
  });

  it('drops a malformed initialView (missing numeric yaw/pitch) on non-first scenes', () => {
    const config = mapTourConfig({
      project,
      assets: [
        asset({ id: 'a' }),
        asset({ id: 'b', metadata: { initialView: { yaw: 'x' } } }),
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].initialView).toEqual({ yaw: -Math.PI / 2, pitch: 0 });
    expect(config!.scenes[1].initialView).toBeUndefined();
  });

  it('applies legacy initialYaw/initialPitch to the first scene only', () => {
    const config = mapTourConfig({
      project,
      assets: [asset({ id: 'a' }), asset({ id: 'b' })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].initialView).toEqual({
      yaw: -Math.PI / 2,
      pitch: 0,
    });
    expect(config!.scenes[1].initialView).toBeUndefined();
  });

  it('lets per-scene initialView win over the legacy fallback on the first scene', () => {
    const config = mapTourConfig({
      project,
      assets: [asset({ metadata: { initialView: { yaw: 0, pitch: 0.1 } } })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].initialView).toEqual({ yaw: 0, pitch: 0.1 });
  });

  it('normalizes metadata hotspots, filters unsafe urls, and validates targetSceneId', () => {
    const config = mapTourConfig({
      project,
      assets: [
        asset({
          id: 'a',
          metadata: {
            hotspots: [
              { id: 'h1', label: 'Kitchen', yaw: 0, pitch: 0, description: 'Remodel' },
              { id: 'bad' },
              { id: 'h2', label: 'Garden', yaw: 1, pitch: 0.2, url: 'javascript:alert(1)', targetSceneId: 'b' },
              { id: 'h3', label: 'Hall', yaw: 2, pitch: 0.1, url: 'https://ok.example', targetSceneId: 'nope' },
            ],
          },
        }),
        asset({ id: 'b' }),
      ],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].hotspots).toHaveLength(3);
    expect(config!.scenes[0].hotspots[0]).toMatchObject({
      id: 'h1',
      label: 'Kitchen',
      yaw: 0,
      pitch: 0,
      description: 'Remodel',
    });
    expect(config!.scenes[0].hotspots[0].sceneId).toBe('a');
    expect(config!.scenes[0].hotspots[0].hotspotType).toBe('info');
    expect(config!.scenes[0].hotspots[0].url).toBeUndefined();
    expect(config!.scenes[0].hotspots[0].targetSceneId).toBeUndefined();
    expect(config!.scenes[0].hotspots[1].url).toBeUndefined();
    expect(config!.scenes[0].hotspots[1].targetSceneId).toBe('b');
    expect(config!.scenes[0].hotspots[2].url).toBe('https://ok.example');
    expect(config!.scenes[0].hotspots[2].targetSceneId).toBeUndefined();
  });

  it('applies legacy flat settings.hotspots to the first scene when no scene defines hotspots', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: {
          hotspots: [
            { id: 'legacy1', label: 'Pool', yaw: 0.5, pitch: -0.1, url: 'https://pool.example' },
          ],
        },
      },
      assets: [asset({ id: 'a' }), asset({ id: 'b' })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].hotspots).toHaveLength(1);
    expect(config!.scenes[0].hotspots[0].id).toBe('legacy1');
    expect(config!.scenes[1].hotspots).toHaveLength(0);
  });

  it('does not apply legacy flat hotspots when a scene already has hotspots', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: { hotspots: [{ id: 'legacy1', label: 'Pool', yaw: 0, pitch: 0 }] },
      },
      assets: [asset({ metadata: { hotspots: [{ id: 'own', label: 'Own', yaw: 0, pitch: 0 }] } })],
      publicUrlFor: urlFor,
    });
    expect(config!.scenes[0].hotspots.map((h) => h.id)).toEqual(['own']);
  });

  it('applies settings defaults', () => {
    const config = mapTourConfig({ project, assets: [asset()], publicUrlFor: urlFor });
    expect(config!.settings).toEqual({
      autoRotate: false,
      autoRotateSpeed: 0.5,
      hotspotStyle: 'pin',
      startSceneId: undefined,
    });
  });

  it('parses settings from a JSON string and honors hotspotStyle/startSceneId', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: JSON.stringify({
          autoRotate: true,
          autoRotateSpeed: 1.2,
          hotspotStyle: 'minimal',
          startSceneId: 'b',
        }),
      },
      assets: [asset({ id: 'a' }), asset({ id: 'b' })],
      publicUrlFor: urlFor,
    });
    expect(config!.settings.autoRotate).toBe(true);
    expect(config!.settings.autoRotateSpeed).toBe(1.2);
    expect(config!.settings.hotspotStyle).toBe('minimal');
    expect(config!.settings.startSceneId).toBe('b');
  });

  it('drops startSceneId that does not match any scene', () => {
    const config = mapTourConfig({
      project: {
        id: 'p1',
        name: 'Sunset Villa',
        settings: { startSceneId: 'missing' },
      },
      assets: [asset({ id: 'a' })],
      publicUrlFor: urlFor,
    });
    expect(config!.settings.startSceneId).toBeUndefined();
  });
});
