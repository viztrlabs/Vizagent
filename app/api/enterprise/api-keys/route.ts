import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createApiKey, getApiKeys, revokeApiKey } from '@/lib/enterprise/api/api-key-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await getApiKeys(auth.authUser.id);
  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { apiKey, rawKey } = await createApiKey(auth.authUser.id, body);
  return NextResponse.json({ apiKey, rawKey }, { status: 201 });
}