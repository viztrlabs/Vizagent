import { NextRequest, NextResponse } from 'next/server';

const rooms = new Map<string, { peers: Set<string>; createdAt: number }>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room_id');

    if (roomId) {
      const room = rooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      return NextResponse.json({
        stats: {
          peerCount: room.peers.size,
          streamCount: room.peers.size,
          room_id: roomId,
        },
      });
    }

    // Return all rooms stats
    const allStats = Array.from(rooms.entries()).map(([id, room]) => ({
      room_id: id,
      peerCount: room.peers.size,
      streamCount: room.peers.size,
    }));

    return NextResponse.json({ stats: allStats });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}