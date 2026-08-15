import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { listComments, createComment } from '@/lib/server/client-portal';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('collab.comment');

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const parentId = searchParams.get('parentId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const comments = await listComments(projectId, parentId === 'null' ? null : parentId);
    return NextResponse.json(comments);
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
    await requirePermission('collab.comment');

    const body = await request.json();
    const { projectId, content, parentId, mentions } = body;
    
    if (!projectId || !content) {
      return NextResponse.json({ error: 'projectId and content required' }, { status: 400 });
    }

    const comment = await createComment({ projectId, content, parentId, mentions });
    return NextResponse.json(comment, { status: 201 });
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