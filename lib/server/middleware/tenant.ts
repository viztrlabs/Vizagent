import { PrismaClient } from '@prisma/client';

export async function withTenant<T>(
  prisma: PrismaClient,
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  await prisma.$executeRaw`SET LOCAL app.current_tenant = ${tenantId}`;
  try {
    return await fn();
  } finally {
    await prisma.$executeRaw`RESET app.current_tenant`;
  }
}
