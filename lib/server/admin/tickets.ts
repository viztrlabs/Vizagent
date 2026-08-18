import { prisma } from '../../../lib/db/server';
import { getCurrentAuth } from '../../../lib/auth/session';
import { auditLog } from '../audit/audit-logger';

export interface TicketFilter {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  userId?: string;
  createdAt?: [gte: Date, lte: Date];
}

export interface TicketSummary {
  id: string;
  userId: string;
  subject: string;
  status: string;
  priority: string;
  message?: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | null;
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  messages: Array<{
    id: string;
    ticketId: string;
    senderId: string;
    content: string;
    createdAt: Date;
  }>;
}

export async function listTickets(filter: TicketFilter = {}): Promise<TicketSummary[]> {
  const { status, priority, userId, ...filterRest } = filter;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (userId) {
    where.userId = userId;
  }

  if (filterRest.createdAt) {
    where.createdAt = {
      gte: filterRest.createdAt[0],
      lte: filterRest.createdAt[1],
    };
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
      messages: {
        select: {
          id: true,
          ticketId: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tickets;
}

export async function createTicket(userId: string, subject: string, message: string): Promise<TicketSummary> {
  const { dbUser } = await getCurrentAuth();
  const tenantId = dbUser?.tenantId ?? '';

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      message,
      tenantId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
      messages: {
        select: {
          id: true,
          ticketId: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Audit log
  await auditLog({
    action: 'ticket.create',
    resource: 'SupportTicket',
    resourceId: ticket.id,
    changes: { subject, message },
  });

  return ticket;
}

export async function updateTicket(ticketId: string, updates: Partial<{
  status: string;
  priority: string;
  message: string;
}>): Promise<TicketSummary> {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updates,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
      messages: {
        select: {
          id: true,
          ticketId: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Audit log
  await auditLog({
    action: 'ticket.update',
    resource: 'SupportTicket',
    resourceId: ticketId,
    changes: updates,
  });

  return ticket;
}

export async function addMessage(ticketId: string, senderId: string, content: string): Promise<{ id: string }> {
  const { dbUser } = await getCurrentAuth();
  const tenantId = dbUser?.tenantId ?? '';

  const message = await prisma.supportTicketMessage.create({
    data: {
      ticketId,
      senderId,
      content,
      tenantId,
    },
    select: {
      id: true,
    },
  });

  // Audit log
  await auditLog({
    action: 'ticket.message',
    resource: 'SupportTicketMessage',
    resourceId: message.id,
    changes: { ticketId, content },
  });

  return { id: message.id };
}

export async function closeTicket(ticketId: string, resolution: string): Promise<TicketSummary> {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: 'closed',
      message: resolution,
      resolvedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
      messages: {
        select: {
          id: true,
          ticketId: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Audit log
  await auditLog({
    action: 'ticket.close',
    resource: 'SupportTicket',
    resourceId: ticketId,
    changes: { status: 'closed', resolution },
  });

  return ticket;
}

export async function getTicketById(ticketId: string): Promise<TicketSummary | null> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
      messages: {
        select: {
          id: true,
          ticketId: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) return null;

  return ticket;
}