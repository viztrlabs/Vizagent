import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'admin@viztr.io' },
    update: {},
    create: {
      email: 'admin@viztr.io',
      name: 'Admin User',
      role: 'ADMIN',
      tenantId: DEFAULT_TENANT_ID,
    },
  });

  // Create a test project
  const project = await prisma.project.upsert({
    where: { id: 'test-project-001' },
    update: {},
    create: {
      id: 'test-project-001',
      name: 'Modern Villa Showcase',
      description: 'A luxury modern villa with panoramic views',
      clientId: user.id,
      serviceType: 'tour',
      status: 'draft',
      settings: JSON.stringify({
        cameraHeight: 1.7,
        autoRotate: false,
        hotspotStyle: 'pin',
      }),
      tenantId: DEFAULT_TENANT_ID,
    },
  });

  // Create an XR asset
  const xrAsset = await prisma.xrAsset.upsert({
    where: { id: 'test-xr-asset-001' },
    update: {},
    create: {
      id: 'test-xr-asset-001',
      projectId: project.id,
      type: 'model3d',
      service: 'webXR',
      tenantId: DEFAULT_TENANT_ID,
    },
  });

  // Create a default configuration
  await prisma.configuration.upsert({
    where: { xrAssetId_name: { xrAssetId: xrAsset.id, name: 'default' } },
    update: {},
    create: {
      xrAssetId: xrAsset.id,
      name: 'default',
      data: JSON.stringify({
        scene: { bg: '#080a0f', exposure: 1.0, toneMapping: 'ACES', environment: 'studio' },
        materials: [],
        objects: [],
        lights: [{
          id: 'default-hemisphere',
          name: 'Hemisphere Light',
          enabled: true,
          type: 'hemisphere',
          color: '#ffffff',
          intensity: 0.8,
          position: [0, 10, 0],
          castShadow: false,
        }],
        camera: { position: [0, 1.7, 5], target: [0, 1.7, 0], fov: 60 },
      }),
      tenantId: DEFAULT_TENANT_ID,
    },
  });

  // Create a configurator session
  await prisma.configuratorSession.create({
    data: {
      projectId: project.id,
      hostId: user.email,
      config: '{}',
      shareToken: 'test-session-token-001',
      startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      tenantId: DEFAULT_TENANT_ID,
    },
  });

  // Seed a published sample tour used by the public viewer and E2E tests
  const tourProject = await prisma.project.upsert({
    where: { id: 'sample-tour-id' },
    update: {
      status: 'published',
      settings: JSON.stringify({
        cameraHeight: 1.7,
        autoRotate: false,
        hotspotStyle: 'pin',
        startSceneId: 'scene-living',
      }),
    },
    create: {
      id: 'sample-tour-id',
      name: 'Sample Ocean Villa',
      description: 'A sample published virtual tour used for E2E verification.',
      clientId: user.id,
      serviceType: 'tour',
      status: 'published',
      settings: JSON.stringify({
        cameraHeight: 1.7,
        autoRotate: false,
        hotspotStyle: 'pin',
        startSceneId: 'scene-living',
      }),
      tenantId: DEFAULT_TENANT_ID,
    },
  });

  const floorOne = await prisma.tourFloor.upsert({
    where: { id: 'floor-1' },
    update: {},
    create: {
      id: 'floor-1',
      projectId: tourProject.id,
      name: 'First Floor',
      level: 1,
      sortOrder: 0,
      svgPath: '/floors/floor-1.svg',
    },
  });
  const floorTwo = await prisma.tourFloor.upsert({
    where: { id: 'floor-2' },
    update: {},
    create: {
      id: 'floor-2',
      projectId: tourProject.id,
      name: 'Second Floor',
      level: 2,
      sortOrder: 1,
      svgPath: '/floors/floor-2.svg',
    },
  });

  const scenes = [
    {
      id: 'scene-living',
      floorId: floorOne.id,
      title: 'Living Room',
      equirectangularUrl:
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
      initialView: JSON.stringify({ yaw: 0.5, pitch: 0, fov: 1.1 }),
      floorPlanPosition: JSON.stringify({ x: 40, y: 60 }),
      sortOrder: 0,
    },
    {
      id: 'scene-kitchen',
      floorId: floorOne.id,
      title: 'Kitchen',
      equirectangularUrl:
        'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&q=80',
      initialView: JSON.stringify({ yaw: 1.0, pitch: 0, fov: 1.1 }),
      floorPlanPosition: JSON.stringify({ x: 70, y: 40 }),
      sortOrder: 1,
    },
    {
      id: 'scene-balcony',
      floorId: floorTwo.id,
      title: 'Balcony',
      equirectangularUrl:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      initialView: JSON.stringify({ yaw: -0.5, pitch: 0, fov: 1.1 }),
      floorPlanPosition: JSON.stringify({ x: 50, y: 30 }),
      sortOrder: 2,
    },
  ];

  for (const scene of scenes) {
    await prisma.tourScene.upsert({
      where: { id: scene.id },
      update: {
        floorId: scene.floorId,
        equirectangularUrl: scene.equirectangularUrl,
        initialView: scene.initialView,
        floorPlanPosition: scene.floorPlanPosition,
      },
      create: {
        id: scene.id,
        projectId: tourProject.id,
        floorId: scene.floorId,
        title: scene.title,
        equirectangularUrl: scene.equirectangularUrl,
        initialView: scene.initialView,
        floorPlanPosition: scene.floorPlanPosition,
        sortOrder: scene.sortOrder,
      },
    });
  }

  const hotspots = [
    {
      id: 'hotspot-1',
      sceneId: 'scene-living',
      label: 'Go to Kitchen',
      targetSceneId: 'scene-kitchen',
    },
    {
      id: 'hotspot-2',
      sceneId: 'scene-living',
      label: 'Go to Balcony',
      targetSceneId: 'scene-balcony',
    },
    {
      id: 'hotspot-3',
      sceneId: 'scene-kitchen',
      label: 'Back to Living Room',
      targetSceneId: 'scene-living',
    },
  ];

  for (const hotspot of hotspots) {
    await prisma.tourHotspot.upsert({
      where: { id: hotspot.id },
      update: { targetSceneId: hotspot.targetSceneId },
      create: {
        id: hotspot.id,
        sceneId: hotspot.sceneId,
        hotspotType: 'navigation',
        label: hotspot.label,
        yaw: 0.8,
        pitch: 0.1,
        targetSceneId: hotspot.targetSceneId,
      },
    });
  }

  console.log('Seed data created successfully!');
  console.log({ user, project, xrAsset, tourProject });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
