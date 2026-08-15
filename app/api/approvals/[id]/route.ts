import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { decideApproval, getApproval } from '@/lib/server/client-portal';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('approvals.request');

    const { id } = await params;
    const approval = await getApproval(id);
    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }
    return NextResponse.json(approval);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('approvals.manage');

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 });
    }

    const approval = await decideApproval(id, { status, notes });
    return NextResponse.json(approval);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Approval not found') {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}