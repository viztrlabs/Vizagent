'use client';

import { cn } from '@/lib/utils';

interface UploadProgressProps {
  progress: number;
  className?: string;
}

export function UploadProgress({ progress, className }: UploadProgressProps) {
  return (
    <div className={cn('w-full h-2 bg-surface rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-cyan transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}