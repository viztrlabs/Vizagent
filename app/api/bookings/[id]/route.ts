import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { deleteSessionFromCalendar } from '@/lib/google-calendar';
import { getToken } from 'next-auth/jwt';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.configuratorSession.findUnique({
    where: { id },
  });

  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete from Google Calendar if exists
  const token = await getToken({ req: request });
  if (token?.accessToken && session.gcalEventId) {
    try {
      await deleteSessionFromCalendar(
        token.accessToken as string,
        session.gcalEventId
      );
    } catch (error) {
      console.error('Failed to delete from Google Calendar:', error);
    }
  }

  // Update session status to cancelled
  await prisma.configuratorSession.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
