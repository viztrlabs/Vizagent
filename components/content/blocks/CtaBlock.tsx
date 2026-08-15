'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { BlockProps } from '@/lib/server/content/content-model';

interface CtaBlockProps {
  props: BlockProps['cta'];
}

export function CtaBlock({ props }: CtaBlockProps) {
  const { text, url, variant, size, icon } = props;

  const variantClasses = {
    primary: 'bg-cyan text-bg hover:bg-cyan/90',
    secondary: 'bg-surface text-white border border-gray-700 hover:bg-surface/80',
    ghost: 'text-gray-400 hover:text-white hover:bg-surface',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-touch',
    md: 'px-4 py-2 text-sm min-h-touch',
    lg: 'px-6 py-3 text-base min-h-touch',
  };

  return (
    <Link
      href={props.url}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[props.size],
        variantClasses[props.variant]
      )}
    >
      {props.icon && <span className="mr-2">{props.icon}</span>}
      {props.text}
    </Link>
  );
}