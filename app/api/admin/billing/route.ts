import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { listSubscriptions, listInvoices, getSubscription } from '@/lib/server/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('admin.billing.read');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'invoices') {
      const tenantId = searchParams.get('tenantId');
      const subscriptionId = searchParams.get('subscriptionId');
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const result = await listInvoices({
        tenantId: searchParams.get('tenantId') || undefined,
        subscriptionId: searchParams.get('subscriptionId') || undefined,
        status: status || undefined,
        page,
        limit,
      });
      return NextResponse.json(result);
    }

    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await listSubscriptions({
      tenantId: searchParams.get('tenantId') || undefined,
      status: searchParams.get('status') || undefined,
      page,
      limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}