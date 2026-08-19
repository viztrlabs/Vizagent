import { NextResponse } from 'next/server';
import { listTickets, createTicket, updateTicket, addMessage, closeTicket, getTicketById, TicketFilter } from '../../../../lib/server/admin/tickets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: TicketFilter = {};

    // Parse query parameters
    if (searchParams.has('status')) filters.status = searchParams.get('status') ?? undefined;
    if (searchParams.has('priority')) filters.priority = searchParams.get('priority') ?? undefined;
    if (searchParams.has('userId')) filters.userId = searchParams.get('userId') ?? undefined;
    if (searchParams.has('createdAt')) {
      const dateStr = searchParams.get('createdAt');
      if (dateStr) {
        const [start, end] = dateStr.split(',').map((d: string) => new Date(d.trim()));
        filters.createdAt = [start, end];
      }
    }

    const tickets = await listTickets(filters);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Failed to list tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, subject, message } = body;

    if (!userId || !subject || !message) {
      return NextResponse.json({ error: 'User ID, subject, and message are required' }, { status: 400 });
    }

    const ticket = await createTicket(userId, subject, message);
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, updates } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = await updateTicket(ticketId, updates);
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Failed to update ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, senderId, content } = body;

    if (!ticketId || !senderId || !content) {
      return NextResponse.json({ error: 'Ticket ID, sender ID, and content are required' }, { status: 400 });
    }

    const message = await addMessage(ticketId, senderId, content);
    return NextResponse.json(message);
  } catch (error) {
    console.error('Failed to add message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const resolution = searchParams.get('resolution');

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = await closeTicket(ticketId, resolution || '');
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Failed to close ticket:', error);
    return NextResponse.json({ error: 'Failed to close ticket' }, { status: 500 });
  }
}

export async function GET_ONE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Failed to get ticket:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}