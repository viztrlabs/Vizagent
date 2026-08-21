'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const create = async () => {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, status: 'draft', sections: [] }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? 'Failed to create page');
      return;
    }
    const page = (await res.json()) as { id: string };
    router.push(`/admin/content/pages/${page.id}/edit`);
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-white mb-6">New Page</h1>
      <label className="block text-sm text-gray-400 mb-1" htmlFor="title">Title</label>
      <input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. About Us"
        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm mb-4"
      />
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      <button
        onClick={create}
        disabled={!title.trim()}
        className="px-4 py-2 bg-cyan text-bg rounded-lg font-semibold text-sm hover:bg-cyan/90 disabled:opacity-50"
      >
        Create
      </button>
    </div>
  );
}
