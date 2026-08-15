import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { listVersions, createVersion, getVersion } from '@/lib/server/client-portal';

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');
    
    if (versionId) {
      const version = await getVersion(versionId);
      if (!version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }
      return NextResponse.json(version);
    }

    const versions = await listVersions(id);
    return NextResponse.json(versions);
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

export async function POST(
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
    const { version, changes } = body;
    
    if (!version || !changes) {
      return NextResponse.json({ error: 'version and changes required' }, { status: 400 });
    }

    const version = await createVersion({ projectId: id, version, changes });
    return NextResponse.json(version, { status: 201 });
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