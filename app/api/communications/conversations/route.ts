import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createConversation, getConversationsForUser } from '@/lib/communications/messaging/service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const type = searchParams.get('type') as 'direct' | 'project' | 'support' | 'team' | undefined;

  const conversations = await getConversationsForUser(auth.authUser.id, { limit, offset, type });
  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const conversation = await createConversation({
    ...body,
    participantIds: [...new Set([...body.participantIds, auth.authUser.id])],
  });
  return NextResponse.json({ conversation }, { status: 201 });
}