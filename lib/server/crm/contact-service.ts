import { prisma } from '@/lib/db/server';

export async function createContact(data: {
  leadId: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  tenantId: string;
}) {
  return prisma.contact.create({ data });
}

export async function getContactsByLead(leadId: string, tenantId: string) {
  return prisma.contact.findMany({
    where: { leadId, tenantId },
    include: { deals: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateContact(id: string, data: { name?: string; email?: string; phone?: string; role?: string }) {
  return prisma.contact.update({ where: { id }, data });
}

export async function deleteContact(id: string) {
  return prisma.contact.delete({ where: { id } });
}
