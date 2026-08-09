import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { addSessionToCalendar } from '@/lib/google-calendar';
import { confirmationEmailHTML } from '@/lib/emails/reminder';

const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_NAMES: Record<string, string> = {
  'vr-walkthrough': 'VR Walkthrough',
  'exterior-viz': 'Exterior Visualisation',
  'interior-xr': 'Interior XR Tour',
  'masterplan': 'Master Plan Review',
};

const SERVICE_DURATIONS: Record<string, number> = {
  'vr-walkthrough': 60,
  'exterior-viz': 45,
  'interior-xr': 60,
  'masterplan': 90,
};

export async function POST(req: NextRequest) {
  try {
    const body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      company?: string;
      serviceId?: string;
      projectType?: string;
      date?: string;
      time?: string;
      notes?: string;
    } = await req.json();
    const {
      firstName,
      lastName,
      email,
      company,
      serviceId,
      projectType,
      date,
      time,
      notes,
    } = body;

    if (!firstName || !lastName || !email || !serviceId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const durationMinutes = SERVICE_DURATIONS[serviceId] || 60;
    const startAt = new Date(`${date}T${time}:00+05:30`);

    const session = await prisma.session.create({
      data: {
        email,
        firstName,
        lastName,
        company: company || null,
        serviceId,
        projectType: projectType || '',
        notes: notes || null,
        date,
        time,
        startAt,
        durationMinutes,
        status: 'CONFIRMED',
      },
    });

    await resend.emails.send({
      from: 'VizTR <bookings@viztr.io>',
      to: email,
      subject: `Session confirmed — ${SERVICE_NAMES[serviceId] || serviceId}`,
      html: await confirmationEmailHTML({
        id: session.id,
        serviceId: SERVICE_NAMES[serviceId] || serviceId,
        firstName,
        lastName,
        date,
        time,
      }),
    });

    await resend.emails.send({
      from: 'VizTR <bookings@viztr.io>',
      to: 'admin@viztr.io',
      subject: `New booking: ${SERVICE_NAMES[serviceId]} — ${firstName} ${lastName}`,
      html: `<p>New session booked:</p>
             <ul>
               <li>Service: ${SERVICE_NAMES[serviceId]}</li>
               <li>Client: ${firstName} ${lastName} (${email})</li>
               <li>Date: ${date} at ${time} IST</li>
               <li>Session ID: ${session.id}</li>
             </ul>`,
    });

    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter required' },
      { status: 400 }
    );
  }

  const sessions = await prisma.session.findMany({
    where: {
      date,
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
    select: { time: true },
  });

  return NextResponse.json({ bookedSlots: sessions.map((s: { time: string | null }) => s.time) });
}
