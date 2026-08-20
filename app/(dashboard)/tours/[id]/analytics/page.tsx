import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getTourAnalytics } from '@/lib/server/tour/analytics';

export const metadata: Metadata = {
  title: 'Tour Analytics | VizTR',
};

interface AnalyticsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function TourAnalyticsPage({ params, searchParams }: AnalyticsPageProps) {
  const { id } = await params;
  const { from, to } = await searchParams;

  const { dbUser } = await getCurrentAuth();
  if (!dbUser) {
    return notFound();
  }

  const project = await prisma.project.findFirst({
    where: { id, tenantId: dbUser.tenantId },
    select: { id: true, name: true, viewCount: true },
  });

  if (!project) {
    return notFound();
  }

  const analytics = await getTourAnalytics(id, {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const sceneData = Object.entries(analytics.sceneHeatmap).map(([sceneId, views]) => {
    const engagement = analytics.engagementByScene[sceneId] ?? { avgTime: 0, clicks: 0 };
    return { sceneId, views, avgTime: engagement.avgTime, clicks: engagement.clicks };
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href={`/tours/${id}`} className="text-blue-400 hover:underline text-sm">
          ← Back to Tour
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">
          Analytics — {project.name}
        </h1>
        <p className="text-gray-400 mt-1">
          Viewing data from{' '}
          {analytics.timeRange.from.toLocaleDateString()} to{' '}
          {analytics.timeRange.to.toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-white">{analytics.totalViews}</div>
          <div className="text-gray-400 text-sm">Total Views</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-white">{analytics.uniqueVisitors}</div>
          <div className="text-gray-400 text-sm">Unique Visitors</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-white">
            {formatDuration(analytics.avgSessionDuration)}
          </div>
          <div className="text-gray-400 text-sm">Avg Session Duration</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-white">
            {sceneData.length}
          </div>
          <div className="text-gray-400 text-sm">Scenes</div>
        </div>
      </div>

      {/* Scene heatmap */}
      {sceneData.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Scene Heatmap</h2>
          <div className="space-y-2">
            {sceneData.map(({ sceneId, views, avgTime, clicks }) => {
              const maxViews = Math.max(...sceneData.map((s) => s.views), 1);
              const intensity = Math.max(0.2, views / maxViews);
              return (
                <div key={sceneId} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-400 truncate">
                    {sceneId.slice(0, 8)}...
                  </div>
                  <div className="flex-1 bg-gray-700 rounded h-6 relative overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${views / maxViews * 100}%`,
                        backgroundColor: `rgba(13, 148, 136, ${intensity})`,
                      }}
                    />
                  </div>
                  <div className="w-48 text-right text-sm text-gray-400">
                    {views} views · {formatDuration(avgTime)} avg · {clicks} clicks
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Source segments */}
      {Object.keys(analytics.sourceSegments).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Traffic Sources</h2>
          <div className="space-y-2">
            {Object.entries(analytics.sourceSegments).map(([source, count]) => {
              const total = Object.values(analytics.sourceSegments).reduce((sum, v) => sum + v, 0);
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={source} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-400">{source}</div>
                  <div className="flex-1 bg-gray-700 rounded h-6">
                    <div
                      className="h-full rounded bg-teal-600/30"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm text-gray-400">
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
