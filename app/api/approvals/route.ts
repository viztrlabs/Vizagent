import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { listApprovals, requestApproval } from '@/lib/server/client-portal';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('approvals.request');

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const approvals = await listApprovals({ projectId, status: status as any });
    return NextResponse.json(approvals);
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

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('approvals.request');

    const body = await request.json();
    const { projectId, notes } = body;
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const approval = await requestApproval({ projectId, notes });
    return NextResponse.json(approval, { status: 201 });
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