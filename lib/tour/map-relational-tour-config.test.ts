import { describe, it, expect } from 'vitest';
import { mapRelationalTourConfig } from './map-relational-tour-config';

const project = {
  id: 'proj-1',
  name: 'Ocean View Villa',
  description: 'A luxury villa tour',
  viewCount: 42,
  settings: { autoRotate: true, hotspotStyle: 'pin' },
};

const scene = (overrides: Record<string, unknown> = {}) => ({
  id: 'scene-1',
  project_id: 'proj-1',
  title: 'Living Room',
  equirectangular_url: 'https://cdn.example.com/living-room.jpg',
  sort_order: 0,
  floor_id: null,
  hotspots: [],
  ...overrides,
});

describe('mapRelationalTourConfig', () => {
  it('maps project metadata into TourConfig', () => {
    const config = mapRelationalTourConfig({
      project,
      scenes: [scene()],
      floors: [],
      walkthroughs: [],
    });

    expect(config.id).toBe('proj-1');
    expect(config.projectId).toBe('proj-1');
    expect(config.title).toBe('Ocean View Villa');
    expect(config.description).toBe('A luxury villa tour');
    expect(config.viewCount).toBe(42);
    expect(config.settings.autoRotate).toBe(true);
    expect(config.settings.hotspotStyle).toBe('pin');
    expect(config.settings.floors).toEqual([]);
  });

  it('maps scenes with equirectangular URL and sort order', () => {
    const config = mapRelationalTourConfig({
      project,
      scenes: [
        scene(),
        scene({ id: 'scene-2', title: 'Kitchen', equirectangular_url: 'https://cdn.example.com/kitchen.jpg', sort_order: 1 }),
      ],
      floors: [],
      walkthroughs: [],
    });

    expect(config.scenes).toHaveLength(2);
    expect(config.scenes[0]).toMatchObject({
      id: 'scene-1',
      projectId: 'proj-1',
      title: 'Living Room',
      equirectangularUrl: 'https://cdn.example.com/living-room.jpg',
      sortOrder: 0,
      floorId: null,
    });
    expect(config.scenes[1].sortOrder).toBe(1);
  });

  it('maps initial view and floor plan position when present', () => {
    const config = mapRelationalTourConfig({
      project,
      scenes: [
        scene({
          initial_view: { yaw: 1.2, pitch: 0.3, fov: 1.0 },
          floor_plan_position: { x: 10, y: 20 },
        }),
      ],
      floors: [],
      walkthroughs: [],
    });

    expect(config.scenes[0].initialView).toEqual({ yaw: 1.2, pitch: 0.3, fov: 1.0 });
    expect(config.scenes[0].floorPlanPosition).toEqual({ x: 10, y: 20 });
  });

  it('omits invalid initial view', () => {
    const config = mapRelationalTourConfig({
      project,
      scenes: [scene({ initial_view: 'not-a-view' })],
      floors: [],
      walkthroughs: [],
    });

    expect(config.scenes[0].initialView).toBeUndefined();
  });

  it('maps hotspots with normalized hotspotType', () => {
    const config = mapRelationalTourConfig({
      project,
      scenes: [
        scene({
          hotspots: [
            {
              id: 'h-1',
              scene_id: 'scene-1',
              type: 'navigation',
              label: 'Go to kitchen',
              yaw: 0.5,
              pitch: -0.2,
              target_scene_id: 'scene-2',
              url: null,
              gallery_id: null,
            },
            {
              id: 'h-2',
              scene_id: 'scene-1',
              type: 'info',
              label: 'Website',
              yaw: 1.0,
              pitch: 0.1,
              target_scene_id: null,
              url: 'https://example.com',
              gallery_id: null,
            },
            {
              id: 'h-3',
              scene_id: 'scene-1',
              type: 'unknown-type',
              label: 'Fallback',
              yaw: 2.0,
              pitch: 0.0,
              target_scene_id: null,
              url: null,
              gallery_id: null,
            },
          ],
        }),
      ],
      floors: [],
      walkthroughs: [],
    });

    const hotspots = config.scenes[0].hotspots;
    expect(hotspots).toHaveLength(3);
    expect(hotspots[0]).toMatchObject({
      id: 'h-1',
      sceneId: 'scene-1',
      hotspotType: 'navigation',
      label: 'Go to kitchen',
      yaw: 0.5,
      pitch: -0.2,
      targetSceneId: 'scene-2',
    });
    expect(hotspots[1].hotspotType).toBe('info');
    expect(hotspots[1].url).toBe('https://example.com');
    expect(hotspots[2].hotspotType).toBe('info');
  });

  it('maps floors with sceneIds from floorId links', () => {
    const config = mapRelationalTourConfig({
      project,
      scenes: [
        scene(),
        scene({ id: 'scene-2', title: 'Kitchen', sort_order: 1, floor_id: 'floor-1' }),
        scene({ id: 'scene-3', title: 'Office', sort_order: 2, floor_id: 'floor-2' }),
      ],
      floors: [
        { id: 'floor-1', project_id: 'proj-1', name: 'First Floor', level: 1, sort_order: 0, svg_path: '/plan-1.svg' },
        { id: 'floor-2', project_id: 'proj-1', name: 'Second Floor', level: 2, sort_order: 1, svg_path: null },
      ],
      walkthroughs: [],
    });

    expect(config.floors).toHaveLength(2);
    expect(config.floors?.[0]).toMatchObject({
      id: 'floor-1',
      name: 'First Floor',
      level: 1,
      sortOrder: 0,
      svgPath: '/plan-1.svg',
      sceneIds: ['scene-2'],
    });
    expect(config.floors?.[1].sceneIds).toEqual(['scene-3']);
    // settings.floors feeds the FloorSelector (id/name/order)
    expect(config.settings.floors).toEqual([
      { id: 'floor-1', name: 'First Floor', order: 1 },
      { id: 'floor-2', name: 'Second Floor', order: 2 },
    ]);
  });

  it('maps walkthroughs', () => {
    const config = mapRelationalTourConfig({
      project,
      scenes: [scene()],
      floors: [],
      walkthroughs: [
        {
          id: 'wt-1',
          project_id: 'proj-1',
          title: 'Full Walkthrough',
          path: [{ sceneId: 'scene-1', targetView: { yaw: 0, pitch: 0 }, durationMs: 3000 }],
          active: true,
        },
      ],
    });

    expect(config.walkthroughs).toHaveLength(1);
    expect(config.walkthroughs?.[0]).toMatchObject({
      id: 'wt-1',
      title: 'Full Walkthrough',
      active: true,
    });
  });

  it('returns empty arrays for missing relational data', () => {
    const config = mapRelationalTourConfig({ project, scenes: [], floors: [], walkthroughs: [] });
    expect(config.scenes).toEqual([]);
    expect(config.floors).toBeUndefined();
    expect(config.walkthroughs).toBeUndefined();
  });

  it('parses string settings JSON', () => {
    const config = mapRelationalTourConfig({
      project: { ...project, settings: JSON.stringify({ autoRotate: false }) },
      scenes: [scene()],
      floors: [],
      walkthroughs: [],
    });

    expect(config.settings.autoRotate).toBe(false);
  });
});