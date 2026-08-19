// M17: Custom Domain Service
import { prisma } from '@/lib/db/server';

export interface CustomDomain {
  id: string;
  tenantId: string;
  domain: string;
  verified: boolean;
  sslEnabled: boolean;
  sslExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function toCustomDomain(domain: any): CustomDomain {
  return {
    ...domain,
    createdAt: domain.createdAt.toISOString(),
    updatedAt: domain.updatedAt.toISOString(),
    sslExpiresAt: domain.sslExpiresAt?.toISOString() || null,
  };
}

export interface CustomDomainInput {
  domain: string;
}

export async function addCustomDomain(tenantId: string, data: CustomDomainInput): Promise<CustomDomain> {
  const domain = await prisma.customDomain.create({ data: { tenantId, domain: data.domain } });
  return toCustomDomain(domain);
}

export async function getCustomDomains(tenantId: string): Promise<CustomDomain[]> {
  const domains = await prisma.customDomain.findMany({ where: { tenantId } });
  return domains.map(toCustomDomain);
}

export async function deleteCustomDomain(id: string, tenantId: string): Promise<void> {
  await prisma.customDomain.delete({ where: { id, tenantId } });
}

export async function verifyCustomDomain(id: string, tenantId: string): Promise<CustomDomain> {
  const domain = await prisma.customDomain.update({
    where: { id, tenantId },
    data: { verified: true },
  });
  return toCustomDomain(domain);
}

export async function enableSsl(id: string, tenantId: string, expiresAt: Date): Promise<CustomDomain> {
  const domain = await prisma.customDomain.update({
    where: { id, tenantId },
    data: { sslEnabled: true, sslExpiresAt: expiresAt },
  });
  return toCustomDomain(domain);
}