import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    // Check if demo user exists
    const existing = await prisma.user.findUnique({
      where: { id: 'demo-user' }
    });

    if (existing) {
      console.log('Demo user already exists:', existing.id);
      return existing;
    }

    // Create demo user with specific ID
    const user = await prisma.user.create({
      data: {
        id: 'demo-user',
        email: 'demo@viztr.io',
        name: 'Demo User',
        role: 'USER',
        tenantId: '00000000-0000-0000-0000-000000000000',
      }
    });

    console.log('Created demo user:', user.id);
    return user;
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();