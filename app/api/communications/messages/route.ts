import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { sendMessage, getMessages, markAsRead } from '@/lib/communications/messaging/service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });

  const messages = await getMessages(conversationId, { limit, offset });
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const message = await sendMessage({
    conversationId: body.conversationId,
    senderId: auth.authUser.id,
    senderType: 'user',
    content: body.content,
    messageType: body.messageType || 'text',
    metadata: body.metadata,
  });

  await markAsRead(body.conversationId, auth.authUser.id);

  return NextResponse.json({ message }, { status: 201 });
}