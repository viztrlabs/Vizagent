import { DashboardCardSkeletonGroup } from '@/components/ui/EmptyState';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="animate-pulse bg-gray-800 rounded h-8 w-48" />
      <div className="animate-pulse bg-gray-800 rounded h-4 w-64" />
      <DashboardCardSkeletonGroup />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-gray-800 p-6 space-y-4">
          <div className="animate-pulse bg-gray-800 rounded h-5 w-32" />
          <div className="animate-pulse bg-gray-800 rounded h-48 w-full" />
        </div>
        <div className="bg-surface rounded-xl border border-gray-800 p-6 space-y-4">
          <div className="animate-pulse bg-gray-800 rounded h-5 w-32" />
          <div className="animate-pulse bg-gray-800 rounded h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
