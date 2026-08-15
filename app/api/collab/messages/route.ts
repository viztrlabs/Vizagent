import { NextRequest, NextResponse } from 'next/server';
import { listMessages, postMessage } from '@/lib/realtime/presence';
import { rateLimit } from '@/lib/server/middleware/rate-limit';

// M0.5: bound chat posting rate to mitigate spam. GET (list) is read-only, so
// only POST is gated. Per-IP fixed window.
const CHAT_LIMIT = { limit: 30, windowMs: 60_000, prefix: 'collab-chat' };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room_id');
    if (!roomId) {
      return NextResponse.json({ error: 'room_id required' }, { status: 400 });
    }
    const messages = await listMessages(roomId);
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, CHAT_LIMIT);
    if (limited) return limited;

    const body = await request.json();
    const { room_id, user_id, name, text, type } = body as {
      room_id?: string;
      user_id?: string;
      name?: string;
      text?: string;
      type?: 'chat' | 'annotation';
    };
    if (!room_id || !user_id || !name || !text) {
      return NextResponse.json({ error: 'room_id, user_id, name, text required' }, { status: 400 });
    }
    const msg = await postMessage(room_id, user_id, name, text, type ?? 'chat');
    return NextResponse.json({ message: msg }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}
