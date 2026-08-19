import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { generateInvoiceFromStripe, formatInvoiceAsText, createManualInvoice } from '@/lib/billing/invoice-generation';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('id');
  const format = searchParams.get('format'); // 'text' | 'json'

  if (!invoiceId) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });

  const invoice = await generateInvoiceFromStripe(invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  if (format === 'text') {
    return new NextResponse(formatInvoiceAsText(invoice), {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ invoice });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const invoice = await createManualInvoice(
    body.userId || auth.authUser.id,
    body.tier,
    body.interval,
    new Date(body.periodStart),
    new Date(body.periodEnd)
  );

  return NextResponse.json({ invoice }, { status: 201 });
}