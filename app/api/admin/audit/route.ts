import { NextResponse } from 'next/server';
import { listAuditLogs, getAuditLogCount } from '../../../../lib/server/audit/audit-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    // Parse query parameters
    if (searchParams.has('action')) filters.action = searchParams.get('action');
    if (searchParams.has('resource')) filters.resource = searchParams.get('resource');
    if (searchParams.has('resourceId')) filters.resourceId = searchParams.get('resourceId');
    if (searchParams.has('userId')) filters.userId = searchParams.get('userId');
    if (searchParams.has('createdAt')) {
      const dateStr = searchParams.get('createdAt');
      if (dateStr) {
        const [start, end] = dateStr.split(',').map((d: string) => new Date(d.trim()));
        filters.createdAt = [start, end];
      }
    }

    const logs = await listAuditLogs(filters);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to list audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function GET_COUNT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    // Parse query parameters
    if (searchParams.has('action')) filters.action = searchParams.get('action');
    if (searchParams.has('resource')) filters.resource = searchParams.get('resource');
    if (searchParams.has('resourceId')) filters.resourceId = searchParams.get('resourceId');
    if (searchParams.has('userId')) filters.userId = searchParams.get('userId');
    if (searchParams.has('createdAt')) {
      const dateStr = searchParams.get('createdAt');
      if (dateStr) {
        const [start, end] = dateStr.split(',').map((d: string) => new Date(d.trim()));
        filters.createdAt = [start, end];
      }
    }

    const count = await getAuditLogCount(filters);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Failed to get audit log count:', error);
    return NextResponse.json({ error: 'Failed to fetch audit log count' }, { status: 500 });
  }
}