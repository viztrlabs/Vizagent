import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { listAnnotations, createAnnotation } from '@/lib/server/client-portal';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('collab.annotate');

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const resolved = searchParams.get('resolved');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const annotations = await listAnnotations({
      projectId,
      resolved: resolved !== null ? resolved === 'true' : undefined,
    });
    return NextResponse.json(annotations);
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
    await requirePermission('collab.annotate');

    const body = await request.json();
    const { projectId, position, content } = body;
    
    if (!projectId || !position || !content) {
      return NextResponse.json({ error: 'projectId, position, and content required' }, { status: 400 });
    }

    const annotation = await createAnnotation({ projectId, position, content });
    return NextResponse.json(annotation, { status: 201 });
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