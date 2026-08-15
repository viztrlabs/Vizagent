'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { BlockProps } from '@/lib/server/content/content-model';

interface GalleryBlockProps {
  props: BlockProps['gallery'];
}

export function GalleryBlock({ props }: GalleryBlockProps) {
  const { images, columns, gap } = props;

  return (
    <div
      className={cn(
        'grid gap-4',
        `grid-cols-${props.columns}`
      )}
      style={{ gap: `${props.gap}px` }}
    >
      {props.images.map((image, index) => (
        <figure
          key={index}
          className="group relative aspect-square overflow-hidden rounded-lg"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {image.caption && (
            <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-sm text-center">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}