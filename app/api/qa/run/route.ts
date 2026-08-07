import { NextRequest, NextResponse } from 'next/server';
import { qaRunSchema } from '@/lib/validations';
import { runQAChecks } from '@/lib/qa/run';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = qaRunSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid request', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { project_id } = validation.data;
    const { jobId } = await runQAChecks(project_id);

    return NextResponse.json({ job_id: jobId });
  } catch (error) {
    console.error('QA run error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}