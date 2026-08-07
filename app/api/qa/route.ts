import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { QARepository } from '@/lib/server/repositories/qa.repository';
import { getQaQueue } from '@/lib/server/queues/qa.queue';

const qaRepository = new QARepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body as { project_id?: string };

    if (!project_id) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }

    const tenantId = await getTenantId();
    const report = await qaRepository.startQA(project_id, tenantId);

    const queue = getQaQueue();
    await queue.add('qa-run', {
      projectId: project_id,
      tenantId,
      reportId: report.id,
    });

    return NextResponse.json(
      { reportId: report.id, status: report.qaStatus },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start QA' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }

    const tenantId = await getTenantId();
    const report = await qaRepository.findByProject(projectId, tenantId);

    if (!report) {
      return NextResponse.json({ report: null });
    }

    return NextResponse.json({
      report: {
        id: report.id,
        projectId: report.projectId,
        qaStatus: report.qaStatus,
        checks: report.checks,
        issues: report.issues,
        checkedAt: report.checkedAt,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch QA report' }, { status: 500 });
  }
}
