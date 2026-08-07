import { NextRequest, NextResponse } from 'next/server';
import { streamCreateSchema } from '@/lib/validations';
import { removePeer } from '@/lib/server/lib/signaling';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = streamCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { room_id, user_id } = validation.data;

    const peers = await removePeer(room_id, user_id);

    return NextResponse.json({ success: true, peers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }
}
