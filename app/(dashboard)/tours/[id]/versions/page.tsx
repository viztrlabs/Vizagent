import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { VersionsList } from './VersionsList';

export const metadata: Metadata = {
  title: 'Tour Versions | VizTR',
};

interface VersionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VersionsPage({ params }: VersionsPageProps) {
  const { id } = await params;

  const { dbUser } = await getCurrentAuth();
  if (!dbUser) {
    return notFound();
  }

  const project = await prisma.project.findFirst({
    where: { id, tenantId: dbUser.tenantId },
    select: { id: true, name: true },
  });

  if (!project) {
    return notFound();
  }

  let versions: Array<{ id: string; version: string; createdAt: string; createdBy: string }> = [];
  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: string; version: string; created_at: Date; created_by: string }>
    >`SELECT id, version, created_at, created_by FROM tour_versions WHERE project_id = ${id} ORDER BY created_at DESC`;
    versions = rows.map((r) => ({
      id: r.id,
      version: r.version,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      createdBy: r.created_by,
    }));
  } catch {
    versions = [];
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href={`/tours/${id}`} className="text-blue-400 hover:underline text-sm">
          ← Back to Tour
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">
          Version History — {project.name}
        </h1>
        <p className="text-gray-400 mt-1">
          {versions.length} {versions.length === 1 ? 'version' : 'versions'} found
        </p>
      </div>

      <VersionsList versions={versions} tourId={id} />

      <div className="mt-6">
        <PublishButton tourId={id} />
      </div>
    </div>
  );
}

function PublishButton({ tourId }: { tourId: string }) {
  return (
    <form
      action={async () => {
        'use server';
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/tours/${tourId}/publish`, {
          method: 'POST',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? 'Failed to publish');
        }
      }}
    >
      <button
        type="submit"
        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded font-medium transition-colors"
      >
        Publish New Version
      </button>
    </form>
  );
}