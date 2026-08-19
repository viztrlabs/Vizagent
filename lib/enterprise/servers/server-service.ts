// M17: Enterprise Server Service
import { prisma } from '@/lib/db/server';

export interface EnterpriseServer {
  id: string;
  tenantId: string;
  name: string;
  region: string;
  instanceType: string;
  gpuEnabled: boolean;
  gpuType: string | null;
  status: string;
  slaTier: string;
  ipAddress: string | null;
  sshKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseServerInput {
  name: string;
  region: string;
  instanceType: string;
  gpuEnabled?: boolean;
  gpuType?: string | null;
  slaTier?: string;
}

export async function createEnterpriseServer(tenantId: string, data: EnterpriseServerInput): Promise<EnterpriseServer> {
  const server = await prisma.enterpriseServer.create({
    data: { tenantId, ...data, status: 'provisioning' },
  });
  return formatServer(server);
}

export async function getEnterpriseServer(tenantId: string): Promise<EnterpriseServer | null> {
  const server = await prisma.enterpriseServer.findUnique({ where: { tenantId } });
  return server ? formatServer(server) : null;
}

export async function updateEnterpriseServer(tenantId: string, data: Partial<EnterpriseServerInput>): Promise<EnterpriseServer> {
  const server = await prisma.enterpriseServer.update({ where: { tenantId }, data });
  return formatServer(server);
}

export async function updateServerStatus(tenantId: string, status: string, ipAddress?: string): Promise<EnterpriseServer> {
  const data: any = { status };
  if (ipAddress) data.ipAddress = ipAddress;
  const server = await prisma.enterpriseServer.update({ where: { tenantId }, data });
  return formatServer(server);
}

export async function deleteEnterpriseServer(tenantId: string): Promise<void> {
  await prisma.enterpriseServer.delete({ where: { tenantId } });
}

function formatServer(server: any): EnterpriseServer {
  return {
    ...server,
    createdAt: server.createdAt.toISOString(),
    updatedAt: server.updatedAt.toISOString(),
  };
}