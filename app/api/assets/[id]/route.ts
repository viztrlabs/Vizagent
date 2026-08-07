import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { deleteObject } from '@/lib/server/lib/r2';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId();

    const asset = await withTenant(prisma, tenantId, async () => {
      const existing = await prisma.asset.findUnique({ where: { id, tenantId } });
      if (!existing) return null;

      try {
        await deleteObject(existing.storagePath);
      } catch (r2Error) {
        // Object may already be gone; still remove the record.
      }

      await prisma.asset.delete({ where: { id, tenantId } });
      return existing;
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
