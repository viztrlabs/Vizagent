'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface VersionRecord {
  id: string;
  version: string;
  createdAt: string;
  createdBy: string;
}

interface VersionsListProps {
  versions: VersionRecord[];
  tourId: string;
}

export function VersionsList({ versions, tourId }: VersionsListProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const router = useRouter();

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      const res = await fetch(`/api/tours/${tourId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Restored to ${data.restoredFrom}`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        alert(`Failed to restore: ${data?.error ?? 'Unknown error'}`);
      }
    } catch {
      alert('Failed to restore version');
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left p-4 text-gray-400 font-medium">Version</th>
            <th className="text-left p-4 text-gray-400 font-medium">Created</th>
            <th className="text-left p-4 text-gray-400 font-medium">Created By</th>
            <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.id} className="border-b border-gray-700 hover:bg-gray-750">
              <td className="p-4 text-white font-mono text-sm">{v.version}</td>
              <td className="p-4 text-gray-400">{formatDate(v.createdAt)}</td>
              <td className="p-4 text-gray-400">
                {v.createdBy ? `${v.createdBy.slice(0, 8)}...` : '—'}
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={restoringId === v.id}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded text-sm font-medium transition-colors"
                >
                  {restoringId === v.id ? 'Restoring...' : 'Restore'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {versions.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No versions found. Publish the tour to create your first version.
        </div>
      )}
    </div>
  );
}