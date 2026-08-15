'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { BlockProps } from '@/lib/server/content/content-model';

interface ImageBlockProps {
  props: BlockProps['image'];
}

export function ImageBlock({ props }: ImageBlockProps) {
  const { src, alt, caption, width, height, link } = props;

  const imageContent = (
    <Image
      src={props.src}
      alt={props.alt}
      width={props.width}
      height={props.height}
      className={cn(
        'rounded-lg',
        props.width && props.height && 'aspect-auto'
      )}
      priority
    />
  );

  const content = (
    <figure className="relative">
      {props.link ? (
        <a href={props.link} target="_blank" rel="noopener noreferrer">
          {imageContent}
        </a>
      ) : (
        imageContent
      )}
      {props.caption && (
        <figcaption className="mt-2 text-sm text-gray-400 text-center">
          {props.caption}
        </figcaption>
      )}
    </figure>
  );

  return <div>{content}</div>;
}