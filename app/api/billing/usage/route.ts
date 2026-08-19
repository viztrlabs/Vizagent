import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getUsage, checkLimit, recordUsage, getUsageHistory } from '@/lib/billing/usage-metering';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'summary';

  if (action === 'summary') {
    const usage = await getUsage(auth.authUser.id, '');
    return NextResponse.json({ usage });
  }

  if (action === 'history') {
    const metric = searchParams.get('metric') as 'processing_minutes' | 'storage_gb' | 'gpu_hours';
    const days = parseInt(searchParams.get('days') || '30');
    const history = await getUsageHistory(auth.authUser.id, metric, days);
    return NextResponse.json({ history });
  }

  if (action === 'check') {
    const metric = searchParams.get('metric') as 'processing_minutes' | 'storage_gb' | 'gpu_hours';
    const additional = parseInt(searchParams.get('additional') || '0');
    const check = await checkLimit(auth.authUser.id, metric, additional);
    return NextResponse.json({ check });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  await recordUsage({
    userId: auth.authUser.id,
    tenantId: '',
    metric: body.metric,
    value: body.value,
    timestamp: new Date(),
    metadata: body.metadata,
  });

  return NextResponse.json({ ok: true });
}