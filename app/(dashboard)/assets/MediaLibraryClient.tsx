'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/server/logger';

const log = createLogger({ module: 'assets/media-library' });

interface Asset {
  id: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  thumbnailPath?: string | null;
  tags: string[];
  createdAt: string;
}

interface MediaLibraryProps {
  initialAssets: Asset[];
}

export function MediaLibraryClient({ initialAssets }: MediaLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const router = useRouter();

  const allTags = Array.from(
    new Set(assets.flatMap((a) => a.tags))
  ).sort();

  const filteredAssets = selectedTags.length > 0
    ? assets.filter((a) => selectedTags.some((t) => a.tags.includes(t)))
    : assets;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addTagToSelectedAssets = async (tag: string) => {
    if (!tag.trim()) return;
    const assetIds = filteredAssets.map((a) => a.id);
    if (assetIds.length === 0) return;

    try {
      const res = await fetch('/api/assets/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds, tags: [tag] }),
      });

      if (res.ok) {
        setAssets((prev) =>
          prev.map((a) =>
            assetIds.includes(a.id) ? { ...a, tags: [...a.tags, tag] } : a
          )
        );
        setNewTagInput('');
      }
    } catch (error) {
      log.error({ error }, 'Failed to add tag');
    }
  };

  const removeTagFromAsset = async (assetId: string, tag: string) => {
    try {
      const res = await fetch('/api/assets/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, tag }),
      });

      if (res.ok) {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === assetId
              ? { ...a, tags: a.tags.filter((t) => t !== tag) }
              : a
          )
        );
      }
    } catch (error) {
      log.error({ error }, 'Failed to remove tag');
    }
  };

  const getImagePreview = (asset: Asset) => {
    if (asset.thumbnailPath) return asset.thumbnailPath;
    if (asset.fileType.startsWith('image/')) return `/api/assets/${asset.id}`;
    if (asset.fileType.startsWith('video/')) return '/placeholder-video.svg';
    return '/placeholder-file.svg';
  };

  return (
    <div className="space-y-6">
      {/* Tag filter bar */}
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tag} ({assets.filter((a) => a.tags.includes(tag)).length})
          </button>
        ))}
      </div>

      {/* Add tag bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addTagToSelectedAssets(newTagInput);
            }
          }}
          placeholder="Add tag to filtered assets..."
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
        />
        <button
          onClick={() => addTagToSelectedAssets(newTagInput)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
        >
          Add Tag
        </button>
      </div>

      {/* Asset grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <img
              src={getImagePreview(asset)}
              alt={asset.fileName}
              className="w-full h-24 object-cover"
            />
            <div className="p-2">
              <p className="text-white text-sm font-medium truncate">
                {asset.fileName}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {asset.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => removeTagFromAsset(asset.id, tag)}
                    className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          {selectedTags.length > 0
            ? 'No assets match the selected tags.'
            : 'No assets found.'}
        </p>
      )}
    </div>
  );
}
