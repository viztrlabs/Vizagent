import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getPublicPageBySlug, resolveTenantFromHostname } from '@/lib/server/content/content-service';
import { BLOCK_PREVIEWS } from '@/lib/server/content/block-registry';

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPage(slug: string) {
  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const tenantId = await resolveTenantFromHostname(host);
  return getPublicPageBySlug(slug, tenantId);
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) return {};

  const title = page.seo?.title ?? page.title;
  const description = page.seo?.description ?? page.description ?? '';

  return {
    title,
    description,
    robots: page.seo?.noIndex ? { index: false, follow: !page.seo?.noFollow } : undefined,
    alternates: { canonical: page.seo?.canonicalUrl ?? undefined },
    openGraph: {
      title: page.openGraph?.title ?? title,
      description: page.openGraph?.description ?? description,
      images: page.openGraph?.image ? [{ url: page.openGraph.image }] : undefined,
      type: page.openGraph?.type ?? 'website',
    },
    twitter: page.twitterCard
      ? { card: page.twitterCard.card as any, site: page.twitterCard.site, creator: page.twitterCard.creator }
      : undefined,
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-bg">
      {page.schemaOrg && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.schemaOrg) }}
        />
      )}

      {page.sections.map((section) => (
        <section key={section.id} className={section.layout === 'full-width' ? '' : 'mx-auto max-w-6xl px-6'}>
          <div className="flex flex-wrap gap-4 py-6">
            {section.blocks.map((block) => {
              const Preview = BLOCK_PREVIEWS[block.type];
              if (!Preview) return null;
              return <Preview key={block.id} props={block.props} />;
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
