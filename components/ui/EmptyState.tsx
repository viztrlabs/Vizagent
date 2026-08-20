import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-gray-600">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-sm">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function DashboardCardSkeletonGroup({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl border border-gray-800 p-4 space-y-3">
          <div className="animate-pulse bg-gray-800 rounded h-4 w-20" />
          <div className="animate-pulse bg-gray-800 rounded h-8 w-16" />
          <div className="animate-pulse bg-gray-800 rounded h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-lg border border-gray-800 p-4 flex items-center gap-4">
          <div className="animate-pulse bg-gray-800 rounded h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="animate-pulse bg-gray-800 rounded h-4 w-1/3" />
            <div className="animate-pulse bg-gray-800 rounded h-3 w-1/2" />
          </div>
          <div className="animate-pulse bg-gray-800 rounded h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <div className="animate-pulse bg-gray-800 rounded h-5 w-40" />
      </div>
      <div className="divide-y divide-gray-800">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, col) => (
              <div
                key={col}
                className="animate-pulse bg-gray-800 rounded h-4"
                style={{ width: col === 0 ? '40%' : `${60 / cols}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
