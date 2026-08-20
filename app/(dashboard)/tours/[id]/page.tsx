import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/server';

export const metadata: Metadata = {
  title: 'Tour Details | VizTR',
};

interface TourDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      viewCount: true,
      createdAt: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Fetch tour data via raw queries (Prisma WASM limitation)
  const scenes = await prisma.$queryRaw<[{id: string, title: string, sort_order: number}]>`
    SELECT id, title, sort_order FROM tour_scenes WHERE project_id = ${id} ORDER BY sort_order ASC
  `;

  const floors = await prisma.$queryRaw<[{id: string, name: string, level: number}]>`
    SELECT id, name, level FROM tour_floors WHERE project_id = ${id} ORDER BY level ASC
  `;

  const walkthroughs = await prisma.$queryRaw<[{id: string, title: string}]>`
    SELECT id, title FROM tour_walkthroughs WHERE project_id = ${id} AND active = true
  `;

  // Get hotspot counts per scene
  const hotspotCounts = await prisma.$queryRaw<[{scene_id: string, count: bigint}]>`
    SELECT scene_id, COUNT(*) as count FROM tour_hotspots
    WHERE scene_id IN (SELECT id FROM tour_scenes WHERE project_id = ${id})
    GROUP BY scene_id
  `;
  const hotspotMap = new Map(hotspotCounts.map(r => [r.scene_id, Number(r.count)]));

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/tours" className="text-blue-400 hover:underline text-sm">
          ← Back to Tours
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">{project.name}</h1>
        {project.description && (
          <p className="text-gray-400 mt-1">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-white">{project.viewCount}</div>
          <div className="text-gray-400 text-sm">Total Views</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-white">{scenes.length}</div>
          <div className="text-gray-400 text-sm">Scenes</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-white">{floors.length}</div>
          <div className="text-gray-400 text-sm">Floors</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenes */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Scenes</h2>
            <Link
              href={`/tours/${id}/scenes`}
              className="text-sm text-blue-400 hover:underline"
            >
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            {scenes.map((scene) => (
              <div
                key={scene.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded"
              >
                <span className="text-white">{scene.title}</span>
                <span className="text-gray-400 text-sm">
                  {hotspotMap.get(scene.id) ?? 0} hotspots
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Floors */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Floors</h2>
          <div className="space-y-2">
            {floors.map((floor) => (
              <div
                key={floor.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded"
              >
                <span className="text-white">{floor.name}</span>
                <span className="text-gray-400 text-sm">Level {floor.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Walkthroughs */}
      {walkthroughs.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Active Walkthroughs</h2>
          <div className="space-y-2">
            {walkthroughs.map((walk) => (
              <div
                key={walk.id}
                className="p-3 bg-gray-700 rounded text-white"
              >
                {walk.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
