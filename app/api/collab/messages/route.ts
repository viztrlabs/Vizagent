import { NextRequest, NextResponse } from 'next/server';
import { listMessages, postMessage } from '@/lib/realtime/presence';

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
