import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { BookingRepository } from '@/lib/server/repositories/booking.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { deleteSessionFromCalendar } from '@/lib/google-calendar';
import { getToken } from 'next-auth/jwt';

const bookingRepository = new BookingRepository();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantId = await getTenantId();

  const session = await withTenant(prisma, tenantId, async () =>
    bookingRepository.findByIdWithViewers(id, tenantId)
  );

  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

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

  await withTenant(prisma, tenantId, async () =>
    bookingRepository.cancel(id, tenantId)
  );

  return NextResponse.json({ success: true });
}
