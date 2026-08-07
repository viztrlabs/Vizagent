'use client';

import { useCallback, useState, useTransition } from 'react';
import { MAX_FILE_SIZE } from '@/lib/validations';
import { formatBytes } from '@/lib/utils/format';

type FileType = 'jpg' | 'jpeg' | 'png' | 'glb' | 'gltf' | 'usdz' | 'zip';

interface UploadFile {
  file: File;
  assetId?: string;
  uploadId?: string;
  status: 'pending' | 'uploading' | 'ready' | 'failed' | 'cancelled';
  progress: number; // 0-100 overall
  error?: string;
}

interface UploadDropzoneProps {
  projectId: string;
  onUploadComplete: (assets: UploadFile[]) => void;
}

const ALLOWED_EXTENSIONS: FileType[] = ['jpg', 'jpeg', 'png', 'glb', 'gltf', 'usdz', 'zip'];
const CONCURRENCY = 4;

export function UploadDropzone({ projectId, onUploadComplete }: UploadDropzoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const uploadFile = useCallback(
    async (uploadFile: UploadFile) => {
      const { file } = uploadFile;
      setFiles((prev) =>
        prev.map((f) => (f.file === file ? { ...f, status: 'uploading' } : f))
      );

      try {
        const initRes = await fetch('/api/assets/upload/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            file_name: file.name,
            file_type: getExtension(file.name),
            file_size: file.size,
          }),
        });

        if (!initRes.ok) {
          const data = await initRes.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to start upload');
        }

        const init = await initRes.json();
        const { uploadId, assetId, partSize, parts } = init as {
          uploadId: string;
          assetId: string;
          partSize: number;
          parts: { partNumber: number; url: string }[];
        };

        setFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, assetId, uploadId } : f))
        );

        const completedParts: { part_number: number; etag: string }[] = [];
        let uploadedBytes = 0;

        const updateProgress = (delta: number) => {
          uploadedBytes += delta;
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, progress: Math.min(99, (uploadedBytes / file.size) * 100) } : f
            )
          );
        };

        const uploadPart = async (part: { partNumber: number; url: string }) => {
          const start = (part.partNumber - 1) * partSize;
          const end = Math.min(start + partSize, file.size);
          const blob = file.slice(start, end);

          let attempt = 0;
          while (attempt < 3) {
            const res = await fetch(part.url, { method: 'PUT', body: blob });
            if (res.ok) {
              const etag = res.headers.get('ETag') || '';
              completedParts.push({ part_number: part.partNumber, etag });
              updateProgress(end - start);
              return;
            }
            attempt++;
          }
          throw new Error(`Failed to upload part ${part.partNumber}`);
        };

        // Upload parts with bounded concurrency.
        const queue = [...parts];
        const workers: Promise<void>[] = [];
        for (let i = 0; i < CONCURRENCY; i++) {
          workers.push(
            (async () => {
              while (queue.length) {
                const part = queue.shift();
                if (!part) break;
                await uploadPart(part);
              }
            })()
          );
        }
        await Promise.all(workers);

        const completeRes = await fetch('/api/assets/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_id: assetId,
            upload_id: uploadId,
            parts: completedParts.sort((a, b) => a.part_number - b.part_number),
          }),
        });

        if (!completeRes.ok) {
          const data = await completeRes.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to finalize upload');
        }

        setFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, status: 'ready', progress: 100 } : f))
        );
      } catch (err) {
        await cancelUpload(uploadFile);
        setFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? {
                  ...f,
                  status: 'failed',
                  error: err instanceof Error ? err.message : 'Upload failed',
                }
              : f
          )
        );
      }
    },
    [projectId]
  );

  const retryUpload = useCallback(
    (f: UploadFile) => uploadFile({ ...f, status: 'pending' }),
    [uploadFile]
  );

  const cancelUpload = useCallback(async (uploadFile: UploadFile) => {
    const { assetId, uploadId } = uploadFile;
    if (uploadId && assetId) {
      await fetch('/api/assets/upload/abort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, upload_id: uploadId }),
      }).catch(() => {});
    }
    setFiles((prev) =>
      prev.map((f) => (f.file === uploadFile.file ? { ...f, status: 'cancelled' } : f))
    );
  }, []);

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      const accepted: UploadFile[] = [];
      for (const file of newFiles) {
        const type = getExtension(file.name);
        if (!ALLOWED_EXTENSIONS.includes(type)) {
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          continue;
        }
        accepted.push({ file, status: 'pending', progress: 0 });
      }
      if (!accepted.length) return;

      setFiles((prev) => [...accepted, ...prev]);
      startTransition(() => {
        accepted.forEach((f) => uploadFile(f));
      });
    },
    [uploadFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(Array.from(e.target.files));
      e.target.value = '';
    },
    [handleFiles]
  );

  const readyCount = files.filter((f) => f.status === 'ready').length;
  const pending = files.some((f) => f.status === 'pending' || f.status === 'uploading');
  const done = readyCount > 0 && !pending && files.every((f) => f.status === 'ready' || f.status === 'cancelled');

  if (done) {
    onUploadComplete(files.filter((f) => f.status === 'ready'));
  }

  return (
    <div className="w-full space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-cyan bg-cyan/5'
            : 'border-gray-300 dark:border-gray-600'
        } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <label className="cursor-pointer">
          <span className="block text-sm font-medium mb-2">Drop files or click to upload</span>
          <input
            type="file"
            multiple
            hidden
            accept=".jpg,.jpeg,.png,.glb,.gltf,.usdz,.zip"
            onChange={onPick}
          />
          <span className="text-cyan hover:text-cyan/80">Select files</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          JPG/PNG, GLB/GLTF, USDZ, ZIP — up to {formatBytes(MAX_FILE_SIZE)}
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <FileCard
              key={`${f.file.name}-${i}`}
              file={f}
              onRetry={() => retryUpload(f)}
              onCancel={() => cancelUpload(f)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({
  file,
  onRetry,
  onCancel,
}: {
  file: UploadFile;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-surface/50 text-sm">
      <span className="text-xl">{iconForExtension(getExtension(file.file.name))}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <span className="font-medium truncate">{file.file.name}</span>
          <span className="text-gray-500">{formatBytes(file.file.size)}</span>
        </div>
        {file.status === 'failed' && file.error && (
          <p className="text-red-500 text-xs mt-1">{file.error}</p>
        )}
        {file.status !== 'ready' && file.status !== 'cancelled' && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="h-full bg-cyan transition-all"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
      </div>
      {file.status === 'failed' && (
        <button onClick={onRetry} className="text-xs underline">
          Retry
        </button>
      )}
      {(file.status === 'uploading' || file.status === 'pending') && (
        <button onClick={onCancel} className="text-xs underline">
          Cancel
        </button>
      )}
      {file.status === 'ready' && <span className="text-green-500 text-xs">✓</span>}
    </div>
  );
}

function getExtension(name: string): FileType {
  return name.split('.').pop()?.toLowerCase() as FileType;
}

function iconForExtension(ext: string): string {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
      return '🖼️';
    case 'glb':
    case 'gltf':
      return '📦';
    case 'usdz':
      return '📱';
    case 'zip':
      return '🗜️';
    default:
      return '📄';
  }
}
