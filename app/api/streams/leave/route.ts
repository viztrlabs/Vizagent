import { NextRequest, NextResponse } from 'next/server';
import { streamCreateSchema } from '@/lib/validations';

const rooms = new Map<string, { peers: Set<string>; createdAt: number }>();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = streamCreateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const { room_id, user_id } = validation.data;

  if (!rooms.has(room_id)) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const room = rooms.get(room_id)!;
  room.peers.delete(user_id);

  // Clean up empty rooms
  if (room.peers.size === 0) {
    rooms.delete(room_id);
  }

  return NextResponse.json({ success: true });
}