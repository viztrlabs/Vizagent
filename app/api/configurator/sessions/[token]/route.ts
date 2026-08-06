import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const session = await prisma.configuratorSession.findUnique({
    where: { shareToken: token },
    include: { viewers: true },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ session });
}