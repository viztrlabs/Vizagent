import { ListSkeleton } from '@/components/ui/EmptyState';

export default function AgentsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="animate-pulse bg-gray-800 rounded h-8 w-32" />
        <div className="animate-pulse bg-gray-800 rounded h-9 w-28" />
      </div>
      <ListSkeleton count={4} />
    </div>
  );
}
