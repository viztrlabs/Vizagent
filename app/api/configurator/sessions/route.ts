import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { configuratorSessionSchema } from '@/lib/validations';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = configuratorSessionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const shareToken = nanoid(10);

  const session = await prisma.configuratorSession.create({
    data: {
      ...validation.data,
      shareToken,
    },
  });

  return NextResponse.json({ session, share_token: shareToken }, { status: 201 });
}