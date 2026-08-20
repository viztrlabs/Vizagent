import { ListSkeleton } from '@/components/ui/EmptyState';

export default function CrmLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="animate-pulse bg-gray-800 rounded h-8 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="animate-pulse bg-gray-800 rounded h-5 w-24" />
          <ListSkeleton count={6} />
        </div>
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-800 rounded h-5 w-24" />
          <div className="bg-surface rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="animate-pulse bg-gray-800 rounded h-6 w-16" />
            <div className="animate-pulse bg-gray-800 rounded h-4 w-full" />
            <div className="animate-pulse bg-gray-800 rounded h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
