import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getSsoConfig, upsertSsoConfig, deleteSsoConfig, generateSamlMetadata } from '@/lib/enterprise/sso/sso-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const metadata = searchParams.get('metadata');

  if (metadata === 'true') {
    const metadata = await generateSamlMetadata(auth.authUser.id);
    return new NextResponse(metadata, { headers: { 'Content-Type': 'application/xml' } });
  }

  const config = await getSsoConfig(auth.authUser.id);
  return NextResponse.json({ config });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const config = await upsertSsoConfig(auth.authUser.id, body);
  return NextResponse.json({ config }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteSsoConfig(auth.authUser.id);
  return NextResponse.json({ ok: true });
}