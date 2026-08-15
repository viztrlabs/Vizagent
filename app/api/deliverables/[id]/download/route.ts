import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { downloadDeliverable } from '@/lib/server/client-portal';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('client.portals.read');

    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    const result = await downloadDeliverable(id, { password });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && (error.message === 'Deliverable not found' || error.message === 'Deliverable expired' || error.message === 'Password required' || error.message === 'Invalid password')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}