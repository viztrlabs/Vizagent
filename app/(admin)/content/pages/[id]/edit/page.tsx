import { notFound } from 'next/navigation';
import { getPageById } from '@/lib/server/content/content-service';
import { PageEditor } from '@/components/content/PageEditor';

export const metadata = { title: 'Edit Page', description: 'Edit content page' };

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getPageById(id);
  if (!page) notFound();

  return <PageEditor initialPage={page} />;
}
