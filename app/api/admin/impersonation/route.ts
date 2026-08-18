import { NextResponse } from 'next/server';
import { listImpersonationLogs, createImpersonationLog, revokeImpersonationLog, getImpersonationLogById } from '../../../../lib/server/admin/impersonation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    // Parse query parameters
    if (searchParams.has('adminUserId')) filters.adminUserId = searchParams.get('adminUserId');
    if (searchParams.has('targetUserId')) filters.targetUserId = searchParams.get('targetUserId');
    if (searchParams.has('status')) filters.status = searchParams.get('status');
    if (searchParams.has('createdAt')) {
      const dateStr = searchParams.get('createdAt');
      if (dateStr) {
        const [start, end] = dateStr.split(',').map((d: string) => new Date(d.trim()));
        filters.createdAt = [start, end];
      }
    }

    const logs = await listImpersonationLogs(filters);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to list impersonation logs:', error);
    return NextResponse.json({ error: 'Failed to fetch impersonation logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminUserId, targetUserId, expiresAt } = body;

    if (!adminUserId || !targetUserId || !expiresAt) {
      return NextResponse.json({ error: 'Admin user ID, target user ID, and expiresAt are required' }, { status: 400 });
    }

    const log = await createImpersonationLog(adminUserId, targetUserId, new Date(expiresAt));
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Failed to create impersonation log:', error);
    return NextResponse.json({ error: 'Failed to create impersonation log' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Impersonation log ID and action are required' }, { status: 400 });
    }

    let log;
    switch (action) {
      case 'revoke':
        if (!reason) {
          return NextResponse.json({ error: 'Reason is required for revoke action' }, { status: 400 });
        }
        log = await revokeImpersonationLog(id, reason);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error('Failed to perform impersonation action:', error);
    return NextResponse.json({ error: 'Failed to perform impersonation action' }, { status: 500 });
  }
}

export async function GET_ONE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Impersonation log ID is required' }, { status: 400 });
    }

    const log = await getImpersonationLogById(id);
    if (!log) {
      return NextResponse.json({ error: 'Impersonation log not found' }, { status: 404 });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error('Failed to get impersonation log:', error);
    return NextResponse.json({ error: 'Failed to fetch impersonation log' }, { status: 500 });
  }
}