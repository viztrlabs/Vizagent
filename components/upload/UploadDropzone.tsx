'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { UploadProgress } from './UploadProgress';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  projectId: string;
  onUploadComplete?: (asset: { id: string; publicUrl: string }) => void;
  className?: string;
}

const ACCEPTED_TYPES = [
  'model/gltf-binary', // .glb
  'model/gltf+json',   // .gltf
  'application/octet-stream', // .draco
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function UploadDropzone({ projectId, onUploadComplete, className }: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Accepted: GLB, GLTF, DRACO, JPEG, PNG';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 500MB limit';
    }
    return null;
  }, []);

  const getPresignedUrl = async (file: File) => {
    const response = await fetch('/api/assets/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get upload URL');
    }

    return response.json();
  };

  const uploadToSupabase = async (file: File, uploadUrl: string, storagePath: string) => {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to storage');
    }

    // Notify backend that upload is complete
    const completeResponse = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
      }),
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.message || 'Failed to register asset');
    }

    return completeResponse.json();
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    setSuccess(false);

    try {
      const { asset_id, upload_url, public_url } = await getPresignedUrl(file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Extract file extension for storage path
      const fileExt = file.name.split('.').pop() || '';
      const storagePath = `${projectId}/${asset_id}.${fileExt}`;

      const asset = await uploadToSupabase(file, upload_url, storagePath);

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);
      setUploading(false);

      if (onUploadComplete) {
        onUploadComplete({ id: asset.id, publicUrl: public_url });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setSuccess(false);
    setError(null);
    setProgress(0);
  };

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
        isDragActive
          ? 'border-cyan bg-cyan/10'
          : 'border-surface hover:border-cyan/50',
        uploading && 'pointer-events-none opacity-75',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={!uploading && !success ? handleClick : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.draco,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploading || success}
      />

      {success ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cyan/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-cyan" />
          </div>
          <div className="text-white">
            <p className="font-heading text-lg">Upload Complete</p>
            <p className="text-sm text-gray-400">Asset registered successfully</p>
          </div>
          <button
            onClick={handleRemove}
            className="px-4 py-2 text-sm font-medium text-cyan hover:text-cyan/80 transition-colors"
          >
            Upload Another
          </button>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 text-red-400">
          <div className="w-16 h-16 rounded-full bg-red-400/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="font-heading text-lg">Upload Failed</p>
          <p className="text-sm text-center max-w-md">{error}</p>
          <button
            onClick={handleRemove}
            className="px-4 py-2 text-sm font-medium text-cyan hover:text-cyan/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : uploading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cyan/20 flex items-center justify-center">
            <Upload className="w-8 h-8 text-cyan animate-spin" />
          </div>
          <div className="w-full max-w-md">
            <div className="flex justify-between text-sm mb-2">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <UploadProgress progress={progress} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface border border-cyan/30 flex items-center justify-center">
            <Upload className="w-8 h-8 text-cyan" />
          </div>
          <div>
            <p className="font-heading text-lg text-white">Drop 3D assets or images here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileIcon className="w-3 h-3" />
              GLB, GLTF, DRACO, JPEG, PNG
            </span>
            <span>•</span>
            <span>Max 500MB</span>
          </div>
        </div>
      )}
    </div>
  );
}