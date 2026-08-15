import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { getRolePermissions, getAvailablePermissions } from '@/lib/server/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('admin.rbac.read');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'permissions') {
      const permissions = await getAvailablePermissions();
      return NextResponse.json(permissions);
    }

    const roles = await getRolePermissions();
    return NextResponse.json(roles);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}