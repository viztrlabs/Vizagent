import { NextResponse } from 'next/server';
import { listUsers, suspendUser, unsuspendUser, updateUserRole, getUserById, UserFilter } from '../../../../lib/server/admin/users';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: UserFilter = {};

    // Parse query parameters
    if (searchParams.has('role')) filters.role = searchParams.get('role') ?? undefined;
    if (searchParams.has('isSuspended')) filters.isSuspended = searchParams.get('isSuspended') === 'true';
    if (searchParams.has('search')) filters.search = searchParams.get('search') ?? undefined;
    if (searchParams.has('createdAt')) {
      const dateStr = searchParams.get('createdAt');
      if (dateStr) {
        const [start, end] = dateStr.split(',').map((d: string) => new Date(d.trim()));
        filters.createdAt = [start, end];
      }
    }

    const users = await listUsers(filters);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to list users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, reason, role } = body;

    switch (action) {
      case 'suspend':
        if (!userId || !reason) {
          return NextResponse.json({ error: 'User ID and reason are required' }, { status: 400 });
        }
        const suspendedUser = await suspendUser(userId, reason);
        return NextResponse.json(suspendedUser);

      case 'unsuspend':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        const unsuspendedUser = await unsuspendUser(userId);
        return NextResponse.json(unsuspendedUser);

      case 'updateRole':
        if (!userId || !role) {
          return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
        }
        const updatedUser = await updateUserRole(userId, role);
        return NextResponse.json(updatedUser);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to perform user action:', error);
    return NextResponse.json({ error: 'Failed to perform user action' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}