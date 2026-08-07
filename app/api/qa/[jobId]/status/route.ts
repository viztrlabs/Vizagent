import { NextRequest, NextResponse } from 'next/server';
import { getQAJobStatus } from '@/lib/qa/run';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    const status = await getQAJobStatus(jobId);

    if (!status) {
      return NextResponse.json(
        { message: 'QA job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('QA status error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}