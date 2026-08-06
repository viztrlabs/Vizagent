import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { addSessionToCalendar } from '@/lib/google-calendar';
import { getToken } from 'next-auth/jwt';

const SERVICE_NAMES: Record<string, string> = {
  'tour': 'Virtual Tour',
  'xr': 'XR Configurator',
  'render': '3D Rendering',
};

const SERVICE_DURATIONS: Record<string, number> = {
  'tour': 60,
  'xr': 90,
  'render': 120,
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { project_id, service, date, time, duration, client_name, email, project_type } = body;

  // Create session
  const session = await prisma.configuratorSession.create({
    data: {
      projectId: project_id,
      hostId: 'admin', // Default host
      config: '{}',
      shareToken: Math.random().toString(36).substring(2, 15),
      startAt: new Date(`${date}T${time}:00`),
    },
  });

  // Try to add to Google Calendar
  const token = await getToken({ req: request });
  let gcalEventId = null;

  if (token?.accessToken) {
    try {
      gcalEventId = await addSessionToCalendar(token.accessToken as string, {
        id: session.id,
        service: SERVICE_NAMES[service] || service,
        date: `${date}T${time}:00`,
        durationMinutes: duration || SERVICE_DURATIONS[service] || 60,
        clientName: client_name,
        projectType: project_type,
      });

      // Update session with gcal event ID
      await prisma.configuratorSession.update({
        where: { id: session.id },
        data: { gcalEventId: gcalEventId },
      });
    } catch (error) {
      console.error('Failed to add to Google Calendar:', error);
    }
  }

  return NextResponse.json({ session, gcalEventId: gcalEventId }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const sessions = await prisma.configuratorSession.findMany({
    where: { hostId: email },
    orderBy: { startAt: 'desc' },
  });

  return NextResponse.json({ sessions });
}
