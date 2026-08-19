import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getAvailableChannels } from '@/lib/communications/notifications/providers';
import { getChannelConfig, setChannelConfig } from '@/lib/communications/notifications/service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = auth.authUser.id;
  const channels = getAvailableChannels();
  const configs = await Promise.all(
    channels.map(async (c) => {
      const config = await getChannelConfig(tenantId, c);
      return { channel: c, ...config };
    })
  );

  return NextResponse.json({ channels: configs });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  await setChannelConfig(auth.authUser.id, body.channel, body.config, body.enabled);
  return NextResponse.json({ ok: true });
}