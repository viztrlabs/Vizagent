import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createSupportTicket, searchFAQs, generateFAQFromTickets } from '@/lib/communications/support/faq';
import { supportTicketSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/api';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'faq-search') {
    const q = searchParams.get('q') || '';
    const faqs = await searchFAQs(q, auth.authUser.id);
    return NextResponse.json({ faqs });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (body.action === 'create-ticket') {
    const validation = validateBody(supportTicketSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    const ticket = await createSupportTicket(
      auth.authUser.id,
      auth.authUser.id,
      validation.data.subject,
      validation.data.message,
      validation.data.category,
      validation.data.priority as 'low' | 'high' | 'urgent' | 'normal'
    );
    return NextResponse.json({ ticket }, { status: 201 });
  }

  if (body.action === 'generate-faqs') {
    const faqs = await generateFAQFromTickets(auth.authUser.id);
    return NextResponse.json({ faqs });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}