import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createDeal, getDeals, getPipelineSummary } from '@/lib/server/crm/deal-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage') as 'PROSPECT' | 'QUOTE' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST' | undefined;
  const pipeline = searchParams.get('pipeline');

  if (pipeline === 'true') {
    const summary = await getPipelineSummary('');
    return NextResponse.json({ pipeline: summary });
  }

  const deals = await getDeals('', stage ?? undefined);
  return NextResponse.json({ deals });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const deal = await createDeal({
    leadId: body.leadId,
    contactId: body.contactId,
    title: body.title,
    value: body.value,
    currency: body.currency,
    closeDate: body.closeDate ? new Date(body.closeDate) : undefined,
    tenantId: '',
  });
  return NextResponse.json({ deal }, { status: 201 });
}
