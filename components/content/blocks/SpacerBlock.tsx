'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['spacer'] }

export function SpacerBlock({ props }: Props) {
  const sizeMap = { sm: 'h-8', md: 'h-16', lg: 'h-24', xl: 'h-32', '2xl': 'h-40' } as const;
  return <div className={sizeMap[props.size]} aria-hidden="true" />;
}
