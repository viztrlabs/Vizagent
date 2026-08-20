import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { sendMessage, getMessages, markAsRead } from '@/lib/communications/messaging/service';
import { messageSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/api';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });

  const messages = await getMessages(conversationId, { limit, offset });
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validation = validateBody(messageSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
  }

  const message = await sendMessage({
    conversationId: validation.data.conversationId,
    senderId: auth.authUser.id,
    senderType: 'user',
    content: validation.data.content,
    messageType: 'text',
    metadata: undefined,
  });

  await markAsRead(validation.data.conversationId, auth.authUser.id);

  return NextResponse.json({ message }, { status: 201 });
}