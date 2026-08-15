import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { grantRolePermission, revokeRolePermission } from '@/lib/server/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('admin.rbac.write');

    const { role } = await params;
    const body = await request.json();
    const { permission, action } = body;

    if (!permission || !action) {
      return NextResponse.json({ error: 'permission and action required' }, { status: 400 });
    }

    if (action === 'grant') {
      const result = await grantRolePermission({ role: role as any, permission });
      return NextResponse.json(result);
    }

    if (action === 'revoke') {
      const result = await revokeRolePermission({ role: role as any, permission });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Invalid role') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}