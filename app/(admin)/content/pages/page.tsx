import Link from 'next/link';
import { listPages } from '@/lib/server/content/content-service';
import { PageList } from '@/components/content/PageList';

export const metadata = { title: 'Pages', description: 'Manage content pages' };

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const { status, search, page } = await searchParams;
  const { pages, total } = await listPages({
    status: status as 'draft' | 'published' | 'archived' | undefined,
    search,
    page: page ? parseInt(page, 10) : 1,
    limit: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-white">Content Pages</h1>
        <Link href="/admin/content/pages/new" className="hidden" />
      </div>
      <PageList pages={pages} total={total} />
    </div>
  );
}
