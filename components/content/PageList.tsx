'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Plus, ExternalLink } from 'lucide-react';
import type { Page } from '@/lib/server/content/content-model';

interface PageListProps {
  pages: Page[];
  total: number;
}

export function PageList({ pages, total }: PageListProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(
    () =>
      pages.filter(
        (p) =>
          (status === 'all' || p.status === status) &&
          (p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search))
      ),
    [pages, search, status]
  );

  const columns = useMemo<ColumnDef<Page>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'updatedAt', header: 'Updated', cell: ({ getValue }) => new Date(getValue() as Date).toLocaleDateString() },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Link href={`/admin/content/pages/${row.original.id}/edit`} className="text-cyan text-sm hover:text-cyan/80">
              Edit
            </Link>
            {row.original.status === 'published' && (
              <Link href={`/${row.original.slug}`} target="_blank" className="text-gray-400 text-sm hover:text-white inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> View
              </Link>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages…"
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <Link href="/admin/content/pages/new" className="inline-flex items-center gap-2 px-4 py-2 bg-cyan text-bg rounded-lg font-semibold text-sm hover:bg-cyan/90">
          <Plus className="w-4 h-4" /> New Page
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/80">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-400">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-900/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">{filtered.length} of {total} pages</p>
    </div>
  );
}
