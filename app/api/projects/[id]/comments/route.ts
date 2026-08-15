import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { getThreadedComments } from '@/lib/server/client-portal';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('collab.comment');

    const { id } = await params;
    const comments = await getThreadedComments(id);
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