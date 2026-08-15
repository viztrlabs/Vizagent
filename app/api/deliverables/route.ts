import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { listDeliverables, createDeliverable } from '@/lib/server/client-portal';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('client.portals.read');

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const deliverables = await listDeliverables(projectId);
    return NextResponse.json(deliverables);
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
    await requirePermission('approvals.manage');

    const body = await request.json();
    const { projectId, name, type, url, password, expiresAt } = body;
    
    if (!projectId || !name || !type || !url) {
      return NextResponse.json({ error: 'projectId, name, type, and url required' }, { status: 400 });
    }

    const deliverable = await createDeliverable({ projectId, name, type, url, password, expiresAt: expiresAt ? new Date(expiresAt) : undefined });
    return NextResponse.json(deliverable, { status: 201 });
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