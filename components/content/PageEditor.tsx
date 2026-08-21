'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save } from 'lucide-react';
import type { Page, Section } from '@/lib/server/content/content-model';
import { BlockEditor } from './BlockEditor';
import { BlockPalette } from './BlockPalette';

interface PageEditorProps {
  initialPage: Page;
}

export function PageEditor({ initialPage }: PageEditorProps) {
  const router = useRouter();
  const [page, setPage] = useState<Page>(initialPage);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(initialPage.sections[0]?.id ?? null);
  const [saving, setSaving] = useState(false);

  const updatePage = (patch: Partial<Page>) => setPage((p) => ({ ...p, ...patch }));

  const handleAddSection = useCallback(async () => {
    const res = await fetch(`/api/pages/${page.id}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Section', layout: 'container', blocks: [] }),
    });
    if (!res.ok) return;
    const section = (await res.json()) as Section;
    setPage((p) => ({ ...p, sections: [...p.sections, section] }));
    setActiveSectionId(section.id);
  }, [page.id]);

  const handleAddBlock = useCallback(
    async (type: string) => {
      if (!activeSectionId) return;
      const res = await fetch(`/api/pages/${page.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: activeSectionId, type, props: {}, order: 0 }),
      });
      if (!res.ok) return;
      const block = (await res.json()) as { id: string; type: string; props: Record<string, unknown>; order: number };
      setPage((p) => ({
        ...p,
        sections: p.sections.map((s) =>
          s.id === activeSectionId ? { ...s, blocks: [...s.blocks, block as never] } : s
        ),
      }));
    },
    [page.id, activeSectionId]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          description: page.description,
          slug: page.slug,
          status: page.status,
          sections: page.sections,
          seo: page.seo,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [page, router]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <input
          value={page.title}
          onChange={(e) => updatePage({ title: e.target.value })}
          placeholder="Page title"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
        />
        <input
          value={page.slug}
          onChange={(e) => updatePage({ slug: e.target.value })}
          placeholder="slug"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
        />
        <button
          onClick={handleAddSection}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-800 rounded-lg hover:border-cyan/50 text-sm text-gray-400"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-cyan/10 border border-cyan/30 rounded-lg text-cyan text-sm font-medium hover:bg-cyan/20"
        >
          <Plus className="w-4 h-4" /> Add Block to selected section
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 p-3 bg-cyan text-bg rounded-lg font-semibold text-sm hover:bg-cyan/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="space-y-6">
        {page.sections.map((section) => (
          <div
            key={section.id}
            onClick={() => setActiveSectionId(section.id)}
            className={`border rounded-xl p-4 cursor-pointer transition-colors ${
              activeSectionId === section.id ? 'border-cyan' : 'border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Section · {section.name}</span>
            </div>
            <BlockEditor
              sectionId={section.id}
              blocks={section.blocks}
              onBlocksChange={(blocks) =>
                setPage((p) => ({
                  ...p,
                  sections: p.sections.map((s) => (s.id === section.id ? { ...s, blocks } : s)),
                }))
              }
            />
          </div>
        ))}
      </div>

      <BlockPalette onAddBlock={handleAddBlock} isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
