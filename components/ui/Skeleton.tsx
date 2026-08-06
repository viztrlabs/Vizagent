'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-800 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function CanvasSkeleton() {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
      <Skeleton className="w-12 h-12 rounded-full bg-gray-700" />
    </div>
  );
}

export function StreamViewerSkeleton() {
  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
      <Skeleton className="w-12 h-12 rounded-full bg-gray-700" />
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="group bg-surface rounded-xl border border-gray-800 overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}