import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createSupportTicket, searchFAQs, generateFAQFromTickets } from '@/lib/communications/support/faq';

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
    const ticket = await createSupportTicket(
      auth.authUser.id,
      auth.authUser.id,
      body.subject,
      body.message,
      body.category,
      body.priority
    );
    return NextResponse.json({ ticket }, { status: 201 });
  }

  if (body.action === 'generate-faqs') {
    const faqs = await generateFAQFromTickets(auth.authUser.id);
    return NextResponse.json({ faqs });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}