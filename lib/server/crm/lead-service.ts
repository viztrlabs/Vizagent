import { prisma } from '@/lib/db/server';
import { LeadStatus } from '@prisma/client';

export async function createLead(data: {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  source?: string;
  tenantId: string;
}) {
  return prisma.lead.create({ data });
}

export async function getLeads(tenantId: string, status?: LeadStatus) {
  const where: Record<string, unknown> = { tenantId };
  if (status) where.status = status;
  return prisma.lead.findMany({
    where,
    include: { contacts: true, deals: true, tasks: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLeadById(id: string, tenantId: string) {
  return prisma.lead.findFirst({
    where: { id, tenantId },
    include: { contacts: true, deals: { include: { tasks: true } }, tasks: true },
  });
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  return prisma.lead.update({
    where: { id },
    data: { status },
  });
}

export async function deleteLead(id: string) {
  return prisma.lead.delete({ where: { id } });
}
