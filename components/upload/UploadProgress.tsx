'use client';

interface UploadProgressProps {
  progress: number;
}

// M0.x stub — feature gap. Full implementation (animated bar, cancel button,
// speed/ETA) is deferred. This satisfies the import so `pnpm build` succeeds.
export default function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-cyan transition-all duration-200"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
