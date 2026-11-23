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
  room.peers.add(user_id);

  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  return NextResponse.json({
    room_id,
    ice_servers: iceServers,
    peers: Array.from(room.peers),
  });
}