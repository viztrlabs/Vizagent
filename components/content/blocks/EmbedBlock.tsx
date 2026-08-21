'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['embed'] }

const RATIOS: Record<string, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
};

export function EmbedBlock({ props }: Props) {
  return (
    <div className={`${RATIOS[props.aspectRatio] ?? 'aspect-video'} overflow-hidden rounded-lg`}>
      <iframe src={props.url} title={props.title ?? 'Embedded content'} className="w-full h-full" allowFullScreen />
    </div>
  );
}
