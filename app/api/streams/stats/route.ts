import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/server/lib/signaling';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room_id');

    if (roomId) {
      const room = await getRoom(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      return NextResponse.json({
        stats: {
          peerCount: room.peers.length,
          streamCount: room.peers.length,
          room_id: roomId,
        },
      });
    }

    return NextResponse.json({ stats: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
