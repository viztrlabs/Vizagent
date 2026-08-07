import { NextRequest, NextResponse } from 'next/server';
import { streamCreateSchema } from '@/lib/validations';
import { addPeer } from '@/lib/server/lib/signaling';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = streamCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { room_id, user_id } = validation.data;

    const peers = await addPeer(room_id, user_id);

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    return NextResponse.json({
      room_id,
      ice_servers: iceServers,
      peers,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
