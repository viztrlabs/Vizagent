import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@viztr.io' }
    });

    if (existing) {
      console.log('User already exists:', existing.id);
      return existing;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'admin@viztr.io',
        name: 'Admin User',
        role: 'ADMIN',
        tenantId: '00000000-0000-0000-0000-000000000000',
      }
    });

    console.log('Created user:', user.id);
    return user;
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();