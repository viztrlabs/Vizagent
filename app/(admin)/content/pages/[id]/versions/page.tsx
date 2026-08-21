'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { PageVersion } from '@/lib/server/content/content-model';

export default function VersionsPage() {
  const params = useParams<{ id: string }>();
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/pages/${params.id}?action=versions`).then(async (res) => {
      const body = await res.json();
      setVersions(body.versions ?? []);
    });
  }, [params.id]);

  const restore = async (versionId: string) => {
    const res = await fetch(`/api/pages/${params.id}?action=restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    });
    setMessage(res.ok ? 'Page restored' : 'Restore failed');
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-white">Version History</h1>
      {message && <p className="text-sm text-cyan">{message}</p>}
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-surface">
            <div>
              <p className="text-sm text-white">{v.changeDescription || 'Version'}</p>
              <p className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => restore(v.id)}
              className="px-3 py-1.5 text-sm text-cyan border border-cyan/30 rounded-lg hover:bg-cyan/10"
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
