import { TableSkeleton } from '@/components/ui/EmptyState';

export default function ProjectsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="animate-pulse bg-gray-800 rounded h-8 w-40" />
        <div className="animate-pulse bg-gray-800 rounded h-9 w-32" />
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
