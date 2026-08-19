import { NextResponse } from 'next/server';
import { listJobs, createJobExecution, updateJobExecution, failJobExecution, completeJobExecution, getJobById, JobFilter } from '../../../../lib/server/admin/jobs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: JobFilter = {};

    // Parse query parameters
    if (searchParams.has('status')) filters.status = searchParams.get('status') ?? undefined;
    if (searchParams.has('jobId')) filters.jobId = searchParams.get('jobId') ?? undefined;
    if (searchParams.has('createdAt')) {
      const dateStr = searchParams.get('createdAt');
      if (dateStr) {
        const [start, end] = dateStr.split(',').map((d: string) => new Date(d.trim()));
        filters.createdAt = [start, end];
      }
    }

    const jobs = await listJobs(filters);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Failed to list jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await createJobExecution(jobId);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Failed to create job execution:', error);
    return NextResponse.json({ error: 'Failed to create job execution' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { jobId, updates } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await updateJobExecution(jobId, updates);
    return NextResponse.json(job);
  } catch (error) {
    console.error('Failed to update job execution:', error);
    return NextResponse.json({ error: 'Failed to update job execution' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { jobId, action } = body;

    if (!jobId || !action) {
      return NextResponse.json({ error: 'Job ID and action are required' }, { status: 400 });
    }

    let job;
    switch (action) {
      case 'fail':
        if (!body.error) {
          return NextResponse.json({ error: 'Error message is required for fail action' }, { status: 400 });
        }
        job = await failJobExecution(jobId, body.error);
        break;

      case 'complete':
        if (body.progress === undefined) {
          return NextResponse.json({ error: 'Progress is required for complete action' }, { status: 400 });
        }
        job = await completeJobExecution(jobId, body.progress);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Failed to perform job action:', error);
    return NextResponse.json({ error: 'Failed to perform job action' }, { status: 500 });
  }
}

export async function GET_ONE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Failed to get job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}