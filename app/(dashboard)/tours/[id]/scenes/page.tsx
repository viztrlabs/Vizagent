import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/server';

export const metadata: Metadata = {
  title: 'Scene Management | VizTR',
};

interface ScenesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScenesPage({ params }: ScenesPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!project) {
    notFound();
  }

  // Fetch scenes via raw query (Prisma WASM limitation)
  const scenes: Array<{id: string, title: string, sort_order: number, equirectangular_url: string}> = await prisma.$queryRaw`
    SELECT id, title, sort_order, equirectangular_url FROM tour_scenes WHERE project_id = ${id} ORDER BY sort_order ASC
  `;

  // Get hotspot counts
  const hotspotCounts = await prisma.$queryRaw<[{scene_id: string, count: bigint}]>`
    SELECT scene_id, COUNT(*) as count FROM tour_hotspots
    WHERE scene_id IN (SELECT id FROM tour_scenes WHERE project_id = ${id})
    GROUP BY scene_id
  `;
  const hotspotMap = new Map(hotspotCounts.map(r => [r.scene_id, Number(r.count)]));

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href={`/tours/${id}`} className="text-blue-400 hover:underline text-sm">
          ← Back to Tour
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">
          Scenes — {project.name}
        </h1>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-4 text-gray-400 font-medium">Order</th>
              <th className="text-left p-4 text-gray-400 font-medium">Title</th>
              <th className="text-left p-4 text-gray-400 font-medium">Hotspots</th>
              <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((scene) => (
              <tr key={scene.id} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="p-4 text-white">{scene.sort_order}</td>
                <td className="p-4 text-white">{scene.title}</td>
                <td className="p-4 text-gray-400">{hotspotMap.get(scene.id) ?? 0}</td>
                <td className="p-4">
                  <Link
                    href={`/tours/${id}/scenes/${scene.id}`}
                    className="text-blue-400 hover:underline text-sm"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {scenes.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No scenes yet. Upload images to create scenes.
          </div>
        )}
      </div>
    </div>
  );
}
