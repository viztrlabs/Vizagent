'use client';

import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';

interface TextBlockProps {
  props: BlockProps['text'];
}

export function TextBlock({ props }: TextBlockProps) {
  const { content, size, alignment } = props;

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div
      className={cn(
        'prose prose-invert max-w-none',
        sizeClasses[props.size],
        alignmentClasses[props.alignment]
      )}
      dangerouslySetInnerHTML={{ __html: props.content }}
    />
  );
}