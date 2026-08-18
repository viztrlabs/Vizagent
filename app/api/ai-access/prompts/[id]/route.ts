import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { updatePrompt } from '@/lib/server/ai-access/prompt-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { prisma } = await import('@/lib/db/server');
  const prompt = await prisma.aiPrompt.findUnique({ where: { id } });
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ prompt });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const prompt = await updatePrompt(id, {
    name: body.name,
    description: body.description,
    template: body.template,
    isActive: body.isActive,
  });
  return NextResponse.json({ prompt });
}
