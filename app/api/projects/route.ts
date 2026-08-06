import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { projectSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

  if (!clientId) {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  }

  const projects = await prisma.project.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = projectSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: validation.data.name,
      description: validation.data.description,
      clientId: body.client_id || 'demo-user',
      serviceType: body.service_type || 'tour',
      deadline: validation.data.deadline ? new Date(validation.data.deadline) : undefined,
      budget: validation.data.budget,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
