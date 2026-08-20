import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Tours | VizTR',
  description: 'Manage your virtual tours',
};

export default async function ToursPage() {
  const auth = await getCurrentAuth();
  
  const projects = await prisma.project.findMany({
    where: {
      tenantId: auth?.dbUser?.tenantId,
      status: 'published',
    },
    select: {
      id: true,
      name: true,
      status: true,
      viewCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get counts separately due to Prisma WASM issue
  const sceneCounts = await prisma.$queryRaw<[{projectId: string, count: bigint}]>`
    SELECT project_id as "projectId", COUNT(*) as count FROM tour_scenes GROUP BY project_id
  `;
  const floorCounts = await prisma.$queryRaw<[{projectId: string, count: bigint}]>`
    SELECT project_id as "projectId", COUNT(*) as count FROM tour_floors GROUP BY project_id
  `;

  const sceneMap = new Map(sceneCounts.map(r => [r.projectId, Number(r.count)]));
  const floorMap = new Map(floorCounts.map(r => [r.projectId, Number(r.count)]));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Virtual Tours</h1>
          <p className="text-gray-400 mt-1">Manage and monitor your published tours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/tours/${project.id}`}
            className="block p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h3 className="text-white font-medium mb-2">{project.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{sceneMap.get(project.id) ?? 0} scenes</span>
              <span>{floorMap.get(project.id) ?? 0} floors</span>
              <span>{project.viewCount} views</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No published tours found.</p>
          <Link href="/projects" className="text-blue-400 hover:underline mt-2 inline-block">
            Go to Projects
          </Link>
        </div>
      )}
    </div>
  );
}
