import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { configuratorSessionSchema } from '@/lib/validations';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = configuratorSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const shareToken = nanoid(10);

    const session = await prisma.configuratorSession.create({
      data: {
        projectId: validation.data.project_id,
        hostId: validation.data.host_id,
        config: validation.data.config,
        shareToken,
      },
    });

    return NextResponse.json({ session, share_token: shareToken }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}