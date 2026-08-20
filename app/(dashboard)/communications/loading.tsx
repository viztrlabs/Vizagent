import { ListSkeleton } from '@/components/ui/EmptyState';

export default function CommunicationsLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-80 border-r border-gray-800 p-4 space-y-3">
        <div className="animate-pulse bg-gray-800 rounded h-9 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-lg p-3 space-y-2">
            <div className="animate-pulse bg-gray-800 rounded h-4 w-2/3" />
            <div className="animate-pulse bg-gray-800 rounded h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="flex-1 p-6">
        <div className="animate-pulse bg-gray-800 rounded h-6 w-48 mb-6" />
        <ListSkeleton count={4} />
      </div>
    </div>
  );
}
