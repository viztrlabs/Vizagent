'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['html'] }

export function HtmlBlock({ props }: Props) {
  return (
    <div
      className="prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}
