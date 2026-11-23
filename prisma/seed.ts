import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'admin@viztr.io' },
    update: {},
    create: {
      email: 'admin@viztr.io',
      name: 'Admin User',
      role: 'admin',
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
    },
  });

  console.log('Seed data created successfully!');
  console.log({ user, project, xrAsset });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
