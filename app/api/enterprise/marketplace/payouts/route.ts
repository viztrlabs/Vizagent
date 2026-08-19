import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createPayouts, getSellerPayouts, markPayoutPaid } from '@/lib/enterprise/marketplace/payout-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'seller') {
    const userId = auth.authUser!.id;
    const payouts = await getSellerPayouts(userId, userId);
    return NextResponse.json({ payouts });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const userId = auth.authUser!.id;
  
  if (body.action === 'calculate') {
    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    const payouts = await import('@/lib/enterprise/marketplace/payout-service').then(m => m.calculatePayouts(userId, periodStart, periodEnd));
    return NextResponse.json({ payouts });
  }

  if (body.action === 'create') {
    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    const payouts = await import('@/lib/enterprise/marketplace/payout-service').then(m => m.createPayouts(userId, periodStart, periodEnd));
    return NextResponse.json({ payouts }, { status: 201 });
  }

  if (body.action === 'mark_paid') {
    await import('@/lib/enterprise/marketplace/payout-service').then(m => m.markPayoutPaid(body.payoutId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}