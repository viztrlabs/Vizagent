import Link from 'next/link';
import { getTenantId } from '@/lib/server/lib/tenant';
import { prisma } from '@/lib/db/server';
import { AnalyticsRepository } from '@/lib/server/repositories/analytics.repository';
import { ProjectStatusChart } from '@/components/dashboard/ProjectStatusChart';

export default async function AnalyticsPage() {
  const tenantId = await getTenantId();

  const analyticsRepository = new AnalyticsRepository();

  const [breakdown, totalAssets] = await Promise.all([
    analyticsRepository.getStatusBreakdown(tenantId),
    analyticsRepository.getTotalAssets(tenantId),
  ]);

  const totalProjects = breakdown.reduce((sum, b) => sum + b.count, 0);
  const publishedCount = breakdown.find((b) => b.status === 'published')?.count ?? 0;
  const qaPassedCount = breakdown.find((b) => b.status === 'qa_passed')?.count ?? 0;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Analytics</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Overview of your projects</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Projects" value={totalProjects} color="text-white" />
          <StatCard label="Published" value={publishedCount} color="text-cyan" />
          <StatCard label="QA Passed" value={qaPassedCount} color="text-green-400" />
          <StatCard label="Total Assets" value={totalAssets} color="text-yellow-400" />
        </div>

        {/* Chart */}
        <section className="bg-surface rounded-xl border border-gray-800 p-5">
          <h2 className="text-lg font-medium text-white mb-4">Projects by Status</h2>
          <ProjectStatusChart data={breakdown} />
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-surface rounded-xl border border-gray-800 p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
