'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['divider'] }

export function DividerBlock({ props }: Props) {
  const styleMap = { solid: 'border-t', dashed: 'border-t border-dashed', dotted: 'border-t border-dotted' } as const;
  const marginMap = { none: 'my-0', sm: 'my-2', md: 'my-4', lg: 'my-8', xl: 'my-12' } as const;
  return <hr className={`${styleMap[props.variant]} ${marginMap[props.margin]} border-gray-700`} style={props.color ? { borderColor: props.color } : undefined} />;
}
