'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Image, Box, Trash2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Asset {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  storagePath: string;
  thumbnailPath?: string;
  optimizedPath?: string;
  optimizedStatus?: string;
  tilingStatus?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  uploaded: 'secondary',
  uploading: 'default',
  optimizing: 'default',
  ready: 'default',
  failed: 'destructive',
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'model/gltf-binary': Box,
  'model/gltf+json': Box,
  'image/jpeg': Image,
  'image/png': Image,
  'image/webp': Image,
  default: FileText,
};

export function AssetList({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/assets`);
        if (!res.ok) throw new Error('Failed to load assets');
        const data = await res.json();
        if (!cancelled) setAssets(data.assets ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load assets');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return <div className="text-gray-400 text-center py-8">Loading assets...</div>;
  }

  if (error) {
    return <div className="text-red-400 text-center">{error}</div>;
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">No assets uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => {
        const Icon = TYPE_ICONS[asset.fileType] || TYPE_ICONS.default;
        return (
          <Card key={asset.id} className="p-0 overflow-hidden">
            <div className="aspect-square bg-gray-900 relative overflow-hidden">
              {asset.thumbnailPath && (
                <img
                  src={asset.thumbnailPath}
                  alt={asset.fileName}
                  className="w-full h-full object-cover"
                />
              ) || (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="w-12 h-12 text-gray-500" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={STATUS_COLORS[asset.status] ?? 'secondary'}>
                  {asset.status}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white truncate mb-1">{asset.fileName}</h3>
              <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                <span>{formatBytes(asset.fileSize)}</span>
                <span>{asset.status}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/assets/${asset.id}`}
                  className="flex-1 btn-secondary text-center py-2"
                >
                  View
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadAsset(asset)}
                  disabled={asset.status !== 'ready'}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteAsset(asset.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function downloadAsset(asset: Asset) {
    // Implementation: call API to get presigned download URL
    window.open(`/api/assets/${asset.id}/download`, '_blank');
  }

  async function deleteAsset(assetId: string) {
    if (!confirm('Delete this asset?')) return;
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }
}