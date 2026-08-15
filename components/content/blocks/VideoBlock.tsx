'use client';

import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';

interface VideoBlockProps {
  props: BlockProps['video'];
}

export function VideoBlock({ props }: VideoBlockProps) {
  const { src, poster, autoplay, loop, controls, muted } = props;

  return (
    <div className="relative w-full aspect-video">
      <video
        src={props.src}
        poster={props.poster}
        autoPlay={props.autoplay}
        loop={props.loop}
        controls={props.controls}
        muted={props.muted}
        className={cn('w-full h-full object-cover rounded-lg')}
        playsInline
      />
    </div>
  );
}