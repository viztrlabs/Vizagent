import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (session.gcalEventId) {
      try {
        const { google } = await import('googleapis');
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: 'placeholder' });
      } catch {}
    }

    await prisma.session.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
