import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { BookingRepository } from '@/lib/server/repositories/booking.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { publish } from '@/lib/server/events/publisher';
import { nanoid } from 'nanoid';

const bookingRepository = new BookingRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, service, date, time, duration, client_name, email, project_type } = body;

    const tenantId = await getTenantId();
    const shareToken = nanoid(10);

    const session = await withTenant(prisma, tenantId, async () =>
      bookingRepository.createBooking(
        {
          projectId: project_id,
          hostId: email || 'admin',
          startAt: new Date(`${date}T${time}:00`),
          shareToken,
        },
        tenantId
      )
    );

    await publish({
      id: nanoid(12),
      type: 'BookingCreated',
      aggregateId: session.id,
      tenantId,
      payload: {
        service,
        date,
        time,
        duration: duration || 60,
        clientName: client_name,
        projectType: project_type,
      },
      occurredAt: new Date(),
      metadata: {},
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }

    const tenantId = await getTenantId();
    const sessions = await withTenant(prisma, tenantId, async () =>
      bookingRepository.findByHost(email, tenantId)
    );

    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
