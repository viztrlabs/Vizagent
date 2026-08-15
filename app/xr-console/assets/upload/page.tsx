'use client';

import { useRouter } from 'next/navigation';
import { XRConsoleLayout } from '@/components/xr-console/XRConsoleLayout';
import { UploadDropzone } from '@/components/upload/UploadDropzone';

export default function UploadAssetPage() {
  const router = useRouter();

  return (
    <XRConsoleLayout>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl text-white">Upload Asset</h1>
          <p className="text-gray-400">Upload 3D models, textures, or media assets for your projects</p>
        </div>

        <div className="bg-surface border border-gray-800 rounded-xl p-8">
          <UploadDropzone
            projectId=""
            onUploadComplete={() => {
              // Redirect to asset list after upload
              router.push('/xr-console/assets');
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">Supported Formats</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• 3D Models: .glb, .gltf, .draco</li>
              <li>• Images: .jpg, .jpeg, .png, .webp</li>
              <li>• Videos: .mp4, .webm</li>
            </ul>
          </div>
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">File Limits</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Maximum file size: 500MB</li>
              <li>• Recommended: &lt; 100MB for optimal performance</li>
              <li>• Multi-part upload for large files</li>
            </ul>
          </div>
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">Processing</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Automatic optimization (WebP, WebM)</li>
              <li>• LOD generation for 3D models</li>
              <li>• Thumbnail generation</li>
              <li>• Metadata extraction</li>
            </ul>
          </div>
        </div>
      </div>
    </XRConsoleLayout>
  );
}